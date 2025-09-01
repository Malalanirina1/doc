<?php
require_once 'config.php';

// Configuration CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:5173';
header("Access-Control-Allow-Origin: $origin");
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
 * API pour la gestion des pièces communes (basée sur pieces_requises)
 * GET: Récupère toutes les pièces distinctes utilisées dans le système
 * POST: Retourne success (le panier est géré côté frontend)
 */

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch($method) {
        case 'GET':
            getPiecesCommunes();
            break;
        case 'POST':
            // Retourne simplement success pour le panier (géré côté frontend)
            echo json_encode(['success' => true, 'message' => 'Pièce ajoutée au panier']);
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
 * Récupère toutes les pièces distinctes utilisées dans le système
 */
function getPiecesCommunes() {
    global $pdo;
    
    $query = "
        SELECT DISTINCT 
            nom_piece as nom,
            description,
            COUNT(*) as utilisation_count,
            MIN(obligatoire) as obligatoire_min,
            MAX(obligatoire) as obligatoire_max
        FROM pieces_requises 
        GROUP BY nom_piece, description
        ORDER BY nom_piece
    ";
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $pieces = $stmt->fetchAll();
    
    // Reformater pour le frontend
    $piecesFormatees = [];
    foreach ($pieces as $piece) {
        $piecesFormatees[] = [
            'id' => md5($piece['nom']), // ID basé sur le nom pour la cohérence
            'nom' => $piece['nom'],
            'description' => $piece['description'],
            'obligatoire' => $piece['obligatoire_max'] == 1, // Prendre le max
            'utilisation_count' => $piece['utilisation_count']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'data' => $piecesFormatees,
        'total' => count($piecesFormatees)
    ]);
}
?>
