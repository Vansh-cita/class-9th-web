<?php
session_start();
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/includes/functions.php';

$page = isset($_GET['page']) ? trim($_GET['page'], '/') : 'home';
$page = explode('?', $page)[0];
$page = rtrim($page, '/');

if (strpos($page, 'api/') === 0) {
    $apiFile = __DIR__ . '/' . $page . '.php';
    if (file_exists($apiFile)) {
        require $apiFile;
    } else {
        header('HTTP/1.0 404 Not Found');
        echo json_encode(['error' => 'API endpoint not found']);
    }
    exit;
}

$publicPages = ['home', 'login', 'register', 'faq'];
$studentPages = ['dashboard', 'books', 'book', 'reader', 'categories', 'search', 'bookmarks', 'profile', 'settings', 'notifications'];
$adminPages = ['admin/dashboard', 'admin/books', 'admin/categories', 'admin/users', 'admin/uploads', 'admin/announcements', 'admin/pages', 'admin/settings', 'admin/logs'];

$isAuthenticated = isset($_SESSION['user_id']);
$isAdmin = $isAuthenticated && ($_SESSION['role'] ?? '') === 'admin';

if ($page === '' || $page === '/') $page = 'home';

if (in_array($page, $publicPages)) {
    $file = __DIR__ . '/pages/' . $page . '.php';
} elseif (in_array($page, $studentPages)) {
    if (!$isAuthenticated) {
        header('Location: /login');
        exit;
    }
    $file = __DIR__ . '/pages/' . $page . '.php';
} elseif (in_array($page, $adminPages)) {
    if (!$isAdmin) {
        header('Location: /login');
        exit;
    }
    $adminPage = str_replace('admin/', '', $page);
    $file = __DIR__ . '/pages/admin/' . $adminPage . '.php';
} elseif (strpos($page, 'hidden/') === 0) {
    $file = __DIR__ . '/pages/hidden/page.php';
} elseif ($page === 'admin') {
    if (!$isAdmin) { header('Location: /login'); exit; }
    $file = __DIR__ . '/pages/admin/dashboard.php';
} elseif ($page === 'logout') {
    session_destroy();
    header('Location: /login');
    exit;
} elseif ($page === 'book') {
    if (!$isAuthenticated) { header('Location: /login'); exit; }
    $file = __DIR__ . '/pages/book.php';
} elseif ($page === 'reader') {
    if (!$isAuthenticated) { header('Location: /login'); exit; }
    $file = __DIR__ . '/pages/reader.php';
} elseif ($page === 'hidden') {
    $file = __DIR__ . '/pages/hidden/page.php';
} else {
    header('HTTP/1.0 404 Not Found');
    $file = __DIR__ . '/pages/404.php';
}

ob_start();
if (file_exists($file)) {
    require $file;
} else {
    header('HTTP/1.0 404 Not Found');
    echo '<h1>404 - Page Not Found</h1>';
}
$content = ob_get_clean();

if (!defined('AJAX_REQUEST') && !defined('API_REQUEST')) {
    $useLayout = true;
    $excludedLayouts = ['login', 'register', 'reader', 'admin/dashboard', 'admin/books', 'admin/categories', 'admin/users', 'admin/uploads', 'admin/announcements', 'admin/pages', 'admin/settings', 'admin/logs'];
    foreach ($excludedLayouts as $e) {
        if ($page === $e || strpos($page, 'admin/') === 0) {
            $useLayout = false;
            break;
        }
    }
    if ($page === 'login' || $page === 'register') $useLayout = false;
    if ($page === 'reader') $useLayout = false;

    if ($useLayout) {
        require __DIR__ . '/includes/header.php';
        echo $content;
        require __DIR__ . '/includes/footer.php';
    } else {
        echo $content;
    }
} else {
    echo $content;
}
