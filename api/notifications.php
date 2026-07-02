<?php
@session_start();
require_once __DIR__ . '/../includes/functions.php';

$db = getDB();
$action = $_REQUEST['action'] ?? '';

$isAdmin = isset($_SESSION['role']) && $_SESSION['role'] === 'admin';

switch ($action) {
    case 'list':
        if (!isset($_SESSION['user_id'])) {
            jsonResponse(['error' => 'Not authenticated'], 401);
        }

        $limit = max(1, min(100, (int)($_GET['limit'] ?? 20)));
        $notifications = getNotifications($_SESSION['user_id'], $limit);

        jsonResponse(['success' => true, 'notifications' => $notifications]);

    case 'mark_read':
        if (!isset($_SESSION['user_id'])) {
            jsonResponse(['error' => 'Not authenticated'], 401);
        }

        $id = (int)($_POST['id'] ?? 0);
        if (!$id) {
            jsonResponse(['error' => 'Notification ID is required'], 400);
        }

        $stmt = $db->prepare("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $_SESSION['user_id']]);

        jsonResponse(['success' => true, 'message' => 'Notification marked as read']);

    case 'mark_all_read':
        if (!isset($_SESSION['user_id'])) {
            jsonResponse(['error' => 'Not authenticated'], 401);
        }

        $stmt = $db->prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0");
        $stmt->execute([$_SESSION['user_id']]);

        jsonResponse(['success' => true, 'message' => 'All notifications marked as read']);

    case 'unread_count':
        if (!isset($_SESSION['user_id'])) {
            jsonResponse(['unread_count' => 0]);
            exit;
        }

        $count = getUnreadNotificationCount($_SESSION['user_id']);
        jsonResponse(['success' => true, 'unread_count' => (int)$count]);

    case 'create':
        if (!$isAdmin) {
            jsonResponse(['error' => 'Unauthorized'], 403);
        }

        $userId = (int)($_POST['user_id'] ?? 0);
        $title = trim($_POST['title'] ?? '');
        $message = trim($_POST['message'] ?? '');
        $type = trim($_POST['type'] ?? 'info');

        if (empty($title)) {
            jsonResponse(['error' => 'Title is required'], 400);
        }

        if ($userId) {
            createNotification($userId, $title, $message, $type);
        } else {
            $stmt = $db->prepare("SELECT id FROM users WHERE role = 'student'");
            $stmt->execute();
            $users = $stmt->fetchAll();
            foreach ($users as $user) {
                createNotification($user['id'], $title, $message, $type);
            }
        }

        logActivity($_SESSION['user_id'], 'create_notification', "Created notification: {$title}");
        jsonResponse(['success' => true, 'message' => 'Notification created'], 201);

    default:
        jsonResponse(['error' => 'Invalid action'], 400);
}
