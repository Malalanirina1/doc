import React from 'react';

const ClientProfileModal = ({ client, isOpen, onClose, dossiers = [] }) => {
    if (!isOpen || !client) return null;

    // Calculer les statistiques du client
    const clientDossiers = dossiers.filter(d => 
        d.client_nom?.toLowerCase() === client.nom?.toLowerCase()
    );
    
    const stats = {
        total: clientDossiers.length,
        en_cours: clientDossiers.filter(d => d.statut === 'en_cours').length,
        fini: clientDossiers.filter(d => d.statut === 'fini').length,
        en_attente: clientDossiers.filter(d => d.statut === 'en_attente').length,
        rejete: clientDossiers.filter(d => d.statut === 'rejete').length
    };

    const getStatusColor = (statut) => {
        switch (statut) {
            case 'en_cours': return 'bg-yellow-100 text-yellow-800';
            case 'fini': return 'bg-green-100 text-green-800';
            case 'en_attente': return 'bg-blue-100 text-blue-800';
            case 'rejete': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Créer les initiales
    const nomComplet = client.nom || "";
    const mots = nomComplet.split(' ');
    const initiales = mots.length >= 2 ? 
        mots[0].charAt(0) + mots[1].charAt(0) : 
        nomComplet.charAt(0) + (nomComplet.charAt(1) || '');

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b">
                        <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                                <span className="text-indigo-600 font-bold text-xl">
                                    {initiales.toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    {client.nom} {client.prenom}
                                </h2>
                                <p className="text-gray-600">Profil Client</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Informations personnelles */}
                    <div className="p-6 border-b">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Informations personnelles</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nom complet</label>
                                <p className="mt-1 text-sm text-gray-900">{client.nom} {client.prenom}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                                <p className="mt-1 text-sm text-gray-900">{client.telephone || 'Non renseigné'}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <p className="mt-1 text-sm text-gray-900">{client.email || 'Non renseigné'}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Date d'inscription</label>
                                <p className="mt-1 text-sm text-gray-900">
                                    {client.created_at ? new Date(client.created_at).toLocaleDateString('fr-FR') : 'Non disponible'}
                                </p>
                            </div>
                        </div>
                        {client.adresse && (
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700">Adresse</label>
                                <p className="mt-1 text-sm text-gray-900">{client.adresse}</p>
                            </div>
                        )}
                    </div>

                    {/* Statistiques */}
                    <div className="p-6 border-b">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Statistiques</h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-indigo-600">{stats.total}</div>
                                <div className="text-sm text-gray-600">Total</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-yellow-600">{stats.en_cours}</div>
                                <div className="text-sm text-gray-600">En cours</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">{stats.fini}</div>
                                <div className="text-sm text-gray-600">Terminés</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">{stats.en_attente}</div>
                                <div className="text-sm text-gray-600">En attente</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-red-600">{stats.rejete}</div>
                                <div className="text-sm text-gray-600">Rejetés</div>
                            </div>
                        </div>
                    </div>

                    {/* Historique des dossiers */}
                    <div className="p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Historique des dossiers</h3>
                        {clientDossiers.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="mt-2">Aucun dossier trouvé</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-60 overflow-y-auto">
                                {clientDossiers.map((dossier, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3">
                                                <span className="font-medium text-gray-900">#{dossier.numero_ticket}</span>
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(dossier.statut)}`}>
                                                    {dossier.statut.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <div className="mt-1 text-sm text-gray-600">
                                                {dossier.type_nom} - {dossier.montant ? `${dossier.montant}€` : 'Montant non défini'}
                                            </div>
                                            <div className="mt-1 text-xs text-gray-500">
                                                Créé le {new Date(dossier.date_creation).toLocaleDateString('fr-FR')}
                                                {dossier.date_echeance && (
                                                    <span> - Échéance: {new Date(dossier.date_echeance).toLocaleDateString('fr-FR')}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end space-x-3 p-6 border-t">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                        >
                            Fermer
                        </button>
                        <button className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md">
                            Modifier le profil
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientProfileModal;
