<?php
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        if (!empty($_GET['salon_id']) && is_numeric($_GET['salon_id'])) {
            $stmt = $pdo->prepare("SELECT * FROM technicians WHERE salon_id = ? ORDER BY rating DESC, id ASC");
            $stmt->execute([intval($_GET['salon_id'])]);
        } else {
            $stmt = $pdo->query("SELECT * FROM technicians ORDER BY rating DESC, id ASC");
        }
        sendResponse($stmt->fetchAll());
    } catch (Exception $e) {
        sendError($e->getMessage(), 500);
    }
} elseif ($method === 'POST') {
    $input = getJsonInput();
    if (empty($input['salon_id']) || empty($input['fullname'])) {
        sendError('Salon ID and Fullname are required');
    }

    try {
        $stmt = $pdo->prepare("
            INSERT INTO technicians (salon_id, fullname, specialties, rating, is_available, avatar, experience_years)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $input['salon_id'],
            $input['fullname'],
            $input['specialties'] ?? 'Gel Art, Russian Manicure',
            $input['rating'] ?? null,
            isset($input['is_available']) ? ($input['is_available'] ? 1 : 0) : 1,
            $input['avatar'] ?? null,
            $input['experience_years'] ?? 3
        ]);
        $newId = $pdo->lastInsertId();
        $stmtGet = $pdo->prepare("SELECT * FROM technicians WHERE id = ?");
        $stmtGet->execute([$newId]);
        sendResponse(['success' => true, 'technician' => $stmtGet->fetch()], 201);
    } catch (Exception $e) {
        sendError($e->getMessage(), 500);
    }
} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? (getJsonInput()['id'] ?? null);
    if (!$id) {
        sendError('Technician ID is required');
    }
    try {
        $stmt = $pdo->prepare("DELETE FROM technicians WHERE id = ?");
        $stmt->execute([$id]);
        sendResponse(['success' => true, 'message' => 'Technician deleted']);
    } catch (Exception $e) {
        sendError($e->getMessage(), 500);
    }
} else {
    sendError('Method not allowed', 405);
}
?>
