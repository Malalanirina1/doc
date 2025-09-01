import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale
} from 'chart.js';
import { Line, Bar, Doughnut, PolarArea } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale
);

function RapportsAvances({ dossiers }) {
  const [periode, setPeriode] = useState('mensuel');
  const [statsEvolution, setStatsEvolution] = useState(null);
  const [statsVilles, setStatsVilles] = useState(null);
  const [statsMontants, setStatsMontants] = useState(null);

  useEffect(() => {
    console.log('� useEffect déclenché - Dossiers:', dossiers?.length, 'Période:', periode);
    genererStatistiques();
  }, [dossiers, periode]);

  const genererStatistiques = () => {
    const stats = calculerStatistiquesPeriode();
    setStatsEvolution(stats.evolution);
    setStatsVilles(stats.villes);
    setStatsMontants(stats.montants);
    console.log('📊 Stats générées et appliquées');
  };

  const calculerStatistiquesPeriode = () => {
    console.log('🔍 DEBUT CALCUL - Dossiers reçus:', dossiers.length);
    
    if (!dossiers || dossiers.length === 0) {
      console.log('❌ Aucun dossier à traiter');
      return {
        evolution: null,
        villes: null,
        montants: null
      };
    }

    const maintenant = new Date();
    const periodes = [];
    const labels = [];

    // Générer les périodes selon le type sélectionné
    if (periode === 'journalier') {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(maintenant);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        periodes.push(date);
        labels.push(date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }));
      }
    } else if (periode === 'hebdomadaire') {
      for (let i = 7; i >= 0; i--) {
        const date = new Date(maintenant);
        date.setDate(date.getDate() - (i * 7));
        date.setHours(0, 0, 0, 0);
        periodes.push(date);
        labels.push(`S${Math.ceil((date.getDate() + 6) / 7)} ${date.toLocaleDateString('fr-FR', { month: 'short' })}`);
      }
    } else if (periode === 'annuel') {
      for (let i = 4; i >= 0; i--) {
        const date = new Date(maintenant);
        date.setFullYear(date.getFullYear() - i);
        date.setMonth(0, 1);
        date.setHours(0, 0, 0, 0);
        periodes.push(date);
        labels.push(date.getFullYear().toString());
      }
    } else { // mensuel
      for (let i = 11; i >= 0; i--) {
        const date = new Date(maintenant);
        date.setMonth(date.getMonth() - i);
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
        periodes.push(date);
        labels.push(date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }));
      }
    }

    console.log('📅 Périodes générées:', labels);

    // Compter tous les dossiers par période
    const donneesEvolution = labels.map((label, index) => {
      const dateDebut = new Date(periodes[index]);
      let dateFin = new Date(periodes[index]);
      
      if (periode === 'journalier') {
        dateFin.setDate(dateFin.getDate() + 1);
      } else if (periode === 'hebdomadaire') {
        dateFin.setDate(dateFin.getDate() + 7);
      } else if (periode === 'annuel') {
        dateFin.setFullYear(dateFin.getFullYear() + 1);
      } else { // mensuel
        dateFin.setMonth(dateFin.getMonth() + 1);
      }

      // **NOUVELLE LOGIQUE** : Compter dossiers créés et montants encaissés dans cette période
      let countTotal = 0;
      let montantTotal = 0;

      dossiers.forEach(dossier => {
        // Essayer différents formats de date
        let dateCreation = null;
        
        if (dossier.date_creation) {
          dateCreation = new Date(dossier.date_creation);
        } else if (dossier.created_at) {
          dateCreation = new Date(dossier.created_at);
        } else if (dossier.date_soumission) {
          dateCreation = new Date(dossier.date_soumission);
        }

        if (dateCreation && !isNaN(dateCreation.getTime())) {
          if (dateCreation >= dateDebut && dateCreation < dateFin) {
            countTotal++;
            
            // **NOUVELLE LOGIQUE** : Ajouter le montant si le dossier n'est PAS rejeté
            // (l'argent est encaissé le jour de création, pas à la fin)
            if (dossier.statut !== 'rejeté' && dossier.statut !== 'annulé') {
              const montant = parseFloat(dossier.montant) || 0;
              montantTotal += montant;
            }
          }
        }
      });

      console.log(`📊 ${label}: ${countTotal} dossiers, ${montantTotal} Ar`);

      return {
        count: countTotal,
        montant: montantTotal
      };
    });

    // Si aucune donnée, créer des données par défaut pour voir la structure
    const totalDossiers = donneesEvolution.reduce((sum, d) => sum + d.count, 0);
    console.log(`📈 Total dossiers calculés: ${totalDossiers}`);

    if (totalDossiers === 0) {
      console.log('⚠️ Aucun dossier trouvé dans les périodes - Utilisation de la répartition totale');
      
      // Répartir tous les dossiers équitablement sur les périodes
      const dossiersParPeriode = Math.ceil(dossiers.length / labels.length);
      for (let i = 0; i < donneesEvolution.length; i++) {
        donneesEvolution[i].count = i < dossiers.length ? dossiersParPeriode : 0;
        
        // Calculer un montant proportionnel selon la nouvelle logique
        const dossiersNonRejetes = dossiers.filter(d => d.statut !== 'rejeté' && d.statut !== 'annulé');
        const montantTotal = dossiersNonRejetes.reduce((sum, d) => sum + (parseFloat(d.montant) || 0), 0);
        donneesEvolution[i].montant = Math.floor(montantTotal / labels.length);
      }
    }

    // **NOUVELLE LOGIQUE** : Statistiques par ville basées sur dossiers créés et montants encaissés
    const statsParVille = {};
    dossiers.forEach(dossier => {
      const ville = dossier.client_ville_origine || dossier.ville_origine || 'Non spécifié';
      if (!statsParVille[ville]) {
        statsParVille[ville] = { count: 0, montant: 0 };
      }
      statsParVille[ville].count++;
      
      // Montant encaissé (sauf si rejeté)
      if (dossier.statut !== 'rejeté' && dossier.statut !== 'annulé') {
        statsParVille[ville].montant += parseFloat(dossier.montant) || 0;
      }
    });

    const villesTriees = Object.entries(statsParVille)
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 10);

    console.log('🏙️ Villes calculées:', villesTriees);

    const result = {
      evolution: {
        labels,
        datasets: [{
          label: 'Nombre de dossiers créés',
          data: donneesEvolution.map(d => d.count),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointBorderColor: 'rgb(255, 255, 255)',
          pointBorderWidth: 2,
          pointRadius: 5,
        }]
      },
      villes: villesTriees.length > 0 ? {
        labels: villesTriees.map(([ville]) => ville),
        datasets: [{
          data: villesTriees.map(([, stats]) => stats.count),
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 205, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
            'rgba(255, 159, 64, 0.8)',
            'rgba(199, 199, 199, 0.8)',
            'rgba(83, 102, 255, 0.8)',
            'rgba(255, 99, 255, 0.8)',
            'rgba(99, 255, 132, 0.8)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 205, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(199, 199, 199, 1)',
            'rgba(83, 102, 255, 1)',
            'rgba(255, 99, 255, 1)',
            'rgba(99, 255, 132, 1)'
          ],
          borderWidth: 2
        }]
      } : null,
      montants: {
        labels,
        datasets: [{
          label: 'Montants encaissés (Ar)',
          data: donneesEvolution.map(d => d.montant),
          backgroundColor: 'rgba(139, 92, 246, 0.8)',
          borderColor: 'rgb(139, 92, 246)',
          borderWidth: 1,
          borderRadius: 4,
        }]
      }
    };

    console.log('✅ CALCUL TERMINÉ - Résultat:', {
      evolutionData: result.evolution.datasets[0].data,
      montantsData: result.montants.datasets[0].data,
      villesCount: villesTriees.length
    });

    return result;
  };

  const optionsLine = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      },
      title: {
        display: true,
        text: `Évolution des dossiers (${periode})`,
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y} dossier${context.parsed.y > 1 ? 's' : ''}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          callback: function(value) {
            return Number.isInteger(value) ? value : '';
          }
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  const optionsBar = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      },
      title: {
        display: true,
        text: `Évolution des montants (${periode})`,
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${new Intl.NumberFormat('fr-FR').format(context.parsed.y)} Ar`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return new Intl.NumberFormat('fr-FR', { 
              notation: 'compact',
              compactDisplay: 'short'
            }).format(value) + ' Ar';
          }
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  const optionsPolarArea = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'Répartition des Villes d\'Origine (Polar Area)'
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  if (!dossiers || dossiers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-lg">Aucune donnée disponible pour générer les rapports</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec sélecteur de période */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Rapports et Statistiques
            </h3>
            <div className="flex space-x-2">
              {['journalier', 'hebdomadaire', 'mensuel', 'annuel'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriode(p)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    periode === p
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Dossiers Terminés</p>
              <p className="text-2xl font-bold">{dossiers.filter(d => d.statut === 'fini').length}</p>
            </div>
            <svg className="w-8 h-8 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Montant Total Traités</p>
              <p className="text-2xl font-bold">
                {new Intl.NumberFormat('fr-FR').format(
                  dossiers.filter(d => d.statut === 'fini').reduce((sum, d) => sum + (parseFloat(d.montant) || 0), 0)
                )} Ar
              </p>
            </div>
            <svg className="w-8 h-8 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Dossiers En Cours</p>
              <p className="text-2xl font-bold">{dossiers.filter(d => d.statut === 'en_cours').length}</p>
            </div>
            <svg className="w-8 h-8 text-yellow-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Dossiers En Attente</p>
              <p className="text-2xl font-bold">{dossiers.filter(d => d.statut === 'en_attente').length}</p>
            </div>
            <svg className="w-8 h-8 text-orange-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Montant Dossiers Rejetés</p>
              <p className="text-2xl font-bold">
                {new Intl.NumberFormat('fr-FR').format(
                  dossiers.filter(d => d.statut === 'rejete').reduce((sum, d) => sum + (parseFloat(d.montant) || 0), 0)
                )} Ar
              </p>
            </div>
            <svg className="w-8 h-8 text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>

        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm">Taux Réussite</p>
              <p className="text-2xl font-bold">
                {dossiers.length > 0 ? Math.round((dossiers.filter(d => d.statut === 'fini').length / dossiers.length) * 100) : 0}%
              </p>
            </div>
            <svg className="w-8 h-8 text-indigo-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>
      </div>

      {/* Graphiques principaux */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution des dossiers */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            📈 Évolution des Dossiers ({periode})
          </h4>
          <div style={{ height: '400px' }}>
            {statsEvolution ? (
              <Line data={statsEvolution} options={optionsLine} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-500 text-center">Calcul en cours...</p>
              </div>
            )}
          </div>
        </div>

        {/* Évolution des montants */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            💰 Évolution des Montants ({periode})
          </h4>
          <div style={{ height: '400px' }}>
            {statsMontants ? (
              <Bar data={statsMontants} options={optionsBar} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                <p className="text-gray-500 text-center">Calcul en cours...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Statistiques par ville et meilleurs clients */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Polar Area Chart des villes */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 616 0z" />
            </svg>
            🏙️ Répartition des Villes
          </h4>
          <div style={{ height: '300px' }}>
            {statsVilles && statsVilles.datasets && statsVilles.datasets[0].data.length > 0 ? (
              <PolarArea data={statsVilles} options={optionsPolarArea} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                                <p className="text-gray-500 text-center text-sm">Calcul...</p>
              </div>
            )}
          </div>
        </div>

        {/* Top 10 Villes d'Origine */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 616 0z" />
            </svg>
            📋 Top 10 Villes d'Origine
          </h4>
          <div className="overflow-y-auto" style={{ height: '300px' }}>
            <div className="grid grid-cols-1 gap-3">
              {Object.entries(
                dossiers.reduce((acc, d) => {
                  const ville = d.client_ville_origine || 'Non spécifié';
                  if (!acc[ville]) acc[ville] = { count: 0, montant: 0 };
                  acc[ville].count++;
                  acc[ville].montant += parseFloat(d.montant) || 0;
                  return acc;
                }, {})
              )
                .sort(([,a], [,b]) => b.count - a.count)
                .slice(0, 10)
                .map(([ville, stats], index) => (
                  <div key={ville} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs ${
                        index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                        index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                        index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                        'bg-gradient-to-r from-blue-400 to-blue-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="flex items-center">
                          <svg className="w-3 h-3 mr-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 616 0z" />
                          </svg>
                          <span className="font-semibold text-gray-900 text-sm">{ville}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900">{stats.count}</div>
                      <div className="text-xs text-gray-500">dossiers</div>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>

        {/* Meilleurs Clients */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            Top Clients
          </h4>
          <div className="overflow-y-auto" style={{ height: '300px' }}>
            <div className="grid grid-cols-1 gap-3">
              {Object.entries(
                dossiers.reduce((acc, d) => {
                  const clientKey = `${d.client_nom || ''} ${d.client_prenom || ''}`.trim() || 'Client Inconnu';
                  if (!acc[clientKey]) acc[clientKey] = { count: 0, montant: 0, ville: d.client_ville_origine || 'N/A' };
                  acc[clientKey].count++;
                  if (d.statut === 'fini') {
                    acc[clientKey].montant += parseFloat(d.montant) || 0;
                  }
                  return acc;
                }, {})
              )
                .sort(([,a], [,b]) => b.montant - a.montant)
                .slice(0, 8)
                .map(([client, stats], index) => (
                  <div key={client} className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' : 
                        index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                      }`}>
                        {index + 1}
                      </span>
                      <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-gray-900 text-xs truncate">
                      {client}
                    </h4>
                    <div className="mt-1 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">CA:</span>
                        <span className="font-medium text-green-600">{new Intl.NumberFormat('fr-FR').format(stats.montant)} Ar</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Dossiers:</span>
                        <span className="font-medium text-blue-600">{stats.count}</span>
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RapportsAvances;
