<?php
@session_start();
require_once __DIR__ . '/../includes/functions.php';

$db = getDB();
$action = $_REQUEST['action'] ?? '';

$isAdmin = isset($_SESSION['role']) && $_SESSION['role'] === 'admin';
$isLoggedIn = isset($_SESSION['user_id']);

switch ($action) {
    case 'list':
        if (!$isLoggedIn) {
            jsonResponse(['error' => 'Not authenticated'], 401);
        }

        if ($isAdmin) {
            $stmt = $db->prepare("SELECT hp.*, u.username as created_by_name, (SELECT COUNT(*) FROM hidden_page_items hpi WHERE hpi.page_id = hp.id) as item_count FROM hidden_pages hp LEFT JOIN users u ON hp.created_by = u.id ORDER BY hp.created_at DESC");
            $stmt->execute();
        } else {
            $stmt = $db->prepare("SELECT hp.*, u.username as created_by_name, (SELECT COUNT(*) FROM hidden_page_items hpi WHERE hpi.page_id = hp.id) as item_count FROM hidden_pages hp LEFT JOIN users u ON hp.created_by = u.id WHERE hp.is_active = 1 AND (hp.id IN (SELECT page_id FROM user_access WHERE user_id = ?) OR hp.id IN (SELECT page_id FROM access_codes WHERE used_by = ? AND is_active = 1)) ORDER BY hp.created_at DESC");
            $stmt->execute([$_SESSION['user_id'], $_SESSION['user_id']]);
        }

        $pages = $stmt->fetchAll();
        jsonResponse(['success' => true, 'pages' => $pages]);

    case 'get':
        $id = (int)($_GET['id'] ?? 0);
        if (!$id) {
            jsonResponse(['error' => 'Page ID is required'], 400);
        }

        $stmt = $db->prepare("SELECT hp.*, u.username as created_by_name FROM hidden_pages hp LEFT JOIN users u ON hp.created_by = u.id WHERE hp.id = ?");
        $stmt->execute([$id]);
        $page = $stmt->fetch();

        if (!$page) {
            jsonResponse(['error' => 'Page not found'], 404);
        }

        if (!$isAdmin && !isHiddenPageAccessible($id)) {
            jsonResponse(['error' => 'Access denied'], 403);
        }

        $stmt = $db->prepare("SELECT * FROM hidden_page_items WHERE page_id = ? ORDER BY created_at ASC");
        $stmt->execute([$id]);
        $page['items'] = $stmt->fetchAll();

        jsonResponse(['success' => true, 'page' => $page]);

    case 'create':
        if (!$isAdmin) {
            jsonResponse(['error' => 'Unauthorized'], 403);
        }

        $title = trim($_POST['title'] ?? '');
        $description = trim($_POST['description'] ?? '');
        $content = $_POST['content'] ?? '';
        $accessCode = trim($_POST['access_code'] ?? '');

        if (empty($title) || empty($accessCode)) {
            jsonResponse(['error' => 'Title and access code are required'], 400);
        }

        $slug = slugify($title);

        $stmt = $db->prepare("SELECT id FROM hidden_pages WHERE slug = ?");
        $stmt->execute([$slug]);
        if ($stmt->fetch()) {
            $slug = $slug . '-' . uniqid();
        }

        $stmt = $db->prepare("INSERT INTO hidden_pages (title, slug, description, content, access_code, created_by) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$title, $slug, $description, $content, $accessCode, $_SESSION['user_id']]);

        $pageId = $db->lastInsertId();
        logActivity($_SESSION['user_id'], 'create_hidden_page', "Created hidden page: {$title}");

        jsonResponse(['success' => true, 'message' => 'Hidden page created', 'id' => $pageId], 201);

    case 'update':
        if (!$isAdmin) {
            jsonResponse(['error' => 'Unauthorized'], 403);
        }

        $id = (int)($_POST['id'] ?? 0);
        if (!$id) {
            jsonResponse(['error' => 'Page ID is required'], 400);
        }

        $stmt = $db->prepare("SELECT * FROM hidden_pages WHERE id = ?");
        $stmt->execute([$id]);
        $page = $stmt->fetch();
        if (!$page) {
            jsonResponse(['error' => 'Page not found'], 404);
        }

        $title = trim($_POST['title'] ?? $page['title']);
        $description = trim($_POST['description'] ?? $page['description']);
        $content = $_POST['content'] ?? $page['content'];
        $accessCode = trim($_POST['access_code'] ?? $page['access_code']);

        $slug = $page['slug'];
        if ($title !== $page['title']) {
            $slug = slugify($title);
            $slugCheck = $db->prepare("SELECT id FROM hidden_pages WHERE slug = ? AND id != ?");
            $slugCheck->execute([$slug, $id]);
            if ($slugCheck->fetch()) {
                $slug = $slug . '-' . uniqid();
            }
        }

        $stmt = $db->prepare("UPDATE hidden_pages SET title = ?, slug = ?, description = ?, content = ?, access_code = ? WHERE id = ?");
        $stmt->execute([$title, $slug, $description, $content, $accessCode, $id]);

        logActivity($_SESSION['user_id'], 'update_hidden_page', "Updated hidden page ID: {$id}");
        jsonResponse(['success' => true, 'message' => 'Hidden page updated']);

    case 'delete':
        if (!$isAdmin) {
            jsonResponse(['error' => 'Unauthorized'], 403);
        }

        $id = (int)($_POST['id'] ?? 0);
        if (!$id) {
            jsonResponse(['error' => 'Page ID is required'], 400);
        }

        $stmt = $db->prepare("SELECT * FROM hidden_pages WHERE id = ?");
        $stmt->execute([$id]);
        if (!$stmt->fetch()) {
            jsonResponse(['error' => 'Page not found'], 404);
        }

        $stmt = $db->prepare("DELETE FROM hidden_pages WHERE id = ?");
        $stmt->execute([$id]);

        logActivity($_SESSION['user_id'], 'delete_hidden_page', "Deleted hidden page ID: {$id}");
        jsonResponse(['success' => true, 'message' => 'Hidden page deleted']);

    case 'toggle_status':
        if (!$isAdmin) {
            jsonResponse(['error' => 'Unauthorized'], 403);
        }

        $id = (int)($_POST['id'] ?? 0);
        if (!$id) {
            jsonResponse(['error' => 'Page ID is required'], 400);
        }

        $stmt = $db->prepare("SELECT id, is_active FROM hidden_pages WHERE id = ?");
        $stmt->execute([$id]);
        $page = $stmt->fetch();
        if (!$page) {
            jsonResponse(['error' => 'Page not found'], 404);
        }

        $newStatus = $page['is_active'] ? 0 : 1;
        $stmt = $db->prepare("UPDATE hidden_pages SET is_active = ? WHERE id = ?");
        $stmt->execute([$newStatus, $id]);

        logActivity($_SESSION['user_id'], 'toggle_hidden_page_status', "Toggled status for page ID: {$id}");
        jsonResponse(['success' => true, 'message' => 'Status toggled', 'is_active' => $newStatus]);

    case 'verify_code':
        if (!$isLoggedIn) {
            jsonResponse(['error' => 'Not authenticated'], 401);
        }

        $pageId = (int)($_POST['page_id'] ?? 0);
        $code = trim($_POST['code'] ?? '');

        if (!$pageId || empty($code)) {
            jsonResponse(['error' => 'Page ID and access code are required'], 400);
        }

        $stmt = $db->prepare("SELECT * FROM hidden_pages WHERE id = ? AND is_active = 1");
        $stmt->execute([$pageId]);
        $page = $stmt->fetch();

        if (!$page) {
            jsonResponse(['error' => 'Page not found or inactive'], 404);
        }

        if ($code !== $page['access_code']) {
            jsonResponse(['error' => 'Invalid access code'], 403);
        }

        $stmt = $db->prepare("INSERT IGNORE INTO user_access (user_id, page_id) VALUES (?, ?)");
        $stmt->execute([$_SESSION['user_id'], $pageId]);

        $stmt = $db->prepare("INSERT INTO access_codes (code, page_id, used_by, is_active, used_at) VALUES (?, ?, ?, 0, datetime('now'))");
        $stmt->execute([$code, $pageId, $_SESSION['user_id']]);

        logActivity($_SESSION['user_id'], 'verify_hidden_page_code', "Verified access code for page ID: {$pageId}");
        jsonResponse(['success' => true, 'message' => 'Access granted', 'page_id' => $pageId]);

    case 'check_access':
        if (!$isLoggedIn) {
            jsonResponse(['error' => 'Not authenticated'], 401);
        }

        $pageId = (int)($_GET['page_id'] ?? 0);
        if (!$pageId) {
            jsonResponse(['error' => 'Page ID is required'], 400);
        }

        $hasAccess = $isAdmin || isHiddenPageAccessible($pageId);
        jsonResponse(['success' => true, 'has_access' => $hasAccess]);

    case 'add_item':
        if (!$isAdmin) {
            jsonResponse(['error' => 'Unauthorized'], 403);
        }

        $pageId = (int)($_POST['page_id'] ?? 0);
        $itemType = trim($_POST['item_type'] ?? '');
        $itemTitle = trim($_POST['title'] ?? '');
        $itemDescription = trim($_POST['description'] ?? '');
        $itemId = !empty($_POST['item_id']) ? (int)$_POST['item_id'] : null;

        if (!$pageId || empty($itemType) || empty($itemTitle)) {
            jsonResponse(['error' => 'Page ID, item type, and title are required'], 400);
        }

        $allowedTypes = ['book', 'note', 'assignment', 'pdf'];
        if (!in_array($itemType, $allowedTypes)) {
            jsonResponse(['error' => 'Invalid item type'], 400);
        }

        $filePath = null;
        if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = __DIR__ . '/../uploads/hidden_pages/';
            $result = uploadFile($_FILES['file'], $uploadDir, ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'doc', 'docx']);
            if (isset($result['error'])) {
                jsonResponse(['error' => $result['error']], 400);
            }
            $filePath = $result['path'];
        }

        $stmt = $db->prepare("INSERT INTO hidden_page_items (page_id, item_type, item_id, title, description, file_path) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$pageId, $itemType, $itemId, $itemTitle, $itemDescription, $filePath]);

        $itemDbId = $db->lastInsertId();
        logActivity($_SESSION['user_id'], 'add_hidden_page_item', "Added item to page ID: {$pageId}");
        jsonResponse(['success' => true, 'message' => 'Item added', 'id' => $itemDbId], 201);

    case 'remove_item':
        if (!$isAdmin) {
            jsonResponse(['error' => 'Unauthorized'], 403);
        }

        $id = (int)($_POST['id'] ?? 0);
        if (!$id) {
            jsonResponse(['error' => 'Item ID is required'], 400);
        }

        $stmt = $db->prepare("SELECT * FROM hidden_page_items WHERE id = ?");
        $stmt->execute([$id]);
        $item = $stmt->fetch();
        if (!$item) {
            jsonResponse(['error' => 'Item not found'], 404);
        }

        if ($item['file_path']) {
            deleteFile($item['file_path']);
        }

        $stmt = $db->prepare("DELETE FROM hidden_page_items WHERE id = ?");
        $stmt->execute([$id]);

        logActivity($_SESSION['user_id'], 'remove_hidden_page_item', "Removed item ID: {$id} from page");
        jsonResponse(['success' => true, 'message' => 'Item removed']);

    default:
        jsonResponse(['error' => 'Invalid action'], 400);
}
