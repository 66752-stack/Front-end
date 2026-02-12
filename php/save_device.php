<?php
/**
 * API för att lägga till eller uppdatera enheter
 * POST api/save_device.php
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config.php';

// Hantera POST-data
$input = json_decode(file_get_contents('php://input'), true);

// Validera input
if (!isset($input['device_name']) || !isset($input['device_type']) || !isset($input['owner'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Obligatoriska fält saknas'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $pdo = getDatabaseConnection();

    // Generera eller använd befintligt device_id
    $device_id = $input['device_id'] ?? null;
    $is_update = false;

    if ($device_id) {
        // Kontrollera om enheten finns
        $checkStmt = $pdo->prepare("SELECT id FROM devices WHERE device_id = ?");
        $checkStmt->execute([$device_id]);
        $is_update = $checkStmt->fetch() !== false;
    } else {
        // Generera nytt ID
        $device_id = 'DEV-' . strtoupper(substr(uniqid(), -9));
    }

    if ($is_update) {
        // Uppdatera befintlig enhet
        $stmt = $pdo->prepare("
            UPDATE devices 
            SET device_name = ?,
                device_type = ?,
                owner = ?,
                status = ?,
                last_updated = ?
            WHERE device_id = ?
        ");

        $stmt->execute([
            $input['device_name'],
            $input['device_type'],
            $input['owner'],
            $input['status'] ?? 'Aktiv',
            date('Y-m-d'),
            $device_id
        ]);

        $message = 'Enheten uppdaterades';

    } else {
        // Lägg till ny enhet
        $stmt = $pdo->prepare("
            INSERT INTO devices (device_id, device_name, device_type, owner, status, last_updated)
            VALUES (?, ?, ?, ?, ?, ?)
        ");

        $stmt->execute([
            $device_id,
            $input['device_name'],
            $input['device_type'],
            $input['owner'],
            $input['status'] ?? 'Aktiv',
            date('Y-m-d')
        ]);

        $message = 'Enheten lades till';
    }

    echo json_encode([
        'success' => true,
        'message' => $message,
        'device_id' => $device_id
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Ett fel uppstod',
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>