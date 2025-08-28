import React, { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    PointElement,
    ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    PointElement,
    ArcElement
);

const FinancialReports = () => {
    const [rapports, setRapports] = useState(null);
    const [periode, setPeriode] = useState('mois');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadRapports();
    }, [periode]);

    const loadRapports = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`http://localhost:80/doc/rapports_financiers.php?periode=${periode}`);
            const result = await response.json();
            
            if (result.success) {
                setRapports(result);
            } else {
                setError(result.message);
            }
        } catch (error) {
            setError('Erreur lors du chargement des rapports: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0) + ' Ar';
    };

    const formatPercentage = (value) => {
        const sign = value >= 0 ? '+' : '';
        return `${sign}${value.toFixed(1)}%`;
    };

    const getEvolutionColor = (value) => {
        if (value > 0) return 'text-green-600';
        if (value < 0) return 'text-red-600';
        return 'text-gray-600';
    };

    const getEvolutionIcon = (value) => {
        if (value > 0) return '📈';
        if (value < 0) return '📉';
        return '➡️';
    };

    // Composant pour les graphiques en barres améliorés
    const EnhancedBarChart = ({ data, dataKey, titleKey, color = '#4F46E5', showCount = false }) => {
        if (!data || data.length === 0) return <div className="text-gray-500 text-center py-4">Aucune donnée disponible</div>;

        const maxValue = Math.max(...data.map(item => parseFloat(item[dataKey]) || 0));
        
        return (
            <div className="space-y-3">
                {data.slice(0, 8).map((item, index) => {
                    const value = parseFloat(item[dataKey]) || 0;
                    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
                    const count = item.nombre_dossiers || item.dossiers_termines || 0;
                    
                    return (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                                <div className="font-medium text-sm text-gray-800">
                                    {item.date || item.mois_nom || item.debut_semaine || item.type_document || `${item.nom} ${item.prenom}`}
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-lg text-indigo-600">
                                        {formatCurrency(value)}
                                    </div>
                                    {showCount && (
                                        <div className="text-xs text-gray-500">
                                            {count} dossier{count > 1 ? 's' : ''} terminé{count > 1 ? 's' : ''}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div 
                                    className="h-3 rounded-full transition-all duration-500 ease-out" 
                                    style={{ 
                                        width: `${percentage}%`, 
                                        backgroundColor: color 
                                    }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    // Composant pour graphique en secteurs amélioré avec Chart.js
    const ImprovedDonutChart = ({ data, title = "Répartition" }) => {
        if (!data || data.length === 0) {
            return (
                <div className="flex items-center justify-center h-64 text-gray-500">
                    <div className="text-center">
                        <div className="text-4xl mb-2">📊</div>
                        <div>Aucune donnée disponible</div>
                    </div>
                </div>
            );
        }

        // Couleurs modernes et attrayantes
        const colors = [
            '#6366f1', // Indigo
            '#10b981', // Emerald
            '#f59e0b', // Amber
            '#ef4444', // Red
            '#8b5cf6', // Violet
            '#06b6d4', // Cyan
            '#f97316', // Orange
            '#84cc16', // Lime
            '#ec4899', // Pink
            '#64748b', // Slate
        ];

        const chartData = {
            labels: data.map(item => item.type_document),
            datasets: [
                {
                    data: data.map(item => parseFloat(item.revenus_type) || 0),
                    backgroundColor: colors.slice(0, data.length),
                    borderColor: colors.slice(0, data.length).map(color => color + '80'),
                    borderWidth: 2,
                    hoverBorderWidth: 3,
                    hoverOffset: 8,
                }
            ]
        };

        const total = data.reduce((sum, item) => sum + (parseFloat(item.revenus_type) || 0), 0);

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: {
                            size: 12,
                            weight: '500'
                        },
                        generateLabels: function(chart) {
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                                return data.labels.map((label, i) => {
                                    const value = data.datasets[0].data[i];
                                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                    return {
                                        text: `${label} (${percentage}%)`,
                                        fillStyle: data.datasets[0].backgroundColor[i],
                                        strokeStyle: data.datasets[0].borderColor[i],
                                        lineWidth: 2,
                                        pointStyle: 'circle',
                                        hidden: false,
                                        index: i
                                    };
                                });
                            }
                            return [];
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                        },
                        afterLabel: function(context) {
                            const dataset = context.dataset.data;
                            const currentValue = dataset[context.dataIndex];
                            const count = data[context.dataIndex]?.nb_dossiers || 0;
                            return `${count} dossier${count > 1 ? 's' : ''}`;
                        }
                    }
                }
            },
            cutout: '60%',
            radius: '90%',
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 1000,
                easing: 'easeOutQuart'
            },
            hover: {
                animationDuration: 300
            }
        };

        return (
            <div className="space-y-4">
                {/* Statistiques rapides */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg mr-3">
                                <span className="text-blue-600 text-xl">💰</span>
                            </div>
                            <div>
                                <div className="text-sm text-blue-600 font-medium">Total Revenus</div>
                                <div className="text-lg font-bold text-blue-900">{formatCurrency(total)}</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg mr-3">
                                <span className="text-green-600 text-xl">📄</span>
                            </div>
                            <div>
                                <div className="text-sm text-green-600 font-medium">Types de Documents</div>
                                <div className="text-lg font-bold text-green-900">{data.length}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Graphique */}
                <div className="relative h-80">
                    <Doughnut data={chartData} options={options} />
                    
                    {/* Centre du donut avec total */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-800">{formatCurrency(total)}</div>
                            <div className="text-sm text-gray-500 font-medium">Total des revenus</div>
                            <div className="text-xs text-gray-400 mt-1">{data.length} type{data.length > 1 ? 's' : ''}</div>
                        </div>
                    </div>
                </div>

                {/* Tableau détaillé */}
                <div className="mt-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Détail par type de document</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                        {data.map((item, index) => {
                            const value = parseFloat(item.revenus_type) || 0;
                            const percentage = total > 0 ? (value / total) * 100 : 0;
                            const count = item.nb_dossiers || 0;
                            
                            return (
                                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center space-x-3">
                                        <div 
                                            className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                                            style={{ backgroundColor: colors[index % colors.length] }}
                                        ></div>
                                        <span className="font-medium text-gray-800">{item.type_document}</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-semibold text-gray-900">{formatCurrency(value)}</div>
                                        <div className="text-xs text-gray-500">{percentage.toFixed(1)}% • {count} dossier{count > 1 ? 's' : ''}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    // Composant graphique en barres avec Chart.js pour les revenus par semaine
    const WeeklyRevenueChart = ({ data }) => {
        if (!data || data.length === 0) return <div className="text-gray-500 text-center py-4">Aucune donnée disponible</div>;

        const chartData = {
            labels: data.map(item => {
                const date = new Date(item.debut_semaine);
                return `Sem. ${date.getDate()}/${date.getMonth() + 1}`;
            }).reverse(),
            datasets: [
                {
                    label: 'Revenus réalisés',
                    data: data.map(item => parseFloat(item.revenus_semaine) || 0).reverse(),
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: 'rgb(59, 130, 246)',
                    borderWidth: 2,
                    borderRadius: 4,
                    borderSkipped: false,
                },
                {
                    label: 'Dossiers terminés',
                    data: data.map(item => (item.dossiers_termines_semaine || 0) * 100).reverse(), // Multiplié par 100 pour être visible
                    backgroundColor: 'rgba(16, 185, 129, 0.6)',
                    borderColor: 'rgb(16, 185, 129)',
                    borderWidth: 2,
                    borderRadius: 4,
                    borderSkipped: false,
                    yAxisID: 'y1',
                }
            ],
        };

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Revenus par Semaine (12 dernières semaines)',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (context.datasetIndex === 1) {
                                return `${context.dataset.label}: ${Math.round(context.parsed.y / 100)} dossiers`;
                            }
                            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Semaines'
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Revenus (Ar)'
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Dossiers terminés'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                    ticks: {
                        callback: function(value) {
                            return Math.round(value / 100);
                        }
                    }
                },
            },
        };

        return (
            <div style={{ height: '350px' }}>
                <Bar data={chartData} options={options} />
            </div>
        );
    };

    // Composant graphique linéaire avec Chart.js pour les revenus par mois
    const MonthlyRevenueChart = ({ data }) => {
        if (!data || data.length === 0) return <div className="text-gray-500 text-center py-4">Aucune donnée disponible</div>;

        const chartData = {
            labels: data.map(item => item.mois_nom || item.mois).reverse(),
            datasets: [
                {
                    label: 'Revenus mensuels',
                    data: data.map(item => parseFloat(item.revenus_mois) || 0).reverse(),
                    borderColor: 'rgb(147, 51, 234)',
                    backgroundColor: 'rgba(147, 51, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: 'rgb(147, 51, 234)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                },
                {
                    label: 'Dossiers terminés',
                    data: data.map(item => (item.dossiers_termines_mois || 0) * 500).reverse(), // Multiplié pour être visible
                    borderColor: 'rgb(245, 158, 11)',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: 'rgb(245, 158, 11)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    yAxisID: 'y1',
                }
            ],
        };

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Évolution des Revenus par Mois (12 derniers mois)',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (context.datasetIndex === 1) {
                                return `${context.dataset.label}: ${Math.round(context.parsed.y / 500)} dossiers`;
                            }
                            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Mois'
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Revenus (Ar)'
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Dossiers terminés'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                    ticks: {
                        callback: function(value) {
                            return Math.round(value / 500);
                        }
                    }
                },
            },
        };

        return (
            <div style={{ height: '350px' }}>
                <Line data={chartData} options={options} />
            </div>
        );
    };

    // Composant graphique en barres pour les revenus par jour
    const DailyRevenueChart = ({ data }) => {
        if (!data || data.length === 0) return <div className="text-gray-500 text-center py-4">Aucune donnée disponible</div>;

        // Prendre les 15 derniers jours et les trier par date croissante pour l'affichage
        const last15Days = data.slice(0, 15).reverse(); // reverse car les données viennent en DESC du backend

        const chartData = {
            labels: last15Days.map(item => {
                const date = new Date(item.date + 'T00:00:00'); // Assurer un format de date correct
                const today = new Date();
                const diffTime = Math.abs(today - date);
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                
                // Format: "27/08" pour aujourd'hui, "26/08" pour hier, etc.
                if (diffDays === 0) {
                    return `Aujourd'hui (${date.getDate()}/${String(date.getMonth() + 1).padStart(2, '0')})`;
                } else if (diffDays === 1) {
                    return `Hier (${date.getDate()}/${String(date.getMonth() + 1).padStart(2, '0')})`;
                } else {
                    return `${date.getDate()}/${String(date.getMonth() + 1).padStart(2, '0')}`;
                }
            }),
            datasets: [
                {
                    label: 'Revenus journaliers (Ar)',
                    data: last15Days.map(item => parseFloat(item.revenus_jour) || 0),
                    backgroundColor: (ctx) => {
                        // Gradient pour rendre plus attractif
                        const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 400);
                        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.8)');
                        gradient.addColorStop(1, 'rgba(16, 185, 129, 0.1)');
                        return gradient;
                    },
                    borderColor: 'rgb(16, 185, 129)',
                    borderWidth: 2,
                    borderRadius: 6,
                    borderSkipped: false,
                    hoverBackgroundColor: 'rgba(16, 185, 129, 1)',
                    hoverBorderColor: 'rgb(5, 150, 105)',
                    hoverBorderWidth: 3,
                }
            ],
        };

        const maxValue = Math.max(...last15Days.map(item => parseFloat(item.revenus_jour) || 0));

        const options = {
            responsive: true,
            maintainAspectRatio: false, // Important pour avoir une hauteur fixe
            plugins: {
                legend: {
                    display: false,
                },
                title: {
                    display: true,
                    text: '📅 Évolution des revenus quotidiens',
                    font: {
                        size: 16,
                        weight: 'bold'
                    },
                    color: '#1f2937'
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: 'rgba(16, 185, 129, 0.5)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        title: function(context) {
                            const item = last15Days[context[0].dataIndex];
                            const date = new Date(item.date + 'T00:00:00');
                            return date.toLocaleDateString('fr-FR', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            });
                        },
                        label: function(context) {
                            const item = last15Days[context.dataIndex];
                            return [
                                `💰 Revenus: ${formatCurrency(context.parsed.y)}`,
                                `📄 Dossiers terminés: ${item.dossiers_termines}`,
                                `🔄 En cours: ${item.dossiers_en_cours}`,
                                `📊 Total dossiers: ${item.nombre_dossiers}`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Jours (15 derniers jours)',
                        font: {
                            weight: 'bold'
                        }
                    },
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 0,
                        font: {
                            size: 11
                        }
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Revenus (Ar)',
                        font: {
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    beginAtZero: true,
                    max: maxValue * 1.1 // Ajouter 10% de marge en haut
                },
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        };

        return (
            <div style={{ height: '400px' }}>
                <Bar data={chartData} options={options} />
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-red-800">{error}</div>
            </div>
        );
    }

    if (!rapports) return null;

    const { stats_generales, revenus_par_jour, revenus_par_semaine, revenus_par_mois, revenus_par_type, top_clients, comparaison } = rapports;

    return (
        <div className="space-y-6">
            {/* Sélecteur de période */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Rapports Financiers</h2>
                    <p className="text-sm text-gray-600 mt-1">
                        💡 <strong>Note :</strong> Les revenus sont comptabilisés à la date de création du dossier (paiement anticipé)
                    </p>
                </div>
                <select 
                    value={periode} 
                    onChange={(e) => setPeriode(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                    <option value="jour">Aujourd'hui</option>
                    <option value="semaine">Cette semaine</option>
                    <option value="mois">Ce mois</option>
                    <option value="tout">Depuis toujours</option>
                </select>
            </div>

            {/* Statistiques principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-green-100">
                            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Revenus Réalisés</p>
                            <p className="text-2xl font-bold text-green-700">{formatCurrency(stats_generales.revenus_realises)}</p>
                            {comparaison.revenus_evolution !== undefined && (
                                <p className={`text-sm ${getEvolutionColor(comparaison.revenus_evolution)}`}>
                                    {getEvolutionIcon(comparaison.revenus_evolution)} {formatPercentage(comparaison.revenus_evolution)}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-purple-100">
                            <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Dossiers</p>
                            <p className="text-2xl font-bold text-purple-700">{stats_generales.total_dossiers}</p>
                            {comparaison.dossiers_evolution !== undefined && (
                                <p className={`text-sm ${getEvolutionColor(comparaison.dossiers_evolution)}`}>
                                    {getEvolutionIcon(comparaison.dossiers_evolution)} {formatPercentage(comparaison.dossiers_evolution)}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-yellow-100">
                            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Montant Moyen</p>
                            <p className="text-2xl font-bold text-yellow-700">{formatCurrency(stats_generales.montant_moyen)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Répartition par statut */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Répartition par Statut</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{stats_generales.dossiers_termines}</div>
                        <div className="text-sm text-gray-600">Terminés</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{stats_generales.dossiers_en_cours}</div>
                        <div className="text-sm text-gray-600">En cours</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{stats_generales.dossiers_en_attente}</div>
                        <div className="text-sm text-gray-600">En attente</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{stats_generales.dossiers_rejetes}</div>
                        <div className="text-sm text-gray-600">Rejetés</div>
                    </div>
                </div>
            </div>

            {/* Graphiques */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenus par jour */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                        📅 Revenus par Jour (15 derniers jours)
                    </h3>
                    <DailyRevenueChart data={revenus_par_jour} />
                </div>

                {/* Revenus par type avec graphique en secteurs amélioré */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                        <span className="text-2xl mr-2">📊</span>
                        Répartition par Type de Document
                    </h3>
                    <ImprovedDonutChart data={revenus_par_type} />
                </div>
            </div>

            {/* Graphiques supplémentaires */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenus par semaine */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                        📈 Revenus par Semaine (12 dernières semaines)
                    </h3>
                    <WeeklyRevenueChart data={revenus_par_semaine} />
                </div>

                {/* Rapport financier du jour */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                        📅 Rapport Financier du Jour
                    </h3>
                    {periode === 'jour' && revenus_par_jour.length > 0 ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                    <div className="text-2xl font-bold text-green-600">
                                        {formatCurrency(revenus_par_jour[0]?.revenus_jour || 0)}
                                    </div>
                                    <div className="text-sm text-green-700">Revenus aujourd'hui</div>
                                </div>
                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {revenus_par_jour[0]?.dossiers_termines || 0}
                                    </div>
                                    <div className="text-sm text-blue-700">Dossiers terminés</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                                    <div className="text-2xl font-bold text-yellow-600">
                                        {revenus_par_jour[0]?.dossiers_en_cours || 0}
                                    </div>
                                    <div className="text-sm text-yellow-700">En cours</div>
                                </div>
                                <div className="text-center p-4 bg-gray-50 rounded-lg">
                                    <div className="text-2xl font-bold text-gray-600">
                                        {revenus_par_jour[0]?.nombre_dossiers || 0}
                                    </div>
                                    <div className="text-sm text-gray-700">Total dossiers</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-4 text-gray-500">
                            Sélectionnez "Aujourd'hui" pour voir le rapport du jour
                        </div>
                    )}
                </div>
            </div>

            {/* Revenus par mois - Graphique en ligne */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                    � Évolution des Revenus (12 derniers mois)
                </h3>
                <MonthlyRevenueChart data={revenus_par_mois} />
            </div>
        </div>
    );
};

export default FinancialReports;
