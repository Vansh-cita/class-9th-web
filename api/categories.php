<?php
@session_start();
require_once __DIR__ . '/../includes/functions.php';

$db = getDB();
$action = $_REQUEST['action'] ?? '';

$isAdmin = isset($_SESSION['role']) && $_SESSION['role'] === 'admin';

switch ($action) {
    case 'list':
        $stmt = $db->prepare("SELECT c.*, (SELECT COUNT(*) FROM books b WHERE b.category_id = c.id) as book_count FROM categories c ORDER BY c.name ASC");
        $stmt->execute();
        $categories = $stmt->fetchAll();

        jsonResponse(['success' => true, 'categories' => $categories]);

    case 'create':
        if (!$isAdmin) {
            jsonResponse(['error' => 'Unauthorized'], 403);
        }

        $name = trim($_POST['name'] ?? '');
        $description = trim($_POST['description'] ?? '');
        $icon = trim($_POST['icon'] ?? 'book');

        if (empty($name)) {
            jsonResponse(['error' => 'Category name is required'], 400);
        }

        $slug = slugify($name);

        $stmt = $db->prepare("SELECT id FROM categories WHERE slug = ?");
        $stmt->execute([$slug]);
        if ($stmt->fetch()) {
            jsonResponse(['error' => 'Category already exists'], 409);
        }

        $stmt = $db->prepare("INSERT INTO categories (name, slug, description, icon) VALUES (?, ?, ?, ?)");
        $stmt->execute([$name, $slug, $description, $icon]);

        $categoryId = $db->lastInsertId();
        logActivity($_SESSION['user_id'], 'create_category', "Created category: {$name}");

        jsonResponse(['success' => true, 'message' => 'Category created', 'id' => $categoryId], 201);

    case 'update':
        if (!$isAdmin) {
            jsonResponse(['error' => 'Unauthorized'], 403);
        }

        $id = (int)($_POST['id'] ?? 0);
        if (!$id) {
            jsonResponse(['error' => 'Category ID is required'], 400);
        }

        $stmt = $db->prepare("SELECT * FROM categories WHERE id = ?");
        $stmt->execute([$id]);
        if (!$stmt->fetch()) {
            jsonResponse(['error' => 'Category not found'], 404);
        }

        $name = trim($_POST['name'] ?? '');
        $description = trim($_POST['description'] ?? '');
        $icon = trim($_POST['icon'] ?? '');

        if (empty($name)) {
            jsonResponse(['error' => 'Category name is required'], 400);
        }

        $slug = slugify($name);
        $stmt = $db->prepare("SELECT id FROM categories WHERE slug = ? AND id != ?");
        $stmt->execute([$slug, $id]);
        if ($stmt->fetch()) {
            jsonResponse(['error' => 'Category name already taken'], 409);
        }

        $stmt = $db->prepare("UPDATE categories SET name = ?, slug = ?, description = ?, icon = ? WHERE id = ?");
        $stmt->execute([$name, $slug, $description, $icon ?: 'book', $id]);

        logActivity($_SESSION['user_id'], 'update_category', "Updated category ID: {$id}");
        jsonResponse(['success' => true, 'message' => 'Category updated']);

    case 'delete':
        if (!$isAdmin) {
            jsonResponse(['error' => 'Unauthorized'], 403);
        }

        $id = (int)($_POST['id'] ?? 0);
        if (!$id) {
            jsonResponse(['error' => 'Category ID is required'], 400);
        }

        $stmt = $db->prepare("SELECT COUNT(*) as count FROM books WHERE category_id = ?");
        $stmt->execute([$id]);
        $count = $stmt->fetch()['count'];

        if ($count > 0) {
            jsonResponse(['error' => 'Cannot delete category with associated books. Remove books first.'], 400);
        }

        $stmt = $db->prepare("DELETE FROM categories WHERE id = ?");
        $stmt->execute([$id]);

        logActivity($_SESSION['user_id'], 'delete_category', "Deleted category ID: {$id}");
        jsonResponse(['success' => true, 'message' => 'Category deleted']);

    default:
        jsonResponse(['error' => 'Invalid action'], 400);
}
