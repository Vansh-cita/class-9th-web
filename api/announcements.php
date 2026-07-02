<?php
@session_start();
require_once __DIR__ . '/../includes/functions.php';

$db = getDB();
$action = $_REQUEST['action'] ?? '';

$isAdmin = isset($_SESSION['role']) && $_SESSION['role'] === 'admin';

switch ($action) {
    case 'list':
        $limit = max(1, min(50, (int)($_GET['limit'] ?? 10)));

        if ($isAdmin && isset($_GET['all'])) {
            $stmt = $db->prepare("SELECT a.*, u.username as created_by_name FROM announcements a LEFT JOIN users u ON a.created_by = u.id ORDER BY a.is_pinned DESC, a.created_at DESC LIMIT ?");
            $stmt->execute([$limit]);
        } else {
            $stmt = $db->prepare("SELECT a.*, u.username as created_by_name FROM announcements a LEFT JOIN users u ON a.created_by = u.id ORDER BY a.is_pinned DESC, a.created_at DESC LIMIT ?");
            $stmt->execute([$limit]);
        }

        $announcements = $stmt->fetchAll();
        jsonResponse(['success' => true, 'announcements' => $announcements]);

    case 'create':
        if (!$isAdmin) {
            jsonResponse(['error' => 'Unauthorized'], 403);
        }

        $title = trim($_POST['title'] ?? '');
        $content = trim($_POST['content'] ?? '');
        $type = trim($_POST['type'] ?? 'general');
        $isPinned = isset($_POST['is_pinned']) ? (int)$_POST['is_pinned'] : 0;

        if (empty($title) || empty($content)) {
            jsonResponse(['error' => 'Title and content are required'], 400);
        }

        $allowedTypes = ['general', 'academic', 'exam', 'event'];
        if (!in_array($type, $allowedTypes)) {
            $type = 'general';
        }

        $stmt = $db->prepare("INSERT INTO announcements (title, content, type, is_pinned, created_by) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$title, $content, $type, $isPinned, $_SESSION['user_id']]);

        $announcementId = $db->lastInsertId();
        logActivity($_SESSION['user_id'], 'create_announcement', "Created announcement: {$title}");

        jsonResponse(['success' => true, 'message' => 'Announcement created', 'id' => $announcementId], 201);

    case 'update':
        if (!$isAdmin) {
            jsonResponse(['error' => 'Unauthorized'], 403);
        }

        $id = (int)($_POST['id'] ?? 0);
        if (!$id) {
            jsonResponse(['error' => 'Announcement ID is required'], 400);
        }

        $stmt = $db->prepare("SELECT * FROM announcements WHERE id = ?");
        $stmt->execute([$id]);
        $announcement = $stmt->fetch();
        if (!$announcement) {
            jsonResponse(['error' => 'Announcement not found'], 404);
        }

        $title = trim($_POST['title'] ?? $announcement['title']);
        $content = trim($_POST['content'] ?? $announcement['content']);
        $type = trim($_POST['type'] ?? $announcement['type']);
        $isPinned = isset($_POST['is_pinned']) ? (int)$_POST['is_pinned'] : $announcement['is_pinned'];

        $allowedTypes = ['general', 'academic', 'exam', 'event'];
        if (!in_array($type, $allowedTypes)) {
            $type = $announcement['type'];
        }

        $stmt = $db->prepare("UPDATE announcements SET title = ?, content = ?, type = ?, is_pinned = ? WHERE id = ?");
        $stmt->execute([$title, $content, $type, $isPinned, $id]);

        logActivity($_SESSION['user_id'], 'update_announcement', "Updated announcement ID: {$id}");
        jsonResponse(['success' => true, 'message' => 'Announcement updated']);

    case 'delete':
        if (!$isAdmin) {
            jsonResponse(['error' => 'Unauthorized'], 403);
        }

        $id = (int)($_POST['id'] ?? 0);
        if (!$id) {
            jsonResponse(['error' => 'Announcement ID is required'], 400);
        }

        $stmt = $db->prepare("DELETE FROM announcements WHERE id = ?");
        $stmt->execute([$id]);

        logActivity($_SESSION['user_id'], 'delete_announcement', "Deleted announcement ID: {$id}");
        jsonResponse(['success' => true, 'message' => 'Announcement deleted']);

    case 'toggle_pin':
        if (!$isAdmin) {
            jsonResponse(['error' => 'Unauthorized'], 403);
        }

        $id = (int)($_POST['id'] ?? 0);
        if (!$id) {
            jsonResponse(['error' => 'Announcement ID is required'], 400);
        }

        $stmt = $db->prepare("SELECT id, is_pinned FROM announcements WHERE id = ?");
        $stmt->execute([$id]);
        $announcement = $stmt->fetch();
        if (!$announcement) {
            jsonResponse(['error' => 'Announcement not found'], 404);
        }

        $newPinned = $announcement['is_pinned'] ? 0 : 1;
        $stmt = $db->prepare("UPDATE announcements SET is_pinned = ? WHERE id = ?");
        $stmt->execute([$newPinned, $id]);

        logActivity($_SESSION['user_id'], 'toggle_announcement_pin', "Toggled pin for announcement ID: {$id}");
        jsonResponse(['success' => true, 'message' => 'Pin status toggled', 'is_pinned' => $newPinned]);

    default:
        jsonResponse(['error' => 'Invalid action'], 400);
}
