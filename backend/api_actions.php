<?php
require_once 'config.php';

// Headers CORS
$origin = $_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:5173';
header("Access-Control-Allow-Origin: $origin");
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

/**
 * API pour les actions sur les dossiers (terminer, rouvrir, rejeter)
 * POST/PUT: Exécute une action sur un dossier
 */

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch($method) {
        case 'POST':
        case 'PUT':
            actionDossier();
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
 * Exécute une action sur un dossier
 */
function actionDossier() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Support des deux formats: id ou dossier_id
    $dossierId = $input['id'] ?? $input['dossier_id'] ?? null;
    
    if (!$dossierId || !isset($input['action'])) {
        http_response_code(400);
        echo json_encode(['error' => 'ID du dossier et action requis']);
        return;
    }
    
    $updates = [];
    $params = [];
    $message = '';
    
    switch ($input['action']) {
        case 'terminer':
            $updates[] = "statut = ?";
            $params[] = 'fini';
            $message = 'Dossier terminé avec succès';
            break;
            
        case 'rouvrir':
            $updates[] = "statut = ?";
            $params[] = 'en_cours';
            $updates[] = "motif_rejet = NULL";
            $message = 'Dossier rouvert avec succès';
            break;
            
        case 'rejeter':
            $updates[] = "statut = ?";
            $params[] = 'rejete';
            // Support des deux formats: motif ou motif_rejet
            $motif = $input['motif_rejet'] ?? $input['motif'] ?? null;
            if ($motif && !empty(trim($motif))) {
                $updates[] = "motif_rejet = ?";
                $params[] = trim($motif);
            }
            $message = 'Dossier rejeté avec succès';
            break;
            
        case 'modifier_date':
            if (!isset($input['date_fin_prevue'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Date fin prévue requise']);
                return;
            }
            $updates[] = "date_fin_prevue = ?";
            $params[] = $input['date_fin_prevue'];
            $message = 'Date d\'échéance modifiée avec succès';
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Action non reconnue']);
            return;
    }
    
    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(['error' => 'Aucune modification à effectuer']);
        return;
    }
    
    // Ajout de l'ID pour la clause WHERE
    $params[] = $dossierId;
    
    $query = "UPDATE dossiers SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE id = ?";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    
    if ($stmt->rowCount() > 0) {
        echo json_encode([
            'success' => true,
            'message' => $message,
            'action' => $input['action'],
            'dossier_id' => $dossierId
        ]);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Dossier non trouvé']);
    }
}
?>
