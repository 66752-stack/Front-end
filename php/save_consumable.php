<?php
/**
 * API för att lägga till eller uppdatera förbrukningsvaror
 * POST api/save_consumable.php
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config.php';

// Hantera POST-data
$input = json_decode(file_get_contents('php://input'), true);

// Validera input
if (!isset($input['product_name']) || !isset($input['category'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Obligatoriska fält saknas'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $pdo = getDatabaseConnection();

    // Generera eller använd befintligt product_id
    $product_id = $input['product_id'] ?? null;
    $is_update = false;

    if ($product_id) {
        // Kontrollera om produkten finns
        $checkStmt = $pdo->prepare("SELECT id FROM consumables WHERE product_id = ?");
        $checkStmt->execute([$product_id]);
        $is_update = $checkStmt->fetch() !== false;
    } else {
        // Generera nytt ID
        $product_id = 'CONS-' . strtoupper(substr(uniqid(), -9));
    }

    if ($is_update) {
        // Uppdatera befintlig produkt
        $stmt = $pdo->prepare("
            UPDATE consumables 
            SET product_name = ?,
                category = ?,
                stock = ?,
                min_level = ?
            WHERE product_id = ?
        ");

        $stmt->execute([
            $input['product_name'],
            $input['category'],
            $input['stock'] ?? 0,
            $input['min_level'] ?? 5,
            $product_id
        ]);

        $message = 'Produkten uppdaterades';

    } else {
        // Lägg till ny produkt
        $stmt = $pdo->prepare("
            INSERT INTO consumables (product_id, product_name, category, stock, min_level)
            VALUES (?, ?, ?, ?, ?)
        ");

        $stmt->execute([
            $product_id,
            $input['product_name'],
            $input['category'],
            $input['stock'] ?? 0,
            $input['min_level'] ?? 5
        ]);

        $message = 'Produkten lades till';
    }

    echo json_encode([
        'success' => true,
        'message' => $message,
        'product_id' => $product_id
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
