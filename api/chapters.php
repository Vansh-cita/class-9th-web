<?php
@session_start();
require_once __DIR__ . '/../includes/functions.php';

$db = getDB();
$action = $_REQUEST['action'] ?? '';

$isAdmin = isset($_SESSION['role']) && $_SESSION['role'] === 'admin';

switch ($action) {
    case 'list':
        $bookId = (int)($_GET['book_id'] ?? 0);
        if (!$bookId) {
            jsonResponse(['error' => 'Book ID is required'], 400);
        }

        $chapters = getChapters($bookId);
        jsonResponse(['success' => true, 'chapters' => $chapters]);

    case 'get':
        $id = (int)($_GET['id'] ?? 0);
        if (!$id) {
            jsonResponse(['error' => 'Chapter ID is required'], 400);
        }

        $stmt = $db->prepare("SELECT c.*, b.title as book_title, b.slug as book_slug FROM chapters c JOIN books b ON c.book_id = b.id WHERE c.id = ?");
        $stmt->execute([$id]);
        $chapter = $stmt->fetch();

        if (!$chapter) {
            jsonResponse(['error' => 'Chapter not found'], 404);
        }

        jsonResponse(['success' => true, 'chapter' => $chapter]);

    case 'create':
        if (!$isAdmin) {
            jsonResponse(['error' => 'Unauthorized'], 403);
        }

        $bookId = (int)($_POST['book_id'] ?? 0);
        $title = trim($_POST['title'] ?? '');
        $chapterNumber = (int)($_POST['chapter_number'] ?? 0);
        $content = $_POST['content'] ?? '';

        if (!$bookId || empty($title) || !$chapterNumber) {
            jsonResponse(['error' => 'Book ID, title, and chapter number are required'], 400);
        }

        $stmt = $db->prepare("SELECT id FROM books WHERE id = ?");
        $stmt->execute([$bookId]);
        if (!$stmt->fetch()) {
            jsonResponse(['error' => 'Book not found'], 404);
        }

        $pdfFile = null;
        if (isset($_FILES['pdf_file']) && $_FILES['pdf_file']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = __DIR__ . '/../uploads/chapters/';
            $result = uploadFile($_FILES['pdf_file'], $uploadDir, ['pdf']);
            if (isset($result['error'])) {
                jsonResponse(['error' => $result['error']], 400);
            }
            $pdfFile = $result['filename'];
        }

        $stmt = $db->prepare("INSERT INTO chapters (book_id, title, chapter_number, pdf_file, content) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$bookId, $title, $chapterNumber, $pdfFile, $content]);

        $chapterId = $db->lastInsertId();
        logActivity($_SESSION['user_id'], 'create_chapter', "Created chapter: {$title} for book ID: {$bookId}");

        jsonResponse(['success' => true, 'message' => 'Chapter created', 'id' => $chapterId], 201);

    case 'update':
        if (!$isAdmin) {
            jsonResponse(['error' => 'Unauthorized'], 403);
        }

        $id = (int)($_POST['id'] ?? 0);
        if (!$id) {
            jsonResponse(['error' => 'Chapter ID is required'], 400);
        }

        $stmt = $db->prepare("SELECT * FROM chapters WHERE id = ?");
        $stmt->execute([$id]);
        $chapter = $stmt->fetch();
        if (!$chapter) {
            jsonResponse(['error' => 'Chapter not found'], 404);
        }

        $title = trim($_POST['title'] ?? $chapter['title']);
        $chapterNumber = isset($_POST['chapter_number']) ? (int)$_POST['chapter_number'] : $chapter['chapter_number'];
        $content = $_POST['content'] ?? $chapter['content'];

        $pdfFile = $chapter['pdf_file'];
        if (isset($_FILES['pdf_file']) && $_FILES['pdf_file']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = __DIR__ . '/../uploads/chapters/';
            $result = uploadFile($_FILES['pdf_file'], $uploadDir, ['pdf']);
            if (isset($result['error'])) {
                jsonResponse(['error' => $result['error']], 400);
            }
            if ($chapter['pdf_file']) {
                deleteFile($uploadDir . $chapter['pdf_file']);
            }
            $pdfFile = $result['filename'];
        }

        $stmt = $db->prepare("UPDATE chapters SET title = ?, chapter_number = ?, pdf_file = ?, content = ? WHERE id = ?");
        $stmt->execute([$title, $chapterNumber, $pdfFile, $content, $id]);

        logActivity($_SESSION['user_id'], 'update_chapter', "Updated chapter ID: {$id}");
        jsonResponse(['success' => true, 'message' => 'Chapter updated']);

    case 'delete':
        if (!$isAdmin) {
            jsonResponse(['error' => 'Unauthorized'], 403);
        }

        $id = (int)($_POST['id'] ?? 0);
        if (!$id) {
            jsonResponse(['error' => 'Chapter ID is required'], 400);
        }

        $stmt = $db->prepare("SELECT * FROM chapters WHERE id = ?");
        $stmt->execute([$id]);
        $chapter = $stmt->fetch();
        if (!$chapter) {
            jsonResponse(['error' => 'Chapter not found'], 404);
        }

        if ($chapter['pdf_file']) {
            deleteFile(__DIR__ . '/../uploads/chapters/' . $chapter['pdf_file']);
        }

        $stmt = $db->prepare("DELETE FROM chapters WHERE id = ?");
        $stmt->execute([$id]);

        logActivity($_SESSION['user_id'], 'delete_chapter', "Deleted chapter ID: {$id}");
        jsonResponse(['success' => true, 'message' => 'Chapter deleted']);

    case 'reorder':
        if (!$isAdmin) {
            jsonResponse(['error' => 'Unauthorized'], 403);
        }

        $items = $_POST['items'] ?? [];
        if (empty($items) || !is_array($items)) {
            jsonResponse(['error' => 'Items array is required'], 400);
        }

        $stmt = $db->prepare("UPDATE chapters SET chapter_number = ? WHERE id = ?");
        foreach ($items as $item) {
            if (isset($item['id']) && isset($item['chapter_number'])) {
                $stmt->execute([(int)$item['chapter_number'], (int)$item['id']]);
            }
        }

        logActivity($_SESSION['user_id'], 'reorder_chapters', 'Chapters reordered');
        jsonResponse(['success' => true, 'message' => 'Chapters reordered']);

    default:
        jsonResponse(['error' => 'Invalid action'], 400);
}
