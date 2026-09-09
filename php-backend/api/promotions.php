<?php
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $stmt = $pdo->query("SELECT * FROM promotions ORDER BY id DESC");
        sendResponse($stmt->fetchAll());
    } catch (Exception $e) {
        sendError($e->getMessage(), 500);
    }
} elseif ($method === 'POST') {
    $input = getJsonInput();
    if (empty($input['salon_id']) || empty($input['title']) || empty($input['code'])) {
        sendError('Salon ID, title, and promo code are required');
    }

    try {
        $stmt = $pdo->prepare("
            INSERT INTO promotions (salon_id, salon_name, title, discount_percentage, code, valid_until, banner, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $input['salon_id'],
            $input['salon_name'] ?? 'Salon Studio',
            $input['title'],
            $input['discount_percentage'] ?? 15,
            $input['code'],
            $input['valid_until'] ?? date('Y-m-d', strtotime('+30 days')),
            $input['banner'] ?? null,
            $input['description'] ?? ''
        ]);
        $newId = $pdo->lastInsertId();
        $stmtGet = $pdo->prepare("SELECT * FROM promotions WHERE id = ?");
        $stmtGet->execute([$newId]);
        sendResponse(['success' => true, 'promotion' => $stmtGet->fetch()], 201);
    } catch (Exception $e) {
        sendError($e->getMessage(), 500);
    }
} else {
    sendError('Method not allowed', 405);
}
?>
