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
 * API d'authentification
 * POST: Login avec username/password
 */

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch($method) {
        case 'POST':
            login();
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
 * Authentification utilisateur
 */
function login() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['username']) || !isset($input['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Username et password requis']);
        return;
    }
    
    $query = "SELECT id, username, password, role, nom_complet FROM users WHERE username = ?";
    $stmt = $pdo->prepare($query);
    $stmt->execute([$input['username']]);
    $user = $stmt->fetch();
    
    if (!$user || !password_verify($input['password'], $user['password'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Identifiants incorrects']);
        return;
    }
    
    // Génération d'un token simple (en production, utiliser JWT)
    $token = base64_encode(json_encode([
        'user_id' => $user['id'],
        'username' => $user['username'],
        'role' => $user['role'],
        'timestamp' => time()
    ]));
    
    echo json_encode([
        'success' => true,
        'message' => 'Connexion réussie',
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'role' => $user['role'],
            'nom_complet' => $user['nom_complet']
        ],
        'token' => $token
    ]);
}
?>
