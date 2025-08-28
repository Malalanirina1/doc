import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const DashboardAdmin = () => {
  // États pour les données
  const [dossiers, setDossiers] = useState([]);
  const [clients, setClients] = useState([]);
  const [typesDocuments, setTypesDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // États pour les filtres (côté frontend uniquement)
  const [filtres, setFiltres] = useState({
    recherche: '',
    rechercheTicket: '',
    statut: 'tous',
    typeDocument: 'tous',
    client: 'tous',
    dateDebut: '',
    dateFin: '',
    enRetard: false
  });
  
  // États pour l'affichage
  const [vue, setVue] = useState('liste'); // 'liste', 'stats', 'nouveau'
  const [dossiersParPage, setDossiersParPage] = useState(20);
  const [pageActuelle, setPageActuelle] = useState(1);

  // Chargement des données depuis l'API (sans filtrage)
  const chargerDonnees = async () => {
    setLoading(true);
    try {
      const [resDossiers, resClients, resTypes] = await Promise.all([
        fetch('http://localhost/doc/backend/api_dossiers.php', { credentials: 'include' }),
        fetch('http://localhost/doc/backend/api_clients.php', { credentials: 'include' }),
        fetch('http://localhost/doc/backend/api_types.php', { credentials: 'include' })
      ]);

      const [dataDossiers, dataClients, dataTypes] = await Promise.all([
        resDossiers.json(),
        resClients.json(),
        resTypes.json()
      ]);

      if (dataDossiers.success) setDossiers(dataDossiers.data || []);
      if (dataClients.success) setClients(dataClients.data || []);
      if (dataTypes.success) setTypesDocuments(dataTypes.data || []);
      
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chargerDonnees();
  }, []);

  // Fonction de filtrage côté frontend (toute la logique ici)
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

      // Filtre par numéro de ticket spécifique
      if (filtres.rechercheTicket) {
        const matchTicket = dossier.numero_ticket?.toLowerCase().includes(filtres.rechercheTicket.toLowerCase());
        if (!matchTicket) return false;
      }

      // Filtre par statut
      if (filtres.statut !== 'tous') {
        if (dossier.statut !== filtres.statut) return false;
      }

      // Filtre par type de document
      if (filtres.typeDocument !== 'tous') {
        if (dossier.type_document_id !== parseInt(filtres.typeDocument)) return false;
      }

      // Filtre par client
      if (filtres.client !== 'tous') {
        if (dossier.client_id !== parseInt(filtres.client)) return false;
      }

      // Filtre par date de dépôt
      if (filtres.dateDebut) {
        const dateDepot = new Date(dossier.date_depot);
        const dateDebut = new Date(filtres.dateDebut);
        if (dateDepot < dateDebut) return false;
      }

      if (filtres.dateFin) {
        const dateDepot = new Date(dossier.date_depot);
        const dateFin = new Date(filtres.dateFin);
        dateFin.setHours(23, 59, 59); // Fin de journée
        if (dateDepot > dateFin) return false;
      }

      // Filtre dossiers en retard
      if (filtres.enRetard) {
        const maintenant = new Date();
        const dateFinPrevue = new Date(dossier.date_fin_prevue);
        const estEnRetard = maintenant > dateFinPrevue && dossier.statut === 'en_cours';
        if (!estEnRetard) return false;
      }

      return true;
    });
  }, [dossiers, filtres]);

  // Pagination côté frontend
  const dossiersAffiches = useMemo(() => {
    const debut = (pageActuelle - 1) * dossiersParPage;
    const fin = debut + dossiersParPage;
    return dossiersFiltrés.slice(debut, fin);
  }, [dossiersFiltrés, pageActuelle, dossiersParPage]);

  // Statistiques calculées côté frontend
  const statistiques = useMemo(() => {
    return {
      total: dossiers.length,
      enCours: dossiers.filter(d => d.statut === 'en_cours').length,
      finis: dossiers.filter(d => d.statut === 'fini').length,
      rejetes: dossiers.filter(d => d.statut === 'rejete').length,
      enRetard: dossiers.filter(d => {
        const maintenant = new Date();
        const dateFinPrevue = new Date(d.date_fin_prevue);
        return maintenant > dateFinPrevue && d.statut === 'en_cours';
      }).length,
      totalFiltres: dossiersFiltrés.length
    };
  }, [dossiers, dossiersFiltrés]);

  // Gestionnaire de changement de filtre
  const handleFiltreChange = (nom, valeur) => {
    setFiltres(prev => ({
      ...prev,
      [nom]: valeur
    }));
    setPageActuelle(1); // Reset pagination
  };

  // Réinitialisation des filtres
  const reinitialiserFiltres = () => {
    setFiltres({
      recherche: '',
      rechercheTicket: '',
      statut: 'tous',
      typeDocument: 'tous',
      client: 'tous',
      dateDebut: '',
      dateFin: '',
      enRetard: false
    });
    setPageActuelle(1);
  };

  // Fonction pour obtenir la couleur du statut
  const getCouleurStatut = (statut) => {
    switch(statut) {
      case 'en_cours': return 'bg-blue-100 text-blue-800';
      case 'fini': return 'bg-green-100 text-green-800';
      case 'rejete': return 'bg-red-100 text-red-800';
      case 'en_retard': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLibelleStatut = (statut) => {
    switch(statut) {
      case 'en_cours': return 'En cours';
      case 'fini': return 'Terminé';
      case 'rejete': return 'Rejeté';
      case 'en_retard': return 'En retard';
      default: return statut;
    }
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
        {/* En-tête */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestion des Dossiers</h1>
              <p className="text-gray-600 mt-1">
                {statistiques.totalFiltres} dossier(s) affiché(s) sur {statistiques.total} total
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setVue('liste')}
                className={`px-4 py-2 rounded-lg ${vue === 'liste' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Liste
              </button>
              <button
                onClick={() => setVue('stats')}
                className={`px-4 py-2 rounded-lg ${vue === 'stats' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Statistiques
              </button>
              <button
                onClick={() => setVue('nouveau')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                + Nouveau Dossier
              </button>
            </div>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{statistiques.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-orange-600">{statistiques.enCours}</div>
            <div className="text-sm text-gray-600">En cours</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-green-600">{statistiques.finis}</div>
            <div className="text-sm text-gray-600">Terminés</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-red-600">{statistiques.rejetes}</div>
            <div className="text-sm text-gray-600">Rejetés</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-purple-600">{statistiques.enRetard}</div>
            <div className="text-sm text-gray-600">En retard</div>
          </div>
        </div>

        {vue === 'liste' && (
          <>
            {/* Filtres */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtres</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Recherche générale */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recherche générale
                  </label>
                  <input
                    type="text"
                    value={filtres.recherche}
                    onChange={(e) => handleFiltreChange('recherche', e.target.value)}
                    placeholder="Nom, ticket, notes..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Recherche par ticket */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro de ticket
                  </label>
                  <input
                    type="text"
                    value={filtres.rechercheTicket}
                    onChange={(e) => handleFiltreChange('rechercheTicket', e.target.value)}
                    placeholder="DOC-2024-09-001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Filtre par statut */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Statut
                  </label>
                  <select
                    value={filtres.statut}
                    onChange={(e) => handleFiltreChange('statut', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="tous">Tous les statuts</option>
                    <option value="en_cours">En cours</option>
                    <option value="fini">Terminé</option>
                    <option value="rejete">Rejeté</option>
                    <option value="en_retard">En retard</option>
                  </select>
                </div>

                {/* Filtre par type de document */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de document
                  </label>
                  <select
                    value={filtres.typeDocument}
                    onChange={(e) => handleFiltreChange('typeDocument', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="tous">Tous les types</option>
                    {typesDocuments.map(type => (
                      <option key={type.id} value={type.id}>{type.nom}</option>
                    ))}
                  </select>
                </div>

                {/* Filtre par client */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client
                  </label>
                  <select
                    value={filtres.client}
                    onChange={(e) => handleFiltreChange('client', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="tous">Tous les clients</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.nom}</option>
                    ))}
                  </select>
                </div>

                {/* Date de début */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de début
                  </label>
                  <input
                    type="date"
                    value={filtres.dateDebut}
                    onChange={(e) => handleFiltreChange('dateDebut', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Date de fin */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    value={filtres.dateFin}
                    onChange={(e) => handleFiltreChange('dateFin', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Checkbox dossiers en retard */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enRetard"
                    checked={filtres.enRetard}
                    onChange={(e) => handleFiltreChange('enRetard', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="enRetard" className="ml-2 block text-sm text-gray-900">
                    Seulement en retard
                  </label>
                </div>
              </div>

              {/* Bouton de réinitialisation */}
              <div className="mt-4 flex justify-between items-center">
                <button
                  onClick={reinitialiserFiltres}
                  className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Réinitialiser les filtres
                </button>
                
                {/* Nombre de résultats */}
                <div className="text-sm text-gray-600">
                  {statistiques.totalFiltres} résultat(s) trouvé(s)
                </div>
              </div>
            </div>

            {/* Liste des dossiers */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ticket
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type de document
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date dépôt
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date fin prévue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Montant
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dossiersAffiches.map((dossier) => (
                      <tr key={dossier.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {dossier.numero_ticket}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {dossier.client_nom}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {dossier.type_document_nom}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCouleurStatut(dossier.statut)}`}>
                            {getLibelleStatut(dossier.statut)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(new Date(dossier.date_depot), 'dd/MM/yyyy', { locale: fr })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(new Date(dossier.date_fin_prevue), 'dd/MM/yyyy', { locale: fr })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {parseFloat(dossier.montant).toFixed(2)} €
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {dossiersFiltrés.length > dossiersParPage && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setPageActuelle(Math.max(1, pageActuelle - 1))}
                      disabled={pageActuelle === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Précédent
                    </button>
                    <button
                      onClick={() => setPageActuelle(Math.min(Math.ceil(dossiersFiltrés.length / dossiersParPage), pageActuelle + 1))}
                      disabled={pageActuelle === Math.ceil(dossiersFiltrés.length / dossiersParPage)}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Suivant
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Affichage de <span className="font-medium">{((pageActuelle - 1) * dossiersParPage) + 1}</span> à{' '}
                        <span className="font-medium">
                          {Math.min(pageActuelle * dossiersParPage, dossiersFiltrés.length)}
                        </span>{' '}
                        sur <span className="font-medium">{dossiersFiltrés.length}</span> résultats
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <select
                        value={dossiersParPage}
                        onChange={(e) => {
                          setDossiersParPage(Number(e.target.value));
                          setPageActuelle(1);
                        }}
                        className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                      >
                        <option value={10}>10 par page</option>
                        <option value={20}>20 par page</option>
                        <option value={50}>50 par page</option>
                        <option value={100}>100 par page</option>
                      </select>
                      
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => setPageActuelle(Math.max(1, pageActuelle - 1))}
                          disabled={pageActuelle === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          ←
                        </button>
                        
                        {/* Pages */}
                        {Array.from({ length: Math.ceil(dossiersFiltrés.length / dossiersParPage) }, (_, i) => i + 1)
                          .filter(page => page === 1 || page === Math.ceil(dossiersFiltrés.length / dossiersParPage) || Math.abs(page - pageActuelle) <= 1)
                          .map((page, index, arr) => (
                            <div key={page} className="flex items-center">
                              {index > 0 && arr[index - 1] !== page - 1 && (
                                <span className="px-2 py-2 text-gray-500">...</span>
                              )}
                              <button
                                onClick={() => setPageActuelle(page)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  page === pageActuelle
                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            </div>
                          ))
                        }
                        
                        <button
                          onClick={() => setPageActuelle(Math.min(Math.ceil(dossiersFiltrés.length / dossiersParPage), pageActuelle + 1))}
                          disabled={pageActuelle === Math.ceil(dossiersFiltrés.length / dossiersParPage)}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          →
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {vue === 'stats' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques détaillées</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Répartition par statut */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Répartition par statut</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>En cours:</span>
                    <span className="font-medium">{statistiques.enCours}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Terminés:</span>
                    <span className="font-medium">{statistiques.finis}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rejetés:</span>
                    <span className="font-medium">{statistiques.rejetes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>En retard:</span>
                    <span className="font-medium">{statistiques.enRetard}</span>
                  </div>
                </div>
              </div>

              {/* Répartition par type de document */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Par type de document</h4>
                <div className="space-y-2">
                  {typesDocuments.map(type => {
                    const count = dossiers.filter(d => d.type_document_id === type.id).length;
                    return (
                      <div key={type.id} className="flex justify-between">
                        <span>{type.nom}:</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Performances */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Performances</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Taux de réussite:</span>
                    <span className="font-medium">
                      {statistiques.total > 0 ? Math.round((statistiques.finis / statistiques.total) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taux de rejet:</span>
                    <span className="font-medium">
                      {statistiques.total > 0 ? Math.round((statistiques.rejetes / statistiques.total) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dossiers en retard:</span>
                    <span className="font-medium">
                      {statistiques.total > 0 ? Math.round((statistiques.enRetard / statistiques.total) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {vue === 'nouveau' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Nouveau Dossier</h3>
            <p className="text-gray-600">Formulaire de création d'un nouveau dossier (à implémenter)</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardAdmin;
