<?php
header('Content-Type: application/json');
$origin = $_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:5173';
header("Access-Control-Allow-Origin: $origin");
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

    // Rechercher le dossier par numéro de ticket avec toutes les informations client
    $stmt = $pdo->prepare("
        SELECT 
            d.id,
            d.numero_ticket,
            d.client_id,
            d.type_dossier_id,
            d.date_depot,
            d.date_fin_prevue,
            d.statut,
            d.motif_rejet,
            d.description,
            d.montant,
            d.created_at as date_creation,
            d.updated_at,
            -- Informations client
            c.nom as client_nom,
            c.prenom as client_prenom,
            c.email as client_email,
            c.telephone as client_telephone,
            c.adresse as client_adresse,
            c.ville_origine as client_ville_origine,
            -- Informations type de dossier
            td.nom as type_nom,
            td.description as type_description,
            td.tarif as type_prix,
            td.delai_jours as type_delai
        FROM dossiers d
        LEFT JOIN clients c ON d.client_id = c.id
        LEFT JOIN types_dossier td ON d.type_dossier_id = td.id
        WHERE d.numero_ticket = ?
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
    if ($dossier['type_dossier_id']) {
        $stmtPieces = $pdo->prepare("
            SELECT pr.*, pr.nom_piece, pr.description
            FROM pieces_requises pr
            WHERE pr.type_dossier_id = ?
            ORDER BY pr.obligatoire DESC, pr.nom_piece ASC
        ");
        $stmtPieces->execute([$dossier['type_dossier_id']]);
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
