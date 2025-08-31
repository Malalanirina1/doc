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
 * API pour la gestion des types de dossiers
 * GET: Liste des types avec pièces requises
 * POST: Création d'un nouveau type avec ses pièces
 * PUT: Modification d'un type
 * DELETE: Suppression ou désactivation d'un type
 */

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch($method) {
        case 'GET':
            getTypes();
            break;
        case 'POST':
            createType();
            break;
        case 'PUT':
            updateType();
            break;
        case 'DELETE':
            deleteType();
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
 * Récupère tous les types de dossiers avec leurs pièces requises
 */
function getTypes() {
    global $pdo;
    
    // Récupération des types
    $query = "
        SELECT id, nom, description, tarif, delai_jours, actif, created_at, updated_at
        FROM types_dossier 
        WHERE actif = 1
        ORDER BY nom
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $types = $stmt->fetchAll();
    
    // Récupération des pièces requises pour chaque type
    $queryPieces = "
        SELECT type_dossier_id, id, nom_piece, obligatoire, description, ordre_affichage
        FROM pieces_requises 
        ORDER BY type_dossier_id, ordre_affichage
    ";
    $stmtPieces = $pdo->prepare($queryPieces);
    $stmtPieces->execute();
    $pieces = $stmtPieces->fetchAll();
    
    // Grouper les pièces par type
    $piecesParType = [];
    foreach ($pieces as $piece) {
        $piecesParType[$piece['type_dossier_id']][] = $piece;
    }
    
    // Ajouter les pièces à chaque type
    foreach ($types as &$type) {
        $type['pieces_requises'] = $piecesParType[$type['id']] ?? [];
    }
    
    echo json_encode([
        'success' => true,
        'data' => $types,
        'total' => count($types)
    ]);
}

/**
 * Crée un nouveau type de dossier avec ses pièces requises
 */
function createType() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validation des données requises
    $required = ['nom', 'tarif', 'delai_jours'];
    foreach ($required as $field) {
        if (!isset($input[$field]) || $input[$field] === '') {
            http_response_code(400);
            echo json_encode(['error' => "Le champ $field est requis"]);
            return;
        }
    }
    
    $pdo->beginTransaction();
    
    try {
        // Création du type de dossier
        $query = "
            INSERT INTO types_dossier (nom, description, tarif, delai_jours) 
            VALUES (?, ?, ?, ?)
        ";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute([
            $input['nom'],
            $input['description'] ?? null,
            $input['tarif'],
            $input['delai_jours']
        ]);
        
        $typeId = $pdo->lastInsertId();
        
        // Ajout des pièces requises si fournies
        if (isset($input['pieces_requises']) && is_array($input['pieces_requises'])) {
            $queryPiece = "
                INSERT INTO pieces_requises (type_dossier_id, nom_piece, obligatoire, description, ordre_affichage) 
                VALUES (?, ?, ?, ?, ?)
            ";
            $stmtPiece = $pdo->prepare($queryPiece);
            
            foreach ($input['pieces_requises'] as $index => $piece) {
                $stmtPiece->execute([
                    $typeId,
                    $piece['nom_piece'],
                    $piece['obligatoire'] ?? 1,
                    $piece['description'] ?? null,
                    $index + 1
                ]);
            }
        }
        
        $pdo->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Type de dossier créé avec succès',
            'id' => $typeId
        ]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

/**
 * Modifie un type de dossier
 */
function updateType() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'ID du type requis']);
        return;
    }
    
    $pdo->beginTransaction();
    
    try {
        // Mise à jour du type
        $updates = [];
        $params = [];
        
        $allowedFields = ['nom', 'description', 'tarif', 'delai_jours', 'actif'];
        
        foreach ($allowedFields as $field) {
            if (isset($input[$field])) {
                $updates[] = "$field = ?";
                $params[] = $input[$field];
            }
        }
        
        if (!empty($updates)) {
            $params[] = $input['id'];
            $query = "UPDATE types_dossier SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE id = ?";
            $stmt = $pdo->prepare($query);
            $stmt->execute($params);
        }
        
        // Mise à jour des pièces requises si fournies
        if (isset($input['pieces_requises']) && is_array($input['pieces_requises'])) {
            // Supprimer les anciennes pièces
            $deleteQuery = "DELETE FROM pieces_requises WHERE type_dossier_id = ?";
            $deleteStmt = $pdo->prepare($deleteQuery);
            $deleteStmt->execute([$input['id']]);
            
            // Ajouter les nouvelles pièces
            $insertQuery = "
                INSERT INTO pieces_requises (type_dossier_id, nom_piece, obligatoire, description, ordre_affichage) 
                VALUES (?, ?, ?, ?, ?)
            ";
            $insertStmt = $pdo->prepare($insertQuery);
            
            foreach ($input['pieces_requises'] as $index => $piece) {
                // Vérifier que la pièce a bien un nom
                $nomPiece = $piece['nom_piece'] ?? $piece['nom'] ?? null;
                if ($nomPiece) {
                    $insertStmt->execute([
                        $input['id'],
                        $nomPiece,
                        $piece['obligatoire'] ?? 1,
                        $piece['description'] ?? null,
                        $index + 1
                    ]);
                }
            }
        }
        
        $pdo->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Type de dossier modifié avec succès'
        ]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

/**
 * Supprime ou désactive un type de dossier
 */
function deleteType() {
    global $pdo;
    
    // Récupérer l'ID depuis l'URL ou le body
    $id = $_GET['id'] ?? null;
    if (!$id) {
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $input['id'] ?? null;
    }
    
    if (!$id) {
        http_response_code(400);
        echo json_encode(['error' => 'ID du type requis']);
        return;
    }
    
    try {
        // Vérifier si le type est utilisé dans des dossiers
        $checkQuery = "SELECT COUNT(*) as count FROM dossiers WHERE type_dossier_id = ?";
        $checkStmt = $pdo->prepare($checkQuery);
        $checkStmt->execute([$id]);
        $result = $checkStmt->fetch();
        
        if ($result['count'] > 0) {
            // Si utilisé, on le désactive au lieu de le supprimer
            $query = "UPDATE types_dossier SET actif = 0, updated_at = NOW() WHERE id = ?";
            $stmt = $pdo->prepare($query);
            $stmt->execute([$id]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Type de dossier désactivé avec succès (il est utilisé dans des dossiers existants)'
            ]);
        } else {
            // Si pas utilisé, on peut le supprimer complètement
            $pdo->beginTransaction();
            
            // Supprimer d'abord les pièces requises
            $deletePiecesQuery = "DELETE FROM pieces_requises WHERE type_dossier_id = ?";
            $deletePiecesStmt = $pdo->prepare($deletePiecesQuery);
            $deletePiecesStmt->execute([$id]);
            
            // Puis supprimer le type
            $deleteTypeQuery = "DELETE FROM types_dossier WHERE id = ?";
            $deleteTypeStmt = $pdo->prepare($deleteTypeQuery);
            $deleteTypeStmt->execute([$id]);
            
            $pdo->commit();
            
            echo json_encode([
                'success' => true,
                'message' => 'Type de dossier supprimé avec succès'
            ]);
        }
        
    } catch (Exception $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
}
?>
