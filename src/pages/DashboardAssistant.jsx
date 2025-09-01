import React, { useState, useEffect, useRef } from 'react';
import Toast from '../components/Toast';
import { jsPDF } from 'jspdf';

const DashboardAssistant = ({ user, onLogout }) => {
    const [activeTab, setActiveTab] = useState('consultation');
    const [ticketNumber, setTicketNumber] = useState('');
    const [dossierInfo, setDossierInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showHelp, setShowHelp] = useState(false);

    // États pour la création de dossier
    const [typeDossier, setTypeDossier] = useState('');
    const [typesDossier, setTypesDossier] = useState([]);
    const [clientInfo, setClientInfo] = useState({
        nom: '',
        prenom: '',
        telephone: '',
        email: ''
    });
    const [pieces, setPieces] = useState([]);
    const [showPiecesRequises, setShowPiecesRequises] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(20);
    const [piecesAlreadyShown, setPiecesAlreadyShown] = useState(new Set()); // Pour éviter le réaffichage

    // États pour la recherche de clients
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredClients, setFilteredClients] = useState([]);
    const [allClients, setAllClients] = useState([]);
    const [showClientsList, setShowClientsList] = useState(false);

    // Toast state
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const toastTimeoutRef = useRef(null);
    const piecesTimeoutRef = useRef(null);

    // Fonction pour afficher un toast
    const showToast = (message, type = 'success') => {
        if (toastTimeoutRef.current) {
            clearTimeout(toastTimeoutRef.current);
        }
        
        setToast({ show: true, message, type });
        
        toastTimeoutRef.current = setTimeout(() => {
            setToast({ show: false, message: '', type: 'success' });
        }, 5000);
    };

    // Fonction pour formater le temps restant
    const formatTime = (seconds) => {
        return `${seconds}s`;
    };

    // Mesures de sécurité - Désactivation des fonctionnalités dangereuses
    useEffect(() => {
        // Désactiver les captures d'écran
        const handleKeyDown = (e) => {
            if (e.key === 'PrintScreen' || 
                (e.ctrlKey && e.shiftKey && e.key === 'S') || 
                (e.ctrlKey && e.shiftKey && e.key === 'I') ||
                (e.ctrlKey && e.key === 'u') ||
                (e.ctrlKey && e.key === 'c') ||
                (e.ctrlKey && e.key === 'v') ||
                (e.ctrlKey && e.key === 'x') ||
                (e.ctrlKey && e.key === 'a') ||
                e.key === 'F12') {
                e.preventDefault();
                return false;
            }
        };

        // Désactiver le menu contextuel
        const handleContextMenu = (e) => {
            e.preventDefault();
            return false;
        };

        // Désactiver la sélection
        const handleSelectStart = (e) => {
            e.preventDefault();
            return false;
        };

        // Ajouter les event listeners
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('selectstart', handleSelectStart);

        // Style CSS pour empêcher la sélection
        document.body.style.webkitUserSelect = 'none';
        document.body.style.mozUserSelect = 'none';
        document.body.style.msUserSelect = 'none';
        document.body.style.userSelect = 'none';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('selectstart', handleSelectStart);
            
            document.body.style.webkitUserSelect = '';
            document.body.style.mozUserSelect = '';
            document.body.style.msUserSelect = '';
            document.body.style.userSelect = '';
        };
    }, []);

    // Charger les types de dossier au montage
    useEffect(() => {
        fetchTypesDossier();
        fetchClients();
    }, []);

    // Gestion du timer pour les pièces requises
    useEffect(() => {
        if (showPiecesRequises && timeRemaining > 0) {
            piecesTimeoutRef.current = setTimeout(() => {
                setTimeRemaining(prev => prev - 1);
            }, 1000);
        } else if (timeRemaining === 0) {
            setShowPiecesRequises(false);
            setPieces([]);
            setTimeRemaining(20);
        }

        return () => {
            if (piecesTimeoutRef.current) {
                clearTimeout(piecesTimeoutRef.current);
            }
        };
    }, [showPiecesRequises, timeRemaining]);

    // Fonction pour récupérer les types de dossier
    const fetchTypesDossier = async () => {
        try {
            console.log('Récupération des types de dossier...');
            const response = await fetch('http://localhost/doc/api_types.php');
            const data = await response.json();
            console.log('Types de dossier reçus:', data);
            if (data.success && data.data) {
                setTypesDossier(data.data);
            } else {
                console.error('Erreur dans la réponse des types:', data);
                setTypesDossier([]);
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des types:', error);
            setTypesDossier([]);
        }
    };

    // Fonction pour récupérer tous les clients
    const fetchClients = async () => {
        try {
            const response = await fetch('http://localhost/doc/api_clients.php?action=get_all', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            console.log('Clients reçus:', data);
            if (data.success) {
                setAllClients(data.data); // Correction: utiliser data.data au lieu de data.clients
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des clients:', error);
        }
    };

    // Fonction de recherche de clients
    const handleClientSearch = (value) => {
        setSearchTerm(value);
        if (value.length >= 2 && allClients && Array.isArray(allClients)) {
            const filtered = allClients.filter(client =>
                client.nom.toLowerCase().includes(value.toLowerCase()) ||
                client.prenom.toLowerCase().includes(value.toLowerCase()) ||
                client.telephone.includes(value) ||
                client.email.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredClients(filtered);
            setShowClientsList(true);
        } else {
            setShowClientsList(false);
            setFilteredClients([]);
        }
    };

    // Fonction pour sélectionner un client
    const selectClient = (client) => {
        setClientInfo({
            nom: client.nom,
            prenom: client.prenom,
            telephone: client.telephone,
            email: client.email
        });
        setSearchTerm(`${client.nom} ${client.prenom}`);
        setShowClientsList(false);
    };

    // Fonction pour consulter un dossier
    const handleConsultDossier = async (e) => {
        e.preventDefault();
        if (!ticketNumber.trim()) {
            setError('Veuillez entrer un numéro de ticket');
            return;
        }

        setLoading(true);
        setError('');
        setDossierInfo(null);

        try {
            console.log('🔍 Recherche du ticket:', ticketNumber);
            const response = await fetch(`http://localhost/doc/api_search.php?ticket=${ticketNumber}`);
            
            console.log('📡 Réponse de l\'API:', response.status);
            const data = await response.json();
            console.log('📋 Données reçues:', data);
            
            if (data.success) {
                console.log('✅ Dossier trouvé:', data.dossier);
                setDossierInfo(data.dossier);
                showToast('Dossier trouvé avec succès', 'success');
            } else {
                console.log('❌ Erreur:', data.message);
                setError(data.message || 'Dossier non trouvé');
            }
        } catch (error) {
            console.error('💥 Erreur de connexion:', error);
            setError('Erreur lors de la consultation du dossier');
        } finally {
            setLoading(false);
        }
    };

    // Fonction pour récupérer les pièces requises
    const fetchPiecesRequises = async (typeId) => {
        try {
            console.log('Récupération des pièces requises pour le type:', typeId);
            const response = await fetch(`http://localhost/doc/api_types.php`);
            const data = await response.json();
            console.log('Données types reçues:', data);
            
            if (data.success && data.data) {
                const selectedType = data.data.find(type => type.id == typeId);
                if (selectedType && selectedType.pieces_requises) {
                    setPieces(selectedType.pieces_requises);
                    setShowPiecesRequises(true);
                    setTimeRemaining(20);
                    console.log('Pièces requises trouvées:', selectedType.pieces_requises);
                }
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des pièces:', error);
        }
    };

    // Gestionnaire pour la sélection du type de dossier
    const handleTypeDossierChange = (e) => {
        const selectedTypeId = e.target.value;
        setTypeDossier(selectedTypeId);
        
        if (selectedTypeId && !piecesAlreadyShown.has(selectedTypeId)) {
            fetchPiecesRequises(selectedTypeId);
            setPiecesAlreadyShown(prev => new Set([...prev, selectedTypeId]));
        } else if (!selectedTypeId) {
            setShowPiecesRequises(false);
            setPieces([]);
        }
    };

    // Fonction pour créer un dossier
    const handleCreateDossier = async (e) => {
        e.preventDefault();
        
        if (!typeDossier || !clientInfo.nom || !clientInfo.prenom || !clientInfo.telephone) {
            setError('Veuillez remplir tous les champs obligatoires');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const requestData = {
                type_id: typeDossier,
                client_nom: clientInfo.nom,
                client_prenom: clientInfo.prenom,
                client_email: clientInfo.email,
                client_telephone: clientInfo.telephone,
                client_adresse: clientInfo.adresse || '',
                ville_origine: clientInfo.ville_origine || '',
                created_by: user?.id || 1 // Valeur par défaut si user n'est pas défini
            };
            
            console.log('Données envoyées pour création:', requestData);
            
            const response = await fetch('http://localhost/doc/api_dossiers.php?action=create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(requestData)
            });

            const data = await response.json();
            console.log('Réponse de création:', data);
            
            if (data.success) {
                showToast('Dossier créé avec succès !', 'success');
                
                // Afficher les pièces requises AVANT la génération du PDF
                const selectedType = typesDossier.find(t => t.id === typeDossier);
                if (selectedType && selectedType.pieces_requises) {
                    // Vérifier si pieces_requises est un tableau d'objets ou une chaîne
                    let piecesArray;
                    if (Array.isArray(selectedType.pieces_requises)) {
                        piecesArray = selectedType.pieces_requises;
                    } else {
                        piecesArray = selectedType.pieces_requises.split(',').map(p => p.trim());
                    }
                    
                    setPieces(piecesArray);
                    setShowPiecesRequises(true);
                    setTimeRemaining(20);
                    
                    // Décompte de 20 secondes puis génération du PDF
                    const countdown = setInterval(() => {
                        setTimeRemaining(prev => {
                            if (prev <= 1) {
                                clearInterval(countdown);
                                setShowPiecesRequises(false);
                                generateTicketPDF(data.data || data.dossier, selectedType);
                                return 0;
                            }
                            return prev - 1;
                        });
                    }, 1000);
                } else {
                    // Si pas de pièces, générer directement le PDF
                    generateTicketPDF(data.data || data.dossier, selectedType);
                }
                
                // Réinitialiser complètement le formulaire après un délai
                setTimeout(() => {
                    setTypeDossier('');
                    setClientInfo({ nom: '', prenom: '', telephone: '', email: '', adresse: '', ville_origine: '' });
                    setSearchTerm('');
                    setShowPiecesRequises(false);
                    setPieces([]);
                    setPiecesAlreadyShown(new Set()); // Réinitialiser pour permettre de revoir les pièces
                }, 5000);
            } else {
                setError(data.message || 'Erreur lors de la création du dossier');
            }
        } catch (error) {
            setError('Erreur lors de la création du dossier');
        } finally {
            setLoading(false);
        }
    };

    // Fonction pour générer le reçu PDF (simple noir et blanc)
    const generateTicketPDF = (dossier, typeDossier = null) => {
        const doc = new jsPDF();
        
        // Configuration simple en noir et blanc
        doc.setTextColor(0, 0, 0); // Noir uniquement
        
        // En-tête simple
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('REÇU DE DÉPÔT DE DOSSIER', 105, 25, { align: 'center' });
        
        // Ligne de séparation
        doc.setLineWidth(0.5);
        doc.line(20, 35, 190, 35);
        
        // Informations du ticket
        let yPos = 50;
        const lineHeight = 8;
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('NUMÉRO DE TICKET:', 25, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(`${dossier.numero_ticket || 'N/A'}`, 85, yPos);
        
        // Type de dossier
        if (typeDossier) {
            yPos += lineHeight;
            doc.setFont('helvetica', 'bold');
            doc.text('TYPE DE DOSSIER:', 25, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(`${typeDossier.nom}`, 85, yPos);
        }
        
        // Date
        yPos += lineHeight;
        doc.setFont('helvetica', 'bold');
        doc.text('DATE:', 25, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(`${new Date().toLocaleDateString('fr-FR')}`, 85, yPos);
        
        // Informations client
        yPos += 20;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('INFORMATIONS CLIENT', 25, yPos);
        
        // Ligne de séparation
        doc.setLineWidth(0.3);
        doc.line(25, yPos + 3, 120, yPos + 3);
        
        yPos += 15;
        doc.setFontSize(11);
        
        // Nom complet
        doc.setFont('helvetica', 'bold');
        doc.text('Nom complet:', 25, yPos);
        doc.setFont('helvetica', 'normal');
        const nomComplet = `${dossier.client_prenom || clientInfo.prenom || ''} ${dossier.client_nom || clientInfo.nom || ''}`.trim();
        doc.text(nomComplet, 65, yPos);
        
        // Téléphone
        if (dossier.client_telephone || clientInfo.telephone) {
            yPos += lineHeight;
            doc.setFont('helvetica', 'bold');
            doc.text('Téléphone:', 25, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(`${dossier.client_telephone || clientInfo.telephone}`, 65, yPos);
        }
        
        // Email (si disponible)
        if (dossier.client_email || clientInfo.email) {
            yPos += lineHeight;
            doc.setFont('helvetica', 'bold');
            doc.text('Email:', 25, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(`${dossier.client_email || clientInfo.email}`, 65, yPos);
        }
        
        // Pièces requises (si disponibles)
        if (typeDossier && typeDossier.pieces_requises) {
            yPos += 20;
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('PIÈCES À FOURNIR', 25, yPos);
            
            // Ligne de séparation
            doc.setLineWidth(0.3);
            doc.line(25, yPos + 3, 110, yPos + 3);
            
            yPos += 15;
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            
            const piecesArray = typeDossier.pieces_requises.split(',').map(p => p.trim());
            piecesArray.forEach((piece, index) => {
                yPos += lineHeight;
                doc.text(`• ${piece}`, 25, yPos);
            });
        }
        
        // Instructions importantes
        yPos += 25;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('INSTRUCTIONS IMPORTANTES', 25, yPos);
        
        // Ligne de séparation
        doc.setLineWidth(0.3);
        doc.line(25, yPos + 3, 140, yPos + 3);
        
        yPos += 15;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text('• Conservez ce reçu précieusement', 25, yPos);
        yPos += lineHeight;
        doc.text('• Présentez-le pour toute consultation de votre dossier', 25, yPos);
        yPos += lineHeight;
        doc.text('• En cas de perte, contactez immédiatement nos services', 25, yPos);
        
        // Pied de page simple
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.text('Document généré automatiquement', 105, 270, { align: 'center' });
        doc.text(`${new Date().toLocaleDateString('fr-FR')} - ${new Date().toLocaleTimeString('fr-FR')}`, 105, 275, { align: 'center' });
        
        // Télécharger le PDF
        const fileName = `recu_${dossier.numero_ticket || 'nouveau'}_${Date.now()}.pdf`;
        doc.save(fileName);
        
        // Afficher un message de succès
        showToast('Reçu PDF généré et téléchargé avec succès !', 'success');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50" style={{userSelect: 'none'}}>
            {/* Toast */}
            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ show: false, message: '', type: 'success' })}
                />
            )}

            {/* Modal Pièces Requises avec délai */}
            {showPiecesRequises && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900">
                                🗂️ Pièces Requises à Dicter au Client
                            </h2>
                            <div className="bg-red-500 text-white px-4 py-2 rounded-full font-bold text-lg">
                                {timeRemaining}s
                            </div>
                        </div>
                        
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                            <p className="text-sm text-yellow-800 font-medium">
                                ⏰ Dictez ces pièces au client maintenant ! Le PDF se générera automatiquement dans {timeRemaining} secondes.
                            </p>
                        </div>
                        
                        <div className="space-y-3">
                            {pieces.map((piece, index) => (
                                <div key={index} className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                                    <h3 className="font-semibold text-gray-900 text-lg">
                                        {index + 1}. {typeof piece === 'object' ? piece.nom_piece : piece}
                                    </h3>
                                    {typeof piece === 'object' && piece.description && (
                                        <p className="text-sm text-gray-600 mt-1">{piece.description}</p>
                                    )}
                                    {typeof piece === 'object' && piece.obligatoire === '1' && (
                                        <span className="inline-block mt-2 px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full">
                                            Obligatoire
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-800">
                                💡 <strong>Instructions :</strong> Lisez chaque pièce clairement au client et assurez-vous qu'il comprend ce qui est requis pour son dossier.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-4">
                            <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-lg p-2">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Interface Assistant</h1>
                                <p className="text-sm text-gray-600">Consultation et création de dossiers</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setShowHelp(!showHelp)}
                                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Guide
                            </button>
                            
                            <div className="flex items-center space-x-3">
                                <div className="text-right">
                                    <p className="text-sm font-medium text-gray-900">{user?.prenom} {user?.nom}</p>
                                    <p className="text-xs text-gray-500">Assistant</p>
                                </div>
                                <button
                                    onClick={onLogout}
                                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Déconnexion
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation Tabs */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex space-x-8">
                        <button
                            onClick={() => setActiveTab('consultation')}
                            className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'consultation'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Consultation de Dossier
                        </button>
                        <button
                            onClick={() => setActiveTab('creation')}
                            className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === 'creation'
                                    ? 'border-green-500 text-green-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Création de Dossier
                        </button>
                    </nav>
                </div>
            </div>

            {/* Guide d'utilisation */}
            {showHelp && (
                <div className="bg-white border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-blue-900 flex items-center">
                                    <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Guide d'Utilisation
                                </h3>
                                <button
                                    onClick={() => setShowHelp(false)}
                                    className="text-blue-400 hover:text-blue-600 transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="font-medium text-blue-900">📋 Consultation de Dossier</h4>
                                    <ul className="space-y-2 text-sm text-blue-800">
                                        <li>• Entrez le numéro de ticket fourni au client</li>
                                        <li>• Consultez toutes les informations du dossier</li>
                                        <li>• Aucune limitation de temps d'affichage</li>
                                        <li>• Interface en lecture seule (pas de modification)</li>
                                    </ul>
                                </div>
                                
                                <div className="space-y-4">
                                    <h4 className="font-medium text-blue-900">➕ Création de Dossier</h4>
                                    <ul className="space-y-2 text-sm text-blue-800">
                                        <li>• Sélectionnez le type de dossier</li>
                                        <li>• Recherchez et sélectionnez un client existant</li>
                                        <li>• Pièces requises affichées 20 secondes seulement</li>
                                        <li>• Génération automatique d'un ticket PDF</li>
                                    </ul>
                                </div>
                            </div>
                            
                            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <h4 className="font-medium text-red-900 mb-2">🔒 Mesures de Sécurité Actives</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-red-800">
                                    <div>• Captures d'écran désactivées</div>
                                    <div>• Copier-coller désactivé</div>
                                    <div>• Menu contextuel désactivé</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Tab Content - Consultation */}
                {activeTab === 'consultation' && (
                    <div className="space-y-6">
                        {/* Formulaire de consultation */}
                        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                                    <svg className="w-6 h-6 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    Consultation de Dossier
                                </h3>
                            </div>
                            
                            <div className="p-6">
                                <form onSubmit={handleConsultDossier} className="space-y-4">
                                    <div>
                                        <label className="flex text-sm font-medium text-gray-700 mb-2">
                                            <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                            </svg>
                                            Numéro de Ticket
                                        </label>
                                        <input
                                            type="text"
                                            value={ticketNumber}
                                            onChange={(e) => setTicketNumber(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                            placeholder="Entrez le numéro de ticket (ex: DOC-2024-001)"
                                            required
                                        />
                                    </div>
                                    
                                    {error && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                            <div className="flex">
                                                <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <p className="text-sm text-red-700">{error}</p>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                                    >
                                        {loading ? (
                                            <div className="flex items-center justify-center">
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Recherche en cours...
                                            </div>
                                        ) : 'Consulter le Dossier'}
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* Affichage des informations du dossier */}
                        {dossierInfo && (
                            <div>
                                {console.log('🎯 Affichage des informations du dossier:', dossierInfo)}
                                <div className="bg-white rounded-xl shadow-lg border border-gray-100">
                                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                                    <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                                        <svg className="w-6 h-6 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Informations du Dossier
                                    </h3>
                                </div>
                                
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                                                Détails du Dossier
                                            </h4>
                                            <div className="space-y-3">
                                                <div className="flex items-center">
                                                    <span className="text-sm font-medium text-gray-500 w-32">Ticket :</span>
                                                    <span className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                                                        {dossierInfo.numero_ticket}
                                                    </span>
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="text-sm font-medium text-gray-500 w-32">Type :</span>
                                                    <span className="text-sm text-gray-900">{dossierInfo.type_nom}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="text-sm font-medium text-gray-500 w-32">Statut :</span>
                                                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                                        dossierInfo.statut === 'terminé' 
                                                            ? 'bg-green-100 text-green-800'
                                                            : dossierInfo.statut === 'en_cours'
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                        {dossierInfo.statut === 'en_attente' ? 'En attente' :
                                                         dossierInfo.statut === 'en_cours' ? 'En cours' :
                                                         dossierInfo.statut === 'terminé' ? 'Terminé' : dossierInfo.statut}
                                                    </span>
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="text-sm font-medium text-gray-500 w-32">Créé le :</span>
                                                    <span className="text-sm text-gray-900">
                                                        {new Date(dossierInfo.date_creation).toLocaleDateString('fr-FR')}
                                                    </span>
                                                </div>
                                                {dossierInfo.montant && (
                                                    <div className="flex items-center">
                                                        <span className="text-sm font-medium text-gray-500 w-32">Montant :</span>
                                                        <span className="text-sm font-semibold text-green-600">
                                                            {parseFloat(dossierInfo.montant).toLocaleString('fr-FR')} Ar
                                                        </span>
                                                    </div>
                                                )}
                                                {dossierInfo.type_prix && (
                                                    <div className="flex items-center">
                                                        <span className="text-sm font-medium text-gray-500 w-32">Tarif type :</span>
                                                        <span className="text-sm text-gray-900">
                                                            {parseFloat(dossierInfo.type_prix).toLocaleString('fr-FR')} Ar
                                                        </span>
                                                    </div>
                                                )}
                                                {dossierInfo.date_completion && (
                                                    <div className="flex items-center">
                                                        <span className="text-sm font-medium text-gray-500 w-32">Terminé le :</span>
                                                        <span className="text-sm text-gray-900">
                                                            {new Date(dossierInfo.date_completion).toLocaleDateString('fr-FR')}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                                                Informations Client
                                            </h4>
                                            <div className="space-y-3">
                                                <div className="flex items-center">
                                                    <span className="text-sm font-medium text-gray-500 w-32">Nom :</span>
                                                    <span className="text-sm text-gray-900">{dossierInfo.client_nom}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="text-sm font-medium text-gray-500 w-32">Prénom :</span>
                                                    <span className="text-sm text-gray-900">{dossierInfo.client_prenom}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="text-sm font-medium text-gray-500 w-32">Téléphone :</span>
                                                    <span className="text-sm text-gray-900">{dossierInfo.client_telephone}</span>
                                                </div>
                                                {dossierInfo.client_email && (
                                                    <div className="flex items-center">
                                                        <span className="text-sm font-medium text-gray-500 w-32">Email :</span>
                                                        <span className="text-sm text-gray-900">{dossierInfo.client_email}</span>
                                                    </div>
                                                )}
                                                {dossierInfo.client_adresse && (
                                                    <div className="flex items-center">
                                                        <span className="text-sm font-medium text-gray-500 w-32">Adresse :</span>
                                                        <span className="text-sm text-gray-900">{dossierInfo.client_adresse}</span>
                                                    </div>
                                                )}
                                                {dossierInfo.client_ville_origine && (
                                                    <div className="flex items-center">
                                                        <span className="text-sm font-medium text-gray-500 w-32">Ville d'origine :</span>
                                                        <span className="text-sm text-gray-900">{dossierInfo.client_ville_origine}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {dossierInfo.commentaires && (
                                        <div className="mt-6 pt-6 border-t border-gray-200">
                                            <h4 className="text-lg font-medium text-gray-900 mb-3">Commentaires</h4>
                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <p className="text-sm text-gray-700">{dossierInfo.commentaires}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Tab Content - Création */}
                {activeTab === 'creation' && (
                    <div className="space-y-6">
                        {/* Formulaire de création de dossier */}
                        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                                    <svg className="w-6 h-6 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Créer un Nouveau Dossier
                                </h3>
                            </div>
                            
                            <div className="p-6">
                                <form onSubmit={handleCreateDossier} className="space-y-6">
                                    {/* Sélection du type de dossier */}
                                    <div>
                                        <label className="flex text-sm font-medium text-gray-700 mb-2">
                                            <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                            </svg>
                                            Type de Dossier *
                                        </label>
                                        <select
                                            value={typeDossier}
                                            onChange={handleTypeDossierChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                            required
                                        >
                                            <option value="">Sélectionnez un type de dossier</option>
                                            {Array.isArray(typesDossier) && typesDossier.map((type) => (
                                                <option key={type.id} value={type.id}>
                                                    {type.nom} - {type.description}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Recherche et sélection de client */}
                                    <div className="space-y-4">
                                        <label className="flex text-sm font-medium text-gray-700">
                                            <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            Rechercher un Client
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={searchTerm}
                                                onChange={(e) => handleClientSearch(e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all pr-10"
                                                placeholder="Rechercher par nom, prénom, téléphone ou email..."
                                            />
                                            <svg className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>

                                        {/* Liste des clients filtrés */}
                                        {showClientsList && filteredClients.length > 0 && (
                                            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg bg-white shadow-lg">
                                                {filteredClients.map((client) => (
                                                    <button
                                                        key={client.id}
                                                        type="button"
                                                        onClick={() => selectClient(client)}
                                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="font-medium text-gray-900">{client.nom} {client.prenom}</p>
                                                                <p className="text-sm text-gray-600">{client.telephone}</p>
                                                                {client.email && (
                                                                    <p className="text-sm text-gray-500">{client.email}</p>
                                                                )}
                                                            </div>
                                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Pièces requises avec timer */}
                                    {showPiecesRequises && pieces.length > 0 && (
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-lg font-medium text-yellow-800 flex items-center">
                                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                    </svg>
                                                    Pièces Requises - Informations Sensibles
                                                </h4>
                                                <div className="flex items-center text-red-600 font-medium">
                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    Disparaît dans {timeRemaining}s
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-3">
                                                {pieces.map((piece, index) => (
                                                    <div key={piece.id || index} className="flex items-start p-3 bg-white rounded border">
                                                        <div className={`w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0 ${piece.obligatoire ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                                                        <div className="flex-1">
                                                            <p className="font-medium text-gray-900">{piece.nom_piece}</p>
                                                            {piece.description && (
                                                                <p className="text-sm text-gray-600 mt-1">{piece.description}</p>
                                                            )}
                                                            <span className={`inline-block text-xs px-2 py-1 rounded-full mt-2 ${
                                                                piece.obligatoire 
                                                                    ? 'bg-red-100 text-red-700' 
                                                                    : 'bg-blue-100 text-blue-700'
                                                            }`}>
                                                                {piece.obligatoire ? 'Obligatoire' : 'Optionnel'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            <div className="mt-4 p-3 bg-white rounded border-l-4 border-yellow-400">
                                                <p className="text-sm text-gray-700">
                                                    <span className="font-medium">⚠️ Attention :</span> Ces informations sont sensibles et ne sont affichées que temporairement. 
                                                    Veuillez noter les pièces requises maintenant.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Informations client */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="flex text-sm font-medium text-gray-700 mb-2">
                                                <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                Nom *
                                            </label>
                                            <input
                                                type="text"
                                                value={clientInfo.nom}
                                                onChange={(e) => setClientInfo(prev => ({ ...prev, nom: e.target.value }))}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="flex text-sm font-medium text-gray-700 mb-2">
                                                <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                Prénom *
                                            </label>
                                            <input
                                                type="text"
                                                value={clientInfo.prenom}
                                                onChange={(e) => setClientInfo(prev => ({ ...prev, prenom: e.target.value }))}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="flex text-sm font-medium text-gray-700 mb-2">
                                                <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                </svg>
                                                Téléphone *
                                            </label>
                                            <input
                                                type="tel"
                                                value={clientInfo.telephone}
                                                onChange={(e) => setClientInfo(prev => ({ ...prev, telephone: e.target.value }))}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="flex text-sm font-medium text-gray-700 mb-2">
                                                <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                                Email
                                            </label>
                                            <input
                                                type="email"
                                                value={clientInfo.email}
                                                onChange={(e) => setClientInfo(prev => ({ ...prev, email: e.target.value }))}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                            <div className="flex">
                                                <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <p className="text-sm text-red-700">{error}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Affichage des pièces requises dans le formulaire */}
                                    {typeDossier && pieces.length > 0 && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <h4 className="text-md font-semibold text-blue-900 mb-3 flex items-center">
                                                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                Pièces requises pour ce type de dossier :
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {pieces.map((piece, index) => (
                                                    <div key={index} className="flex items-center p-3 bg-white rounded-lg border border-blue-200">
                                                        <div className="flex-1">
                                                            <p className="font-medium text-gray-900">
                                                                {typeof piece === 'string' ? piece : piece.nom_piece}
                                                            </p>
                                                            {typeof piece === 'object' && piece.description && (
                                                                <p className="text-sm text-gray-600 mt-1">{piece.description}</p>
                                                            )}
                                                        </div>
                                                        {typeof piece === 'object' && (
                                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                                piece.obligatoire === 1 || piece.obligatoire === '1' 
                                                                    ? 'bg-red-100 text-red-800' 
                                                                    : 'bg-gray-100 text-gray-800'
                                                            }`}>
                                                                {piece.obligatoire === 1 || piece.obligatoire === '1' ? 'Obligatoire' : 'Optionnel'}
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

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
            </main>
        </div>
    );
};

export default DashboardAssistant;
