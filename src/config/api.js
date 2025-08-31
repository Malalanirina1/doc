// Configuration des endpoints API - Version restructurée
const API_BASE_URL = 'http://localhost/doc';

export const API_ENDPOINTS = {
  // Authentification
  login: `${API_BASE_URL}/api_auth.php`,
  register: `${API_BASE_URL}/api_auth.php`,
  
  // Clients
  clients: `${API_BASE_URL}/api_clients.php`,
  
  // Dossiers
  dossiers: `${API_BASE_URL}/api_dossiers.php`,
  
  // Créer dossier
  creerDossier: `${API_BASE_URL}/api_dossiers.php`,
  
  // Recherche par ticket (pour assistant)
  search: `${API_BASE_URL}/api_search.php`,
  
  // Types de dossiers
  typesDossier: `${API_BASE_URL}/api_types.php`,
  types: `${API_BASE_URL}/api_types.php`,
  
  // Types de documents  
  typesDocuments: `${API_BASE_URL}/api_types.php`,
  
  // Modifier dossier
  modifierDossier: `${API_BASE_URL}/api_dossiers.php`,
  
  // Modifier statut dossier  
  modifierStatut: `${API_BASE_URL}/api_dossiers.php`,
  
  // Actions sur les dossiers
  actions: `${API_BASE_URL}/api_actions.php`,
  
  // Statistiques et dashboard
  dashboard: `${API_BASE_URL}/api_stats.php`,
  stats: `${API_BASE_URL}/api_stats.php`,
  
  // Test de connexion
  test: `${API_BASE_URL}/config.php`,
  status: `${API_BASE_URL}/config.php`
};

// Configuration par défaut pour fetch - Sans credentials pour éviter les problèmes CORS
export const fetchConfig = {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
  // credentials supprimé pour éviter les conflits CORS
};

// Helper pour faire des requêtes API avec debug complet
export const apiRequest = async (endpoint, options = {}) => {
  const config = {
    ...fetchConfig,
    ...options,
    headers: {
      ...fetchConfig.headers,
      ...options.headers
    }
  };
  
  try {
    console.log('🔵 API REQUEST START');
    console.log('📍 Endpoint:', endpoint);
    console.log('⚙️ Config:', config);
    console.log('📤 Request body:', config.body);
    
    const response = await fetch(endpoint, config);
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response ok:', response.ok);
    console.log('📡 Response headers:', [...response.headers.entries()]);
    
    // Vérifier si la réponse a un contenu
    const text = await response.text();
    console.log('📄 Raw response text:', text);
    console.log('📄 Raw response length:', text.length);
    
    if (!text) {
      console.error('❌ Empty response from server');
      throw new Error('Empty response from server');
    }
    
    let data;
    try {
      data = JSON.parse(text);
      console.log('✅ Parsed JSON data:', data);
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      console.error('❌ Response text that failed to parse:', text);
      throw new Error('Invalid JSON response from server: ' + text.substring(0, 100));
    }
    
    if (!response.ok) {
      console.error('❌ HTTP Error:', response.status, data.error);
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    
    console.log('🔵 API REQUEST SUCCESS');
    console.log('📊 Final data:', data);
    console.log('-------------------');
    
    return data;
  } catch (error) {
    console.error('🔴 API Request Error:', error);
    console.error('🔴 Error details:', {
      message: error.message,
      stack: error.stack,
      endpoint: endpoint,
      config: config
    });
    console.log('-------------------');
    throw error;
  }
};

// Helper pour les actions sur les dossiers
export const executerActionDossier = async (dossierId, action, params = {}) => {
  const payload = {
    id: dossierId,
    action: action,
    ...params
  };
  
  console.log('🔧 Exécution action dossier:', { dossierId, action, params });
  
  try {
    const response = await apiRequest(API_ENDPOINTS.actions, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    
    console.log('✅ Action exécutée avec succès:', response);
    return response;
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution de l\'action:', error);
    throw error;
  }
};

export default API_ENDPOINTS;
