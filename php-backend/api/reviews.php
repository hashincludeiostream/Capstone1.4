<?php
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        if (!empty($_GET['salon_id']) && is_numeric($_GET['salon_id'])) {
            $stmt = $pdo->prepare("
                SELECT r.*, s.salon_name 
                FROM reviews r 
                LEFT JOIN salons s ON r.salon_id = s.id 
                WHERE r.salon_id = ? 
                ORDER BY r.id DESC
            ");
            $stmt->execute([intval($_GET['salon_id'])]);
        } else {
            $stmt = $pdo->query("
                SELECT r.*, s.salon_name 
                FROM reviews r 
                LEFT JOIN salons s ON r.salon_id = s.id 
                ORDER BY r.id DESC
            ");
        }
        $reviews = $stmt->fetchAll();
        // Map user_name to customer_name for frontend compatibility
        foreach ($reviews as &$review) {
            $review['customer_name'] = $review['user_name'] ?? 'Unknown';
            $review['review_text'] = $review['comment'] ?? '';
        }
        sendResponse($reviews);
    } catch (Exception $e) {
        sendError($e->getMessage(), 500);
    }
} elseif ($method === 'POST') {
    $input = getJsonInput();
    if (empty($input['salon_id']) || empty($input['rating']) || empty($input['comment'])) {
        sendError('Salon ID, rating, and review comment are required');
    }

    try {
        $stmt = $pdo->prepare("
            INSERT INTO reviews (salon_id, technician_id, technician_name, user_id, user_name, user_avatar, rating, comment, service_name)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $input['salon_id'],
            $input['technician_id'] ?? null,
            $input['technician_name'] ?? null,
            $input['user_id'] ?? 1,
            $input['user_name'] ?? 'Verified Client',
            $input['user_avatar'] ?? null,
            $input['rating'],
            $input['comment'],
            $input['service_name'] ?? 'Classic Manicure'
        ]);

        $newId = $pdo->lastInsertId();

        if (!empty($input['technician_id'])) {
            $stmtTechAvg = $pdo->prepare(
                'UPDATE technicians SET rating = (SELECT AVG(rating) FROM reviews WHERE technician_id = ?) WHERE id = ?'
            );
            $stmtTechAvg->execute([$input['technician_id'], $input['technician_id']]);
        }

        // Update average rating on salon
        $stmtAvg = $pdo->prepare("SELECT AVG(rating) as avg_r, COUNT(*) as cnt FROM reviews WHERE salon_id = ?");
        $stmtAvg->execute([$input['salon_id']]);
        $stats = $stmtAvg->fetch();
        if ($stats) {
            $stmtUpdateSalon = $pdo->prepare("UPDATE salons SET avg_rating = ?, review_count = ? WHERE id = ?");
            $stmtUpdateSalon->execute([round($stats['avg_r'], 2), $stats['cnt'], $input['salon_id']]);
        }

        $stmtGet = $pdo->prepare("SELECT * FROM reviews WHERE id = ?");
        $stmtGet->execute([$newId]);
        sendResponse(['success' => true, 'review' => $stmtGet->fetch()], 201);
    } catch (Exception $e) {
        sendError($e->getMessage(), 500);
    }
} else {
    sendError('Method not allowed', 405);
}
?>
