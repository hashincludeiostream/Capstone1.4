<?php
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $stmt = $pdo->query("SELECT * FROM announcements ORDER BY id DESC");
        sendResponse($stmt->fetchAll());
    } catch (Exception $e) {
        sendError($e->getMessage(), 500);
    }
} elseif ($method === 'POST') {
    $input = getJsonInput();
    if (empty($input['title']) || empty($input['message'])) {
        sendError('Title and message are required');
    }

    try {
        $stmt = $pdo->prepare("
            INSERT INTO announcements (title, message, priority, target_audience, created_by)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $input['title'],
            $input['message'],
            $input['priority'] ?? 'normal',
            $input['target_audience'] ?? 'all',
            $input['created_by'] ?? 'Administrator'
        ]);
        $newId = $pdo->lastInsertId();
        $stmtGet = $pdo->prepare("SELECT * FROM announcements WHERE id = ?");
        $stmtGet->execute([$newId]);
        sendResponse(['success' => true, 'announcement' => $stmtGet->fetch()], 201);
    } catch (Exception $e) {
        sendError($e->getMessage(), 500);
    }
} else {
    sendError('Method not allowed', 405);
}
?>
