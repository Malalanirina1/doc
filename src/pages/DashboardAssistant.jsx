import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest, API_ENDPOINTS } from '../config/api.js';
import { useToast } from '../components/Toast';
import jsPDF from 'jspdf';
import { getCurrentDateTime, generateTicketNumber } from '../utils/dateUtils.js';

const DashboardAssistant = ({ user, setUser }) => {
    const [activeTab, setActiveTab] = useState('consultation');
    const [numeroTicket, setNumeroTicket] = useState('');
    const [dossierData, setDossierData] = useState(null);
    const [pieces, setPieces] = useState([]);
    const [loading, setLoading] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [showPiecesRequises, setShowPiecesRequises] = useState(false);
    
    // États pour création de dossier
    const [typesDossiers, setTypesDossiers] = useState([]);
    const [selectedType, setSelectedType] = useState('');
    const [nouveauDossier, setNouveauDossier] = useState({
        client_nom: '',
        client_prenom: '',
        client_email: '',
        client_telephone: '',
        client_adresse: '',
        client_ville_origine: '',
        montant: '',
        commentaire: ''
    });

    const navigate = useNavigate();
    const { showToast } = useToast();

    useEffect(() => {
        if (!user || user.role !== 'assistant') {
            navigate('/login');
            return;
        }
        
        // Charger les types de dossiers
        loadTypesDossiers();
        
        // Désactiver les captures d'écran et copier-coller
        disableSecurityFeatures();
    }, [user, navigate]);

    // Timer pour les 20 secondes d'affichage des pièces requises
    useEffect(() => {
        let interval;
        if (showPiecesRequises && timeRemaining > 0) {
            interval = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        setShowPiecesRequises(false);
                        setPieces([]);
                        showToast('Informations effacées pour sécurité', 'info');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [showPiecesRequises, timeRemaining, showToast]);

    const loadTypesDossiers = async () => {
        try {
            const data = await apiRequest(API_ENDPOINTS.types);
            if (data.success && data.data && Array.isArray(data.data)) {
                setTypesDossiers(data.data.filter(type => type.actif === 1));
            } else {
                console.error('Données types invalides:', data);
                setTypesDossiers([]);
            }
        } catch (error) {
            console.error('Erreur chargement types:', error);
            setTypesDossiers([]);
        }
    };

    const disableSecurityFeatures = () => {
        // Désactiver capture d'écran
        document.addEventListener('keydown', (e) => {
            if (e.key === 'PrintScreen' || (e.ctrlKey && e.shiftKey && e.key === 'I') || 
                (e.ctrlKey && e.shiftKey && e.key === 'C') || (e.key === 'F12')) {
                e.preventDefault();
                showToast('Action interdite pour sécurité', 'error');
            }
        });

        // Désactiver copier-coller
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'x')) || 
                (e.ctrlKey && e.key === 'a')) {
                e.preventDefault();
                showToast('Copier-coller désactivé', 'error');
            }
        });

        // Désactiver menu contextuel
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // Désactiver sélection
        document.addEventListener('selectstart', (e) => {
            if (showPiecesRequises) {
                e.preventDefault();
            }
        });
    };

    const handleConsultation = async (e) => {
        e.preventDefault();
        if (!numeroTicket.trim()) {
            showToast('Veuillez entrer un numéro de ticket', 'error');
            return;
        }

        setLoading(true);
        try {
            const data = await apiRequest(`${API_ENDPOINTS.search}?ticket=${encodeURIComponent(numeroTicket.trim())}`);

            if (data.success) {
                setDossierData(data.dossier);
                showToast('Dossier trouvé', 'success');
            } else {
                setDossierData(null);
                showToast(data.message || 'Ticket non trouvé', 'error');
            }
        } catch (error) {
            showToast('Erreur lors de la recherche', 'error');
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDossier = async (e) => {
        e.preventDefault();
        if (!selectedType || !nouveauDossier.client_nom || !nouveauDossier.client_prenom || !nouveauDossier.client_email) {
            showToast('Veuillez remplir tous les champs obligatoires', 'error');
            return;
        }

        setLoading(true);
        try {
            // Générer le numéro de ticket côté frontend
            const numeroTicket = generateTicketNumber();
            const dateCreation = getCurrentDateTime();

            const dossierPayload = {
                ...nouveauDossier,
                type_id: selectedType,
                statut: 'nouveau',
                numero_dossier: numeroTicket,
                created_at: dateCreation,
                updated_at: dateCreation
            };

            const data = await apiRequest(API_ENDPOINTS.dossiers, {
                method: 'POST',
                body: JSON.stringify(dossierPayload)
            });

            if (data.success) {
                // Générer et imprimer le PDF avec le numéro de ticket
                generateTicketPDF(numeroTicket);
                
                // Afficher les pièces requises pendant 20 secondes
                if (data.pieces_requises && data.pieces_requises.length > 0) {
                    setPieces(data.pieces_requises);
                    setShowPiecesRequises(true);
                    setTimeRemaining(20);
                }

                // Réinitialiser le formulaire
                setNouveauDossier({
                    client_nom: '',
                    client_prenom: '',
                    client_email: '',
                    client_telephone: '',
                    client_ville_origine: ''
                });
                setSelectedType('');

                showToast(`Dossier créé avec succès - Ticket: ${numeroTicket}`, 'success');
            } else {
                showToast(data.message || 'Erreur lors de la création', 'error');
            }
        } catch (error) {
            showToast('Erreur lors de la création du dossier', 'error');
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateTicketPDF = (numeroTicket) => {
        const doc = new jsPDF();
        
        // Configuration PDF
        doc.setFontSize(16);
        doc.text('TICKET DE DOSSIER', 20, 30);
        
        doc.setFontSize(12);
        doc.text('Numéro de ticket:', 20, 50);
        
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text(numeroTicket, 20, 65);
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 20, 85);
        doc.text('Conservez ce ticket pour toute consultation', 20, 95);
        
        // Sauvegarder avec le nom du ticket
        doc.save(`${numeroTicket}.pdf`);
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('user');
        navigate('/login');
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
                        <header className="shadow-xl border-b border-gray-100 backdrop-blur-sm bg-white/95">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                Interface Assistant
                            </h1>
                            <span className="ml-4 px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                {user?.username}
                            </span>
                        </div>
                        <div className="flex items-center space-x-4">
                            {showPiecesRequises && (
                                <div className="flex items-center bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L10 9.586V6z" clipRule="evenodd" />
                                    </svg>
                                    {formatTime(timeRemaining)}
                                </div>
                            )}
                            <button
                                onClick={handleLogout}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                            >
                                Déconnexion
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation Tabs */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <nav className="flex space-x-8 mt-6">
                    {[
                        { id: 'consultation', label: 'Consultation Dossier', icon: '🔍' },
                        { id: 'creation', label: 'Nouveau Dossier', icon: '�' },
                        { id: 'aide', label: 'Aide', icon: '❓' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                                activeTab === tab.id 
                                    ? 'bg-indigo-100 text-indigo-700 shadow-md' 
                                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                            }`}
                        >
                            <span className="mr-2 text-lg">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'consultation' && (
                    <div className="space-y-6">
                        {/* Formulaire de consultation */}
                        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                                <svg className="w-6 h-6 mr-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                Consultation par Numéro de Ticket
                            </h3>
                            <form onSubmit={handleConsultation} className="flex space-x-4">
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        placeholder="Entrez le numéro de ticket (ex: TK001)"
                                        value={numeroTicket}
                                        onChange={(e) => setNumeroTicket(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
                                        disabled={loading}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                                >
                                    {loading ? (
                                        <div className="flex items-center">
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Recherche...
                                        </div>
                                    ) : 'Consulter'}
                                </button>
                            </form>
                        </div>

                        {/* Affichage des données du dossier (sans restriction de temps) */}
                        {dossierData && (
                            <div className="bg-white rounded-xl shadow-lg border border-gray-100">
                                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                                    <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                                        <svg className="w-6 h-6 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Dossier #{dossierData.numero_dossier}
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <div>
                                                <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                                    <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                    Informations Client
                                                </h4>
                                                <div className="space-y-3">
                                                    <div className="flex items-center">
                                                        <span className="font-medium text-gray-700 w-20">Nom:</span>
                                                        <span className="text-gray-900">{dossierData.client_nom} {dossierData.client_prenom}</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <span className="font-medium text-gray-700 w-20">Email:</span>
                                                        <span className="text-gray-900">{dossierData.client_email}</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <span className="font-medium text-gray-700 w-20">Téléphone:</span>
                                                        <span className="text-gray-900">{dossierData.client_telephone || 'Non renseigné'}</span>
                                                    </div>
                                                    {dossierData.client_ville_origine && (
                                                        <div className="flex items-center">
                                                            <span className="font-medium text-gray-700 w-20">Ville:</span>
                                                            <span className="text-gray-900">{dossierData.client_ville_origine}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            <div>
                                                <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    Informations Dossier
                                                </h4>
                                                <div className="space-y-3">
                                                    <div className="flex items-center">
                                                        <span className="font-medium text-gray-700 w-20">Type:</span>
                                                        <span className="text-gray-900">{dossierData.type_nom || dossierData.nom_type}</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <span className="font-medium text-gray-700 w-20">Statut:</span>
                                                        <span className={`ml-2 px-3 py-1 text-xs font-medium rounded-full ${
                                                            dossierData.statut === 'fini' ? 'bg-green-100 text-green-800' :
                                                            dossierData.statut === 'en_cours' ? 'bg-yellow-100 text-yellow-800' :
                                                            dossierData.statut === 'nouveau' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {dossierData.statut}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <span className="font-medium text-gray-700 w-20">Créé le:</span>
                                                        <span className="text-gray-900">{new Date(dossierData.date_creation).toLocaleDateString('fr-FR')}</span>
                                                    </div>
                                                    {dossierData.montant && (
                                                        <div className="flex items-center">
                                                            <span className="font-medium text-gray-700 w-20">Montant:</span>
                                                            <span className="text-gray-900 font-semibold">{new Intl.NumberFormat('fr-FR').format(dossierData.montant)} Ar</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                                        <div className="mt-6">
                                            <h4 className="text-sm font-medium text-gray-900 mb-3">Pièces Requises</h4>
                                            <div className="space-y-2">
                                                {pieces.map((piece, index) => (
                                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">{piece.nom_piece}</p>
                                                            {piece.description && (
                                                                <p className="text-xs text-gray-600">{piece.description}</p>
                                                            )}
                                                        </div>
                                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                                            piece.obligatoire === 1 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {piece.obligatoire === 1 ? 'Obligatoire' : 'Optionnel'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                {activeTab === 'creation' && (
                    <div className="space-y-6">
                        {/* Formulaire de création de dossier */}
                        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                                <svg className="w-6 h-6 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Création d'un Nouveau Dossier
                            </h3>
                            
                            <form onSubmit={handleCreateDossier} className="space-y-6">
                                {/* Sélection du type de dossier */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Type de Dossier *</label>
                                    <select
                                        value={selectedType}
                                        onChange={(e) => setSelectedType(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        required
                                    >
                                        <option value="">Sélectionnez un type de dossier</option>
                                        {typesDossiers.map(type => (
                                            <option key={type.id} value={type.id}>
                                                {type.nom} - {new Intl.NumberFormat('fr-FR').format(type.tarif)} Ar
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Informations client */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
                                        <input
                                            type="text"
                                            required
                                            value={nouveauDossier.client_nom}
                                            onChange={(e) => setNouveauDossier({...nouveauDossier, client_nom: e.target.value})}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Prénom *</label>
                                        <input
                                            type="text"
                                            required
                                            value={nouveauDossier.client_prenom}
                                            onChange={(e) => setNouveauDossier({...nouveauDossier, client_prenom: e.target.value})}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                                        <input
                                            type="email"
                                            required
                                            value={nouveauDossier.client_email}
                                            onChange={(e) => setNouveauDossier({...nouveauDossier, client_email: e.target.value})}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                                        <input
                                            type="tel"
                                            value={nouveauDossier.client_telephone}
                                            onChange={(e) => setNouveauDossier({...nouveauDossier, client_telephone: e.target.value})}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Ville d'Origine</label>
                                        <input
                                            type="text"
                                            value={nouveauDossier.client_ville_origine}
                                            onChange={(e) => setNouveauDossier({...nouveauDossier, client_ville_origine: e.target.value})}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Montant (Ar)</label>
                                        <input
                                            type="number"
                                            value={nouveauDossier.montant}
                                            onChange={(e) => setNouveauDossier({...nouveauDossier, montant: e.target.value})}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Adresse</label>
                                    <textarea
                                        rows={3}
                                        value={nouveauDossier.client_adresse}
                                        onChange={(e) => setNouveauDossier({...nouveauDossier, client_adresse: e.target.value})}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Commentaire</label>
                                    <textarea
                                        rows={3}
                                        value={nouveauDossier.commentaire}
                                        onChange={(e) => setNouveauDossier({...nouveauDossier, commentaire: e.target.value})}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 px-6 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg transition-colors"
                                >
                                    {loading ? (
                                        <div className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Création en cours...
                                        </div>
                                    ) : 'Créer le Dossier'}
                                </button>
                            </form>
                        </div>

                        {/* Affichage temporaire des pièces requises (20 secondes) */}
                        {showPiecesRequises && pieces.length > 0 && (
                            <div className="bg-white rounded-xl shadow-lg border border-red-200 p-6" style={{userSelect: 'none', pointerEvents: 'none'}}>
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Pièces Requises pour ce Dossier
                                    </h4>
                                    <div className="flex items-center bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L10 9.586V6z" clipRule="evenodd" />
                                        </svg>
                                        {formatTime(timeRemaining)}
                                    </div>
                                </div>
                                
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                                    <p className="text-sm text-yellow-800 font-medium">
                                        ⚠️ Ces informations seront automatiquement effacées dans {formatTime(timeRemaining)} pour des raisons de sécurité
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {pieces.map((piece, index) => (
                                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                                            <div>
                                                <p className="font-medium text-gray-900">{piece.nom_piece}</p>
                                                {piece.description && (
                                                    <p className="text-sm text-gray-600 mt-1">{piece.description}</p>
                                                )}
                                            </div>
                                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                                piece.obligatoire === 1 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {piece.obligatoire === 1 ? 'Obligatoire' : 'Optionnel'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'aide' && (
                    <div className="bg-white rounded-xl shadow-lg border border-gray-100">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                                <svg className="w-6 h-6 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Guide d'Utilisation - Interface Assistant
                            </h3>
                        </div>
                        <div className="p-6">
                            <div className="space-y-8">
                                <div>
                                    <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                        <span className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">1</span>
                                        Consultation de Dossier
                                    </h4>
                                    <div className="ml-11 space-y-2">
                                        <p className="text-gray-700">• <strong>Fonction :</strong> Consulter le statut d'un dossier existant</p>
                                        <p className="text-gray-700">• <strong>Comment :</strong> Entrez le numéro de ticket fourni au client</p>
                                        <p className="text-gray-700">• <strong>Affichage :</strong> Toutes les informations du dossier sans restriction de temps</p>
                                        <p className="text-gray-700">• <strong>Limitation :</strong> Aucun bouton de gestion (consultation uniquement)</p>
                                    </div>
                                </div>
                                
                                <div>
                                    <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                        <span className="bg-green-100 text-green-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">2</span>
                                        Création de Nouveau Dossier
                                    </h4>
                                    <div className="ml-11 space-y-2">
                                        <p className="text-gray-700">• <strong>Fonction :</strong> Créer un nouveau dossier pour un client</p>
                                        <p className="text-gray-700">• <strong>Étapes :</strong> Sélectionner le type, remplir les informations client</p>
                                        <p className="text-gray-700">• <strong>Sécurité :</strong> Pièces requises affichées 20 secondes seulement</p>
                                        <p className="text-gray-700">• <strong>Résultat :</strong> Génération automatique d'un ticket PDF à imprimer</p>
                                    </div>
                                </div>
                                
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <h4 className="text-lg font-medium text-red-900 mb-3 flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                        Mesures de Sécurité
                                    </h4>
                                    <div className="space-y-2">
                                        <p className="text-red-800">• <strong>Captures d'écran désactivées</strong> - Protection des données confidentielles</p>
                                        <p className="text-red-800">• <strong>Copier-coller désactivé</strong> - Prévention de la copie non autorisée</p>
                                        <p className="text-red-800">• <strong>Menu contextuel désactivé</strong> - Aucun accès aux options du navigateur</p>
                                    </div>
                                </div>
                                
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                    <h4 className="text-lg font-medium text-gray-900 mb-3">📋 Bonnes Pratiques</h4>
                                    <div className="space-y-2">
                                        <p className="text-gray-700">• Vérifiez toujours les informations avant de créer un dossier</p>
                                        <p className="text-gray-700">• Remettez immédiatement le ticket PDF au client</p>
                                        <p className="text-gray-700">• Ne partagez jamais vos identifiants de connexion</p>
                                        <p className="text-gray-700">• Déconnectez-vous toujours après utilisation</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default DashboardAssistant;
