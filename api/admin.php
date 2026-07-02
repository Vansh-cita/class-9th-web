<?php
@session_start();
require_once __DIR__ . '/../includes/functions.php';

$db = getDB();
$action = $_REQUEST['action'] ?? '';

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    jsonResponse(['error' => 'Unauthorized'], 403);
}

switch ($action) {
    case 'stats':
        $stats = [];

        $stmt = $db->query("SELECT COUNT(*) as count FROM books");
        $stats['total_books'] = (int)$stmt->fetch()['count'];

        $stmt = $db->query("SELECT COUNT(*) as count FROM users");
        $stats['total_users'] = (int)$stmt->fetch()['count'];

        $stmt = $db->query("SELECT COUNT(*) as count FROM categories");
        $stats['total_categories'] = (int)$stmt->fetch()['count'];

        $stmt = $db->query("SELECT COUNT(*) as count FROM uploads");
        $stats['total_uploads'] = (int)$stmt->fetch()['count'];

        $stmt = $db->query("SELECT COUNT(*) as count FROM chapters");
        $stats['total_chapters'] = (int)$stmt->fetch()['count'];

        $stmt = $db->query("SELECT COUNT(*) as count FROM bookmarks");
        $stats['total_bookmarks'] = (int)$stmt->fetch()['count'];

        $stmt = $db->query("SELECT u.id, u.username, u.role, u.created_at FROM users u ORDER BY u.created_at DESC LIMIT 5");
        $stats['recent_users'] = $stmt->fetchAll();

        $stmt = $db->query("SELECT u.id, u.file_name, u.file_type, u.file_size, u.created_at, u2.username FROM uploads u LEFT JOIN users u2 ON u.user_id = u2.id ORDER BY u.created_at DESC LIMIT 5");
        $stats['recent_uploads'] = $stmt->fetchAll();

        $stmt = $db->query("SELECT c.name, COUNT(b.id) as book_count FROM categories c LEFT JOIN books b ON c.id = b.category_id GROUP BY c.id, c.name ORDER BY book_count DESC");
        $stats['books_by_category'] = $stmt->fetchAll();

        jsonResponse(['success' => true, 'stats' => $stats]);

    case 'users':
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = max(1, min(100, (int)($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;
        $search = trim($_GET['search'] ?? '');

        $sql = "SELECT u.*, (SELECT COUNT(*) FROM bookmarks bm WHERE bm.user_id = u.id) as bookmark_count, (SELECT COUNT(*) FROM reading_progress rp WHERE rp.user_id = u.id) as progress_count FROM users u WHERE 1=1";
        $params = [];

        if ($search) {
            $sql .= " AND (u.username LIKE ? OR u.role_number LIKE ? OR u.school_name LIKE ?)";
            $searchTerm = "%{$search}%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }

        $countStmt = $db->prepare(str_replace("u.*, (SELECT COUNT(*) FROM bookmarks bm WHERE bm.user_id = u.id) as bookmark_count, (SELECT COUNT(*) FROM reading_progress rp WHERE rp.user_id = u.id) as progress_count", "COUNT(*) as total", $sql));
        $countStmt->execute($params);
        $total = $countStmt->fetch()['total'];

        $sql .= " ORDER BY u.created_at DESC LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $users = $stmt->fetchAll();

        jsonResponse([
            'success' => true,
            'users' => $users,
            'total' => (int)$total,
            'page' => $page,
            'limit' => $limit,
            'total_pages' => ceil($total / $limit)
        ]);

    case 'update_user':
        $id = (int)($_POST['id'] ?? 0);
        if (!$id) {
            jsonResponse(['error' => 'User ID is required'], 400);
        }

        $stmt = $db->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$id]);
        if (!$stmt->fetch()) {
            jsonResponse(['error' => 'User not found'], 404);
        }

        $role = $_POST['role'] ?? '';
        $status = $_POST['status'] ?? '';

        $fields = [];
        $params = [];

        if ($role && in_array($role, ['student', 'admin'])) {
            $fields[] = "role = ?";
            $params[] = $role;
        }

        if (!empty($params)) {
            $params[] = $id;
            $stmt = $db->prepare("UPDATE users SET " . implode(', ', $fields) . " WHERE id = ?");
            $stmt->execute($params);
        }

        logActivity($_SESSION['user_id'], 'update_user', "Updated user ID: {$id}");
        jsonResponse(['success' => true, 'message' => 'User updated']);

    case 'delete_user':
        $id = (int)($_POST['id'] ?? 0);
        if (!$id) {
            jsonResponse(['error' => 'User ID is required'], 400);
        }

        if ($id === (int)$_SESSION['user_id']) {
            jsonResponse(['error' => 'Cannot delete your own account'], 403);
        }

        $stmt = $db->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$id]);
        if (!$stmt->fetch()) {
            jsonResponse(['error' => 'User not found'], 404);
        }

        $stmt = $db->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$id]);

        logActivity($_SESSION['user_id'], 'delete_user', "Deleted user ID: {$id}");
        jsonResponse(['success' => true, 'message' => 'User deleted']);

    case 'settings':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $settings = $_POST['settings'] ?? [];
            if (empty($settings) || !is_array($settings)) {
                jsonResponse(['error' => 'No settings provided'], 400);
            }

            $stmt = $db->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)");
            foreach ($settings as $key => $value) {
                $stmt->execute([sanitize($key), sanitize($value)]);
            }

            logActivity($_SESSION['user_id'], 'update_settings', 'Site settings updated');
            jsonResponse(['success' => true, 'message' => 'Settings saved']);
        } else {
            $stmt = $db->query("SELECT * FROM settings ORDER BY setting_key ASC");
            $settings = $stmt->fetchAll();

            $result = [];
            foreach ($settings as $s) {
                $result[$s['setting_key']] = $s['setting_value'];
            }

            jsonResponse(['success' => true, 'settings' => $result]);
        }

    case 'logs':
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = max(1, min(100, (int)($_GET['limit'] ?? 30)));
        $offset = ($page - 1) * $limit;
        $userId = $_GET['user_id'] ?? '';
        $actionFilter = trim($_GET['action'] ?? '');
        $dateFrom = trim($_GET['date_from'] ?? '');
        $dateTo = trim($_GET['date_to'] ?? '');

        $sql = "SELECT l.*, u.username FROM logs l LEFT JOIN users u ON l.user_id = u.id WHERE 1=1";
        $params = [];

        if ($userId) {
            $sql .= " AND l.user_id = ?";
            $params[] = (int)$userId;
        }

        if ($actionFilter) {
            $sql .= " AND l.action LIKE ?";
            $params[] = "%{$actionFilter}%";
        }

        if ($dateFrom) {
            $sql .= " AND l.created_at >= ?";
            $params[] = $dateFrom . ' 00:00:00';
        }

        if ($dateTo) {
            $sql .= " AND l.created_at <= ?";
            $params[] = $dateTo . ' 23:59:59';
        }

        $countStmt = $db->prepare(str_replace("l.*, u.username", "COUNT(*) as total", $sql));
        $countStmt->execute($params);
        $total = $countStmt->fetch()['total'];

        $sql .= " ORDER BY l.created_at DESC LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $logs = $stmt->fetchAll();

        jsonResponse([
            'success' => true,
            'logs' => $logs,
            'total' => (int)$total,
            'page' => $page,
            'limit' => $limit,
            'total_pages' => ceil($total / $limit)
        ]);

    case 'clear_logs':
        $db->exec("TRUNCATE TABLE logs");
        logActivity($_SESSION['user_id'], 'clear_logs', 'All activity logs cleared');
        jsonResponse(['success' => true, 'message' => 'All logs cleared']);

    case 'export_logs':
        $userId = $_GET['user_id'] ?? '';
        $actionFilter = trim($_GET['action'] ?? '');
        $dateFrom = trim($_GET['date_from'] ?? '');
        $dateTo = trim($_GET['date_to'] ?? '');

        $sql = "SELECT l.id, l.action, l.details, l.ip_address, l.user_agent, l.created_at, u.username FROM logs l LEFT JOIN users u ON l.user_id = u.id WHERE 1=1";
        $params = [];

        if ($userId) {
            $sql .= " AND l.user_id = ?";
            $params[] = (int)$userId;
        }

        if ($actionFilter) {
            $sql .= " AND l.action LIKE ?";
            $params[] = "%{$actionFilter}%";
        }

        if ($dateFrom) {
            $sql .= " AND l.created_at >= ?";
            $params[] = $dateFrom . ' 00:00:00';
        }

        if ($dateTo) {
            $sql .= " AND l.created_at <= ?";
            $params[] = $dateTo . ' 23:59:59';
        }

        $sql .= " ORDER BY l.created_at DESC";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $logs = $stmt->fetchAll();

        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="activity_logs_' . date('Y-m-d') . '.csv"');

        $output = fopen('php://output', 'w');
        fputcsv($output, ['ID', 'Username', 'Action', 'Details', 'IP Address', 'User Agent', 'Date']);

        foreach ($logs as $log) {
            fputcsv($output, [
                $log['id'],
                $log['username'] ?? 'Guest',
                $log['action'],
                $log['details'],
                $log['ip_address'],
                $log['user_agent'],
                $log['created_at']
            ]);
        }

        fclose($output);
        exit;

    default:
        jsonResponse(['error' => 'Invalid action'], 400);
}
