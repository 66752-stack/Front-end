<?php
/**
 * API för att lägga till eller uppdatera förbrukningsvaror
 * POST api/save_consumable.php
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config.php';

$input = json_decode(file_get_contents('php://input'), true);

// Validera obligatoriska fält
if (!isset($input['product_name']) || !isset($input['category'])
    || !isset($input['stock']) || !isset($input['min_level'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Obligatoriska fält saknas'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Validera numeriska värden
$stock     = filter_var($input['stock'],     FILTER_VALIDATE_INT, ['options' => ['min_range' => 0]]);
$min_level = filter_var($input['min_level'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 0]]);

if ($stock === false || $min_level === false) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Ogiltiga numeriska värden'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $pdo = getDatabaseConnection();

    $product_id = $input['product_id'] ?? null;
    $is_update  = false;

    if ($product_id) {
        $checkStmt = $pdo->prepare("SELECT id FROM consumables WHERE product_id = ?");
        $checkStmt->execute([$product_id]);
        $is_update = $checkStmt->fetch() !== false;
    } else {
        $product_id = 'CONS-' . strtoupper(substr(uniqid(), -9));
    }

    if ($is_update) {
        $stmt = $pdo->prepare("
            UPDATE consumables
            SET product_name = ?,
                category     = ?,
                stock        = ?,
                min_level    = ?
            WHERE product_id = ?
        ");
        $stmt->execute([
            substr($input['product_name'], 0, 255),
            substr($input['category'],     0, 100),
            $stock,
            $min_level,
            $product_id
        ]);
        $message = 'Varan uppdaterades';
    } else {
        $stmt = $pdo->prepare("
            INSERT INTO consumables (product_id, product_name, category, stock, min_level)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $product_id,
            substr($input['product_name'], 0, 255),
            substr($input['category'],     0, 100),
            $stock,
            $min_level
        ]);
        $message = 'Varan lades till';
    }

    echo json_encode([
        'success'    => true,
        'message'    => $message,
        'product_id' => $product_id
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Ett fel uppstod',
        'error'   => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>






