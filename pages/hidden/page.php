<?php
require_once __DIR__ . '/../../includes/functions.php';

$pageId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
$code = isset($_GET['code']) ? sanitize($_GET['code']) : '';

if (!$pageId) {
    header('Location: /');
    exit;
}

$stmt = getDB()->prepare("SELECT * FROM hidden_pages WHERE id = ?");
$stmt->execute([$pageId]);
$hiddenPage = $stmt->fetch();

if (!$hiddenPage) {
    header('HTTP/1.0 404 Not Found');
    echo '<h1>Page not found</h1>';
    exit;
}

$hasAccess = false;
$isLoggedIn = isset($_SESSION['user_id']);

if ($isLoggedIn) {
    $stmt = getDB()->prepare("SELECT * FROM user_access WHERE user_id = ? AND page_id = ?");
    $stmt->execute([$_SESSION['user_id'], $pageId]);
    $hasAccess = (bool)$stmt->fetch();

    if (!$hasAccess && $code) {
        $stmt = getDB()->prepare("SELECT * FROM hidden_pages WHERE id = ? AND access_code = ? AND is_active = 1");
        $stmt->execute([$pageId, $code]);
        if ($stmt->fetch()) {
            $stmt = getDB()->prepare("INSERT INTO user_access (user_id, page_id) VALUES (?, ?)");
            $stmt->execute([$_SESSION['user_id'], $pageId]);
            $stmt = getDB()->prepare("INSERT INTO access_codes (code, page_id, used_by, used_at) VALUES (?, ?, ?, datetime('now'))");
            $stmt->execute([$code, $pageId, $_SESSION['user_id']]);
            $hasAccess = true;
            logActivity($_SESSION['user_id'], 'access_code_used', "Used access code for page: {$hiddenPage['title']}");
        }
    }
}

