<?php
@session_start();
require_once __DIR__ . '/../includes/functions.php';

$db = getDB();
$action = $_REQUEST['action'] ?? '';

if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    jsonResponse(['error' => 'Unauthorized'], 403);
}

$userId = $_SESSION['user_id'];

switch ($action) {
    case 'upload':
        if (!isset($_FILES['file'])) {
            jsonResponse(['error' => 'No file uploaded'], 400);
        }

        $allowedTypes = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'zip', 'rar', 'mp4', 'mp3'];
        $uploadDir = __DIR__ . '/../uploads/files/';
        $result = uploadFile($_FILES['file'], $uploadDir, $allowedTypes);

        if (isset($result['error'])) {
            jsonResponse(['error' => $result['error']], 400);
        }

        $bookId = !empty($_POST['book_id']) ? (int)$_POST['book_id'] : null;
        $ext = strtolower(pathinfo($_FILES['file']['name'], PATHINFO_EXTENSION));

        $stmt = $db->prepare("INSERT INTO uploads (user_id, book_id, file_name, file_path, file_type, file_size) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $userId,
            $bookId,
            $_FILES['file']['name'],
            $result['path'],
            $ext,
            $_FILES['file']['size']
        ]);

        $uploadId = $db->lastInsertId();
        logActivity($userId, 'upload_file', "Uploaded file: {$_FILES['file']['name']}");

        jsonResponse(['success' => true, 'message' => 'File uploaded', 'id' => $uploadId, 'filename' => $result['filename']], 201);

    case 'list':
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = max(1, min(50, (int)($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;
        $type = $_GET['type'] ?? '';

        $sql = "SELECT u.*, u2.username FROM uploads u LEFT JOIN users u2 ON u.user_id = u2.id WHERE 1=1";
        $params = [];

        if ($type) {
            $sql .= " AND u.file_type = ?";
            $params[] = sanitize($type);
        }

        $countStmt = $db->prepare(str_replace("u.*, u2.username", "COUNT(*) as total", $sql));
        $countStmt->execute($params);
        $total = $countStmt->fetch()['total'];

        $sql .= " ORDER BY u.created_at DESC LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $uploads = $stmt->fetchAll();

        jsonResponse([
            'success' => true,
            'uploads' => $uploads,
            'total' => (int)$total,
            'page' => $page,
            'limit' => $limit,
            'total_pages' => ceil($total / $limit)
        ]);

    case 'delete':
        $id = (int)($_POST['id'] ?? 0);
        if (!$id) {
            jsonResponse(['error' => 'Upload ID is required'], 400);
        }

        $stmt = $db->prepare("SELECT * FROM uploads WHERE id = ?");
        $stmt->execute([$id]);
        $upload = $stmt->fetch();
        if (!$upload) {
            jsonResponse(['error' => 'Upload not found'], 404);
        }

        deleteFile($upload['file_path']);

        $stmt = $db->prepare("DELETE FROM uploads WHERE id = ?");
        $stmt->execute([$id]);

        logActivity($userId, 'delete_upload', "Deleted upload ID: {$id}");
        jsonResponse(['success' => true, 'message' => 'Upload deleted']);

    case 'upload_book_pdf':
        $bookId = (int)($_POST['book_id'] ?? 0);
        $chapterId = !empty($_POST['chapter_id']) ? (int)$_POST['chapter_id'] : null;

        if (!$bookId || !isset($_FILES['pdf_file'])) {
            jsonResponse(['error' => 'Book ID and PDF file are required'], 400);
        }

        $stmt = $db->prepare("SELECT id FROM books WHERE id = ?");
        $stmt->execute([$bookId]);
        if (!$stmt->fetch()) {
            jsonResponse(['error' => 'Book not found'], 404);
        }

        $uploadDir = __DIR__ . '/../uploads/books/';
        $result = uploadFile($_FILES['pdf_file'], $uploadDir, ['pdf']);

        if (isset($result['error'])) {
            jsonResponse(['error' => $result['error']], 400);
        }

        if ($chapterId) {
            $stmt = $db->prepare("UPDATE chapters SET pdf_file = ? WHERE id = ? AND book_id = ?");
            $stmt->execute([$result['filename'], $chapterId, $bookId]);
        }

        $stmt = $db->prepare("INSERT INTO uploads (user_id, book_id, file_name, file_path, file_type, file_size) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $userId,
            $bookId,
            $_FILES['pdf_file']['name'],
            $result['path'],
            'pdf',
            $_FILES['pdf_file']['size']
        ]);

        logActivity($userId, 'upload_book_pdf', "Uploaded PDF for book ID: {$bookId}");
        jsonResponse(['success' => true, 'message' => 'PDF uploaded', 'filename' => $result['filename']], 201);

    default:
        jsonResponse(['error' => 'Invalid action'], 400);
}
