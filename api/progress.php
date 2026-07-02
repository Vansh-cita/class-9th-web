<?php
@session_start();
require_once __DIR__ . '/../includes/functions.php';

$db = getDB();
$action = $_REQUEST['action'] ?? '';

if (!isset($_SESSION['user_id'])) {
    jsonResponse(['error' => 'Not authenticated'], 401);
}

$userId = $_SESSION['user_id'];

switch ($action) {
    case 'get':
        $bookId = (int)($_GET['book_id'] ?? 0);
        if (!$bookId) {
            jsonResponse(['error' => 'Book ID is required'], 400);
        }

        $progress = getReadingProgress($userId, $bookId);
        jsonResponse(['success' => true, 'progress' => $progress ?: null]);

    case 'save':
        $bookId = (int)($_POST['book_id'] ?? 0);
        $chapterId = !empty($_POST['chapter_id']) ? (int)$_POST['chapter_id'] : null;
        $lastPage = max(1, (int)($_POST['last_page'] ?? 1));
        $totalPages = max(0, (int)($_POST['total_pages'] ?? 0));
        $progressPercent = min(100, max(0, (float)($_POST['progress_percent'] ?? 0)));

        if (!$bookId) {
            jsonResponse(['error' => 'Book ID is required'], 400);
        }

        $stmt = $db->prepare("SELECT id FROM books WHERE id = ?");
        $stmt->execute([$bookId]);
        if (!$stmt->fetch()) {
            jsonResponse(['error' => 'Book not found'], 404);
        }

        $stmt = $db->prepare("INSERT INTO reading_progress (user_id, book_id, chapter_id, last_page, total_pages, progress_percent) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE chapter_id = VALUES(chapter_id), last_page = VALUES(last_page), total_pages = VALUES(total_pages), progress_percent = VALUES(progress_percent)");
        $stmt->execute([$userId, $bookId, $chapterId, $lastPage, $totalPages, $progressPercent]);

        jsonResponse(['success' => true, 'message' => 'Progress saved']);

    case 'list':
        $stmt = $db->prepare("SELECT rp.*, b.title as book_title, b.slug as book_slug, b.thumbnail, ch.title as chapter_title FROM reading_progress rp JOIN books b ON rp.book_id = b.id LEFT JOIN chapters ch ON rp.chapter_id = ch.id WHERE rp.user_id = ? ORDER BY rp.last_read_at DESC");
        $stmt->execute([$userId]);
        $progress = $stmt->fetchAll();

        jsonResponse(['success' => true, 'progress' => $progress]);

    default:
        jsonResponse(['error' => 'Invalid action'], 400);
}
