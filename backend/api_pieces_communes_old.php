<?php
require_once 'config.php';

// Headers CORS
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Origin: http://localhost:5173');

// Gérer les requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

/**
 * API pour la gestion des pièces communes réutilisables
 * GET: Liste des pièces communes
 * POST: Création d'une nouvelle pièce commune
 * PUT: Modification d'une pièce commune
 * DELETE: Suppression d'une pièce commune
 */

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch($method) {
        case 'GET':
            getPiecesCommunes();
            break;
        case 'POST':
            createPieceCommune();
            break;
        case 'PUT':
            updatePieceCommune();
            break;
        case 'DELETE':
            deletePieceCommune();
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
 * Récupère toutes les pièces communes
 */
function getPiecesCommunes() {
    global $pdo;
    
    $query = "
        SELECT id, nom_piece, description, obligatoire_par_defaut, created_at, updated_at
        FROM pieces_communes 
        ORDER BY nom_piece
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $pieces = $stmt->fetchAll();
    
    echo json_encode([
        'success' => true,
        'data' => $pieces,
        'total' => count($pieces)
    ]);
}

/**
 * Crée une nouvelle pièce commune
 */
function createPieceCommune() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['nom_piece']) || $input['nom_piece'] === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Le nom de la pièce est requis']);
        return;
    }
    
    try {
        $query = "
            INSERT INTO pieces_communes (nom_piece, description, obligatoire_par_defaut) 
            VALUES (?, ?, ?)
        ";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute([
            $input['nom_piece'],
            $input['description'] ?? null,
            $input['obligatoire_par_defaut'] ?? 1
        ]);
        
        $pieceId = $pdo->lastInsertId();
        
        echo json_encode([
            'success' => true,
            'message' => 'Pièce commune créée avec succès',
            'id' => $pieceId
        ]);
        
    } catch (Exception $e) {
        if ($e->getCode() == 23000) { // Contrainte d'unicité
            http_response_code(400);
            echo json_encode(['error' => 'Cette pièce existe déjà']);
        } else {
            throw $e;
        }
    }
}

/**
 * Modifie une pièce commune
 */
function updatePieceCommune() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'ID de la pièce requis']);
        return;
    }
    
    try {
        $updates = [];
        $params = [];
        
        $allowedFields = ['nom_piece', 'description', 'obligatoire_par_defaut'];
        
        foreach ($allowedFields as $field) {
            if (isset($input[$field])) {
                $updates[] = "$field = ?";
                $params[] = $input[$field];
            }
        }
        
        if (!empty($updates)) {
            $params[] = $input['id'];
            $query = "UPDATE pieces_communes SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE id = ?";
            $stmt = $pdo->prepare($query);
            $stmt->execute($params);
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Pièce commune modifiée avec succès'
        ]);
        
    } catch (Exception $e) {
        if ($e->getCode() == 23000) {
            http_response_code(400);
            echo json_encode(['error' => 'Ce nom de pièce existe déjà']);
        } else {
            throw $e;
        }
    }
}

/**
 * Supprime une pièce commune
 */
function deletePieceCommune() {
    global $pdo;
    
    $id = $_GET['id'] ?? null;
    if (!$id) {
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $input['id'] ?? null;
    }
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID de la pièce requis']);
        return;
    }
    
    try {
        // Vérifier si la pièce est utilisée
        $checkQuery = "SELECT COUNT(*) as count FROM pieces_requises WHERE nom_piece = (SELECT nom_piece FROM pieces_communes WHERE id = ?)";
        $checkStmt = $pdo->prepare($checkQuery);
        $checkStmt->execute([$id]);
        $result = $checkStmt->fetch();
        
        if ($result['count'] > 0) {
            http_response_code(400);
            echo json_encode(['error' => 'Cette pièce est utilisée dans des types de dossiers existants']);
            return;
        }
        
        $query = "DELETE FROM pieces_communes WHERE id = ?";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$id]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Pièce commune supprimée avec succès'
        ]);
        
    } catch (Exception $e) {
        throw $e;
    }
}
?>
