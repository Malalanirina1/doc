import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest, API_ENDPOINTS } from '../config/api.js';
import { useToast } from '../components/Toast';

const DashboardAssistant = ({ user, setUser }) => {
    const [activeTab, setActiveTab] = useState('recherche');
    const [numeroTicket, setNumeroTicket] = useState('');
    const [dossierData, setDossierData] = useState(null);
    const [pieces, setPieces] = useState([]);
    const [loading, setLoading] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [showData, setShowData] = useState(false);
    const [newClient, setNewClient] = useState({
        nom: '',
        prenom: '',
        email: '',
        telephone: '',
        adresse: ''
    });
    const navigate = useNavigate();
    const { showToast } = useToast();

    useEffect(() => {
        if (!user || user.role !== 'assistant') {
            navigate('/login');
            return;
        }
    }, [user, navigate]);

    // Timer pour les 30 secondes d'affichage
    useEffect(() => {
        let interval;
        if (showData && timeRemaining > 0) {
            interval = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        setShowData(false);
                        setDossierData(null);
                        setPieces([]);
                        showToast('Données cachées pour sécurité', 'info');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [showData, timeRemaining, showToast]);

    const handleRecherche = async (e) => {
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
                setPieces(data.pieces || []);
                setShowData(true);
                setTimeRemaining(30); // 30 secondes
                showToast('Dossier trouvé - Affichage 30s', 'success');
            } else {
                showToast(data.message || 'Ticket non trouvé', 'error');
            }
        } catch (error) {
            showToast('Erreur lors de la recherche', 'error');
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateClient = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = await apiRequest(API_ENDPOINTS.clients, {
                method: 'POST',
                body: JSON.stringify(newClient)
            });

            if (data.success) {
                showToast('Client créé avec succès', 'success');
                setNewClient({
                    nom: '',
                    prenom: '',
                    email: '',
                    telephone: '',
                    adresse: ''
                });
            } else {
                showToast(response.data.message || 'Erreur lors de la création', 'error');
            }
        } catch (error) {
            showToast('Erreur lors de la création du client', 'error');
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
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
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-gray-900">Interface Assistant</h1>
                            <span className="ml-4 px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                {user?.username}
                            </span>
                        </div>
                        <div className="flex items-center space-x-4">
                            {showData && (
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
                        { id: 'recherche', label: 'Recherche Ticket', icon: '🔍' },
                        { id: 'clients', label: 'Nouveau Client', icon: '👤' },
                        { id: 'aide', label: 'Aide', icon: '❓' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                                activeTab === tab.id 
                                    ? 'bg-indigo-100 text-indigo-700' 
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <span className="mr-2">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'recherche' && (
                    <div className="space-y-6">
                        {/* Formulaire de recherche */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Recherche par Numéro de Ticket</h3>
                            <form onSubmit={handleRecherche} className="flex space-x-4">
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        placeholder="Entrez le numéro de ticket (ex: TK001)"
                                        value={numeroTicket}
                                        onChange={(e) => setNumeroTicket(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        disabled={loading}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading || showData}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Recherche...' : 'Rechercher'}
                                </button>
                            </form>
                            
                            {showData && (
                                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-sm text-yellow-800">
                                        ⚠️ Données visibles pendant {formatTime(timeRemaining)} pour des raisons de sécurité
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Affichage des données du dossier */}
                        {showData && dossierData && (
                            <div className="bg-white rounded-lg shadow">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        Dossier #{dossierData.numero_dossier}
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-900 mb-3">Informations Client</h4>
                                            <div className="space-y-2 text-sm">
                                                <p><span className="font-medium">Nom:</span> {dossierData.nom_client} {dossierData.prenom_client}</p>
                                                <p><span className="font-medium">Email:</span> {dossierData.email_client}</p>
                                                <p><span className="font-medium">Téléphone:</span> {dossierData.telephone_client}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-900 mb-3">Informations Dossier</h4>
                                            <div className="space-y-2 text-sm">
                                                <p><span className="font-medium">Type:</span> {dossierData.nom_type}</p>
                                                <p><span className="font-medium">Statut:</span> 
                                                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                                                        dossierData.statut === 'termine' ? 'bg-green-100 text-green-800' :
                                                        dossierData.statut === 'en_cours' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-blue-100 text-blue-800'
                                                    }`}>
                                                        {dossierData.statut}
                                                    </span>
                                                </p>
                                                <p><span className="font-medium">Date création:</span> {new Date(dossierData.date_creation).toLocaleDateString('fr-FR')}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pièces requises */}
                                    {pieces.length > 0 && (
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
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'clients' && (
                    <div className="bg-white rounded-lg shadow">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Enregistrement Nouveau Client</h3>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleCreateClient} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                                        <input
                                            type="text"
                                            required
                                            value={newClient.nom}
                                            onChange={(e) => setNewClient({...newClient, nom: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                                        <input
                                            type="text"
                                            required
                                            value={newClient.prenom}
                                            onChange={(e) => setNewClient({...newClient, prenom: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                    <input
                                        type="email"
                                        required
                                        value={newClient.email}
                                        onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                                    <input
                                        type="tel"
                                        value={newClient.telephone}
                                        onChange={(e) => setNewClient({...newClient, telephone: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                                    <textarea
                                        rows={3}
                                        value={newClient.adresse}
                                        onChange={(e) => setNewClient({...newClient, adresse: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Création...' : 'Créer le Client'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {activeTab === 'aide' && (
                    <div className="bg-white rounded-lg shadow">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Guide d'Utilisation</h3>
                        </div>
                        <div className="p-6">
                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">🔍 Recherche de Dossiers</h4>
                                    <ul className="text-sm text-gray-600 space-y-1">
                                        <li>• Utilisez le numéro de ticket fourni par l'administration</li>
                                        <li>• Les données sont visibles pendant 30 secondes seulement</li>
                                        <li>• Cette limitation est mise en place pour la sécurité</li>
                                    </ul>
                                </div>
                                
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">👤 Enregistrement Clients</h4>
                                    <ul className="text-sm text-gray-600 space-y-1">
                                        <li>• Vous pouvez enregistrer de nouveaux clients</li>
                                        <li>• Les champs nom, prénom et email sont obligatoires</li>
                                        <li>• Vérifiez les informations avant validation</li>
                                    </ul>
                                </div>
                                
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">⚠️ Sécurité</h4>
                                    <ul className="text-sm text-gray-600 space-y-1">
                                        <li>• Votre accès est limité pour des raisons de confidentialité</li>
                                        <li>• Ne partagez jamais vos identifiants</li>
                                        <li>• Déconnectez-vous toujours après utilisation</li>
                                    </ul>
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
