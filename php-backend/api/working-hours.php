<?php
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $salonId = $_GET['salon_id'] ?? null;
    if (!$salonId || !is_numeric($salonId)) {
        sendError('Salon ID is required');
    }

    try {
        $stmt = $pdo->prepare('SELECT * FROM working_hours WHERE salon_id = ? ORDER BY id ASC');
        $stmt->execute([intval($salonId)]);
        sendResponse($stmt->fetchAll());
    } catch (Exception $e) {
        sendError($e->getMessage(), 500);
    }
} elseif ($method === 'PUT') {
    $input = getJsonInput();
    $salonId = $input['salon_id'] ?? null;
    $hours = $input['hours'] ?? [];
    if (!$salonId || !is_numeric($salonId) || !is_array($hours)) {
        sendError('Salon ID and working hours are required');
    }

    try {
        $pdo->beginTransaction();
        $delete = $pdo->prepare('DELETE FROM working_hours WHERE salon_id = ?');
        $delete->execute([intval($salonId)]);
        $insert = $pdo->prepare(
            'INSERT INTO working_hours (salon_id, day_of_week, opening_time, closing_time, is_closed) VALUES (?, ?, ?, ?, ?)'
        );

        foreach ($hours as $hour) {
            $insert->execute([
                intval($salonId),
                $hour['day_of_week'] ?? '',
                $hour['opening_time'] ?? '09:00',
                $hour['closing_time'] ?? '19:00',
                !empty($hour['is_closed']) ? 1 : 0,
            ]);
        }

        $pdo->commit();
        $stmt = $pdo->prepare('SELECT * FROM working_hours WHERE salon_id = ? ORDER BY id ASC');
        $stmt->execute([intval($salonId)]);
        sendResponse(['success' => true, 'working_hours' => $stmt->fetchAll()]);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        sendError($e->getMessage(), 500);
    }
} else {
    sendError('Method not allowed', 405);
}
?>
