<?php
@session_start();
require_once __DIR__ . '/../includes/functions.php';

$db = getDB();
$input = json_decode(file_get_contents('php://input'), true) ?: [];
$_POST = array_merge($_POST, $input);
$action = $_REQUEST['action'] ?? $input['action'] ?? '';

if (!isset($_SESSION['user_id'])) {
    jsonResponse(['error' => 'Not authenticated'], 401);
}

$userId = $_SESSION['user_id'];

switch ($action) {
    case 'stats':
        $stmt = $db->prepare("SELECT COUNT(DISTINCT book_id) as books_read FROM reading_progress WHERE user_id = ? AND progress_percent > 0");
        $stmt->execute([$userId]);
        $booksRead = (int)$stmt->fetch()['books_read'];

        $stmt = $db->prepare("SELECT COUNT(*) as in_progress FROM reading_progress WHERE user_id = ? AND progress_percent > 0 AND progress_percent < 100");
        $stmt->execute([$userId]);
        $inProgress = (int)$stmt->fetch()['in_progress'];

        $stmt = $db->prepare("SELECT COUNT(*) as bookmarks FROM bookmarks WHERE user_id = ?");
        $stmt->execute([$userId]);
        $bookmarks = (int)$stmt->fetch()['bookmarks'];

        $stmt = $db->prepare("SELECT COUNT(*) as notifications FROM notifications WHERE user_id = ? AND is_read = 0");
        $stmt->execute([$userId]);
        $notifications = (int)$stmt->fetch()['notifications'];

        jsonResponse([
            'booksRead' => $booksRead,
            'inProgress' => $inProgress,
            'bookmarks' => $bookmarks,
            'notifications' => $notifications
        ]);

    case 'continue-reading':
        $stmt = $db->prepare("SELECT rp.*, b.title as book_title, b.slug as book_slug, b.thumbnail, b.subject, ch.title as chapter_title FROM reading_progress rp JOIN books b ON rp.book_id = b.id LEFT JOIN chapters ch ON rp.chapter_id = ch.id WHERE rp.user_id = ? ORDER BY rp.last_read_at DESC LIMIT 10");
        $stmt->execute([$userId]);
        $progress = $stmt->fetchAll();
        jsonResponse(['data' => $progress]);

    default:
        jsonResponse(['error' => 'Invalid action'], 400);
}