if (!$hasAccess) {
    ?>
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Access Required</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="/assets/css/style.css">
        <style>
            body { background: #050505; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; font-family: 'Outfit', sans-serif; }
            .access-card { max-width: 500px; width: 90%; padding: 48px; text-align: center; }
            .access-card .lock-icon { width: 80px; height: 80px; border-radius: 50%; background: rgba(255,15,123,0.1); display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; font-size: 36px; }
            .access-card h1 { font-size: 28px; color: #fff; margin-bottom: 8px; }
            .access-card p { color: rgba(255,255,255,0.6); margin-bottom: 32px; font-size: 15px; line-height: 1.6; }
            .code-input { width: 100%; padding: 16px 20px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; color: #fff; font-size: 18px; text-align: center; letter-spacing: 2px; font-family: 'Outfit', monospace; outline: none; transition: all 0.3s; margin-bottom: 16px; }
            .code-input:focus { border-color: #FF0F7B; box-shadow: 0 0 20px rgba(255,15,123,0.2); }
            .error-msg { color: #ff4444; font-size: 14px; margin-bottom: 16px; display: none; }
            .btn-submit { width: 100%; padding: 16px; background: #FF0F7B; color: #fff; border: none; border-radius: 16px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s; font-family: 'Outfit', sans-serif; }
            .btn-submit:hover { background: #e00d6e; transform: translateY(-1px); box-shadow: 0 8px 30px rgba(255,15,123,0.3); }
            .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
            .back-link { display: inline-block; margin-top: 24px; color: rgba(255,255,255,0.4); text-decoration: none; font-size: 14px; transition: color 0.3s; }
            .back-link:hover { color: #FF0F7B; }
        </style>
    </head>
    <body>
        <div class="glass-card access-card">
            <div class="lock-icon">🔒</div>
            <h1><?= htmlspecialchars($hiddenPage['title']) ?></h1>
            <p>This page is protected. Enter the access code to continue.</p>
            <form id="accessForm">
                <input type="hidden" name="page_id" value="<?= $pageId ?>">
                <input type="text" class="code-input" name="code" placeholder="Enter access code" autocomplete="off" maxlength="20">
                <div class="error-msg" id="errorMsg"></div>
                <button type="submit" class="btn-submit" id="submitBtn">Unlock Access</button>
            </form>
            <a href="/" class="back-link">← Back to Home</a>
        </div>
        <script>
        document.getElementById('accessForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const btn = document.getElementById('submitBtn');
            const error = document.getElementById('errorMsg');
            const code = this.querySelector('[name="code"]').value.trim();
            if (!code) { error.textContent = 'Please enter an access code'; error.style.display = 'block'; return; }
            btn.disabled = true; btn.textContent = 'Verifying...';
            try {
                const res = await fetch('/api/pages.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({ action: 'verify_code', page_id: '<?= $pageId ?>', code: code })
                });
                const data = await res.json();
                if (data.success) {
                    window.location.reload();
                } else {
                    error.textContent = data.error || 'Invalid access code';
                    error.style.display = 'block';
                    btn.disabled = false; btn.textContent = 'Unlock Access';
                }
            } catch (err) {
                error.textContent = 'An error occurred. Please try again.';
                error.style.display = 'block';
                btn.disabled = false; btn.textContent = 'Unlock Access';
            }
        });
        </script>
    </body>
    </html>
    <?php
    exit;
}

// User has access - show the hidden page content
$stmt = getDB()->prepare("SELECT * FROM hidden_page_items WHERE page_id = ? ORDER BY created_at DESC");
$stmt->execute([$pageId]);
$items = $stmt->fetchAll();

$pageTitle = $hiddenPage['title'];
$pageDescription = $hiddenPage['description'];
$pageContent = $hiddenPage['content'];

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($pageTitle) ?> - Hidden Resources</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/assets/css/style.css">
    <style>
        .hidden-page-header { padding: 120px 24px 60px; text-align: center; }
        .hidden-page-header h1 { font-size: 48px; font-weight: 800; background: linear-gradient(135deg, #FF0F7B, #ff6b9d); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 16px; }
        .hidden-page-header p { color: rgba(255,255,255,0.6); font-size: 18px; max-width: 600px; margin: 0 auto; line-height: 1.6; }
        .hidden-content { max-width: 1200px; margin: 0 auto; padding: 0 24px 80px; }
        .hidden-content .content-body { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 24px; padding: 40px; margin-bottom: 40px; color: rgba(255,255,255,0.8); font-size: 16px; line-height: 1.8; }
        .items-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
        .item-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 24px; padding: 28px; transition: all 0.3s; }
        .item-card:hover { border-color: rgba(255,15,123,0.3); transform: translateY(-2px); box-shadow: 0 8px 30px rgba(255,15,123,0.1); }
        .item-card .item-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
        .item-badge.book { background: rgba(255,15,123,0.15); color: #FF0F7B; }
        .item-badge.note { background: rgba(0,200,255,0.15); color: #00c8ff; }
        .item-badge.assignment { background: rgba(255,200,0,0.15); color: #ffc800; }
        .item-badge.pdf { background: rgba(0,255,150,0.15); color: #00ff96; }
        .item-card h3 { font-size: 18px; font-weight: 600; color: #fff; margin-bottom: 8px; }
        .item-card p { color: rgba(255,255,255,0.5); font-size: 14px; line-height: 1.5; margin-bottom: 16px; }
        .item-card .item-link { display: inline-flex; align-items: center; gap: 8px; color: #FF0F7B; text-decoration: none; font-weight: 500; font-size: 14px; transition: gap 0.3s; }
        .item-card .item-link:hover { gap: 12px; }
        .back-link { display: inline-flex; align-items: center; gap: 8px; color: rgba(255,255,255,0.5); text-decoration: none; font-size: 14px; margin-bottom: 40px; transition: color 0.3s; }
        .back-link:hover { color: #FF0F7B; }
        @media (max-width: 768px) {
            .hidden-page-header h1 { font-size: 32px; }
            .items-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <?php require_once __DIR__ . '/../../includes/navbar.php'; ?>
    
    <div class="main-content">
        <div class="hidden-page-header" data-animate="fade-up">
            <h1><?= htmlspecialchars($pageTitle) ?></h1>
            <?php if ($pageDescription): ?>
                <p><?= htmlspecialchars($pageDescription) ?></p>
            <?php endif; ?>
        </div>

        <div class="hidden-content">
            <a href="/dashboard" class="back-link">← Back to Dashboard</a>

            <?php if ($pageContent): ?>
                <div class="content-body glass-card" data-animate="fade-up">
                    <?= nl2br(htmlspecialchars($pageContent)) ?>
                </div>
            <?php endif; ?>

            <?php if (count($items) > 0): ?>
                <h2 style="font-size: 24px; font-weight: 600; color: #fff; margin-bottom: 24px;" data-animate="fade-up">Resources</h2>
                <div class="items-grid" data-animate="fade-up">
                    <?php foreach ($items as $item): ?>
                        <div class="item-card glass-card">
                            <span class="item-badge <?= htmlspecialchars($item['item_type']) ?>"><?= htmlspecialchars($item['item_type']) ?></span>
                            <h3><?= htmlspecialchars($item['title']) ?></h3>
                            <?php if ($item['description']): ?>
                                <p><?= htmlspecialchars(truncateText($item['description'], 120)) ?></p>
                            <?php endif; ?>
                            <?php if ($item['item_type'] === 'book' && $item['item_id']): ?>
                                <a href="/book?id=<?= $item['item_id'] ?>" class="item-link">Read Book →</a>
                            <?php elseif ($item['file_path']): ?>
                                <a href="/<?= ltrim($item['file_path'], '/') ?>" class="item-link" target="_blank">Download →</a>
                            <?php endif; ?>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php else: ?>
                <div class="glass-card" style="text-align: center; padding: 60px 24px;" data-animate="fade-up">
                    <p style="color: rgba(255,255,255,0.4); font-size: 16px;">No resources available yet.</p>
                </div>
            <?php endif; ?>
        </div>
    </div>

    <?php require_once __DIR__ . '/../../includes/footer.php'; ?>
</body>
</html>
