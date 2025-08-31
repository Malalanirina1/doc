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
 * API pour la gestion des pièces communes
 * GET: Récupère toutes les pièces distinctes utilisées dans le système
 * POST: Crée une nouvelle pièce commune dans la table pieces_requises
 */

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch($method) {
        case 'GET':
            getPiecesCommunes();
            break;
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            if (isset($input['action']) && $input['action'] === 'create') {
                createPieceCommune($input);
            } else {
                // Pour la compatibilité avec l'ancien système (panier)
                echo json_encode(['success' => true, 'message' => 'Pièce ajoutée au panier']);
            }
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

/**
 * Crée une nouvelle pièce commune (type de pièce générique)
 */
function createPieceCommune($input) {
    global $pdo;
    
    // Validation des données
    if (empty($input['nom_piece'])) {
        echo json_encode(['success' => false, 'message' => 'Le nom de la pièce est requis']);
        return;
    }
    
    $nom_piece = trim($input['nom_piece']);
    $description = isset($input['description']) ? trim($input['description']) : '';
    
    // Vérifier si cette pièce existe déjà
    $checkQuery = "SELECT COUNT(*) as count FROM pieces_requises WHERE nom_piece = ?";
    $checkStmt = $pdo->prepare($checkQuery);
    $checkStmt->execute([$nom_piece]);
    $existingCount = $checkStmt->fetch()['count'];
    
    if ($existingCount > 0) {
        echo json_encode(['success' => false, 'message' => 'Cette pièce existe déjà dans le système']);
        return;
    }
    
    try {
        // Créer une entrée générique dans pieces_requises
        // Cette pièce pourra être réutilisée dans différents types de dossiers
        $query = "INSERT INTO pieces_requises (
            type_dossier_id, 
            nom_piece, 
            description, 
            obligatoire, 
            ordre_affichage
        ) VALUES (
            NULL,  -- NULL pour indiquer que c'est une pièce générique
            ?, 
            ?, 
            0,     -- Pas obligatoire par défaut
            999    -- Ordre élevé pour les pièces génériques
        )";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute([$nom_piece, $description]);
        
        echo json_encode([
            'success' => true, 
            'message' => 'Pièce à fournir créée avec succès',
            'data' => [
                'id' => $pdo->lastInsertId(),
                'nom_piece' => $nom_piece,
                'description' => $description
            ]
        ]);
        
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Erreur lors de la création: ' . $e->getMessage()]);
    }
}
?>
