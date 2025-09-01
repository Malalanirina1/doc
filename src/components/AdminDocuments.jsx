import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import Modal from './Modal';
import Toast from './Toast';
import './AdminDocuments.css';

export default function AdminDocuments() {
  const [dossiers, setDossiers] = useState([]);
  const [loading, setLoading] = useState(true);
  // États pour le modal de détails
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState(null);

  // Filtres
  const [filter, setFilter] = useState('tous');

  // États pour le modal de création de type
  const [showCreateTypeModal, setShowCreateTypeModal] = useState(false);
  const [piecesDisponibles, setPiecesDisponibles] = useState([]);

  // État pour le formulaire de nouveau type
  const [newType, setNewType] = useState({
    nom: '',
    description: '',
    prix_base: '',
    delai_traitement: '3 jours',
    pieces_requises: []
  });

  // Toast state
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  // Fonction pour générer un PDF récapitulatif pour l'admin
  const generateDossierPDF = (dossier) => {
    const doc = new jsPDF();
    
    // Configuration simple en noir et blanc
    doc.setTextColor(0, 0, 0);
    
    // En-tête
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('RÉCAPITULATIF DOSSIER', 105, 25, { align: 'center' });
    
    // Ligne de séparation
    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);
    
    // Informations du dossier
    let yPos = 50;
    const lineHeight = 8;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('NUMÉRO:', 25, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`${dossier.numero_ticket}`, 65, yPos);
    
    yPos += lineHeight;
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENT:', 25, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`${dossier.nom_client}`, 65, yPos);
    
    yPos += lineHeight;
    doc.setFont('helvetica', 'bold');
    doc.text('TÉLÉPHONE:', 25, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`${dossier.telephone}`, 65, yPos);
    
    if (dossier.email) {
      yPos += lineHeight;
      doc.setFont('helvetica', 'bold');
      doc.text('EMAIL:', 25, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(`${dossier.email}`, 65, yPos);
    }
    
    yPos += lineHeight;
    doc.setFont('helvetica', 'bold');
    doc.text('TYPE:', 25, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`${dossier.type_document}`, 65, yPos);
    
    yPos += lineHeight;
    doc.setFont('helvetica', 'bold');
    doc.text('STATUT:', 25, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`${dossier.statut}`, 65, yPos);
    
    yPos += lineHeight;
    doc.setFont('helvetica', 'bold');
    doc.text('MONTANT:', 25, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`${dossier.montant} Ar`, 65, yPos);
    
    yPos += lineHeight;
    doc.setFont('helvetica', 'bold');
    doc.text('DATE CRÉATION:', 25, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`${dossier.created_at}`, 65, yPos);
    
    if (dossier.description) {
      yPos += 20;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('DESCRIPTION', 25, yPos);
      
      yPos += 10;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      
      // Découper la description en lignes
      const lines = doc.splitTextToSize(dossier.description, 160);
      lines.forEach((line) => {
        yPos += lineHeight;
        doc.text(line, 25, yPos);
      });
    }
    
    // Pied de page
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text('Document généré par l\'administration', 105, 270, { align: 'center' });
    doc.text(`${new Date().toLocaleDateString('fr-FR')} - ${new Date().toLocaleTimeString('fr-FR')}`, 105, 275, { align: 'center' });
    
    // Télécharger le PDF
    const fileName = `recap_${dossier.numero_ticket}_${Date.now()}.pdf`;
    doc.save(fileName);
    
    showToast('PDF généré et téléchargé avec succès !', 'success');
  };

  useEffect(() => {
    loadData();
  }, []);

  // Charger les pièces disponibles pour les types
  const loadPiecesDisponibles = async () => {
    try {
      const response = await fetch('http://localhost/projet/doc/backend/manage_types_documents.php');
      const data = await response.json();
      if (data.success) {
        setPiecesDisponibles(data.pieces_disponibles);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des pièces:', error);
    }
  };

  // Créer un nouveau type de document
  const createNewType = async () => {
    try {
      const response = await fetch('http://localhost/projet/doc/backend/manage_types_documents.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newType)
      });
      
      const data = await response.json();
      if (data.success) {
        showToast('Type de document créé avec succès', 'success');
        setShowCreateTypeModal(false);
        setNewType({
          nom: '',
          description: '',
          prix_base: '',
          delai_traitement: '3 jours',
          pieces_requises: []
        });
      } else {
        showToast(data.message || 'Erreur lors de la création', 'error');
      }
    } catch (error) {
      showToast('Erreur de connexion', 'error');
      console.error('Erreur:', error);
    }
  };

  // Gérer la sélection de pièces requises
  const togglePieceRequise = (piece) => {
    setNewType(prev => ({
      ...prev,
      pieces_requises: prev.pieces_requises.includes(piece)
        ? prev.pieces_requises.filter(p => p !== piece)
        : [...prev.pieces_requises, piece]
    }));
  };

  // Chargement mock des dossiers
  const loadData = async () => {
    try {
      setLoading(true);
      const mockDossiers = [
        {
          id: 1,
          numero_ticket: 'DOC-2024-001',
          nom_client: 'RAKOTO Jean',
          telephone: '0341234567',
          email: 'rakoto@email.com',
          type_document: 'Certificat de résidence',
          statut: 'en_cours',
          montant: 15000,
          delai_traitement: '3 jours',
          niveau_urgence: 'normal',
          created_at: '2024-01-15',
          description: 'Demande de certificat de résidence pour démarche administrative'
        },
        {
          id: 2,
          numero_ticket: 'DOC-2024-002',
          nom_client: 'RABE Marie',
          telephone: '0347654321',
          email: 'rabe@email.com',
          type_document: 'Extrait de naissance',
          statut: 'fini',
          montant: 5000,
          delai_traitement: '1 jour',
          niveau_urgence: 'urgent',
          created_at: '2024-01-14',
          description: 'Extrait de naissance pour inscription scolaire'
        }
      ];
      
      setDossiers(mockDossiers);
      
    } catch (error) {
      showToast('Erreur lors du chargement des données', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'en_cours': return 'bg-yellow-100 text-yellow-800';
      case 'fini': return 'bg-green-100 text-green-800';
      case 'rejete': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEdit = (dossier) => {
    setSelectedDossier(dossier);
    setModalOpen(true);
  };

  const handleDelete = (dossier) => {
    if (confirm(`Supprimer le dossier ${dossier.numero_ticket} ?`)) {
      showToast(`Dossier ${dossier.numero_ticket} supprimé`, 'success');
    }
  };

  const showDossierDetails = (dossier) => {
    setSelectedDossier(dossier);
    setModalOpen(true);
  };

  const filteredDossiers = filter === 'tous' 
    ? dossiers 
    : dossiers.filter(d => d.statut === filter);

  return (
    <div className="w-full p-6 bg-white rounded-lg shadow-sm border">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Dossiers</h2>
          <p className="text-gray-600">Consultez, modifiez et gérez tous les dossiers.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="tous">Tous les statuts</option>
            <option value="en_cours">En cours</option>
            <option value="fini">Terminés</option>
            <option value="rejete">Rejetés</option>
          </select>
          <button 
            onClick={() => {
              loadPiecesDisponibles();
              setShowCreateTypeModal(true);
            }}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouveau Type
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Chargement...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  N° Ticket
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarif
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Délai
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDossiers.map((dossier) => (
                <tr key={dossier.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-3 ${
                        dossier.niveau_urgence === 'urgent' ? 'bg-red-500' : 'bg-blue-500'
                      }`}></div>
                      <span className="text-sm font-medium text-gray-900">
                        {dossier.numero_ticket}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {dossier.nom_client}
                      </div>
                      <div className="text-sm text-gray-500">{dossier.telephone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {dossier.type_document}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(dossier.statut)}`}>
                      {dossier.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {dossier.montant?.toLocaleString()} Ar
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="font-medium text-gray-900">
                      {dossier.delai_traitement}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => showDossierDetails(dossier)}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        Détails
                      </button>
                      <button 
                        onClick={() => handleEdit(dossier)}
                        className="text-indigo-600 hover:text-indigo-900 font-medium"
                      >
                        Modifier
                      </button>
                      <button 
                        onClick={() => generateDossierPDF(dossier)}
                        className="text-green-600 hover:text-green-900 font-medium"
                      >
                        PDF
                      </button>
                      <button 
                        onClick={() => handleDelete(dossier)}
                        className="text-red-600 hover:text-red-900 font-medium"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredDossiers.length === 0 && (
            <div className="text-center py-8">
              <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500">Aucun dossier trouvé pour ce filtre</p>
            </div>
          )}
        </div>
      )}
      
      {/* Modal pour les détails */}
      <Modal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title={selectedDossier ? `Détails du dossier ${selectedDossier.numero_ticket}` : 'Détails'}
        size="large"
      >
        {selectedDossier && (
          <div className="dossier-details">
            <div className="detail-section">
              <h4>Informations client</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Nom complet</span>
                  <span className="detail-value">{selectedDossier.nom_client}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Téléphone</span>
                  <span className="detail-value">{selectedDossier.telephone}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">{selectedDossier.email}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4>Informations du dossier</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Numéro de ticket</span>
                  <span className="detail-value">{selectedDossier.numero_ticket}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Type de document</span>
                  <span className="detail-value">{selectedDossier.type_document}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Statut</span>
                  <span className={`detail-value status-badge status-${selectedDossier.statut}`}>
                    {selectedDossier.statut}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Montant</span>
                  <span className="detail-value montant-highlight">
                    {selectedDossier.montant?.toLocaleString()} Ar
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Délai de traitement</span>
                  <span className="detail-value">{selectedDossier.delai_traitement}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Niveau d'urgence</span>
                  <span className="detail-value">{selectedDossier.niveau_urgence}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Date de création</span>
                  <span className="detail-value">{selectedDossier.created_at}</span>
                </div>
              </div>
            </div>

            {selectedDossier.description && (
              <div className="detail-section">
                <h4>Description</h4>
                <p className="detail-value">{selectedDossier.description}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal pour créer un nouveau type de document */}
      <Modal
        isOpen={showCreateTypeModal}
        onClose={() => {
          setShowCreateTypeModal(false);
          setNewType({
            nom: '',
            description: '',
            prix_base: '',
            delai_traitement: '3 jours',
            pieces_requises: []
          });
        }}
        title="Créer un nouveau type de document"
        size="large"
      >
        <form onSubmit={(e) => { e.preventDefault(); createNewType(); }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom du document *
              </label>
              <input
                type="text"
                value={newType.nom}
                onChange={(e) => setNewType(prev => ({...prev, nom: e.target.value}))}
                placeholder="Ex: Certificat de résidence"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prix de base (Ar) *
              </label>
              <input
                type="number"
                value={newType.prix_base}
                onChange={(e) => setNewType(prev => ({...prev, prix_base: e.target.value}))}
                placeholder="15000"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={newType.description}
              onChange={(e) => setNewType(prev => ({...prev, description: e.target.value}))}
              placeholder="Description du type de document..."
              rows="3"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Délai de traitement
            </label>
            <select
              value={newType.delai_traitement}
              onChange={(e) => setNewType(prev => ({...prev, delai_traitement: e.target.value}))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="1 jour">1 jour</option>
              <option value="2 jours">2 jours</option>
              <option value="3 jours">3 jours</option>
              <option value="1 semaine">1 semaine</option>
              <option value="2 semaines">2 semaines</option>
              <option value="1 mois">1 mois</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Pièces requises
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {piecesDisponibles.map((piece, index) => (
                <label key={index} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newType.pieces_requises.includes(piece)}
                    onChange={() => togglePieceRequise(piece)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">{piece}</span>
                </label>
              ))}
            </div>
            <div className="mt-2">
              <input
                type="text"
                placeholder="Ajouter une nouvelle pièce..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    e.preventDefault();
                    const newPiece = e.target.value.trim();
                    if (!piecesDisponibles.includes(newPiece)) {
                      setPiecesDisponibles(prev => [...prev, newPiece]);
                      setNewType(prev => ({
                        ...prev,
                        pieces_requises: [...prev.pieces_requises, newPiece]
                      }));
                    }
                    e.target.value = '';
                  }
                }}
                className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">Appuyez sur Entrée pour ajouter une nouvelle pièce</p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setShowCreateTypeModal(false)}
              className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              Créer le type
            </button>
          </div>
        </form>
      </Modal>

      {/* Toast */}
      {toast.show && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast({ show: false, message: '', type: '' })} 
        />
      )}
    </div>
  );
}
