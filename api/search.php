<?php
@session_start();
require_once __DIR__ . '/../includes/functions.php';

$db = getDB();
$action = $_REQUEST['action'] ?? '';

switch ($action) {
    case 'search':
        $query = trim($_GET['q'] ?? '');
        $limit = max(1, min(20, (int)($_GET['limit'] ?? 20)));

        if (empty($query)) {
            jsonResponse(['error' => 'Search query is required'], 400);
        }

        $searchTerm = "%{$query}%";
        $results = ['books' => [], 'categories' => []];

        $stmt = $db->prepare("SELECT b.id, b.title, b.slug, b.subject, b.thumbnail, b.author, c.name as category_name FROM books b LEFT JOIN categories c ON b.category_id = c.id WHERE b.title LIKE ? OR b.subject LIKE ? OR b.author LIKE ? LIMIT ?");
        $stmt->execute([$searchTerm, $searchTerm, $searchTerm, $limit]);
        $results['books'] = $stmt->fetchAll();

        $stmt = $db->prepare("SELECT c.id, c.name, c.slug, c.icon, c.description, (SELECT COUNT(*) FROM books b WHERE b.category_id = c.id) as book_count FROM categories c WHERE c.name LIKE ? OR c.description LIKE ? LIMIT ?");
        $stmt->execute([$searchTerm, $searchTerm, $limit]);
        $results['categories'] = $stmt->fetchAll();

        jsonResponse([
            'success' => true,
            'query' => $query,
            'results' => $results,
            'total' => count($results['books']) + count($results['categories'])
        ]);

    default:
        jsonResponse(['error' => 'Invalid action'], 400);
}
