<?php
@session_start();
require_once __DIR__ . '/../includes/functions.php';

$db = getDB();
$action = $_REQUEST['action'] ?? '';

$isAdmin = isset($_SESSION['role']) && $_SESSION['role'] === 'admin';

switch ($action) {
    case 'list':
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = max(1, min(50, (int)($_GET['limit'] ?? 12)));
        $offset = ($page - 1) * $limit;
        $categoryId = $_GET['category_id'] ?? null;
        $search = trim($_GET['search'] ?? '');

        $sql = "SELECT b.*, c.name as category_name FROM books b LEFT JOIN categories c ON b.category_id = c.id WHERE 1=1";
        $params = [];

        if ($categoryId) {
            $sql .= " AND b.category_id = ?";
            $params[] = (int)$categoryId;
        }

        if ($search) {
            $sql .= " AND (b.title LIKE ? OR b.subject LIKE ? OR b.author LIKE ?)";
            $searchTerm = "%{$search}%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }

        $countSql = str_replace("b.*, c.name as category_name", "COUNT(*) as total", $sql);
        $countStmt = $db->prepare($countSql);
        $countStmt->execute($params);
        $total = $countStmt->fetch()['total'];

        $sql .= " ORDER BY b.created_at DESC LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $books = $stmt->fetchAll();

        jsonResponse([
            'success' => true,
            'books' => $books,
            'total' => (int)$total,
            'page' => $page,
            'limit' => $limit,
            'total_pages' => ceil($total / $limit)
        ]);

    case 'get':
        $id = (int)($_GET['id'] ?? 0);
        if (!$id) {
            jsonResponse(['error' => 'Book ID is required'], 400);
        }

        $stmt = $db->prepare("SELECT b.*, c.name as category_name FROM books b LEFT JOIN categories c ON b.category_id = c.id WHERE b.id = ?");
        $stmt->execute([$id]);
        $book = $stmt->fetch();

        if (!$book) {
            jsonResponse(['error' => 'Book not found'], 404);
        }

        $chapters = getChapters($id);

        $book['chapters'] = $chapters;
        jsonResponse(['success' => true, 'book' => $book]);

    case 'create':
        if (!$isAdmin) {
            jsonResponse(['error' => 'Unauthorized'], 403);
        }

        $title = trim($_POST['title'] ?? '');
        $description = trim($_POST['description'] ?? '');
        $subject = trim($_POST['subject'] ?? '');
        $language = trim($_POST['language'] ?? 'English');
        $categoryId = !empty($_POST['category_id']) ? (int)$_POST['category_id'] : null;
        $author = trim($_POST['author'] ?? 'NCERT');
        $isChapterWise = isset($_POST['is_chapter_wise']) ? (int)$_POST['is_chapter_wise'] : 0;

        if (empty($title)) {
            jsonResponse(['error' => 'Title is required'], 400);
        }

        $slug = slugify($title);

        $stmt = $db->prepare("SELECT id FROM books WHERE slug = ?");
        $stmt->execute([$slug]);
        if ($stmt->fetch()) {
            $slug = $slug . '-' . uniqid();
        }

        $stmt = $db->prepare("INSERT INTO books (title, slug, description, subject, language, category_id, author, is_chapter_wise) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$title, $slug, $description, $subject, $language, $categoryId, $author, $isChapterWise]);

        $bookId = $db->lastInsertId();
        logActivity($_SESSION['user_id'], 'create_book', "Created book: {$title}");

        jsonResponse(['success' => true, 'message' => 'Book created', 'id' => $bookId], 201);

    case 'update':
        if (!$isAdmin) {
            jsonResponse(['error' => 'Unauthorized'], 403);
        }

        $id = (int)($_POST['id'] ?? 0);
        if (!$id) {
            jsonResponse(['error' => 'Book ID is required'], 400);
        }

        $stmt = $db->prepare("SELECT * FROM books WHERE id = ?");
        $stmt->execute([$id]);
        $book = $stmt->fetch();
        if (!$book) {
            jsonResponse(['error' => 'Book not found'], 404);
        }

        $fields = [];
        $params = [];
        $allowedFields = ['title', 'description', 'subject', 'language', 'author', 'is_chapter_wise'];
        $numericFields = ['category_id'];

        foreach ($_POST as $key => $value) {
            if (in_array($key, $allowedFields)) {
                $fields[] = "{$key} = ?";
                $params[] = trim($value);
            }
            if (in_array($key, $numericFields)) {
                $fields[] = "{$key} = ?";
                $params[] = !empty($value) ? (int)$value : null;
            }
        }

        if (empty($fields)) {
            jsonResponse(['error' => 'No fields to update'], 400);
        }

        if (isset($_POST['title']) && trim($_POST['title']) !== $book['title']) {
            $newSlug = slugify(trim($_POST['title']));
            $slugCheck = $db->prepare("SELECT id FROM books WHERE slug = ? AND id != ?");
            $slugCheck->execute([$newSlug, $id]);
            if (!$slugCheck->fetch()) {
                $fields[] = "slug = ?";
                $params[] = $newSlug;
            }
        }

        $params[] = $id;
        $sql = "UPDATE books SET " . implode(', ', $fields) . " WHERE id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        logActivity($_SESSION['user_id'], 'update_book', "Updated book ID: {$id}");
        jsonResponse(['success' => true, 'message' => 'Book updated']);

    case 'delete':
        if (!$isAdmin) {
            jsonResponse(['error' => 'Unauthorized'], 403);
        }

        $id = (int)($_POST['id'] ?? 0);
        if (!$id) {
            jsonResponse(['error' => 'Book ID is required'], 400);
        }

        $stmt = $db->prepare("SELECT * FROM books WHERE id = ?");
        $stmt->execute([$id]);
        $book = $stmt->fetch();
        if (!$book) {
            jsonResponse(['error' => 'Book not found'], 404);
        }

        if ($book['thumbnail'] && $book['thumbnail'] !== 'default-book.png') {
            deleteFile(__DIR__ . '/../uploads/thumbnails/' . $book['thumbnail']);
        }

        $chapters = getChapters($id);
        foreach ($chapters as $chapter) {
            if ($chapter['pdf_file']) {
                deleteFile(__DIR__ . '/../uploads/' . $chapter['pdf_file']);
            }
        }

        $stmt = $db->prepare("DELETE FROM books WHERE id = ?");
        $stmt->execute([$id]);

        logActivity($_SESSION['user_id'], 'delete_book', "Deleted book ID: {$id}");
        jsonResponse(['success' => true, 'message' => 'Book deleted']);

    case 'upload_thumbnail':
        if (!$isAdmin) {
            jsonResponse(['error' => 'Unauthorized'], 403);
        }

        $id = (int)($_POST['id'] ?? 0);
        if (!$id) {
            jsonResponse(['error' => 'Book ID is required'], 400);
        }

        if (!isset($_FILES['thumbnail'])) {
            jsonResponse(['error' => 'No file uploaded'], 400);
        }

        $uploadDir = __DIR__ . '/../uploads/thumbnails/';
        $result = uploadFile($_FILES['thumbnail'], $uploadDir, ['jpg', 'jpeg', 'png', 'gif', 'webp']);

        if (isset($result['error'])) {
            jsonResponse(['error' => $result['error']], 400);
        }

        $stmt = $db->prepare("SELECT thumbnail FROM books WHERE id = ?");
        $stmt->execute([$id]);
        $oldThumb = $stmt->fetch()['thumbnail'];

        if ($oldThumb && $oldThumb !== 'default-book.png') {
            deleteFile($uploadDir . $oldThumb);
        }

        $stmt = $db->prepare("UPDATE books SET thumbnail = ? WHERE id = ?");
        $stmt->execute([$result['filename'], $id]);

        logActivity($_SESSION['user_id'], 'upload_thumbnail', "Uploaded thumbnail for book ID: {$id}");
        jsonResponse(['success' => true, 'message' => 'Thumbnail uploaded', 'filename' => $result['filename']]);

    case 'recent':
        $limit = max(1, min(50, (int)($_GET['limit'] ?? 6)));

        $stmt = $db->prepare("SELECT b.*, c.name as category_name FROM books b LEFT JOIN categories c ON b.category_id = c.id ORDER BY b.created_at DESC LIMIT ?");
        $stmt->execute([$limit]);
        $books = $stmt->fetchAll();

        jsonResponse(['success' => true, 'books' => $books]);

    default:
        jsonResponse(['error' => 'Invalid action'], 400);
}
