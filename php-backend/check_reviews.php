<?php
require_once __DIR__ . '/config/db.php';

try {
    $stmt = $pdo->query("SELECT * FROM reviews");
    $reviews = $stmt->fetchAll();
    
    echo json_encode([
        'count' => count($reviews),
        'reviews' => $reviews
    ]);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
