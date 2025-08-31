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
 * API pour la gestion des dossiers
 * GET: Récupère tous les dossiers avec priorités calculées
 * POST: Crée un nouveau dossier  
 * PUT: Modifie un dossier (statut, date échéance, etc.)
 */

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch($method) {
        case 'GET':
            getDossiers();
            break;
        case 'POST':
            createDossier();
            break;
        case 'PUT':
            updateDossier();
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
 * Récupère tous les dossiers SANS calcul de priorité (géré côté frontend)
 */
function getDossiers() {
    global $pdo;
    
    // Récupération avec toutes les jointures nécessaires
    $query = "
        SELECT 
            d.id,
            d.numero_ticket,
            d.client_id,
            d.type_dossier_id,
            d.date_depot,
            d.date_fin_prevue,
            d.statut,
            d.motif_rejet,
            d.montant,
            d.created_at,
            d.updated_at,
            -- Informations client
            CONCAT(c.prenom, ' ', c.nom) as client_nom,
            c.nom as client_nom_famille,
            c.prenom as client_prenom,
            c.email as client_email,
            c.telephone as client_telephone,
            c.adresse as client_adresse,
            -- Informations type de dossier
            td.nom as type_nom,
            td.description as type_description,
            td.tarif as type_tarif,
            td.delai_jours as type_delai,
            -- Informations utilisateur
            u.nom_complet as created_by_name
        FROM dossiers d
        LEFT JOIN clients c ON d.client_id = c.id
        LEFT JOIN types_dossier td ON d.type_dossier_id = td.id
        LEFT JOIN users u ON d.created_by = u.id
        ORDER BY d.created_at DESC
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $dossiers = $stmt->fetchAll();
    
    // Récupération des pièces requises pour chaque type
    $queryPieces = "
        SELECT type_dossier_id, nom_piece, obligatoire, description, ordre_affichage
        FROM pieces_requises 
        ORDER BY type_dossier_id, ordre_affichage
    ";
    $stmtPieces = $pdo->prepare($queryPieces);
    $stmtPieces->execute();
    $pieces = $stmtPieces->fetchAll();
    
    // Grouper les pièces par type de dossier
    $piecesParType = [];
    foreach ($pieces as $piece) {
        $piecesParType[$piece['type_dossier_id']][] = $piece;
    }
    
    // Ajouter les pièces requises à chaque dossier
    foreach ($dossiers as &$dossier) {
        $dossier['pieces_requises'] = $piecesParType[$dossier['type_dossier_id']] ?? [];
    }
    
    // Calcul des statistiques simples (seulement par statut)
    $stats = calculerStatistiquesSimples($dossiers);
    
    echo json_encode([
        'success' => true,
        'data' => $dossiers,
        'stats' => $stats,
        'total' => count($dossiers),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}

/**
 * Calcule les statistiques simples des dossiers (seulement par statut)
 */
function calculerStatistiquesSimples($dossiers) {
    $stats = [
        'total' => count($dossiers),
        'en_cours' => 0,
        'termines' => 0,
        'rejetes' => 0,
        'chiffre_affaires' => 0
    ];
    
    foreach ($dossiers as $dossier) {
        // Comptage par statut uniquement
        switch ($dossier['statut']) {
            case 'en_cours':
                $stats['en_cours']++;
                break;
            case 'fini':
                $stats['termines']++;
                $stats['chiffre_affaires'] += floatval($dossier['montant']);
                break;
            case 'rejete':
                $stats['rejetes']++;
                break;
        }
    }
    
    return $stats;
}

/**
 * Crée un nouveau dossier
 */
function createDossier() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validation des données requises
    $required = ['client_id', 'type_dossier_id', 'date_fin_prevue', 'montant'];
    foreach ($required as $field) {
        if (!isset($input[$field]) || empty($input[$field])) {
            http_response_code(400);
            echo json_encode(['error' => "Le champ $field est requis"]);
            return;
        }
    }
    
    // Génération du numéro de ticket
    $numero_ticket = generateTicketNumber();
    
    $query = "
        INSERT INTO dossiers (
            numero_ticket, client_id, type_dossier_id, date_fin_prevue, 
            montant, created_by, statut
        ) VALUES (?, ?, ?, ?, ?, ?, 'en_cours')
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute([
        $numero_ticket,
        $input['client_id'],
        $input['type_dossier_id'],
        $input['date_fin_prevue'],
        $input['montant'],
        $input['created_by'] ?? 1
    ]);
    
    $dossierId = $pdo->lastInsertId();
    
    echo json_encode([
        'success' => true,
        'message' => 'Dossier créé avec succès',
        'id' => $dossierId,
        'numero_ticket' => $numero_ticket
    ]);
}

/**
 * Modifie un dossier
 */
function updateDossier() {
    global $pdo;
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'ID du dossier requis']);
        return;
    }
    
    $updates = [];
    $params = [];
    
    // Champs modifiables
    $allowedFields = ['statut', 'date_fin_prevue', 'motif_rejet', 'montant'];
    
    // Actions spéciales
    if (isset($input['action'])) {
        switch ($input['action']) {
            case 'terminer':
                $updates[] = "statut = ?";
                $params[] = 'fini';
                break;
            case 'rouvrir':
                $updates[] = "statut = ?";
                $params[] = 'en_cours';
                // Effacer le motif de rejet
                $updates[] = "motif_rejet = NULL";
                break;
            case 'rejeter':
                $updates[] = "statut = ?";
                $params[] = 'rejete';
                if (isset($input['motif_rejet'])) {
                    $updates[] = "motif_rejet = ?";
                    $params[] = $input['motif_rejet'];
                }
                break;
        }
    } else {
        // Modification normale des champs
        foreach ($allowedFields as $field) {
            if (isset($input[$field])) {
                $updates[] = "$field = ?";
                $params[] = $input[$field];
            }
        }
    }
    
    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(['error' => 'Aucune modification fournie']);
        return;
    }
    
    // Ajout de l'ID pour la clause WHERE
    $params[] = $input['id'];
    
    $query = "UPDATE dossiers SET " . implode(', ', $updates) . ", updated_at = NOW() WHERE id = ?";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    
    echo json_encode([
        'success' => true,
        'message' => 'Dossier modifié avec succès',
        'updated_fields' => array_keys($input)
    ]);
}

/**
 * Génère un numéro de ticket unique
 */
function generateTicketNumber() {
    global $pdo;
    
    $year = date('Y');
    $month = date('m');
    
    // Récupérer le dernier numéro pour ce mois
    $query = "SELECT numero_ticket FROM dossiers WHERE numero_ticket LIKE ? ORDER BY id DESC LIMIT 1";
    $stmt = $pdo->prepare($query);
    $stmt->execute(["DOC-$year-$month-%"]);
    $last = $stmt->fetch();
    
    if ($last) {
        // Extraire le numéro et l'incrémenter
        $parts = explode('-', $last['numero_ticket']);
        $num = intval($parts[3]) + 1;
    } else {
        $num = 1;
    }
    
    return sprintf("DOC-%s-%s-%03d", $year, $month, $num);
}
?>
