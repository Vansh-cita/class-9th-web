<?php
session_start();
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/functions.php';

$user = getCurrentUser();
if (!$user || ($_SESSION['role'] ?? '') !== 'admin') {
    header('Location: /login');
    exit;
}

$db = getDB();

$errors = [];
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'save_settings') {
    $settings = $_POST['settings'] ?? [];
    foreach ($settings as $key => $value) {
        $value = sanitize($value);
        $stmt = $db->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?");
        $stmt->execute([$key, $value, $value]);
    }
    logActivity($user['id'], 'update_settings', 'Updated site settings');
    $success = 'Settings saved successfully';
}

$stmt = $db->query("SELECT * FROM settings");
$allSettings = $stmt->fetchAll();
$settings = [];
foreach ($allSettings as $s) {
    $settings[$s['setting_key']] = $s['setting_value'];
}

$siteName = $settings['site_name'] ?? 'CBSE Class 9 Portal';
$siteTagline = $settings['site_tagline'] ?? 'Your Complete Learning Portal';
$siteDescription = $settings['site_description'] ?? '';
$footerText = $settings['footer_text'] ?? '© CBSE Class 9 Learning Portal';
$logoText = $settings['logo_text'] ?? 'C9';
$contactEmail = $settings['contact_email'] ?? '';
$enableRegistration = $settings['enable_registration'] ?? '1';
$maintenanceMode = $settings['maintenance_mode'] ?? '0';
$defaultTheme = $settings['default_theme'] ?? 'dark';
$primaryColor = $settings['primary_color'] ?? '#FF0F7B';
$bgColor = $settings['bg_color'] ?? '#050505';
$fontFamily = $settings['font_family'] ?? 'Inter';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Settings - Admin - CBSE Class 9 Portal</title>
    <link rel="stylesheet" href="/assets/css/style.css">
    <link rel="stylesheet" href="/assets/css/admin.css">
