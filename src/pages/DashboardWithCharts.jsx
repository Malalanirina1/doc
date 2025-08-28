import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const DashboardWithCharts = () => {
  // États pour les données
  const [dossiers, setDossiers] = useState([]);
  const [stats, setStats] = useState({});
  const [statsJournalieres, setStatsJournalieres] = useState([]);
  const [statsMensuelles, setStatsMensuelles] = useState([]);
  const [statsTypes, setStatsTypes] = useState([]);
  const [statsPriorites, setStatsPriorites] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // États pour les filtres
  const [filtres, setFiltres] = useState({
    recherche: '',
    rechercheTicket: '',
    priorite: 'tous',
    typeDocument: 'tous',
    dateDebut: '',
    dateFin: ''
  });
  
  // États pour l'affichage
  const [vue, setVue] = useState('tableau'); // 'tableau', 'stats', 'graphiques'
  const [pageActuelle, setPageActuelle] = useState(1);
  const [dossiersParPage] = useState(20);

  // Chargement des données depuis l'API
  const chargerDonnees = async () => {
    setLoading(true);
    try {
      const [resDossiers, resStatsDash, resStatsJour, resStatsMois, resStatsTypes, resStatsPrio] = await Promise.all([
        fetch('http://localhost/doc/backend/api_dossiers.php', { credentials: 'include' }),
        fetch('http://localhost/doc/backend/api_stats.php?type=dashboard', { credentials: 'include' }),
        fetch('http://localhost/doc/backend/api_stats.php?type=journalier', { credentials: 'include' }),
        fetch('http://localhost/doc/backend/api_stats.php?type=mensuel', { credentials: 'include' }),
        fetch('http://localhost/doc/backend/api_stats.php?type=types', { credentials: 'include' }),
        fetch('http://localhost/doc/backend/api_stats.php?type=priorites', { credentials: 'include' })
      ]);

      const [dataDossiers, dataStatsDash, dataStatsJour, dataStatsMois, dataStatsTypes, dataStatsPrio] = await Promise.all([
        resDossiers.json(),
        resStatsDash.json(),
        resStatsJour.json(),
        resStatsMois.json(),
        resStatsTypes.json(),
        resStatsPrio.json()
      ]);

      if (dataDossiers.success) {
        setDossiers(dataDossiers.data || []);
        setStats(dataDossiers.stats || {});
      }
      if (dataStatsDash.success) setStats(prev => ({ ...prev, ...dataStatsDash.stats }));
      if (dataStatsJour.success) setStatsJournalieres(dataStatsJour.daily_stats || []);
      if (dataStatsMois.success) setStatsMensuelles(dataStatsMois.monthly_stats || []);
      if (dataStatsTypes.success) setStatsTypes(dataStatsTypes.types_stats || []);
      if (dataStatsPrio.success) setStatsPriorites(dataStatsPrio.priorites_stats || []);
      
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chargerDonnees();
    // Actualisation automatique toutes les 5 minutes
    const interval = setInterval(chargerDonnees, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Fonction de filtrage côté frontend
  const dossiersFiltrés = useMemo(() => {
    if (!dossiers.length) return [];

    return dossiers.filter(dossier => {
      // Filtre par recherche générale
      if (filtres.recherche) {
        const recherche = filtres.recherche.toLowerCase();
        const matchRecherche = 
          dossier.numero_ticket?.toLowerCase().includes(recherche) ||
          dossier.client_nom?.toLowerCase().includes(recherche) ||
          dossier.type_document_nom?.toLowerCase().includes(recherche) ||
          dossier.notes?.toLowerCase().includes(recherche);
        
        if (!matchRecherche) return false;
      }

      // Filtre par numéro de ticket
      if (filtres.rechercheTicket) {
        const matchTicket = dossier.numero_ticket?.toLowerCase().includes(filtres.rechercheTicket.toLowerCase());
        if (!matchTicket) return false;
      }

      // Filtre par priorité calculée
      if (filtres.priorite !== 'tous') {
        if (dossier.priorite_calculee !== filtres.priorite) return false;
      }

      // Filtre par type de document
      if (filtres.typeDocument !== 'tous') {
        if (dossier.type_document_id !== parseInt(filtres.typeDocument)) return false;
      }

      // Filtre par date
      if (filtres.dateDebut) {
        const dateDepot = new Date(dossier.date_depot);
        const dateDebut = new Date(filtres.dateDebut);
        if (dateDepot < dateDebut) return false;
      }

      if (filtres.dateFin) {
        const dateDepot = new Date(dossier.date_depot);
        const dateFin = new Date(filtres.dateFin);
        dateFin.setHours(23, 59, 59);
        if (dateDepot > dateFin) return false;
      }

      return true;
    });
  }, [dossiers, filtres]);

  // Pagination
  const dossiersAffiches = useMemo(() => {
    const debut = (pageActuelle - 1) * dossiersParPage;
    const fin = debut + dossiersParPage;
    return dossiersFiltrés.slice(debut, fin);
  }, [dossiersFiltrés, pageActuelle, dossiersParPage]);

  // Gestionnaire de changement de filtre
  const handleFiltreChange = (nom, valeur) => {
    setFiltres(prev => ({
      ...prev,
      [nom]: valeur
    }));
    setPageActuelle(1);
  };

  // Fonction pour obtenir l'icône de priorité
  const getIconePriorite = (priorite) => {
    switch(priorite) {
      case 'en_retard': return '🚨';
      case 'urgent_aujourd_hui': return '⚡';
      case 'bientot_echeance': return '⚠️';
      case 'en_cours_normal': return '📋';
      case 'termine': return '✅';
      case 'rejete': return '❌';
      default: return '📄';
    }
  };

  const formatDateRelative = (date) => {
    const aujourd_hui = new Date();
    const dateFinPrevue = new Date(date);
    const diffJours = Math.ceil((dateFinPrevue - aujourd_hui) / (1000 * 60 * 60 * 24));
    
    if (diffJours < 0) return `En retard de ${Math.abs(diffJours)} jour(s)`;
    if (diffJours === 0) return "Échéance aujourd'hui";
    if (diffJours <= 2) return `Dans ${diffJours} jour(s)`;
    return `Dans ${diffJours} jours`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête avec actualisation automatique */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Administrateur</h1>
              <p className="text-gray-600 mt-1">
                {dossiersFiltrés.length} dossier(s) affiché(s) sur {dossiers.length} total
                {stats.dossiers_mis_a_jour > 0 && (
                  <span className="ml-2 text-orange-600">
                    • {stats.dossiers_mis_a_jour} statut(s) mis à jour automatiquement
                  </span>
                )}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setVue('tableau')}
                className={`px-4 py-2 rounded-lg ${vue === 'tableau' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                📋 Tableau
              </button>
              <button
                onClick={() => setVue('stats')}
                className={`px-4 py-2 rounded-lg ${vue === 'stats' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                📊 Statistiques
              </button>
              <button
                onClick={() => setVue('graphiques')}
                className={`px-4 py-2 rounded-lg ${vue === 'graphiques' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                📈 Graphiques
              </button>
              <button
                onClick={chargerDonnees}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                🔄 Actualiser
              </button>
            </div>
          </div>
        </div>

        {/* Cartes de statistiques avec codes couleur */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-center">
              <span className="text-2xl mr-2">🚨</span>
              <div>
                <div className="text-2xl font-bold text-red-600">{stats.en_retard || 0}</div>
                <div className="text-sm text-red-700">En retard</div>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg">
            <div className="flex items-center">
              <span className="text-2xl mr-2">⚡</span>
              <div>
                <div className="text-2xl font-bold text-orange-600">{stats.urgents_aujourd_hui || 0}</div>
                <div className="text-sm text-orange-700">Urgent</div>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
            <div className="flex items-center">
              <span className="text-2xl mr-2">⚠️</span>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{stats.bientot_echeance || 0}</div>
                <div className="text-sm text-yellow-700">Bientôt</div>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
            <div className="flex items-center">
              <span className="text-2xl mr-2">📋</span>
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.en_cours || 0}</div>
                <div className="text-sm text-blue-700">En cours</div>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
            <div className="flex items-center">
              <span className="text-2xl mr-2">✅</span>
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.termines || 0}</div>
                <div className="text-sm text-green-700">Terminés</div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 border-l-4 border-gray-500 p-4 rounded-lg">
            <div className="flex items-center">
              <span className="text-2xl mr-2">❌</span>
              <div>
                <div className="text-2xl font-bold text-gray-600">{stats.rejetes || 0}</div>
                <div className="text-sm text-gray-700">Rejetés</div>
              </div>
            </div>
          </div>
        </div>

        {vue === 'tableau' && (
          <>
            {/* Filtres */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtres</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Recherche générale</label>
                  <input
                    type="text"
                    value={filtres.recherche}
                    onChange={(e) => handleFiltreChange('recherche', e.target.value)}
                    placeholder="Nom, ticket, notes..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Numéro de ticket</label>
                  <input
                    type="text"
                    value={filtres.rechercheTicket}
                    onChange={(e) => handleFiltreChange('rechercheTicket', e.target.value)}
                    placeholder="DOC-2025-08-001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priorité</label>
                  <select
                    value={filtres.priorite}
                    onChange={(e) => handleFiltreChange('priorite', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="tous">Toutes les priorités</option>
                    <option value="en_retard">🚨 En retard</option>
                    <option value="urgent_aujourd_hui">⚡ Urgent</option>
                    <option value="bientot_echeance">⚠️ Bientôt</option>
                    <option value="en_cours_normal">📋 En cours</option>
                    <option value="termine">✅ Terminé</option>
                    <option value="rejete">❌ Rejeté</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date début</label>
                  <input
                    type="date"
                    value={filtres.dateDebut}
                    onChange={(e) => handleFiltreChange('dateDebut', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date fin</label>
                  <input
                    type="date"
                    value={filtres.dateFin}
                    onChange={(e) => handleFiltreChange('dateFin', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Tableau des dossiers */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priorité & Ticket
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Échéance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Montant
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dossiersAffiches.map((dossier) => (
                      <tr key={dossier.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-2xl mr-2">{getIconePriorite(dossier.priorite_calculee)}</span>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{dossier.numero_ticket}</div>
                              <div className={`text-xs px-2 py-1 rounded-full ${dossier.badge_class}`}>
                                {dossier.libelle_priorite}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {dossier.client_nom}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {dossier.type_document_nom}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {format(new Date(dossier.date_fin_prevue), 'dd/MM/yyyy', { locale: fr })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDateRelative(dossier.date_fin_prevue)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {parseFloat(dossier.montant).toFixed(2)} €
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {vue === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Répartition par priorité */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Répartition par priorité</h3>
              <div className="space-y-3">
                {statsPriorites.map((stat, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full mr-3"
                        style={{ backgroundColor: stat.couleur }}
                      ></div>
                      <span className="text-sm font-medium">{stat.priorite}</span>
                    </div>
                    <span className="text-lg font-bold">{stat.nombre}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance mensuelle */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance mensuelle</h3>
              <div className="space-y-2">
                {statsMensuelles.slice(0, 6).map((stat, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm">{stat.mois}</span>
                    <div className="text-right">
                      <div className="text-sm font-medium">{stat.total_mois} dossiers</div>
                      <div className="text-xs text-gray-500">{parseFloat(stat.ca_mensuel || 0).toFixed(0)} €</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {vue === 'graphiques' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Graphiques détaillés</h3>
            <p className="text-gray-600">Intégration des graphiques Chart.js à venir...</p>
            
            {/* Aperçu des données pour les graphiques */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Données journalières (30 derniers jours)</h4>
                <div className="bg-gray-50 p-4 rounded max-h-60 overflow-y-auto">
                  <pre className="text-xs">{JSON.stringify(statsJournalieres.slice(0, 5), null, 2)}</pre>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Répartition par type</h4>
                <div className="bg-gray-50 p-4 rounded max-h-60 overflow-y-auto">
                  <pre className="text-xs">{JSON.stringify(statsTypes.slice(0, 5), null, 2)}</pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardWithCharts;
