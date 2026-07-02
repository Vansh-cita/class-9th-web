<?php if (!isset($page)) $page = ''; ?>
<?php
$siteName = getSetting('site_name', 'CBSE Class 9 Portal');
$siteDesc = getSetting('site_description', 'Your complete learning portal for CBSE Class 9 with NCERT books, study materials, and resources.');
$ogTitle = $siteName;
$ogDesc = $siteDesc;
$ogImage = '/assets/images/og-default.png';
$ogUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost') . ($_SERVER['REQUEST_URI'] ?? '/');
$isAdminPage = strpos($page, 'admin/') === 0 || $page === 'admin';
$isReaderPage = $page === 'reader';
$pageTitle = $siteName;
if ($page === 'home') $pageTitle = $siteName;
elseif ($page === 'login') $pageTitle = 'Login - ' . $siteName;
elseif ($page === 'register') $pageTitle = 'Register - ' . $siteName;
elseif ($page === 'faq') $pageTitle = 'FAQ - ' . $siteName;
elseif ($page === 'books') $pageTitle = 'Books - ' . $siteName;
elseif ($page === 'categories') $pageTitle = 'Categories - ' . $siteName;
elseif ($page === 'announcements') $pageTitle = 'Announcements - ' . $siteName;
elseif ($page === 'dashboard') $pageTitle = 'Dashboard - ' . $siteName;
elseif ($page === 'bookmarks') $pageTitle = 'Bookmarks - ' . $siteName;
elseif ($page === 'notifications') $pageTitle = 'Notifications - ' . $siteName;
elseif ($page === 'profile') $pageTitle = 'Profile - ' . $siteName;
elseif ($page === 'settings') $pageTitle = 'Settings - ' . $siteName;
elseif ($page === 'search') $pageTitle = 'Search - ' . $siteName;
elseif ($page === 'reader') $pageTitle = 'Reader - ' . $siteName;
elseif ($isAdminPage) $pageTitle = 'Admin - ' . $siteName;
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($pageTitle) ?></title>
    <meta name="description" content="<?= htmlspecialchars($siteDesc) ?>">
    <meta name="theme-color" content="#050505">

    <meta property="og:title" content="<?= htmlspecialchars($ogTitle) ?>">
    <meta property="og:description" content="<?= htmlspecialchars($ogDesc) ?>">
    <meta property="og:image" content="<?= htmlspecialchars($ogImage) ?>">
    <meta property="og:url" content="<?= htmlspecialchars($ogUrl) ?>">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="<?= htmlspecialchars($ogTitle) ?>">
    <meta name="twitter:description" content="<?= htmlspecialchars($ogDesc) ?>">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700&display=swap" as="style">

    <link rel="stylesheet" href="/assets/css/style.css">
    <?php if ($isAdminPage): ?>
    <link rel="stylesheet" href="/assets/css/admin.css">
    <?php endif; ?>
    <?php if ($isReaderPage): ?>
    <link rel="stylesheet" href="/assets/css/reader.css">
    <?php endif; ?>

    <link rel="icon" type="image/svg+xml" href="/assets/images/favicon.svg">
    <link rel="icon" type="image/png" href="/assets/images/favicon.png">
    <link rel="apple-touch-icon" href="/assets/images/apple-touch-icon.png">
</head>
<body>
    <?php include __DIR__ . '/navbar.php'; ?>
    <div class="main-content">
