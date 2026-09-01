<?php
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $stmt = $pdo->query("SELECT * FROM business_categories ORDER BY id ASC");
        $categories = $stmt->fetchAll();
        sendResponse($categories);
    } catch (Exception $e) {
        sendError($e->getMessage(), 500);
    }
} elseif ($method === 'POST') {
    $input = getJsonInput();
    if (empty($input['category_name'])) {
        sendError('Category name is required');
    }
    try {
        $stmt = $pdo->prepare("INSERT INTO business_categories (category_name, description, icon) VALUES (?, ?, ?)");
        $stmt->execute([
            $input['category_name'],
            $input['description'] ?? '',
            $input['icon'] ?? '💅'
        ]);
        $id = $pdo->lastInsertId();
        sendResponse(['success' => true, 'id' => $id]);
    } catch (Exception $e) {
        sendError($e->getMessage(), 500);
    }
} else {
    sendError('Method not allowed', 405);
}
?>
