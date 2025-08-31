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
 * API pour les statistiques et tableaux de bord
 * GET: Statistiques globales et par période
 */

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch($method) {
        case 'GET':
            getStatistiques();
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
 * Récupère les statistiques complètes
 */
function getStatistiques() {
    global $pdo;
    
    $stats = [];
    
    // 1. Statistiques générales
    $queryGeneral = "
        SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN statut = 'en_cours' THEN 1 END) as en_cours,
            COUNT(CASE WHEN statut = 'fini' THEN 1 END) as termines,
            COUNT(CASE WHEN statut = 'rejete' THEN 1 END) as rejetes,
            COUNT(CASE WHEN statut = 'retard' THEN 1 END) as retard,
            SUM(CASE WHEN statut = 'fini' THEN montant ELSE 0 END) as chiffre_affaires
        FROM dossiers
    ";
    
    $stmt = $pdo->prepare($queryGeneral);
    $stmt->execute();
    $general = $stmt->fetch();
    $stats['general'] = $general;
    
    // 2. Répartition par priorité (calculée dynamiquement)
    $queryPriorites = "
        SELECT 
            COUNT(CASE WHEN statut = 'en_cours' AND date_fin_prevue < CURDATE() OR statut = 'retard' THEN 1 END) as retard,
            COUNT(CASE WHEN statut = 'en_cours' AND date_fin_prevue = CURDATE() THEN 1 END) as urgent,
            COUNT(CASE WHEN statut = 'en_cours' AND date_fin_prevue > CURDATE() AND date_fin_prevue <= DATE_ADD(CURDATE(), INTERVAL " . JOURS_BIENTOT . " DAY) THEN 1 END) as bientot,
            COUNT(CASE WHEN statut = 'en_cours' AND date_fin_prevue > DATE_ADD(CURDATE(), INTERVAL " . JOURS_BIENTOT . " DAY) THEN 1 END) as normal
        FROM dossiers
    ";
    
    $stmt = $pdo->prepare($queryPriorites);
    $stmt->execute();
    $priorites = $stmt->fetch();
    $stats['priorites'] = $priorites;
    
    // 3. Statistiques mensuelles
    $queryMensuel = "
        SELECT 
            DATE_FORMAT(created_at, '%Y-%m') as mois,
            COUNT(*) as total,
            COUNT(CASE WHEN statut = 'fini' THEN 1 END) as termines,
            SUM(CASE WHEN statut = 'fini' THEN montant ELSE 0 END) as revenus
        FROM dossiers 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY mois DESC
        LIMIT 12
    ";
    
    $stmt = $pdo->prepare($queryMensuel);
    $stmt->execute();
    $mensuel = $stmt->fetchAll();
    $stats['mensuel'] = $mensuel;
    
    // 4. Top types de dossiers
    $queryTypes = "
        SELECT 
            td.nom as type_nom,
            COUNT(d.id) as nb_dossiers,
            SUM(d.montant) as revenus_total,
            AVG(d.montant) as revenu_moyen
        FROM dossiers d
        JOIN types_dossier td ON d.type_dossier_id = td.id
        GROUP BY td.id, td.nom
        ORDER BY nb_dossiers DESC
        LIMIT 10
    ";
    
    $stmt = $pdo->prepare($queryTypes);
    $stmt->execute();
    $types = $stmt->fetchAll();
    $stats['types'] = $types;
    
    // 5. Alertes importantes (dossiers en retard)
    $queryAlertes = "
        SELECT 
            d.numero_ticket,
            d.date_fin_prevue,
            CONCAT(c.prenom, ' ', c.nom) as client_nom,
            td.nom as type_nom,
            DATEDIFF(CURDATE(), d.date_fin_prevue) as jours_retard
        FROM dossiers d
        JOIN clients c ON d.client_id = c.id
        JOIN types_dossier td ON d.type_dossier_id = td.id
        WHERE (d.statut = 'en_cours' AND d.date_fin_prevue < CURDATE()) OR d.statut = 'retard'
        ORDER BY jours_retard DESC
        LIMIT 10
    ";
    
    $stmt = $pdo->prepare($queryAlertes);
    $stmt->execute();
    $alertes = $stmt->fetchAll();
    $stats['alertes'] = $alertes;
    
    echo json_encode([
        'success' => true,
        'data' => $stats,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>
