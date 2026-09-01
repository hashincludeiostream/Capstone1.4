<?php
require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

if ($method === 'GET') {
    if ($id) {
        // Get single user
        try {
            $stmt = $pdo->prepare("SELECT id, fullname, email, phone, user_type, avatar, status, created_at FROM users WHERE id = ?");
            $stmt->execute([$id]);
            $user = $stmt->fetch();
            
            if (!$user) {
                sendError('User not found', 404);
            }
            
            sendResponse($user);
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
    } else {
        // List all users (admin only)
        try {
            $stmt = $pdo->query("SELECT id, fullname, email, phone, user_type, avatar, status, created_at FROM users ORDER BY id ASC");
            sendResponse($stmt->fetchAll());
        } catch (Exception $e) {
            sendError($e->getMessage(), 500);
        }
    }
} elseif ($method === 'PUT') {
    if (!$id) {
        sendError('User ID is required', 400);
    }

    $input = getJsonInput();
    
    try {
        // Check if user exists
        $stmtCheck = $pdo->prepare("SELECT id FROM users WHERE id = ?");
        $stmtCheck->execute([$id]);
        if (!$stmtCheck->fetch()) {
            sendError('User not found', 404);
        }

        // Build update query dynamically based on provided fields
        $updateFields = [];
        $params = [];
        
        if (isset($input['fullname'])) {
            $updateFields[] = "fullname = ?";
            $params[] = $input['fullname'];
        }
        
        if (isset($input['email'])) {
            // Check if email is already taken by another user
            $stmtEmail = $pdo->prepare("SELECT id FROM users WHERE LOWER(email) = LOWER(?) AND id != ?");
            $stmtEmail->execute([$input['email'], $id]);
            if ($stmtEmail->fetch()) {
                sendError('Email address is already in use by another account', 400);
            }
            $updateFields[] = "email = ?";
            $params[] = $input['email'];
        }
        
        if (isset($input['phone'])) {
            $updateFields[] = "phone = ?";
            $params[] = $input['phone'];
        }
        
        if (isset($input['avatar'])) {
            $updateFields[] = "avatar = ?";
            $params[] = $input['avatar'];
        }
        
        if (empty($updateFields)) {
            sendError('No valid fields to update', 400);
        }

        $params[] = $id; // Add ID for WHERE clause
        
        $sql = "UPDATE users SET " . implode(', ', $updateFields) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        // Fetch updated user
        $stmtUser = $pdo->prepare("SELECT id, fullname, email, phone, user_type, avatar, status, created_at FROM users WHERE id = ?");
        $stmtUser->execute([$id]);
        $updatedUser = $stmtUser->fetch();

        sendResponse($updatedUser);
    } catch (Exception $e) {
        sendError($e->getMessage(), 500);
    }
} elseif ($method === 'PATCH') {
    if (!$id) {
        sendError('User ID is required', 400);
    }

    $input = getJsonInput();
    
    try {
        // Handle status updates
        if (isset($input['status'])) {
            $validStatuses = ['active', 'suspended', 'inactive'];
            if (!in_array($input['status'], $validStatuses)) {
                sendError('Invalid status value', 400);
            }
            
            $stmt = $pdo->prepare("UPDATE users SET status = ? WHERE id = ?");
            $stmt->execute([$input['status'], $id]);
            
            sendResponse(['success' => true, 'message' => 'User status updated']);
        }
        
        sendError('No valid PATCH operation specified', 400);
    } catch (Exception $e) {
        sendError($e->getMessage(), 500);
    }
} elseif ($method === 'DELETE') {
    if (!$id) {
        sendError('User ID is required', 400);
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$id]);
        
        sendResponse(['success' => true, 'message' => 'User deleted']);
    } catch (Exception $e) {
        sendError($e->getMessage(), 500);
    }
} else {
    sendError('Method not allowed', 405);
}
?>