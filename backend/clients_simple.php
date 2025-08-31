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
 * API simple pour récupérer la liste des clients
 * Compatible avec l'ancien système
 */

try {
    $query = "
        SELECT id, nom, prenom, telephone, email, adresse, created_at,
               CONCAT(prenom, ' ', nom) as nom_complet
        FROM clients 
        ORDER BY nom, prenom
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $clients = $stmt->fetchAll();
    
    // Format compatible avec l'ancien système
    echo json_encode($clients);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur serveur: ' . $e->getMessage()]);
}
?>
