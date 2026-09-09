<?php
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'login';

if ($method === 'POST') {
    $input = getJsonInput();

    // 1. LOGIN
    if ($action === 'login') {
        $email = trim($input['email'] ?? '');
        $password = $input['password'] ?? '';
        $role = $input['role'] ?? null;

        if (empty($email) || empty($password)) {
            sendError('Email and password are required');
        }

        try {
            $stmt = $pdo->prepare("SELECT * FROM users WHERE LOWER(email) = LOWER(?)");
            $stmt->execute([$email]);
            $user = $stmt->fetch();

            if (!$user) {
                sendError('No account found with this email address.', 404);
            }

            if (empty($user['password']) || !password_verify($password, $user['password'])) {
                sendError('Incorrect password. Please check your password and try again.', 401);
            }

            if ($role && $user['user_type'] !== $role) {
                sendError("This account is registered as a " . str_replace('_', ' ', $user['user_type']) . ". Please use the appropriate portal.", 403, [
                    'user_type' => $user['user_type']
                ]);
            }

            unset($user['password']);
            sendResponse(['success' => true, 'user' => $user]);
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
    }

    // 2. REGISTER
    if ($action === 'register') {
        $fullname = trim($input['fullname'] ?? '');
        $email = trim($input['email'] ?? '');
        $password = $input['password'] ?? '';
        $phone = $input['phone'] ?? '';
        $user_type = $input['user_type'] ?? 'customer';
        $admin_code = $input['admin_code'] ?? '';

        if (empty($fullname) || empty($email) || empty($password)) {
            sendError('Full name, email, and password are required');
        }

        if (strlen($password) < 8) {
            sendError('Password must be at least 8 characters long');
        }

        // Admin Security Passcode verification
        if ($user_type === 'admin') {
            $validCodes = ['ADMIN2025', 'GLAM_ADMIN', 'ADMIN', 'SUPERADMIN'];
            if (empty($admin_code) || !in_array(strtoupper(trim($admin_code)), $validCodes)) {
                sendError('Invalid Administrator Security Authorization Code.', 403);
            }
        }

        try {
            // Check duplicate email
            $stmtCheck = $pdo->prepare("SELECT id FROM users WHERE LOWER(email) = LOWER(?)");
            $stmtCheck->execute([$email]);
            if ($stmtCheck->fetch()) {
                sendError('An account with this email address already exists.', 400);
            }

            $stmt = $pdo->prepare("
                INSERT INTO users (fullname, email, password, phone, user_type, status)
                VALUES (?, ?, ?, ?, ?, 'active')
            ");
            $stmt->execute([$fullname, $email, password_hash($password, PASSWORD_DEFAULT), $phone, $user_type]);
            $userId = $pdo->lastInsertId();

            $stmtUser = $pdo->prepare("SELECT * FROM users WHERE id = ?");
            $stmtUser->execute([$userId]);
            $createdUser = $stmtUser->fetch();
            unset($createdUser['password']);

            // If registering as a salon owner and provided salon details
            $createdSalon = null;
            if ($user_type === 'salon_owner' && !empty($input['salon_name'])) {
                $stmtSalon = $pdo->prepare("
                    INSERT INTO salons (
                        owner_id, salon_name, address, phone, email, description,
                        category_id, category_name, verification_status, is_active
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Nail Services', 'pending', 1)
                ");
                $stmtSalon->execute([
                    $userId,
                    $input['salon_name'],
                    $input['salon_address'] ?? 'Metro Manila',
                    $input['salon_phone'] ?? $phone,
                    $email,
                    $input['salon_description'] ?? 'Modern nail care and beauty studio',
                    $input['salon_category_id'] ?? 1
                ]);
                $salonId = $pdo->lastInsertId();
                $stmtGetSalon = $pdo->prepare("SELECT * FROM salons WHERE id = ?");
                $stmtGetSalon->execute([$salonId]);
                $createdSalon = $stmtGetSalon->fetch();
            }

            sendResponse([
                'success' => true,
                'user' => $createdUser,
                'salon' => $createdSalon
            ], 201);
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
    }
} elseif ($method === 'GET') {
    // List users (admin only / system users)
    try {
        $stmt = $pdo->query("SELECT id, fullname, email, phone, user_type, avatar, status, created_at FROM users ORDER BY id ASC");
        sendResponse($stmt->fetchAll());
    } catch (Exception $e) {
        sendError($e->getMessage(), 500);
    }
} else {
    sendError('Method not allowed', 405);
}
?>
