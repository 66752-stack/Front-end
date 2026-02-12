<?php
/**
 * API för att hämta inventarie-data
 * GET api/get_inventory.php
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

require_once '../config.php';

try {
    $pdo = getDatabaseConnection();

    // Hämta alla enheter
    $devicesStmt = $pdo->query("
        SELECT 
            device_id,
            device_name,
            device_type,
            owner,
            status,
            last_updated
        FROM devices
        ORDER BY last_updated DESC
    ");
    $devices = $devicesStmt->fetchAll();

    // Hämta alla förbrukningsvaror
    $consumablesStmt = $pdo->query("
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
        ORDER BY product_name ASC
    ");
    $consumables = $consumablesStmt->fetchAll();

    // Räkna statistik
    $stats = [
        'total_devices' => count($devices),
        'total_consumables' => count($consumables),
        'active_devices' => count(array_filter($devices, fn($d) => $d['status'] === 'Aktiv')),
        'low_stock_items' => count(array_filter($consumables, fn($c) => $c['stock_status'] === 'Lågt lager')),
        'out_of_stock_items' => count(array_filter($consumables, fn($c) => $c['stock_status'] === 'Slut i lager'))
    ];

    // Skicka svar
    echo json_encode([
        'success' => true,
        'devices' => $devices,
        'consumables' => $consumables,
        'stats' => $stats,
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Ett fel uppstod vid hämtning av data',
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>
