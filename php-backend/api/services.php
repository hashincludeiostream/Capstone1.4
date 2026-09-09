<?php
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        if (!empty($_GET['salon_id']) && is_numeric($_GET['salon_id'])) {
            $stmt = $pdo->prepare("SELECT * FROM services WHERE salon_id = ? ORDER BY is_popular DESC, id ASC");
            $stmt->execute([intval($_GET['salon_id'])]);
        } else {
            $stmt = $pdo->query("SELECT * FROM services ORDER BY is_popular DESC, id ASC");
        }
        sendResponse($stmt->fetchAll());
    } catch (Exception $e) {
        sendError($e->getMessage(), 500);
    }
} elseif ($method === 'POST') {
    $input = getJsonInput();
    if (empty($input['salon_id']) || empty($input['service_name'])) {
        sendError('Salon ID and Service name are required');
    }

    try {
        $stmt = $pdo->prepare("
            INSERT INTO services (salon_id, service_name, description, price, duration_minutes, category_name, image, is_popular)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $input['salon_id'],
            $input['service_name'],
            $input['description'] ?? '',
            0,
            $input['duration_minutes'] ?? 45,
            $input['category_name'] ?? 'Nail Services',
            $input['image'] ?? null,
            !empty($input['is_popular']) ? 1 : 0
        ]);
        $newId = $pdo->lastInsertId();
        $stmtGet = $pdo->prepare("SELECT * FROM services WHERE id = ?");
        $stmtGet->execute([$newId]);
        sendResponse(['success' => true, 'service' => $stmtGet->fetch()], 201);
    } catch (Exception $e) {
        sendError($e->getMessage(), 500);
    }
} elseif ($method === 'PUT') {
    $input = getJsonInput();
    $serviceId = $input['id'] ?? ($_GET['id'] ?? null);
    if (empty($serviceId)) {
        sendError('Service ID is required');
    }
    try {
        $stmt = $pdo->prepare("
            UPDATE services
            SET service_name = ?, description = ?, price = ?, duration_minutes = ?, category_name = ?, image = ?, is_popular = ?
            WHERE id = ?
        ");
        $stmt->execute([
            $input['service_name'],
            $input['description'] ?? '',
            0,
            $input['duration_minutes'] ?? 45,
            $input['category_name'] ?? 'Nail Services',
            $input['image'] ?? '',
            !empty($input['is_popular']) ? 1 : 0,
            $serviceId
        ]);
        $stmtGet = $pdo->prepare("SELECT * FROM services WHERE id = ?");
        $stmtGet->execute([$serviceId]);
        sendResponse(['success' => true, 'service' => $stmtGet->fetch()]);
    } catch (Exception $e) {
        sendError($e->getMessage(), 500);
    }
} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? (getJsonInput()['id'] ?? null);
    if (!$id) {
        sendError('Service ID is required');
    }
    try {
        $stmt = $pdo->prepare("DELETE FROM services WHERE id = ?");
        $stmt->execute([$id]);
        sendResponse(['success' => true, 'message' => 'Service deleted']);
    } catch (Exception $e) {
        sendError($e->getMessage(), 500);
    }
} else {
    sendError('Method not allowed', 405);
}
?>
