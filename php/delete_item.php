<?php
/**
 * API för att radera enheter eller förbrukningsvaror
 * POST api/delete_item.php
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config.php';

// Hantera POST-data
$input = json_decode(file_get_contents('php://input'), true);

// Validera input
if (!isset($input['item_id']) || !isset($input['type'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Item ID och typ måste anges'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $pdo = getDatabaseConnection();

    $item_id = $input['item_id'];
    $type = $input['type']; // 'device' eller 'consumable'

    if ($type === 'device') {
        $stmt = $pdo->prepare("DELETE FROM devices WHERE device_id = ?");
        $stmt->execute([$item_id]);
        $message = 'Enheten raderades';

    } elseif ($type === 'consumable') {
        $stmt = $pdo->prepare("DELETE FROM consumables WHERE product_id = ?");
        $stmt->execute([$item_id]);
        $message = 'Produkten raderades';

    } else {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Ogiltig typ angiven'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($stmt->rowCount() > 0) {
        echo json_encode([
            'success' => true,
            'message' => $message
        ], JSON_UNESCAPED_UNICODE);
    } else {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Objektet kunde inte hittas'
        ], JSON_UNESCAPED_UNICODE);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Ett fel uppstod',
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>
