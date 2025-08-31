<?php
require_once 'config.php';

// Configuration CORS
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

// Gérer les requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

/**
 * API pour la gestion des clients
 * GET: Recherche et liste des clients
 * POST: Création d'un nouveau client
 */

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch($method) {
        case 'GET':
            getClients();
            break;
        case 'POST':
            createClient();
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Méthode non autorisée']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur: ' . $e->getMessage()]);
}

/**
 * Récupère la liste des clients avec possibilité de recherche
 */
function getClients() {
    global $pdo;
    
    $search = $_GET['search'] ?? '';
    $limit = $_GET['limit'] ?? 100;
    
    if ($search) {
        $query = "
            SELECT id, nom, prenom, telephone, email, adresse, ville_origine, created_at,
                   CONCAT(prenom, ' ', nom) as nom_complet
            FROM clients 
            WHERE nom LIKE ? OR prenom LIKE ? OR telephone LIKE ? OR email LIKE ? OR ville_origine LIKE ?
            ORDER BY nom, prenom
            LIMIT ?
        ";
        $searchTerm = "%$search%";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$searchTerm, $searchTerm, $searchTerm, $searchTerm, $searchTerm, $limit]);
    } else {
        $query = "
            SELECT id, nom, prenom, telephone, email, adresse, ville_origine, created_at,
                   CONCAT(prenom, ' ', nom) as nom_complet
            FROM clients 
            ORDER BY nom, prenom
            LIMIT ?
        ";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$limit]);
    }
    
    $clients = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'data' => $clients,
        'total' => count($clients)
    ]);
}

/**
 * Crée un nouveau client
 */
function createClient() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validation des données requises
    $required = ['nom', 'prenom'];
    foreach ($required as $field) {
        if (!isset($input[$field]) || empty($input[$field])) {
            http_response_code(400);
            echo json_encode(['error' => "Le champ $field est requis"]);
            return;
        }
    }
    
    $query = "
        INSERT INTO clients (nom, prenom, telephone, email, adresse, ville_origine) 
        VALUES (?, ?, ?, ?, ?, ?)
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute([
        $input['nom'],
        $input['prenom'],
        $input['telephone'] ?? null,
        $input['email'] ?? null,
        $input['adresse'] ?? null,
        $input['ville_origine'] ?? null
    ]);
    
    $clientId = $pdo->lastInsertId();
    
    // Récupérer le client créé
    $getQuery = "SELECT *, CONCAT(prenom, ' ', nom) as nom_complet FROM clients WHERE id = ?";
    $getStmt = $pdo->prepare($getQuery);
    $getStmt->execute([$clientId]);
    $client = $getStmt->fetch();
    
    echo json_encode([
        'success' => true,
        'message' => 'Client créé avec succès',
        'data' => $client
    ]);
}
?>
