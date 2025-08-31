
import React, { useState, useEffect } from 'react';
import { useLocation } from "react-router-dom";

// Utilitaire pour logguer les réponses API
const logApiResponse = (method, endpoint, data, success, error = null) => {
  const endpointName = endpoint.split('/').pop();
  console.log(`🔵 API Response: ${method} ${endpointName}`);
  console.log('📊 Data:', data);
  console.log(`✅ Success: ${success}`);
  if (error) {
    console.log('❌ Error:', error);
  }
  console.log('-------------------');
};

function DashboardAdmin({ user, setUser }) {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // États pour les données
  const [dossiers, setDossiers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [alertes, setAlertes] = useState([]);
  
  // États pour les modals
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCreateTypeModal, setShowCreateTypeModal] = useState(false);
  const [showClientSearch, setShowClientSearch] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionReason, setActionReason] = useState('');
  
  // États pour les formulaires
  const [newDossier, setNewDossier] = useState({
    client_id: '',
    client_nom: '',
    client_prenom: '',
    client_telephone: '',
    client_email: '',
    type_dossier_id: '',
    description: '',
    date_fin_prevue: '',
    montant: ''
  });
  
  const [newType, setNewType] = useState({
    nom: '',
    description: '',
    tarif: '',
    delai_jours: 7,
    pieces_requises: []
  });

  // État pour la création de nouvelles pièces
  const [nouvellePiece, setNouvellePiece] = useState('');
  const [showAddPieceForm, setShowAddPieceForm] = useState(false);
  const [piecesPersonnalisees, setPiecesPersonnalisees] = useState([]);
  
  // États pour les données dynamiques
  const [typesDocuments, setTypesDocuments] = useState([]);
  const [piecesCommunes, setPiecesCommunes] = useState([]);
  const [clients, setClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTicket, setSearchTicket] = useState('');
  const [filter, setFilter] = useState('tous');
  
  // États pour l'édition de types
  const [editingType, setEditingType] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  
  // États pour le "panier" de pièces
  const [panierPieces, setPanierPieces] = useState([]);
  const [showPiecesCommunes, setShowPiecesCommunes] = useState(false);
  
  // Toast state
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  
  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
  };

  // Helper pour calculer la priorité d'un dossier côté frontend
  const calculerPriorite = (dossier) => {
    // Pour les dossiers finis ou rejetés, pas de priorité (status figé)
    if (dossier.statut === 'fini' || dossier.statut === 'rejete') {
      return null; // Pas de priorité pour les dossiers fermés
    }
    
    // Pour les dossiers en cours, calculer selon la date d'échéance
    if (dossier.statut === 'en_cours' && dossier.date_fin_prevue) {
      const aujourd_hui = new Date();
      const echeance = new Date(dossier.date_fin_prevue);
      const diff_jours = Math.ceil((echeance - aujourd_hui) / (1000 * 60 * 60 * 24));
      
      if (diff_jours < 0) return 'retard';      // En retard
      if (diff_jours === 0) return 'urgent';    // Échéance aujourd'hui
      if (diff_jours <= 2) return 'bientot';    // Échéance dans 2 jours
      return 'normal';                           // Normal
    }
    
    return 'normal';
  };

  // Helper pour formater le statut en français
  const formaterStatut = (statut) => {
    switch(statut) {
      case 'en_cours': return 'En cours';
      case 'fini': return 'Terminé';
      case 'rejete': return 'Rejeté';
      default: return statut;
    }
  };

  // Helper pour calculer les jours restants
  const calculerJoursRestants = (dossier) => {
    if (!dossier.date_fin_prevue) return null;
    
    const aujourd_hui = new Date();
    const echeance = new Date(dossier.date_fin_prevue);
    return Math.ceil((echeance - aujourd_hui) / (1000 * 60 * 60 * 24));
  };

  // Helper pour enrichir un dossier avec les calculs frontend
  const enrichirDossierFrontend = (dossier) => {
    const priorite = calculerPriorite(dossier);
    const jours_restants = calculerJoursRestants(dossier);
    
    return {
      ...dossier,
      priorite: priorite,
      jours_restants: jours_restants,
      niveau_urgence: priorite // Compatibilité avec l'ancien système
    };
  };

  // Helper pour calculer les statistiques côté frontend
  const calculerStatistiquesFrontend = (dossiers) => {
    const stats = {
      total: dossiers.length,
      en_cours: 0,
      retard: 0,
      urgent: 0,
      bientot: 0,
      normal: 0,
      termines: 0,
      rejetes: 0,
      chiffre_affaires: 0
    };
    
    dossiers.forEach(dossier => {
      const priorite = dossier.priorite || calculerPriorite(dossier);
      
      // Compter d'abord par statut
      if (dossier.statut === 'fini') {
        stats.termines++;
        stats.chiffre_affaires += parseFloat(dossier.montant) || 0;
      } else if (dossier.statut === 'rejete') {
        stats.rejetes++;
      } else if (dossier.statut === 'en_cours') {
        stats.en_cours++;
        
        // Puis par priorité pour les dossiers en cours
        switch (priorite) {
          case 'retard':
            stats.retard++;
            break;
          case 'urgent':
            stats.urgent++;
            break;
          case 'bientot':
            stats.bientot++;
            break;
          case 'normal':
            stats.normal++;
            break;
        }
      }
    });
    
    return stats;
  };

  // Helper pour logger les réponses API
  const logApiResponse = (endpoint, data, method = 'GET') => {
    console.group(`🔵 API Response: ${method} ${endpoint}`);
    console.log('📊 Data:', data);
    console.log('✅ Success:', data.success);
    if (data.message) console.log('💬 Message:', data.message);
    if (data.error) console.error('❌ Error:', data.error);
    console.groupEnd();
  };

  // Fonction pour exécuter une action sur un dossier via l'API
  const executerActionDossier = async (dossierId, action, params = {}) => {
    try {
      const requestData = {
        dossier_id: dossierId,
        action: action,
        ...params
      };

      console.log('🔧 Sending action request:', requestData);

      const response = await fetch('http://localhost/doc/api_actions.php', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();
      logApiResponse('api_actions.php', data, 'POST');
      
      return data;
    } catch (error) {
      console.error('Erreur lors de l\'exécution de l\'action:', error);
      throw error;
    }
  };

  useEffect(() => {
    loadData();
    loadTypesDocuments();
    loadPiecesCommunes();
  }, []);

  // Charger les alertes après le chargement des dossiers
  useEffect(() => {
    if (dossiers.length > 0) {
      loadAlertes();
    }
  }, [dossiers]);

  // Charger les pièces personnalisées depuis localStorage
  useEffect(() => {
    const piecesStorees = localStorage.getItem('piecesPersonnalisees');
    if (piecesStorees) {
      try {
        const pieces = JSON.parse(piecesStorees);
        setPiecesPersonnalisees(pieces);
      } catch (error) {
        console.error('Erreur lors du chargement des pièces personnalisées:', error);
      }
    }
  }, []);

  // Sauvegarder les pièces personnalisées dans localStorage
  useEffect(() => {
    if (piecesPersonnalisees.length > 0) {
      localStorage.setItem('piecesPersonnalisees', JSON.stringify(piecesPersonnalisees));
    }
  }, [piecesPersonnalisees]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔵 LOADING DATA START');
      
      const response = await fetch('http://localhost/doc/api_dossiers.php', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📊 RAW DATA FROM API:', data);
      
      logApiResponse('api_dossiers.php', data, 'GET');
      
      if (data.success) {
        console.log('✅ Data loading successful');
        console.log('📁 Dossiers count:', data.data?.length || 0);
        console.log('📊 Stats from API:', data.stats);
        
        // Enrichir les dossiers avec les calculs frontend
        const dossiersEnrichis = (data.data || []).map(enrichirDossierFrontend);
        
        // Trier par priorité (retard en premier)
        dossiersEnrichis.sort((a, b) => {
          const priorityOrder = { retard: 1, urgent: 2, bientot: 3, normal: 4 };
          return (priorityOrder[a.priorite] || 999) - (priorityOrder[b.priorite] || 999);
        });
        
        setDossiers(dossiersEnrichis);
        
        // Calculer les statistiques côté frontend
        const statsFrontend = calculerStatistiquesFrontend(dossiersEnrichis);
        console.log('📊 Stats calculées frontend:', statsFrontend);
        
        setStats(statsFrontend);
      } else {
        console.log('❌ API returned error:', data);
        showToast('Erreur lors du chargement des dossiers', 'error');
      }
      
    } catch (error) {
      console.error('🔴 LOADING DATA ERROR:', {
        error: error,
        message: error.message,
        stack: error.stack
      });
      showToast('Erreur de connexion: ' + error.message, 'error');
    } finally {
      setLoading(false);
      console.log('🔵 LOADING DATA END');
    }
  };

  const loadTypesDocuments = async () => {
    try {
      console.log('🔵 LOADING TYPES START');
      
      const response = await fetch('http://localhost/doc/api_types.php', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('📡 Types response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📊 TYPES DATA:', data);
      
      logApiResponse('api_types.php', data, 'GET');
      
      if (data.success) {
        console.log('✅ Types loaded:', data.data?.length || 0);
        setTypesDocuments(data.data || []);
      } else {
        console.log('❌ Types loading failed:', data);
        logApiResponse('api_types.php', data, 'GET', false, data.message);
      }
    } catch (error) {
      console.error('🔴 TYPES LOADING ERROR:', error);
      logApiResponse('api_types.php', null, 'GET', false, error.message);
    }
    console.log('🔵 LOADING TYPES END');
  };

  const loadAlertes = async () => {
    try {
      console.log('🔵 GENERATING ALERTS FROM LOADED DATA');
      
      // Générer les alertes à partir des dossiers déjà chargés
      const alertesGenerees = dossiers
        .filter(d => d.priorite === 'retard' || d.priorite === 'urgent')
        .map(d => ({
          id: d.id,
          type: 'retard',
          numero_ticket: d.numero_ticket,
          client_nom: d.client_nom,
          jours_retard: Math.abs(d.jours_restants),
          message: `Le dossier "${d.numero_ticket}" est ${d.priorite === 'retard' ? 'en retard depuis' : 'urgent pour'} ${Math.abs(d.jours_restants)} jour(s)`,
          date_creation: new Date().toISOString()
        }))
        .slice(0, 10); // Limiter aux 10 plus importantes
        
      console.log('📊 Generated alerts:', alertesGenerees.length);
      setAlertes(alertesGenerees);
      
    } catch (error) {
      console.error('🔴 Erreur lors de la génération des alertes:', error);
    }
  };

  // Fonction pour charger les pièces communes
  const loadPiecesCommunes = async () => {
    try {
      const response = await fetch('http://localhost/doc/api_pieces_communes.php', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setPiecesCommunes(data.data || []);
      } else {
        // Si l'API ne fonctionne pas, utiliser des pièces par défaut
        console.log('API pièces communes non disponible, utilisation de pièces par défaut');
        setPiecesCommunes([
          { id: 1, nom_piece: 'Carte d\'identité nationale', description: 'Carte d\'identité nationale en cours de validité', obligatoire_par_defaut: true },
          { id: 2, nom_piece: 'Acte de naissance', description: 'Acte de naissance original ou copie certifiée', obligatoire_par_defaut: true },
          { id: 3, nom_piece: 'Justificatif de domicile', description: 'Facture d\'électricité, d\'eau ou téléphone de moins de 3 mois', obligatoire_par_defaut: true },
          { id: 4, nom_piece: 'Photo d\'identité récente', description: 'Photo d\'identité couleur récente (moins de 6 mois)', obligatoire_par_defaut: true },
          { id: 5, nom_piece: 'Certificat de résidence', description: 'Certificat de résidence délivré par la commune', obligatoire_par_defaut: false },
          { id: 6, nom_piece: 'Extrait de casier judiciaire', description: 'Bulletin n°3 du casier judiciaire', obligatoire_par_defaut: false },
          { id: 7, nom_piece: 'Certificat médical', description: 'Certificat médical délivré par un médecin agréé', obligatoire_par_defaut: false },
          { id: 8, nom_piece: 'Diplôme ou certificat', description: 'Copie certifiée du diplôme ou certificat requis', obligatoire_par_defaut: false },
          { id: 9, nom_piece: 'Passeport', description: 'Passeport en cours de validité', obligatoire_par_defaut: false },
          { id: 10, nom_piece: 'Permis de conduire', description: 'Permis de conduire en cours de validité', obligatoire_par_defaut: false }
        ]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des pièces communes:', error);
      // Utiliser des pièces par défaut en cas d'erreur
      setPiecesCommunes([
        { id: 1, nom_piece: 'Carte d\'identité nationale', description: 'Carte d\'identité nationale en cours de validité', obligatoire_par_defaut: true },
        { id: 2, nom_piece: 'Acte de naissance', description: 'Acte de naissance original ou copie certifiée', obligatoire_par_defaut: true },
        { id: 3, nom_piece: 'Justificatif de domicile', description: 'Facture d\'électricité, d\'eau ou téléphone de moins de 3 mois', obligatoire_par_defaut: true },
        { id: 4, nom_piece: 'Photo d\'identité récente', description: 'Photo d\'identité couleur récente (moins de 6 mois)', obligatoire_par_defaut: true },
        { id: 5, nom_piece: 'Certificat de résidence', description: 'Certificat de résidence délivré par la commune', obligatoire_par_defaut: false }
      ]);
    }
  };

  // Fonction pour gérer les actions sur les types
  const handleTypeAction = async (typeId, action) => {
    try {
      let response;
      
      if (action === 'delete') {
        response = await fetch(`http://localhost/doc/api_types.php?id=${typeId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        });
      } else if (action === 'toggle') {
        const type = typesDocuments.find(t => t.id === typeId);
        response = await fetch('http://localhost/doc/api_types.php', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: typeId,
            actif: !type.actif
          })
        });
      }
      
      const data = await response.json();
      if (data.success) {
        showToast(data.message, 'success');
        loadTypesDocuments(); // Recharger les types
      } else {
        showToast(data.error || 'Erreur lors de l\'action', 'error');
      }
    } catch (error) {
      console.error('Erreur lors de l\'action sur le type:', error);
      showToast('Erreur de connexion', 'error');
    }
  };

  // Fonctions pour gérer le panier de pièces
  const ajouterPieceAuPanier = (piece) => {
    if (!panierPieces.find(p => p.nom_piece === piece.nom_piece)) {
      setPanierPieces(prev => [...prev, {
        ...piece,
        obligatoire: piece.obligatoire_par_defaut || false,
        source: 'commune'
      }]);
    }
  };

  const retirerPieceDuPanier = (nomPiece) => {
    setPanierPieces(prev => prev.filter(p => p.nom_piece !== nomPiece));
  };

  const ajouterPiecePersonnalisee = (nomPiece, description = '') => {
    if (nomPiece.trim() && !panierPieces.find(p => p.nom_piece === nomPiece)) {
      setPanierPieces(prev => [...prev, {
        nom_piece: nomPiece.trim(),
        description: description,
        obligatoire: true,
        source: 'personnalisee'
      }]);
    }
  };

  const toggleObligatoirePiece = (nomPiece) => {
    setPanierPieces(prev => prev.map(p => 
      p.nom_piece === nomPiece 
        ? { ...p, obligatoire: !p.obligatoire }
        : p
    ));
  };

  const viderPanier = () => {
    setPanierPieces([]);
  };

  const searchClients = async (query) => {
    if (query.length < 2) {
      setClients([]);
      return;
    }
    
    try {
      const response = await fetch(`http://localhost/doc/search_clients.php?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        logApiResponse('GET', `search_clients.php?search=${query}`, data, data.success);
        
        if (data.success) {
          setClients(data.clients || []);
        } else {
          logApiResponse('GET', `search_clients.php?search=${query}`, data, false, data.message);
        }
      } else {
        logApiResponse('GET', `search_clients.php?search=${query}`, null, false, `HTTP ${response.status}`);
      }
    } catch (error) {
      logApiResponse('GET', `search_clients.php?search=${query}`, null, false, error.message);
      console.error('Erreur lors de la recherche de clients:', error);
    }
  };

  const selectClient = (client) => {
    setNewDossier(prev => ({
      ...prev,
      client_id: client.id,
      client_nom: client.nom_complet.split(' ')[0] || '',
      client_prenom: client.nom_complet.split(' ').slice(1).join(' ') || '',
      client_telephone: client.telephone || '',
      client_email: client.email || ''
    }));
    setShowClientSearch(false);
    setClients([]);
    setSearchQuery('');
  };

  const createNewDossier = async (e) => {
    e.preventDefault();
    
    if (!newDossier.type_dossier_id) {
      showToast('Veuillez sélectionner un type de dossier', 'error');
      return;
    }
    
    if (!newDossier.client_nom.trim()) {
      showToast('Veuillez saisir le nom du client', 'error');
      return;
    }

    try {
      // Si pas de client_id, créer le client d'abord
      let clientId = newDossier.client_id;
      
      if (!clientId) {
        const clientResponse = await fetch('http://localhost/doc/clients_simple.php', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nom: newDossier.client_nom.trim(),
            prenom: newDossier.client_prenom.trim(),
            telephone: newDossier.client_telephone.trim(),
            email: newDossier.client_email.trim(),
            adresse: ''
          })
        });
        
        const clientData = await clientResponse.json();
        if (clientData.success) {
          clientId = clientData.client_id;
        } else {
          showToast('Erreur lors de la création du client', 'error');
          return;
        }
      }

      const dossierData = {
        client_id: clientId,
        type_dossier_id: newDossier.type_dossier_id,
        description: newDossier.description.trim(),
        date_fin_prevue: newDossier.date_fin_prevue,
        montant: parseFloat(newDossier.montant) || 0
      };

      const response = await fetch('http://localhost/doc/dossiers.php', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dossierData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        showToast('Dossier créé avec succès', 'success');
        setShowCreateForm(false);
        setNewDossier({
          client_id: '',
          client_nom: '',
          client_prenom: '',
          client_telephone: '',
          client_email: '',
          type_dossier_id: '',
          description: '',
          date_fin_prevue: '',
          montant: ''
        });
        loadData();
      } else {
        showToast(data.message || 'Erreur lors de la création du dossier', 'error');
      }
    } catch (error) {
      showToast('Erreur de connexion', 'error');
      console.error('Erreur:', error);
    }
  };

  const createNewType = async () => {
    if (!newType.nom.trim() || !newType.tarif) {
      showToast('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }

    if (panierPieces.length === 0) {
      showToast('Ajoutez au moins une pièce requise', 'error');
      return;
    }

    try {
      const typeData = {
        nom: newType.nom.trim(),
        description: newType.description.trim(),
        tarif: parseFloat(newType.tarif),
        delai_jours: parseInt(newType.delai_jours),
        pieces_requises: panierPieces.map((piece, index) => ({
          nom_piece: piece.nom_piece,
          obligatoire: piece.obligatoire,
          description: piece.description || '',
          ordre_affichage: index + 1
        }))
      };

      const response = await fetch('http://localhost/doc/api_types.php', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(typeData)
      });
      
      const data = await response.json();
      if (data.success) {
        showToast('Type de dossier créé avec succès', 'success');
        setShowCreateTypeModal(false);
        resetFormulaire();
        viderPanier();
        loadTypesDocuments();
      } else {
        showToast(data.message || 'Erreur lors de la création', 'error');
      }
    } catch (error) {
      showToast('Erreur de connexion', 'error');
      console.error('Erreur:', error);
    }
  };

  const updateDossierStatus = async (dossierId, newStatus, motif = '') => {
    try {
      // Convertir le statut vers les actions correspondantes
      let action;
      const params = {};
      
      switch (newStatus) {
        case 'fini':
          action = 'terminer';
          break;
        case 'rejete':
          action = 'rejeter';
          if (motif) params.motif = motif;
          break;
        case 'en_cours':
          action = 'rouvrir';
          break;
        default:
          throw new Error(`Statut non supporté: ${newStatus}`);
      }
      
      // Utiliser l'API actions moderne
      await executerAction(dossierId, action, params);
      
    } catch (error) {
      showToast('Erreur de connexion', 'error');
      console.error('Erreur:', error);
    }
  };

  // Nouvelle fonction pour exécuter les actions avec l'API moderne
  const executerAction = async (dossierId, action, params = {}) => {
    try {
      console.log(`🔧 Exécution de l'action ${action} sur le dossier ${dossierId}`);
      
      const response = await executerActionDossier(dossierId, action, params);
      
      if (response.success) {
        showToast(`Action "${action}" exécutée avec succès`, 'success');
        
        // Si on a un filtre actif qui pourrait cacher le dossier modifié, on revient à "tous"
        if (filter !== 'tous') {
          const actionMessages = {
            'terminer': 'Le dossier a été terminé et pourrait ne plus apparaître dans ce filtre.',
            'rejeter': 'Le dossier a été rejeté et pourrait ne plus apparaître dans ce filtre.',
            'rouvrir': 'Le dossier a été rouvert et est maintenant en cours.'
          };
          
          if (actionMessages[action]) {
            setTimeout(() => {
              showToast(actionMessages[action] + ' Passage au filtre "Tous".', 'info');
              setFilter('tous');
            }, 1000);
          }
        }
        
        loadData(); // Recharger les données
      } else {
        showToast(response.message || 'Erreur lors de l\'exécution de l\'action', 'error');
      }
    } catch (error) {
      console.error('Erreur lors de l\'exécution de l\'action:', error);
      showToast('Erreur de connexion', 'error');
    }
  };

  // Gestion des confirmations d'actions
  const confirmerAction = (dossierId, action, needsReason = false) => {
    setConfirmAction({ dossierId, action, needsReason });
    setActionReason('');
    setShowConfirmModal(true);
  };

  const executerActionConfirmee = async () => {
    if (!confirmAction) return;

    const { dossierId, action, needsReason } = confirmAction;
    
    // Vérifier si une raison est requise
    if (needsReason && !actionReason.trim()) {
      showToast('Veuillez saisir une raison', 'error');
      return;
    }

    const params = needsReason ? { motif: actionReason.trim() } : {};
    
    await executerAction(dossierId, action, params);
    
    // Fermer le modal
    setShowConfirmModal(false);
    setConfirmAction(null);
    setActionReason('');
  };

  const togglePieceRequise = (piece) => {
    setNewType(prev => ({
      ...prev,
      pieces_requises: prev.pieces_requises.includes(piece)
        ? prev.pieces_requises.filter(p => p !== piece)
        : [...prev.pieces_requises, piece]
    }));
  };

  // Fonction pour ajouter une nouvelle pièce personnalisée
  const ajouterNouvellePiece = () => {
    if (!nouvellePiece.trim()) {
      showToast('Veuillez saisir le nom de la pièce', 'error');
      return;
    }
    
    const pieceFormatee = nouvellePiece.trim();
    
    // Vérifier si la pièce existe déjà
    const toutesLesPieces = [...piecesRequisesList, ...piecesPersonnalisees];
    if (toutesLesPieces.includes(pieceFormatee)) {
      showToast('Cette pièce existe déjà', 'error');
      return;
    }
    
    // Ajouter à la liste des pièces personnalisées
    setPiecesPersonnalisees(prev => [...prev, pieceFormatee]);
    
    // Ajouter automatiquement à la sélection
    setNewType(prev => ({
      ...prev,
      pieces_requises: [...prev.pieces_requises, pieceFormatee]
    }));
    
    // Réinitialiser le formulaire
    setNouvellePiece('');
    setShowAddPieceForm(false);
    showToast(`Pièce "${pieceFormatee}" ajoutée avec succès`, 'success');
  };

  // Fonction pour supprimer une pièce personnalisée
  const supprimerPiecePersonnalisee = (piece) => {
    setPiecesPersonnalisees(prev => prev.filter(p => p !== piece));
    setNewType(prev => ({
      ...prev,
      pieces_requises: prev.pieces_requises.filter(p => p !== piece)
    }));
    showToast(`Pièce "${piece}" supprimée`, 'info');
  };

  // Fonction pour réinitialiser le formulaire de création de type
  const resetFormulaire = () => {
    setNewType({
      nom: '',
      description: '',
      tarif: '',
      delai_jours: 7,
      pieces_requises: []
    });
    setNouvellePiece('');
    setShowAddPieceForm(false);
    setPiecesPersonnalisees([]);
  };

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'en_cours': return 'bg-blue-100 text-blue-800 border-blue-200'; // Bleu - En cours
      case 'fini': return 'bg-green-100 text-green-800 border-green-200'; // Vert - Terminé
      case 'rejete': return 'bg-gray-100 text-gray-800 border-gray-200'; // Gris - Rejeté
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getPriorityColor = (priorite) => {
    switch (priorite) {
      case 'retard': return 'bg-red-500';
      case 'urgent': return 'bg-orange-500';
      case 'bientot': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const getPriorityText = (priorite, jours_restants = null) => {
    switch (priorite) {
      case 'retard': 
        return jours_restants ? `Retard (${Math.abs(jours_restants)}j)` : 'Retard';
      case 'urgent': 
        return 'Urgent';
      case 'bientot': 
        return jours_restants ? `${jours_restants}j restants` : 'Bientôt';
      default: 
        return 'Normal';
    }
  };

  const getStatusText = (statut) => {
    return formaterStatut(statut);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  const showDossierDetails = (dossier) => {
    setSelectedDossier(dossier);
    setModalOpen(true);
  };

  // Filtrage combiné : filtre par statut + recherche par ticket + recherche générale
  const filteredDossiers = dossiers.filter(d => {
    // 1. Filtrage par recherche de ticket
    if (searchTicket.trim() && !d.numero_ticket?.toLowerCase().includes(searchTicket.toLowerCase())) {
      return false;
    }

    // 2. Filtrage par recherche générale (client, type, etc.)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        d.client_nom?.toLowerCase().includes(query) ||
        d.client_prenom?.toLowerCase().includes(query) ||
        d.type_nom?.toLowerCase().includes(query) ||
        d.numero_ticket?.toLowerCase().includes(query);
      
      if (!matchesSearch) return false;
    }

    // 3. Filtrage par statut/priorité
    if (filter === 'tous') return true;
    
    switch (filter) {
      case 'retard':
        return d.priorite === 'retard';
      case 'urgent':
        return d.priorite === 'urgent';
      case 'bientot':
        return d.priorite === 'bientot';
      case 'normal':
        return d.priorite === 'normal';
      case 'en_cours':
        return d.statut === 'en_cours'; // Tous les dossiers en cours (peu importe la priorité)
      case 'fini':
        return d.statut === 'fini';
      case 'rejete':
        return d.statut === 'rejete';
      default:
        return d.statut === filter;
    }
  });

  const piecesRequisesList = [
    'Carte d\'identité nationale',
    'Acte de naissance',
    'Justificatif de domicile',
    'Photo d\'identité récente',
    'Certificat de résidence',
    'Extrait de casier judiciaire',
    'Attestation de travail',
    'Relevé bancaire',
    'Facture d\'électricité',
    'Permis de conduire',
    'Attestation d\'assurance',
    'Certificat médical'
  ];

  // Combinaison des pièces statiques et personnalisées
  const toutesLesPieces = [...piecesRequisesList, ...piecesPersonnalisees];

  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="w-full px-4 sm:px-6">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
              <span className="ml-4 px-3 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
                {user?.user_username || user?.username}
              </span>
            </div>
            <div className="flex items-center space-x-4">
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

      {/* Navigation */}
      <div className="w-full px-4 sm:px-6">
        <nav className="flex space-x-8 mt-6 overflow-x-auto">
          {[
            { id: 'dashboard', label: 'Vue d\'ensemble', icon: 'chart' },
            { id: 'dossiers', label: 'Gestion Dossiers', icon: '📁' },
            { id: 'types', label: 'Types de Dossiers', icon: 'document' },
            { id: 'statistiques', label: 'Rapports', icon: '📈' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.icon === 'chart' ? (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              ) : tab.icon === 'document' ? (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              ) : (
                <span className="mr-2">{tab.icon}</span>
              )}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <main className="w-full px-6 sm:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Alertes */}
            {alertes.length > 0 && (
              <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-400 p-6 rounded-lg">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-red-800">Alertes importantes ({alertes.length})</h3>
                    <div className="mt-2 space-y-1">
                      {alertes.slice(0, 3).map((alerte, index) => (
                        <p key={index} className="text-sm text-red-700">
                          • {alerte.titre} - {alerte.message}
                        </p>
                      ))}
                      {alertes.length > 3 && (
                        <p className="text-sm text-red-600 font-medium">
                          ... et {alertes.length - 3} autres alertes
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Statistiques Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-xs font-medium text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.total || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-gradient-to-r from-red-500 to-red-600">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-xs font-medium text-gray-600">En Retard</p>
                    <p className="text-2xl font-bold text-red-600">{stats.retard || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-xs font-medium text-gray-600">Urgent</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.urgent || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-xs font-medium text-gray-600">Bientôt</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.bientot || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-500">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m0 0h2M9 11h4m6 8a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-xs font-medium text-gray-600">En Cours</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.en_cours || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-gradient-to-r from-green-500 to-green-600">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-xs font-medium text-gray-600">Terminés</p>
                    <p className="text-2xl font-bold text-green-600">{stats.termines || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section Chiffre d'affaires */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-purple-600">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Chiffre d'affaires</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {(stats.chiffre_affaires || 0).toLocaleString()} Ar
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Revenus des dossiers terminés</p>
                </div>
              </div>
            </div>

            {/* Dossiers récents */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Dossiers récents</h3>
              </div>
              <div className="p-6">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : dossiers.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Aucun dossier trouvé</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dossiers.slice(0, 5).map((dossier) => (
                      <div key={dossier.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className={`w-3 h-3 rounded-full ${getPriorityColor(dossier.priorite)}`}></div>
                          <div>
                            <p className="font-medium text-gray-900">{dossier.numero_ticket}</p>
                            <p className="text-sm text-gray-600">{dossier.client_nom} {dossier.client_prenom}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(dossier.statut)}`}>
                            {getStatusText(dossier.statut)}
                          </span>
                          <button
                            onClick={() => showDossierDetails(dossier)}
                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                          >
                            Voir détails
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dossiers' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Gestion des Dossiers</h3>
                  <div className="flex gap-3">
                    <select 
                      value={filter} 
                      onChange={(e) => setFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    >
                      <option value="tous">Tous les dossiers</option>
                      <option value="retard">En retard</option>
                      <option value="urgent">Urgent (échéance aujourd'hui)</option>
                      <option value="bientot">Bientôt (échéance proche)</option>
                      <option value="normal">Normal</option>
                      <option value="en_cours">En cours</option>
                      <option value="fini">Terminés</option>
                      <option value="rejete">Rejetés</option>
                    </select>
                    <button 
                      onClick={() => setShowCreateForm(true)}
                      className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-2 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Nouveau Dossier
                    </button>
                  </div>
                </div>
                
                {/* Section de recherche */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTicket}
                      onChange={(e) => setSearchTicket(e.target.value)}
                      placeholder="Rechercher par numéro de ticket..."
                      className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.023.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                    </svg>
                  </div>
                  
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Rechercher par client, type de document..."
                      className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                    <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                  </div>
                </div>

                {/* Indicateur de filtres actifs */}
                {(searchTicket || searchQuery || filter !== 'tous') && (
                  <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"></path>
                    </svg>
                    <span className="text-sm text-blue-700">
                      Filtres actifs : 
                      {searchTicket && <span className="ml-1 px-2 py-1 bg-blue-100 rounded-full text-xs">Ticket: {searchTicket}</span>}
                      {searchQuery && <span className="ml-1 px-2 py-1 bg-green-100 rounded-full text-xs">Recherche: {searchQuery}</span>}
                      {filter !== 'tous' && <span className="ml-1 px-2 py-1 bg-purple-100 rounded-full text-xs">Statut: {filter}</span>}
                    </span>
                    <button 
                      onClick={() => {setSearchTicket(''); setSearchQuery(''); setFilter('tous');}}
                      className="ml-auto text-blue-600 hover:text-blue-800 text-xs underline"
                    >
                      Effacer tout
                    </button>
                  </div>
                )}
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">N° Ticket</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Client</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Statut</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Priorité</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Échéance</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Tarif</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredDossiers.map((dossier) => (
                      <tr key={dossier.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-3 ${getPriorityColor(dossier.priorite)}`}></div>
                            <div>
                              <span className="text-sm font-medium text-gray-900">{dossier.numero_ticket}</span>
                              {dossier.jours_restants !== undefined && (
                                <p className="text-xs text-gray-500">
                                  {dossier.jours_restants > 0 
                                    ? `${dossier.jours_restants} jours restants`
                                    : dossier.jours_restants === 0 
                                    ? 'Échéance aujourd\'hui'
                                    : `${Math.abs(dossier.jours_restants)} jours de retard`
                                  }
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {dossier.client_nom} {dossier.client_prenom}
                            </div>
                            <div className="text-sm text-gray-500">{dossier.telephone}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{dossier.type_nom}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(dossier.statut)}`}>
                            {getStatusText(dossier.statut)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {dossier.priorite && dossier.statut === 'en_cours' ? (
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md ${getPriorityColor(dossier.priorite)} text-white`}>
                              {getPriorityText(dossier.priorite, dossier.jours_restants)}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {dossier.date_fin_prevue ? new Date(dossier.date_fin_prevue).toLocaleDateString('fr-FR') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {dossier.montant ? `${parseFloat(dossier.montant).toLocaleString()} Ar` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-y-1">
                          <div className="flex flex-col space-y-1">
                            <button 
                              onClick={() => showDossierDetails(dossier)}
                              className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 font-medium transition-all duration-200 text-left px-2 py-1 rounded-md text-xs flex items-center gap-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              Gérer
                            </button>
                            
                            {/* Motif de rejet pour les dossiers rejetés */}
                            {dossier.statut === 'rejete' && dossier.motif_rejet && (
                              <div className="bg-red-50 border border-red-200 rounded-md p-2 mt-1">
                                <p className="text-xs text-red-700 font-medium">Motif du rejet :</p>
                                <p className="text-xs text-red-600 mt-1">{dossier.motif_rejet}</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredDossiers.length === 0 && (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun dossier</h3>
                    <p className="mt-1 text-sm text-gray-500">Commencez par créer un nouveau dossier.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'types' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-900">Gestion des Types de Dossiers</h3>
                  <button 
                    onClick={() => setShowCreateTypeModal(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-2 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nouveau Type
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {typesDocuments.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                      <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun type de dossier</h3>
                      <p className="mt-1 text-sm text-gray-500">Commencez par créer un nouveau type de dossier.</p>
                    </div>
                  ) : (
                    typesDocuments.map((type) => (
                      <div key={type.id} className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-indigo-300">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">{type.nom}</h4>
                            {type.description && (
                              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{type.description}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className={`w-3 h-3 rounded-full ${type.actif ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">Tarif:</span>
                            <span className="text-lg font-bold text-indigo-600">
                              {type.tarif ? `${Number(type.tarif).toLocaleString()} Ar` : 'Non défini'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">Délai:</span>
                            <span className="text-sm text-gray-900">
                              {type.delai_jours} jour{type.delai_jours > 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              type.actif 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {type.actif ? 'Actif' : 'Inactif'}
                            </span>
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => setEditingType(type)}
                                className="flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 transition-all duration-200"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Modifier
                              </button>
                              <button 
                                onClick={() => handleTypeAction(type.id, 'toggle')}
                                className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
                                  type.actif 
                                    ? 'text-orange-700 bg-orange-50 border border-orange-200 hover:bg-orange-100 hover:border-orange-300'
                                    : 'text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 hover:border-green-300'
                                }`}
                              >
                                {type.actif ? (
                                  <>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Désactiver
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-2-8V4a2 2 0 012-2h2a2 2 0 012 2v2" />
                                    </svg>
                                    Activer
                                  </>
                                )}
                              </button>
                              <button 
                                onClick={() => setShowDeleteConfirm(type)}
                                className="flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 hover:border-red-300 transition-all duration-200"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Supprimer
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'statistiques' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Rapports et Statistiques</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Statistiques par statut */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Répartition par statut</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">En cours</span>
                      <span className="font-semibold text-blue-600">{stats.en_cours || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Terminés</span>
                      <span className="font-semibold text-green-600">{stats.termines || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">En retard</span>
                      <span className="font-semibold text-red-600">{stats.retard || 0}</span>
                    </div>
                  </div>
                </div>
                
                {/* Chiffre d'affaires */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Performance financière</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Revenus réalisés</span>
                      <span className="font-bold text-green-600">
                        {(stats.chiffre_affaires || 0).toLocaleString()} Ar
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Dossiers payés</span>
                      <span className="font-semibold text-green-600">{stats.termines || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Revenu moyen</span>
                      <span className="font-semibold text-green-600">
                        {stats.termines > 0 
                          ? Math.round((stats.chiffre_affaires || 0) / stats.termines).toLocaleString()
                          : 0
                        } Ar
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Types de dossiers les plus demandés</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-600 text-center">Graphiques et statistiques détaillées disponibles prochainement</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal pour les détails des dossiers */}
      {modalOpen && selectedDossier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-8 border w-full max-w-2xl shadow-2xl rounded-2xl bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900">
                    Dossier {selectedDossier.numero_ticket}
                  </h3>
                  <div className="flex items-center mt-2 space-x-3">
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedDossier.statut)}`}>
                      {getStatusText(selectedDossier.statut)}
                    </span>
                    <div className={`w-3 h-3 rounded-full ${getPriorityColor(selectedDossier.priorite)}`}></div>
                    <span className="text-sm text-gray-600">
                      {getPriorityText(selectedDossier.priorite, selectedDossier.jours_restants)}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Informations client */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Informations client
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Nom complet</label>
                      <p className="text-gray-900 font-medium">{selectedDossier.client_nom} {selectedDossier.client_prenom}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Téléphone</label>
                      <p className="text-gray-900">{selectedDossier.telephone}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <p className="text-gray-900">{selectedDossier.email || 'Non renseigné'}</p>
                    </div>
                  </div>
                </div>

                {/* Informations dossier */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Informations dossier
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Type de dossier</label>
                      <p className="text-gray-900 font-medium">{selectedDossier.type_nom}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Date de dépôt</label>
                      <p className="text-gray-900">
                        {selectedDossier.date_depot ? new Date(selectedDossier.date_depot).toLocaleDateString('fr-FR') : 'Non définie'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Échéance prévue</label>
                      <p className="text-gray-900">
                        {selectedDossier.date_fin_prevue ? new Date(selectedDossier.date_fin_prevue).toLocaleDateString('fr-FR') : 'Non définie'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Montant</label>
                      <p className="text-2xl font-bold text-green-600">
                        {selectedDossier.montant ? `${parseFloat(selectedDossier.montant).toLocaleString()} Ar` : 'Non défini'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedDossier.description && (
                <div className="mt-6 bg-gray-50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Description</h4>
                  <p className="text-gray-700 leading-relaxed">{selectedDossier.description}</p>
                </div>
              )}

              {/* Échéance et urgence */}
              {selectedDossier.jours_restants !== undefined && (
                <div className="mt-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Suivi des délais</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Jours restants</p>
                      <p className={`text-2xl font-bold ${
                        selectedDossier.jours_restants > 3 ? 'text-green-600' :
                        selectedDossier.jours_restants > 0 ? 'text-orange-600' : 'text-red-600'
                      }`}>
                        {selectedDossier.jours_restants > 0 
                          ? selectedDossier.jours_restants
                          : selectedDossier.jours_restants === 0 
                          ? 'Aujourd\'hui'
                          : Math.abs(selectedDossier.jours_restants)
                        }
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-700">Statut délai</p>
                      <p className={`text-lg font-semibold ${
                        selectedDossier.jours_restants > 3 ? 'text-green-600' :
                        selectedDossier.jours_restants > 0 ? 'text-orange-600' : 'text-red-600'
                      }`}>
                        {selectedDossier.jours_restants > 3 ? 'Dans les temps' :
                         selectedDossier.jours_restants > 0 ? 'À surveiller' :
                         selectedDossier.jours_restants === 0 ? 'Échéance' : 'En retard'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-8 flex justify-end space-x-4 pt-6 border-t border-gray-200">
                {selectedDossier.statut === 'en_cours' && (
                  <>
                    <button 
                      onClick={() => {
                        executerAction(selectedDossier.id, 'terminer');
                        setModalOpen(false);
                      }}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Marquer comme terminé
                    </button>
                    <button 
                      onClick={() => {
                        const motif = prompt('Motif de rejet:');
                        if (motif) {
                          executerAction(selectedDossier.id, 'rejeter', { motif });
                          setModalOpen(false);
                        }
                      }}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:to-pink-700 transition-all duration-300 shadow-lg"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Rejeter
                    </button>
                  </>
                )}
                
                {selectedDossier.statut === 'rejete' && (
                  <button 
                    onClick={() => {
                      executerAction(selectedDossier.id, 'rouvrir');
                      setModalOpen(false);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Réouvrir
                  </button>
                )}
                
                {selectedDossier.statut === 'fini' && (
                  <button 
                    onClick={() => {
                      executerAction(selectedDossier.id, 'rouvrir');
                      setModalOpen(false);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-yellow-600 text-white rounded-lg hover:from-orange-700 hover:to-yellow-700 transition-all duration-300 shadow-lg"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Réouvrir
                  </button>
                )}
                
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour créer un nouveau dossier */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-8 border w-full max-w-md shadow-2xl rounded-2xl bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Nouveau dossier</h3>
                <button 
                  onClick={() => setShowCreateForm(false)} 
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={createNewDossier} className="space-y-4">
                {/* Recherche de client */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Client</label>
                  {newDossier.client_id ? (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <span className="text-sm text-green-800">
                        {newDossier.client_nom} {newDossier.client_prenom}
                      </span>
                      <button
                        type="button"
                        onClick={() => setNewDossier(prev => ({
                          ...prev,
                          client_id: '',
                          client_nom: '',
                          client_prenom: '',
                          client_telephone: '',
                          client_email: ''
                        }))}
                        className="text-green-600 hover:text-green-800"
                      >
                        Changer
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            searchClients(e.target.value);
                          }}
                          placeholder="Rechercher un client existant..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        {clients.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-auto">
                            {clients.map((client) => (
                              <button
                                key={client.id}
                                type="button"
                                onClick={() => selectClient(client)}
                                className="w-full px-4 py-2 text-left hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                              >
                                <div className="font-medium text-gray-900">{client.nom_complet}</div>
                                <div className="text-sm text-gray-500">{client.telephone} • {client.email}</div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-center">
                        <span className="text-sm text-gray-500">ou créer un nouveau client :</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Formulaire nouveau client */}
                {!newDossier.client_id && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                        <input
                          type="text"
                          value={newDossier.client_nom}
                          onChange={(e) => setNewDossier(prev => ({...prev, client_nom: e.target.value}))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                        <input
                          type="text"
                          value={newDossier.client_prenom}
                          onChange={(e) => setNewDossier(prev => ({...prev, client_prenom: e.target.value}))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
                      <input
                        type="tel"
                        value={newDossier.client_telephone}
                        onChange={(e) => setNewDossier(prev => ({...prev, client_telephone: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={newDossier.client_email}
                        onChange={(e) => setNewDossier(prev => ({...prev, client_email: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </>
                )}

                {/* Type de dossier */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type de dossier *</label>
                  <select 
                    value={newDossier.type_dossier_id}
                    onChange={(e) => {
                      const selectedType = typesDocuments.find(t => t.id === parseInt(e.target.value));
                      setNewDossier(prev => ({
                        ...prev,
                        type_dossier_id: e.target.value,
                        montant: selectedType ? selectedType.tarif : ''
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">Sélectionner un type</option>
                    {typesDocuments.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.nom} - {type.tarif ? `${Number(type.tarif).toLocaleString()} Ar` : 'Tarif non défini'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date d'échéance */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date d'échéance</label>
                  <input
                    type="date"
                    value={newDossier.date_fin_prevue}
                    onChange={(e) => setNewDossier(prev => ({...prev, date_fin_prevue: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Montant */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Montant (Ar)</label>
                  <input
                    type="number"
                    value={newDossier.montant}
                    onChange={(e) => setNewDossier(prev => ({...prev, montant: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newDossier.description}
                    onChange={(e) => setNewDossier(prev => ({...prev, description: e.target.value}))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Détails du dossier..."
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 shadow-lg"
                  >
                    Créer le dossier
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour créer un nouveau type */}
      {showCreateTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-8 border w-full max-w-lg shadow-2xl rounded-2xl bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Nouveau type de dossier</h3>
                <button 
                  onClick={() => setShowCreateTypeModal(false)} 
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={(e) => { e.preventDefault(); createNewType(); }} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom du type *</label>
                  <input
                    type="text"
                    value={newType.nom}
                    onChange={(e) => setNewType(prev => ({...prev, nom: e.target.value}))}
                    placeholder="Ex: Passeport biométrique"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tarif (Ar) *</label>
                    <input
                      type="number"
                      value={newType.tarif}
                      onChange={(e) => setNewType(prev => ({...prev, tarif: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Délai (jours) *</label>
                    <input
                      type="number"
                      value={newType.delai_jours}
                      onChange={(e) => setNewType(prev => ({...prev, delai_jours: parseInt(e.target.value) || 7}))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      min="1"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={newType.description}
                    onChange={(e) => setNewType(prev => ({...prev, description: e.target.value}))}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Description détaillée du type de dossier..."
                  />
                </div>
                
                {/* Section Panier de Pièces */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">Pièces requises</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowPiecesCommunes(!showPiecesCommunes)}
                        className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        Pièces communes
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddPieceForm(!showAddPieceForm)}
                        className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Nouvelle pièce
                      </button>
                    </div>
                  </div>

                  {/* Catalogue des pièces communes */}
                  {showPiecesCommunes && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-900 mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        Catalogue des pièces communes
                      </h4>
                      <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                        {piecesCommunes.length === 0 ? (
                          <div className="text-center py-4 text-gray-500">
                            <p className="text-sm">Aucune pièce commune disponible</p>
                          </div>
                        ) : (
                          piecesCommunes.map((piece) => {
                            const dejaDansPanier = panierPieces.find(p => p.nom_piece === piece.nom_piece);
                            return (
                              <div key={piece.id} className="flex items-center justify-between p-2 bg-white rounded border hover:border-blue-300 transition-colors">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">{piece.nom_piece}</p>
                                  {piece.description && (
                                    <p className="text-xs text-gray-500 mt-1">{piece.description}</p>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => dejaDansPanier ? retirerPieceDuPanier(piece.nom_piece) : ajouterPieceAuPanier(piece)}
                                  className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                                    dejaDansPanier
                                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                  }`}
                                >
                                  {dejaDansPanier ? 'Retirer' : 'Ajouter'}
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {/* Formulaire d'ajout de pièce personnalisée */}
                  {showAddPieceForm && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="text-sm font-medium text-green-900 mb-3">Créer une nouvelle pièce</h4>
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={nouvellePiece}
                          onChange={(e) => setNouvellePiece(e.target.value)}
                          placeholder="Nom de la nouvelle pièce..."
                          className="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (nouvellePiece.trim()) {
                                ajouterPiecePersonnalisee(nouvellePiece);
                                setNouvellePiece('');
                                setShowAddPieceForm(false);
                              }
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                          >
                            Ajouter au panier
                          </button>
                          <button
                            type="button"
                            onClick={() => {setShowAddPieceForm(false); setNouvellePiece('');}}
                            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Panier de pièces sélectionnées */}
                  <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m-2.4 0L3 3H1m6 10a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4z" />
                        </svg>
                        Panier de pièces ({panierPieces.length})
                      </h4>
                      {panierPieces.length > 0 && (
                        <button
                          type="button"
                          onClick={viderPanier}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Vider le panier
                        </button>
                      )}
                    </div>

                    {panierPieces.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <svg className="mx-auto h-8 w-8 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m-2.4 0L3 3H1m6 10a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4z" />
                        </svg>
                        <p className="text-sm">Votre panier est vide</p>
                        <p className="text-xs mt-1">Ajoutez des pièces depuis le catalogue ou créez-en de nouvelles</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {panierPieces.map((piece, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900">{piece.nom_piece}</span>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  piece.source === 'commune' 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {piece.source === 'commune' ? 'Commune' : 'Personnalisée'}
                                </span>
                              </div>
                              {piece.description && (
                                <p className="text-xs text-gray-500 mt-1">{piece.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="flex items-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={piece.obligatoire}
                                  onChange={() => toggleObligatoirePiece(piece.nom_piece)}
                                  className="h-3 w-3 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <span className="text-xs text-gray-600">Obligatoire</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => retirerPieceDuPanier(piece.nom_piece)}
                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {setShowCreateTypeModal(false); resetFormulaire();}}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 transform hover:scale-105 transition-all duration-300 shadow-lg"
                  >
                    Créer le type
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation d'action moderne */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowConfirmModal(false)}></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-6 pt-6 pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Confirmer l'action
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {confirmAction.action === 'terminer' && 'Voulez-vous marquer ce dossier comme terminé ?'}
                        {confirmAction.action === 'rejeter' && 'Voulez-vous rejeter ce dossier ?'}
                        {confirmAction.action === 'rouvrir' && 'Voulez-vous réouvrir ce dossier ?'}
                      </p>
                      
                      {confirmAction.needsReason && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Raison {confirmAction.action === 'rejeter' ? 'du rejet' : ''} :
                          </label>
                          <textarea
                            value={actionReason}
                            onChange={(e) => setActionReason(e.target.value)}
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Saisissez la raison..."
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={executerActionConfirmee}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm transition-colors ${
                    confirmAction.action === 'terminer' ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' :
                    confirmAction.action === 'rejeter' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' :
                    'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                  }`}
                >
                  {confirmAction.action === 'terminer' && 'Terminer'}
                  {confirmAction.action === 'rejeter' && 'Rejeter'}
                  {confirmAction.action === 'rouvrir' && 'Réouvrir'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression de type */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowDeleteConfirm(null)}></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-6 pt-6 pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Supprimer le type de dossier
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Êtes-vous sûr de vouloir supprimer le type "{showDeleteConfirm.nom}" ? 
                        Cette action peut être irréversible si le type est utilisé dans des dossiers existants.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-3 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => {
                    handleTypeAction(showDeleteConfirm.id, 'delete');
                    setShowDeleteConfirm(null);
                  }}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Supprimer
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.show && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-lg shadow-lg text-base font-medium transition-all duration-300 ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 
          toast.type === 'error' ? 'bg-red-500 text-white' : 
          'bg-blue-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default DashboardAdmin;