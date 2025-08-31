<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Gestion de la requête OPTIONS pour CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config.php';

try {
    // Vérifier que c'est une requête GET avec un paramètre ticket
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        throw new Exception('Méthode non autorisée');
    }

    if (!isset($_GET['ticket']) || empty(trim($_GET['ticket']))) {
        throw new Exception('Numéro de ticket requis');
    }

    $numeroTicket = trim($_GET['ticket']);

    // Rechercher le dossier par numéro de ticket
    $stmt = $pdo->prepare("
        SELECT 
            d.*,
            t.nom as type_nom,
            t.prix as type_prix
        FROM dossiers d
        LEFT JOIN types_dossier t ON d.type_id = t.id
        WHERE d.numero_dossier = ?
        LIMIT 1
    ");
    
    $stmt->execute([$numeroTicket]);
    $dossier = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$dossier) {
        echo json_encode([
            'success' => false,
            'message' => 'Aucun dossier trouvé avec ce numéro de ticket'
        ]);
        exit();
    }

    // Récupérer les pièces requises pour ce type de dossier (si nécessaire)
    $pieces = [];
    if ($dossier['type_id']) {
        $stmtPieces = $pdo->prepare("
            SELECT pr.*, td.nom_piece, td.description
            FROM pieces_requises pr
            JOIN types_documents td ON pr.type_document_id = td.id
            WHERE pr.type_dossier_id = ?
            ORDER BY pr.obligatoire DESC, td.nom_piece ASC
        ");
        $stmtPieces->execute([$dossier['type_id']]);
        $pieces = $stmtPieces->fetchAll(PDO::FETCH_ASSOC);
    }

    echo json_encode([
        'success' => true,
        'dossier' => $dossier,
        'pieces' => $pieces,
        'message' => 'Dossier trouvé avec succès'
    ]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
