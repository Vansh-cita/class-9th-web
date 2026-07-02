<?php
function getDB() {
    return Database::getInstance()->getConnection();
}

function sanitize($input) {
    return htmlspecialchars(strip_tags(trim($input)), ENT_QUOTES, 'UTF-8');
}

function validateInput($data, $rules) {
    $errors = [];
    foreach ($rules as $field => $rule) {
        $value = $data[$field] ?? '';
        if (strpos($rule, 'required') !== false && empty($value)) {
            $errors[$field] = ucfirst($field) . ' is required';
        }
        if (strpos($rule, 'email') !== false && !empty($value) && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
            $errors[$field] = 'Invalid email format';
        }
        if (preg_match('/min:(\d+)/', $rule, $m) && strlen($value) < (int)$m[1]) {
            $errors[$field] = ucfirst($field) . ' must be at least ' . $m[1] . ' characters';
        }
        if (preg_match('/max:(\d+)/', $rule, $m) && strlen($value) > (int)$m[1]) {
            $errors[$field] = ucfirst($field) . ' must not exceed ' . $m[1] . ' characters';
        }
    }
    return $errors;
}

function jsonResponse($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function getCurrentUser() {
    if (!isset($_SESSION['user_id'])) return null;
    $stmt = getDB()->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    return $stmt->fetch();
}

function getSetting($key, $default = '') {
    $stmt = getDB()->prepare("SELECT setting_value FROM settings WHERE setting_key = ?");
    $stmt->execute([$key]);
    $row = $stmt->fetch();
    return $row ? $row['setting_value'] : $default;
}

function getBooks($limit = 10, $offset = 0, $categoryId = null) {
    $sql = "SELECT b.*, c.name as category_name FROM books b LEFT JOIN categories c ON b.category_id = c.id";
    $params = [];
    if ($categoryId) {
        $sql .= " WHERE b.category_id = ?";
        $params[] = $categoryId;
    }
    $sql .= " ORDER BY b.created_at DESC LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;
    $stmt = getDB()->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}

function getBook($id) {
    $stmt = getDB()->prepare("SELECT b.*, c.name as category_name FROM books b LEFT JOIN categories c ON b.category_id = c.id WHERE b.id = ?");
    $stmt->execute([$id]);
    return $stmt->fetch();
}

function getChapters($bookId) {
    $stmt = getDB()->prepare("SELECT * FROM chapters WHERE book_id = ? ORDER BY chapter_number ASC");
    $stmt->execute([$bookId]);
    return $stmt->fetchAll();
}

function getCategories($includeBookCount = true) {
    if ($includeBookCount) {
        $stmt = getDB()->prepare("SELECT c.*, (SELECT COUNT(*) FROM books b WHERE b.category_id = c.id) as book_count FROM categories c ORDER BY c.name ASC");
    } else {
        $stmt = getDB()->prepare("SELECT * FROM categories ORDER BY name ASC");
    }
    $stmt->execute();
    return $stmt->fetchAll();
}

function getBookmarks($userId) {
    $stmt = getDB()->prepare("SELECT bm.*, bk.title as book_title, bk.slug as book_slug, ch.title as chapter_title FROM bookmarks bm LEFT JOIN books bk ON bm.book_id = bk.id LEFT JOIN chapters ch ON bm.chapter_id = ch.id WHERE bm.user_id = ? ORDER BY bm.created_at DESC");
    $stmt->execute([$userId]);
    return $stmt->fetchAll();
}

function getReadingProgress($userId, $bookId) {
    $stmt = getDB()->prepare("SELECT * FROM reading_progress WHERE user_id = ? AND book_id = ?");
    $stmt->execute([$userId, $bookId]);
    return $stmt->fetch();
}

function getAnnouncements($limit = 5) {
    $stmt = getDB()->prepare("SELECT * FROM announcements ORDER BY is_pinned DESC, created_at DESC LIMIT ?");
    $stmt->execute([$limit]);
    return $stmt->fetchAll();
}

function getNotifications($userId, $limit = 10) {
    $stmt = getDB()->prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?");
    $stmt->execute([$userId, $limit]);
    return $stmt->fetchAll();
}

function getUnreadNotificationCount($userId) {
    $stmt = getDB()->prepare("SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0");
    $stmt->execute([$userId]);
    return $stmt->fetch()['count'];
}

function createNotification($userId, $title, $message = '', $type = 'info') {
    $stmt = getDB()->prepare("INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)");
    return $stmt->execute([$userId, $title, $message, $type]);
}

function logActivity($userId, $action, $details = '') {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
    $stmt = getDB()->prepare("INSERT INTO logs (user_id, action, details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)");
    return $stmt->execute([$userId, $action, $details, $ip, $ua]);
}

function uploadFile($file, $targetDir, $allowedTypes = ['pdf','jpg','jpeg','png','gif','webp']) {
    if ($file['error'] !== UPLOAD_ERR_OK) {
        return ['error' => 'Upload failed with error code ' . $file['error']];
    }
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, $allowedTypes)) {
        return ['error' => 'File type not allowed: ' . $ext];
    }
    $maxSize = 100 * 1024 * 1024;
    if ($file['size'] > $maxSize) {
        return ['error' => 'File too large. Maximum 100MB'];
    }
    $filename = uniqid() . '_' . time() . '.' . $ext;
    $targetPath = rtrim($targetDir, '/') . '/' . $filename;
    if (!is_dir($targetDir)) {
        mkdir($targetDir, 0755, true);
    }
    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        return ['success' => true, 'filename' => $filename, 'path' => $targetPath];
    }
    return ['error' => 'Failed to move uploaded file'];
}

function deleteFile($filePath) {
    if (file_exists($filePath) && is_file($filePath)) {
        return unlink($filePath);
    }
    return false;
}

function slugify($text) {
    $text = preg_replace('~[^\pL\d]+~u', '-', $text);
    $text = iconv('utf-8', 'us-ascii//TRANSLIT', $text);
    $text = preg_replace('~[^-\w]+~', '', $text);
    $text = trim($text, '-');
    $text = preg_replace('~-+~', '-', $text);
    $text = strtolower($text);
    return empty($text) ? 'n-a' : $text;
}

function timeAgo($datetime) {
    $time = strtotime($datetime);
    $diff = time() - $time;
    if ($diff < 60) return 'just now';
    if ($diff < 3600) return floor($diff / 60) . 'm ago';
    if ($diff < 86400) return floor($diff / 3600) . 'h ago';
    if ($diff < 604800) return floor($diff / 86400) . 'd ago';
    return date('M j, Y', $time);
}

function truncateText($text, $length = 100) {
    if (strlen($text) <= $length) return $text;
    return substr($text, 0, $length) . '...';
}

function isHiddenPageAccessible($pageId) {
    if (!isset($_SESSION['user_id'])) return false;
    $stmt = getDB()->prepare("SELECT * FROM user_access WHERE user_id = ? AND page_id = ?");
    $stmt->execute([$_SESSION['user_id'], $pageId]);
    return (bool)$stmt->fetch();
}


