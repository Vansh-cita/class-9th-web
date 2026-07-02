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
    case 'list':
        $bookmarks = getBookmarks($userId);
        jsonResponse(['success' => true, 'bookmarks' => $bookmarks]);

    case 'add':
        $bookId = (int)($_POST['book_id'] ?? 0);
        $chapterId = !empty($_POST['chapter_id']) ? (int)$_POST['chapter_id'] : null;
        $page = max(1, (int)($_POST['page'] ?? 1));
        $note = trim($_POST['note'] ?? '');

        if (!$bookId) {
            jsonResponse(['error' => 'Book ID is required'], 400);
        }

        $stmt = $db->prepare("SELECT id FROM books WHERE id = ?");
        $stmt->execute([$bookId]);
        if (!$stmt->fetch()) {
            jsonResponse(['error' => 'Book not found'], 404);
        }

        $stmt = $db->prepare("SELECT id FROM bookmarks WHERE user_id = ? AND book_id = ? AND chapter_id <=> ? AND page = ?");
        $stmt->execute([$userId, $bookId, $chapterId, $page]);
        if ($stmt->fetch()) {
            jsonResponse(['error' => 'Bookmark already exists'], 409);
        }

        $stmt = $db->prepare("INSERT INTO bookmarks (user_id, book_id, chapter_id, page, note) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$userId, $bookId, $chapterId, $page, $note]);

        $bookmarkId = $db->lastInsertId();
        jsonResponse(['success' => true, 'message' => 'Bookmark added', 'id' => $bookmarkId], 201);

    case 'remove':
        $id = (int)($_POST['id'] ?? 0);
        if (!$id) {
            jsonResponse(['error' => 'Bookmark ID is required'], 400);
        }

        $stmt = $db->prepare("SELECT id FROM bookmarks WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);
        if (!$stmt->fetch()) {
            jsonResponse(['error' => 'Bookmark not found or access denied'], 404);
        }

        $stmt = $db->prepare("DELETE FROM bookmarks WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);

        jsonResponse(['success' => true, 'message' => 'Bookmark removed']);

    case 'check':
        $bookId = (int)($_GET['book_id'] ?? 0);
        if (!$bookId) {
            jsonResponse(['error' => 'Book ID is required'], 400);
        }

        $stmt = $db->prepare("SELECT id FROM bookmarks WHERE user_id = ? AND book_id = ?");
        $stmt->execute([$userId, $bookId]);
        $bookmark = $stmt->fetch();

        jsonResponse([
            'success' => true,
            'is_bookmarked' => (bool)$bookmark,
            'bookmark' => $bookmark ?: null
        ]);

    default:
        jsonResponse(['error' => 'Invalid action'], 400);
}
