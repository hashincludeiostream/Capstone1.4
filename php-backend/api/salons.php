<?php
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // If specific ID is requested (e.g. /salons.php?id=1)
    if (isset($_GET['id']) && is_numeric($_GET['id'])) {
        $salonId = intval($_GET['id']);
        try {
            $stmt = $pdo->prepare("SELECT * FROM salons WHERE id = ?");
            $stmt->execute([$salonId]);
            $salon = $stmt->fetch();

            if (!$salon) {
                sendError('Salon not found', 404);
            }

            // Fetch related records
            $stmtServices = $pdo->prepare("SELECT * FROM services WHERE salon_id = ? ORDER BY id ASC");
            $stmtServices->execute([$salonId]);
            $services = $stmtServices->fetchAll();

            $stmtTechs = $pdo->prepare("SELECT * FROM technicians WHERE salon_id = ? ORDER BY id ASC");
            $stmtTechs->execute([$salonId]);
            $technicians = $stmtTechs->fetchAll();

            $stmtReviews = $pdo->prepare("SELECT * FROM reviews WHERE salon_id = ? ORDER BY id DESC");
            $stmtReviews->execute([$salonId]);
            $reviews = $stmtReviews->fetchAll();

            $stmtHours = $pdo->prepare("SELECT * FROM working_hours WHERE salon_id = ? ORDER BY id ASC");
            $stmtHours->execute([$salonId]);
            $working_hours = $stmtHours->fetchAll();

            sendResponse([
                'salon' => $salon,
                'services' => $services,
                'technicians' => $technicians,
                'reviews' => $reviews,
                'working_hours' => $working_hours,
            ]);
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
    }

    // List all salons with filtering
    try {
        $sql = "SELECT * FROM salons WHERE 1=1";
        $params = [];

        if (!empty($_GET['category']) && is_numeric($_GET['category'])) {
            $sql .= " AND category_id = ?";
            $params[] = intval($_GET['category']);
        }

        if (!empty($_GET['owner_id']) && is_numeric($_GET['owner_id'])) {
            $sql .= " AND owner_id = ?";
            $params[] = intval($_GET['owner_id']);
        }

        if (!empty($_GET['search'])) {
            $search = '%' . trim($_GET['search']) . '%';
            $sql .= " AND (salon_name LIKE ? OR address LIKE ? OR city LIKE ? OR description LIKE ?)";
            $params[] = $search;
            $params[] = $search;
            $params[] = $search;
            $params[] = $search;
        }

        $sql .= " ORDER BY featured DESC, avg_rating DESC, id ASC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $salons = $stmt->fetchAll();

        sendResponse($salons);
    } catch (Exception $e) {
        sendError($e->getMessage(), 500);
    }
} elseif ($method === 'POST') {
    $input = getJsonInput();
    if (empty($input['salon_name']) || empty($input['owner_id'])) {
        sendError('Salon name and owner ID are required');
    }

    try {
        $stmt = $pdo->prepare("
            INSERT INTO salons (
                owner_id, salon_name, address, city, province, postal_code,
                landmark, parking_info, phone, email, description, logo, banner,
                category_id, category_name, latitude, longitude, verification_status, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 1)
        ");

        $stmt->execute([
            $input['owner_id'],
            $input['salon_name'],
            $input['address'] ?? 'Metro Manila',
            $input['city'] ?? 'Metro Manila',
            $input['province'] ?? 'Metro Manila',
            $input['postal_code'] ?? '1000',
            $input['landmark'] ?? null,
            $input['parking_info'] ?? null,
            $input['phone'] ?? null,
            $input['email'] ?? null,
            $input['description'] ?? '',
            $input['logo'] ?? 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=300&auto=format&fit=crop&q=80',
            $input['banner'] ?? 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80',
            $input['category_id'] ?? 1,
            $input['category_name'] ?? 'Nail Services',
            $input['latitude'] ?? 14.5995,
            $input['longitude'] ?? 120.9842,
        ]);

        $newId = $pdo->lastInsertId();
        $stmtGet = $pdo->prepare("SELECT * FROM salons WHERE id = ?");
        $stmtGet->execute([$newId]);
        $created = $stmtGet->fetch();

        sendResponse(['success' => true, 'salon' => $created], 201);
    } catch (Exception $e) {
        sendError($e->getMessage(), 500);
    }
} elseif ($method === 'PUT') {
    $input = getJsonInput();
    if (empty($input['id'])) {
        sendError('Salon ID is required');
    }

    try {
        $fields = [];
        $params = [];

        $allowed = [
            'salon_name', 'address', 'city', 'province', 'postal_code',
            'landmark', 'parking_info', 'phone', 'email', 'description',
            'logo', 'banner', 'category_id', 'category_name', 'latitude',
            'longitude', 'verification_status', 'is_active', 'featured'
        ];

        foreach ($allowed as $field) {
            if (array_key_exists($field, $input)) {
                $fields[] = "`$field` = ?";
                $params[] = $input[$field];
            }
        }

        if (empty($fields)) {
            sendError('No valid fields to update');
        }

        $params[] = $input['id'];
        $sql = "UPDATE salons SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        $stmtGet = $pdo->prepare("SELECT * FROM salons WHERE id = ?");
        $stmtGet->execute([$input['id']]);
        $updated = $stmtGet->fetch();

        sendResponse(['success' => true, 'salon' => $updated]);
    } catch (Exception $e) {
        sendError($e->getMessage(), 500);
    }
} else {
    sendError('Method not allowed', 405);
}
?>
