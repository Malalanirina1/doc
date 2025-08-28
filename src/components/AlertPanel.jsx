import React from 'react';

const AlertPanel = ({ alertes, stats, isOpen, onClose }) => {
    if (!isOpen) return null;

    const getAlertTypeColor = (type) => {
        switch (type) {
            case 'retard':
                return 'bg-red-50 border-red-200 text-red-800';
            case 'aujourd_hui':
                return 'bg-orange-50 border-orange-200 text-orange-800';
            case 'proche':
                return 'bg-yellow-50 border-yellow-200 text-yellow-800';
            default:
                return 'bg-gray-50 border-gray-200 text-gray-800';
        }
    };

    const getAlertIcon = (type) => {
        switch (type) {
            case 'retard':
                return (
                    <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
                    </svg>
                );
            case 'aujourd_hui':
                return (
                    <svg className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
                    </svg>
                );
            case 'proche':
                return (
                    <svg className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
                    </svg>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
            <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-xl">
                <div className="flex h-full flex-col">
                    <div className="flex items-center justify-between p-4 border-b">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Alertes ({stats.total})
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Statistiques */}
                    <div className="p-4 border-b bg-gray-50">
                        <div className="grid grid-cols-3 gap-2 text-sm">
                            <div className="text-center">
                                <div className="text-red-600 font-bold text-lg">{stats.retard}</div>
                                <div className="text-red-700">En retard</div>
                            </div>
                            <div className="text-center">
                                <div className="text-orange-600 font-bold text-lg">{stats.aujourd_hui}</div>
                                <div className="text-orange-700">Aujourd'hui</div>
                            </div>
                            <div className="text-center">
                                <div className="text-yellow-600 font-bold text-lg">{stats.proche}</div>
                                <div className="text-yellow-700">2 jours</div>
                            </div>
                        </div>
                    </div>

                    {/* Liste des alertes */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {alertes.length === 0 ? (
                            <div className="text-center text-gray-500 py-8">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
                                </svg>
                                <p className="mt-2">Aucune alerte</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {alertes.map((alerte, index) => (
                                    <div
                                        key={index}
                                        className={`border rounded-lg p-3 ${getAlertTypeColor(alerte.type_alerte)}`}
                                    >
                                        <div className="flex items-start space-x-3">
                                            <div className="flex-shrink-0">
                                                {getAlertIcon(alerte.type_alerte)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-medium">
                                                        Ticket #{alerte.numero_ticket}
                                                    </p>
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                        alerte.type_alerte === 'retard' ? 'bg-red-100 text-red-800' :
                                                        alerte.type_alerte === 'aujourd_hui' ? 'bg-orange-100 text-orange-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {alerte.type_alerte === 'retard' ? 'RETARD' :
                                                         alerte.type_alerte === 'aujourd_hui' ? 'URGENT' : 'BIENTÔT'}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-700 mt-1">
                                                    {alerte.client_nom} {alerte.client_prenom}
                                                </p>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {alerte.type_nom}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-2">
                                                    {alerte.message}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Échéance: {new Date(alerte.date_echeance).toLocaleDateString('fr-FR')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AlertPanel;
