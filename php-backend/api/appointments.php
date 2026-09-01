<?php
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $sql = "SELECT * FROM appointments WHERE 1=1";
        $params = [];

        if (!empty($_GET['customer_id']) && is_numeric($_GET['customer_id'])) {
            $sql .= " AND customer_id = ?";
            $params[] = intval($_GET['customer_id']);
        }

        if (!empty($_GET['salon_id']) && is_numeric($_GET['salon_id'])) {
            $sql .= " AND salon_id = ?";
            $params[] = intval($_GET['salon_id']);
        }

        $sql .= " ORDER BY appointment_date DESC, appointment_time DESC, id DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        sendResponse($stmt->fetchAll());
    } catch (Exception $e) {
        sendError($e->getMessage(), 500);
    }
} elseif ($method === 'POST') {
    $input = getJsonInput();
    if (empty($input['salon_id']) || empty($input['customer_name']) || empty($input['service_name']) || empty($input['appointment_date'])) {
        sendError('Salon, customer name, service name, and appointment date are required');
    }

    try {
        $stmt = $pdo->prepare("
            INSERT INTO appointments (
                customer_id, customer_name, customer_phone, customer_email,
                salon_id, salon_name, service_id, service_name,
                technician_id, technician_name, appointment_date, appointment_time,
                status, total_price, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $status = $input['status'] ?? 'pending';
        $totalPrice = $input['total_price'] ?? 0;

        $stmt->execute([
            $input['customer_id'] ?? 1,
            $input['customer_name'],
            $input['customer_phone'] ?? null,
            $input['customer_email'] ?? null,
            $input['salon_id'],
            $input['salon_name'] ?? 'Nail Salon',
            $input['service_id'] ?? 1,
            $input['service_name'],
            $input['technician_id'] ?? null,
            $input['technician_name'] ?? 'Any Available Stylist',
            $input['appointment_date'],
            $input['appointment_time'] ?? '14:00',
            $status,
            $totalPrice,
            $input['notes'] ?? null
        ]);

        $newId = $pdo->lastInsertId();
        $stmtGet = $pdo->prepare("SELECT * FROM appointments WHERE id = ?");
        $stmtGet->execute([$newId]);
        sendResponse(['success' => true, 'appointment' => $stmtGet->fetch()], 201);
    } catch (Exception $e) {
        sendError($e->getMessage(), 500);
    }
} elseif ($method === 'PUT') {
    $input = getJsonInput();
    if (empty($input['id']) || empty($input['status'])) {
        sendError('Appointment ID and new status are required');
    }

    try {
        $stmt = $pdo->prepare("UPDATE appointments SET status = ? WHERE id = ?");
        $stmt->execute([$input['status'], $input['id']]);

        $stmtGet = $pdo->prepare("SELECT * FROM appointments WHERE id = ?");
        $stmtGet->execute([$input['id']]);
        sendResponse(['success' => true, 'appointment' => $stmtGet->fetch()]);
    } catch (Exception $e) {
        sendError($e->getMessage(), 500);
    }
} else {
    sendError('Method not allowed', 405);
}
?>
