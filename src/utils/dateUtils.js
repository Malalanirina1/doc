/**
 * Utilitaires pour le calcul des dates côté frontend
 * Évite les incohérences liées aux différences de fuseaux horaires serveur/client
 */

/**
 * Obtient la date actuelle au format YYYY-MM-DD en heure locale
 */
export const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Obtient la date et heure actuelle au format YYYY-MM-DD HH:mm:ss en heure locale
 */
export const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * Ajoute des jours ouvrables à une date
 * @param {string|Date} startDate - Date de départ
 * @param {number} businessDays - Nombre de jours ouvrables à ajouter
 * @returns {string} Date au format YYYY-MM-DD
 */
export const addBusinessDays = (startDate, businessDays) => {
    const date = new Date(startDate);
    let daysAdded = 0;
    
    while (daysAdded < businessDays) {
        date.setDate(date.getDate() + 1);
        
        // Vérifier si c'est un jour ouvrable (lundi = 1, dimanche = 0)
        const dayOfWeek = date.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Pas samedi ni dimanche
            daysAdded++;
        }
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Ajoute des jours calendaires à une date
 * @param {string|Date} startDate - Date de départ
 * @param {number} days - Nombre de jours à ajouter
 * @returns {string} Date au format YYYY-MM-DD
 */
export const addDays = (startDate, days) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + days);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Calcule la date d'échéance en fonction du type de dossier
 * @param {string} typeDossier - Type de dossier
 * @returns {string} Date d'échéance au format YYYY-MM-DD
 */
export const calculateEcheance = (typeDossier) => {
    const today = getCurrentDate();
    
    // Définir les délais par type de dossier
    const delais = {
        'passeport': 15, // 15 jours ouvrables
        'visa': 10,      // 10 jours ouvrables
        'carte_identite': 7, // 7 jours ouvrables
        'acte_naissance': 5, // 5 jours ouvrables
        'casier_judiciaire': 3, // 3 jours ouvrables
        'default': 10    // Délai par défaut
    };
    
    const delai = delais[typeDossier] || delais.default;
    return addBusinessDays(today, delai);
};

/**
 * Formate une date au format français
 * @param {string|Date} date - Date à formater
 * @returns {string} Date formatée (ex: "15 septembre 2025")
 */
export const formatDateFr = (date) => {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

/**
 * Formate une date et heure au format français
 * @param {string|Date} date - Date à formater
 * @returns {string} Date et heure formatées (ex: "15 septembre 2025 à 14:30")
 */
export const formatDateTimeFr = (date) => {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

/**
 * Calcule le nombre de jours entre deux dates
 * @param {string|Date} startDate - Date de début
 * @param {string|Date} endDate - Date de fin
 * @returns {number} Nombre de jours
 */
export const daysBetween = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Vérifie si une date est passée
 * @param {string|Date} date - Date à vérifier
 * @returns {boolean} True si la date est passée
 */
export const isDatePassed = (date) => {
    const today = new Date(getCurrentDate());
    const checkDate = new Date(date);
    return checkDate < today;
};

/**
 * Génère un numéro de ticket unique basé sur la date actuelle
 * @returns {string} Numéro de ticket (ex: "TK20250901001")
 */
export const generateTicketNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `TK${year}${month}${day}${hours}${minutes}${seconds}`;
};
