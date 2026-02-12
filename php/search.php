<?php
/**
 * API för att söka i inventariet
 * GET api/search.php?query=sökterm
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

require_once '../config.php';

// Hämta sökterm
$query = $_GET['query'] ?? '';

if (empty($query)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Sökterm måste anges'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $pdo = getDatabaseConnection();
    $searchTerm = '%' . $query . '%';

    // Sök i enheter
    $devicesStmt = $pdo->prepare("
        SELECT 
            device_id,
            device_name,
            device_type,
            owner,
            status,
            last_updated
        FROM devices
        WHERE device_id LIKE ? 
           OR device_name LIKE ? 
           OR device_type LIKE ? 
           OR owner LIKE ?
        ORDER BY last_updated DESC
    ");
    $devicesStmt->execute([$searchTerm, $searchTerm, $searchTerm, $searchTerm]);
    $devices = $devicesStmt->fetchAll();

    // Sök i förbrukningsvaror
    $consumablesStmt = $pdo->prepare("
        SELECT 
            product_id,
            product_name,
            category,
            stock,
            min_level,
            CASE
                WHEN stock = 0 THEN 'Slut i lager'
                WHEN stock < min_level THEN 'Lågt lager'
                ELSE 'I lager'
            END as stock_status
        FROM consumables
        WHERE product_id LIKE ? 
           OR product_name LIKE ? 
           OR category LIKE ?
        ORDER BY product_name ASC
    ");
    $consumablesStmt->execute([$searchTerm, $searchTerm, $searchTerm]);
    $consumables = $consumablesStmt->fetchAll();

    echo json_encode([
        'success' => true,
        'query' => $query,
        'devices' => $devices,
        'consumables' => $consumables,
        'total_results' => count($devices) + count($consumables)
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Ett fel uppstod vid sökning',
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>