</head>
<body>
<div class="admin-layout">
    <aside class="admin-sidebar">
        <div class="admin-sidebar-header">
            <div>
                <div style="font-weight:800;font-size:1.15rem;">C9 Admin</div>
                <a href="/" class="back-link">← Back to site</a>
            </div>
        </div>
        <nav class="admin-sidebar-nav">
            <a href="/admin"><span class="nav-icon">📊</span> Dashboard</a>
            <a href="/admin/books"><span class="nav-icon">📚</span> Books</a>
            <a href="/admin/categories"><span class="nav-icon">🏷️</span> Categories</a>
            <a href="/admin/users"><span class="nav-icon">👥</span> Users</a>
            <a href="/admin/uploads"><span class="nav-icon">📁</span> Uploads</a>
            <a href="/admin/announcements"><span class="nav-icon">📢</span> Announcements</a>
            <a href="/admin/pages"><span class="nav-icon">🔒</span> Hidden Pages</a>
            <a href="/admin/settings" class="active"><span class="nav-icon">⚙️</span> Settings</a>
            <a href="/admin/logs"><span class="nav-icon">📋</span> Logs</a>
        </nav>
        <div class="admin-sidebar-footer">
            <div class="admin-avatar"><?= strtoupper(substr($user['username'] ?? 'A', 0, 1)) ?></div>
            <div class="admin-info">
                <div class="admin-name"><?= htmlspecialchars($user['username'] ?? 'Admin') ?></div>
                <div class="admin-role">Administrator</div>
            </div>
        </div>
    </aside>
    <div class="admin-sidebar-overlay"></div>

    <div class="admin-main">
        <header class="admin-topbar">
            <div style="display:flex;align-items:center;gap:12px;">
                <button class="admin-sidebar-toggle" aria-label="Toggle sidebar">☰</button>
                <div class="admin-topbar-title">Site Settings</div>
            </div>
            <div class="admin-topbar-actions">
                <a href="/" class="btn btn-sm btn-ghost">View Site</a>
                <a href="/logout" class="btn btn-sm btn-ghost" style="color:#ff1744;">Logout</a>
            </div>
        </header>

        <main class="admin-content">
            <div class="admin-page-header">
                <div>
                    <h1 class="admin-page-title">⚙️ Settings</h1>
                    <p class="admin-page-desc">Configure your learning portal</p>
                </div>
            </div>

            <?php if ($success): ?>
            <div id="settingsSuccess" style="padding:12px 16px;background:rgba(0,200,83,0.1);border:1px solid rgba(0,200,83,0.3);border-radius:var(--radius-md);margin-bottom:20px;color:#00c853;font-weight:500;"><?= htmlspecialchars($success) ?></div>
            <?php endif; ?>
            <?php if (!empty($errors)): ?>
            <div style="padding:12px 16px;background:rgba(255,23,68,0.1);border:1px solid rgba(255,23,68,0.3);border-radius:var(--radius-md);margin-bottom:20px;color:#ff1744;font-weight:500;">
                <?php foreach ($errors as $e): ?><div><?= htmlspecialchars($e) ?></div><?php endforeach; ?>
            </div>
            <?php endif; ?>

            <form method="POST" id="adminSettingsForm">
                <input type="hidden" name="action" value="save_settings">

                <div class="admin-card">
                    <div class="admin-card-header">
                        <div class="admin-card-title">🌐 General Settings</div>
                    </div>
                    <div class="admin-card-body">
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
                            <div class="form-group">
                                <label class="form-label">Site Name</label>
                                <input class="form-input" name="settings[site_name]" value="<?= htmlspecialchars($siteName) ?>" maxlength="100">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Logo Text</label>
                                <input class="form-input" name="settings[logo_text]" value="<?= htmlspecialchars($logoText) ?>" maxlength="10">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Tagline</label>
                                <input class="form-input" name="settings[site_tagline]" value="<?= htmlspecialchars($siteTagline) ?>" maxlength="200">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Contact Email</label>
                                <input class="form-input" name="settings[contact_email]" type="email" value="<?= htmlspecialchars($contactEmail) ?>">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Site Description (SEO)</label>
                            <textarea class="form-input" name="settings[site_description]" rows="3" maxlength="500"><?= htmlspecialchars($siteDescription) ?></textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Footer Text</label>
                            <input class="form-input" name="settings[footer_text]" value="<?= htmlspecialchars($footerText) ?>" maxlength="255">
                        </div>
                    </div>
                </div>

                <div class="admin-card">
                    <div class="admin-card-header">
                        <div class="admin-card-title">🔧 Feature Settings</div>
                    </div>
                    <div class="admin-card-body">
                        <div style="display:flex;gap:32px;flex-wrap:wrap;">
                            <label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:0.95rem;">
                                <input type="hidden" name="settings[enable_registration]" value="0">
                                <input type="checkbox" name="settings[enable_registration]" value="1" <?= $enableRegistration === '1' ? 'checked' : '' ?> style="width:auto;">
                                Enable User Registration
                            </label>
                            <label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:0.95rem;">
                                <input type="hidden" name="settings[maintenance_mode]" value="0">
                                <input type="checkbox" name="settings[maintenance_mode]" value="1" <?= $maintenanceMode === '1' ? 'checked' : '' ?> style="width:auto;">
                                Maintenance Mode
                            </label>
                        </div>
                        <?php if ($maintenanceMode === '1'): ?>
                        <div style="margin-top:12px;padding:10px 14px;background:rgba(255,193,7,0.1);border:1px solid rgba(255,193,7,0.3);border-radius:var(--radius-sm);color:#ffc107;font-size:0.85rem;">
                            ⚠️ Maintenance mode is ON. Only admins can access the site.
                        </div>
                        <?php endif; ?>
                    </div>
                </div>

                <div class="admin-card">
                    <div class="admin-card-header">
                        <div class="admin-card-title">🎨 Appearance</div>
                    </div>
                    <div class="admin-card-body">
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
                            <div class="form-group">
                                <label class="form-label">Default Theme</label>
                                <select class="form-select" name="settings[default_theme]">
                                    <option value="dark" <?= $defaultTheme === 'dark' ? 'selected' : '' ?>>Dark</option>
                                    <option value="light" <?= $defaultTheme === 'light' ? 'selected' : '' ?>>Light</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Font Family</label>
                                <select class="form-select" name="settings[font_family]">
                                    <option value="Inter" <?= $fontFamily === 'Inter' ? 'selected' : '' ?>>Inter</option>
                                    <option value="Outfit" <?= $fontFamily === 'Outfit' ? 'selected' : '' ?>>Outfit</option>
                                    <option value="System" <?= $fontFamily === 'System' ? 'selected' : '' ?>>System UI</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Primary Color</label>
                                <div style="display:flex;gap:8px;align-items:center;">
                                    <input type="color" name="settings[primary_color]" value="<?= htmlspecialchars($primaryColor) ?>" style="width:48px;height:48px;padding:4px;border-radius:var(--radius-sm);cursor:pointer;">
                                    <input type="text" class="form-input" value="<?= htmlspecialchars($primaryColor) ?>" style="width:120px;font-family:monospace;" readonly>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Background Color</label>
                                <div style="display:flex;gap:8px;align-items:center;">
                                    <input type="color" name="settings[bg_color]" value="<?= htmlspecialchars($bgColor) ?>" style="width:48px;height:48px;padding:4px;border-radius:var(--radius-sm);cursor:pointer;">
                                    <input type="text" class="form-input" value="<?= htmlspecialchars($bgColor) ?>" style="width:120px;font-family:monospace;" readonly>
                                </div>
                            </div>
                        </div>
                        <div style="margin-top:16px;padding:12px 16px;background:var(--bg-glass-strong);border-radius:var(--radius-md);">
                            <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:8px;">Preview</div>
                            <div style="display:flex;gap:12px;align-items:center;">
                                <span style="background:<?= htmlspecialchars($primaryColor) ?>;width:32px;height:32px;border-radius:var(--radius-sm);"></span>
                                <span style="font-weight:600;color:<?= htmlspecialchars($primaryColor) ?>;">Primary Color</span>
                                <span style="background:<?= htmlspecialchars($bgColor) ?>;width:32px;height:32px;border-radius:var(--radius-sm);border:1px solid var(--border-color);"></span>
                                <span style="color:var(--text-muted);">Background</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="display:flex;gap:12px;margin-bottom:40px;">
                    <button type="submit" class="btn btn-primary" id="settingsSubmitBtn">💾 Save All Settings</button>
                </div>
            </form>
        </main>
    </div>
</div>

<script src="/assets/js/main.js"></script>
<script src="/assets/js/admin.js"></script>
<script>
document.querySelectorAll('input[type="color"]').forEach(input => {
    const textInput = input.nextElementSibling;
    if (textInput) {
        input.addEventListener('input', () => {
            textInput.value = input.value;
        });
    }
});
</script>
</body>
</html>
