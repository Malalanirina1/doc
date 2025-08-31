import React, { useState } from 'react';
import { apiRequest } from '../config/api';
import { API_ENDPOINTS } from '../config/api';

const ChangePassword = ({ onClose, onSuccess, userInfo }) => {
    const [formData, setFormData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Effacer l'erreur quand l'utilisateur tape
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.current_password) {
            newErrors.current_password = 'Mot de passe actuel requis';
        }

        if (!formData.new_password) {
            newErrors.new_password = 'Nouveau mot de passe requis';
        } else if (formData.new_password.length < 6) {
            newErrors.new_password = 'Le mot de passe doit contenir au moins 6 caractères';
        }

        if (!formData.confirm_password) {
            newErrors.confirm_password = 'Confirmation requise';
        } else if (formData.new_password !== formData.confirm_password) {
            newErrors.confirm_password = 'Les mots de passe ne correspondent pas';
        }

        if (formData.current_password === formData.new_password) {
            newErrors.new_password = 'Le nouveau mot de passe doit être différent de l\'actuel';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        
        try {
            const response = await apiRequest(API_ENDPOINTS.changePassword, {
                method: 'POST',
                body: JSON.stringify({
                    user_id: userInfo.id,
                    current_password: formData.current_password,
                    new_password: formData.new_password
                })
            });

            if (response.success) {
                onSuccess('Mot de passe modifié avec succès');
                onClose();
            } else {
                setErrors({ submit: response.message || 'Erreur lors du changement' });
            }
        } catch (error) {
            setErrors({ submit: 'Erreur de connexion' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                        <svg className="w-6 h-6 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Changer le Mot de Passe
                    </h3>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Mot de passe actuel */}
                    <div>
                        <label className="flex text-sm font-medium text-gray-700 mb-2 items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Mot de passe actuel
                        </label>
                        <input
                            type="password"
                            name="current_password"
                            value={formData.current_password}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                errors.current_password ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="Saisissez votre mot de passe actuel"
                        />
                        {errors.current_password && (
                            <p className="text-red-600 text-xs mt-1">{errors.current_password}</p>
                        )}
                    </div>

                    {/* Nouveau mot de passe */}
                    <div>
                        <label className="flex text-sm font-medium text-gray-700 mb-2 items-center">
                            <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Nouveau mot de passe
                        </label>
                        <input
                            type="password"
                            name="new_password"
                            value={formData.new_password}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                errors.new_password ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="Nouveau mot de passe (min 6 caractères)"
                        />
                        {errors.new_password && (
                            <p className="text-red-600 text-xs mt-1">{errors.new_password}</p>
                        )}
                    </div>

                    {/* Confirmation */}
                    <div>
                        <label className="flex text-sm font-medium text-gray-700 mb-2 items-center">
                            <svg className="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Confirmer le nouveau mot de passe
                        </label>
                        <input
                            type="password"
                            name="confirm_password"
                            value={formData.confirm_password}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                errors.confirm_password ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="Répétez le nouveau mot de passe"
                        />
                        {errors.confirm_password && (
                            <p className="text-red-600 text-xs mt-1">{errors.confirm_password}</p>
                        )}
                    </div>

                    {/* Erreur générale */}
                    {errors.submit && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-red-600 text-sm">{errors.submit}</p>
                        </div>
                    )}

                    {/* Boutons */}
                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Modification...
                                </div>
                            ) : 'Modifier le mot de passe'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePassword;
