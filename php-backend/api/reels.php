<?php
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $stmt = $pdo->query("SELECT * FROM reels ORDER BY id DESC");
        sendResponse($stmt->fetchAll());
    } catch (Exception $e) {
        sendError($e->getMessage(), 500);
    }
} elseif ($method === 'POST') {
    $input = getJsonInput();
    // Like action (e.g. { reel_id: 1, action: 'like' })
    if (!empty($input['reel_id'])) {
        try {
            $stmt = $pdo->prepare("UPDATE reels SET likes = likes + 1 WHERE id = ?");
            $stmt->execute([$input['reel_id']]);

            $stmtGet = $pdo->prepare("SELECT * FROM reels WHERE id = ?");
            $stmtGet->execute([$input['reel_id']]);
            sendResponse(['success' => true, 'reel' => $stmtGet->fetch()]);
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
    } else {
        // Create new reel
        if (empty($input['salon_id']) || empty($input['video_url']) || empty($input['title'])) {
            sendError('Salon ID, video URL, and title are required');
        }
        try {
            $stmt = $pdo->prepare("
                INSERT INTO reels (salon_id, salon_name, salon_logo, video_url, thumbnail, title, description, likes, views)
                VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0)
            ");
            $stmt->execute([
                $input['salon_id'],
                $input['salon_name'] ?? 'Salon Studio',
                $input['salon_logo'] ?? '',
                $input['video_url'],
                $input['thumbnail'] ?? '',
                $input['title'],
                $input['description'] ?? ''
            ]);
            $newId = $pdo->lastInsertId();
            $stmtGet = $pdo->prepare("SELECT * FROM reels WHERE id = ?");
            $stmtGet->execute([$newId]);
            sendResponse(['success' => true, 'reel' => $stmtGet->fetch()], 201);
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
    }
} else {
    sendError('Method not allowed', 405);
}
?>
