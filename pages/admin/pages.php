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

function generateAccessCode($length = 8) {
    $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $code = '';
    for ($i = 0; $i < $length; $i++) {
        $code .= $chars[random_int(0, strlen($chars) - 1)];
    }
    return $code;
}

$errors = [];
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if ($_POST['action'] === 'create_page' || $_POST['action'] === 'edit_page') {
        $title = sanitize($_POST['title'] ?? '');
        $description = sanitize($_POST['description'] ?? '');
        $content = $_POST['content'] ?? '';
        $accessCode = sanitize($_POST['access_code'] ?? generateAccessCode());
        $pageId = (int)($_POST['page_id'] ?? 0);

        if (empty($title)) $errors[] = 'Title is required';

        if (empty($errors)) {
            if ($_POST['action'] === 'create_page') {
                $stmt = $db->prepare("SELECT COUNT(*) as c FROM hidden_pages WHERE access_code=?");
                $stmt->execute([$accessCode]);
                if ((int)$stmt->fetch()['c'] > 0) {
                    $accessCode = generateAccessCode();
                }
                $stmt = $db->prepare("INSERT INTO hidden_pages (title, description, content, access_code, created_by, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))");
                $stmt->execute([$title, $description, $content, $accessCode, $user['id']]);
                $success = 'Hidden page created. Access code: ' . $accessCode;
                logActivity($user['id'], 'create_hidden_page', "Created hidden page: $title");
            } else {
                $stmt = $db->prepare("UPDATE hidden_pages SET title=?, description=?, content=?, access_code=? WHERE id=?");
                $stmt->execute([$title, $description, $content, $accessCode, $pageId]);
                $success = 'Hidden page updated';
                logActivity($user['id'], 'update_hidden_page', "Updated hidden page: $title");
            }
        }
    }

    if ($_POST['action'] === 'delete_page' && isset($_POST['page_id'])) {
        $stmt = $db->prepare("DELETE FROM hidden_pages WHERE id=?");
        $stmt->execute([(int)$_POST['page_id']]);
        $stmt = $db->prepare("DELETE FROM user_access WHERE page_id=?");
        $stmt->execute([(int)$_POST['page_id']]);
        $success = 'Hidden page deleted';
        logActivity($user['id'], 'delete_hidden_page', "Deleted hidden page #{$_POST['page_id']}");
    }

    if ($_POST['action'] === 'toggle_status' && isset($_POST['page_id'])) {
        $stmt = $db->prepare("UPDATE hidden_pages SET is_active = NOT is_active WHERE id=?");
        $stmt->execute([(int)$_POST['page_id']]);
        $success = 'Page status toggled';
    }

    if ($_POST['action'] === 'add_page_item' && isset($_POST['page_id'])) {
        $pageId = (int)$_POST['page_id'];
        $itemType = sanitize($_POST['item_type'] ?? '');
        $itemTitle = sanitize($_POST['item_title'] ?? '');
        $itemContent = $_POST['item_content'] ?? '';

        $itemFile = '';
        if (!empty($_FILES['item_file']['name'])) {
            $upload = uploadFile($_FILES['item_file'], __DIR__ . '/../../uploads/hidden_items', ['pdf','jpg','jpeg','png','gif','webp','doc','docx','ppt','pptx','mp4']);
            if (isset($upload['error'])) {
                $errors[] = $upload['error'];
            } else {
                $itemFile = '/uploads/hidden_items/' . $upload['filename'];
            }
        }

        if (empty($errors)) {
            $stmt = $db->prepare("INSERT INTO hidden_page_items (page_id, item_type, title, content, file_path, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))");
            $stmt->execute([$pageId, $itemType, $itemTitle, $itemContent, $itemFile ?: null]);
            $success = 'Item added to page';
        }
    }

    if ($_POST['action'] === 'delete_page_item' && isset($_POST['item_id'])) {
        $stmt = $db->prepare("DELETE FROM hidden_page_items WHERE id=?");
        $stmt->execute([(int)$_POST['item_id']]);
        $success = 'Item removed';
    }
}

$stmt = $db->query("SELECT hp.*, u.username as creator_name, (SELECT COUNT(*) FROM user_access WHERE page_id = hp.id) as access_count FROM hidden_pages hp LEFT JOIN users u ON hp.created_by = u.id ORDER BY hp.created_at DESC");
$pages = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hidden Pages - Admin - CBSE Class 9 Portal</title>
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
            <a href="/admin/pages" class="active"><span class="nav-icon">🔒</span> Hidden Pages</a>
            <a href="/admin/settings"><span class="nav-icon">⚙️</span> Settings</a>
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
                <div class="admin-topbar-title">Hidden Pages</div>
            </div>
            <div class="admin-topbar-actions">
                <a href="/" class="btn btn-sm btn-ghost">View Site</a>
                <a href="/logout" class="btn btn-sm btn-ghost" style="color:#ff1744;">Logout</a>
            </div>
        </header>

        <main class="admin-content">
            <div class="admin-page-header">
                <div>
                    <h1 class="admin-page-title">🔒 Hidden Pages</h1>
                    <p class="admin-page-desc">Access-restricted pages with unique entry codes (<?= count($pages) ?> total)</p>
                </div>
                <button class="btn btn-primary" onclick="openPageForm()">➕ Create Hidden Page</button>
            </div>

            <?php if ($success): ?>
            <div style="padding:12px 16px;background:rgba(0,200,83,0.1);border:1px solid rgba(0,200,83,0.3);border-radius:var(--radius-md);margin-bottom:20px;color:#00c853;font-weight:500;word-break:break-all;"><?= htmlspecialchars($success) ?></div>
            <?php endif; ?>
            <?php if (!empty($errors)): ?>
            <div style="padding:12px 16px;background:rgba(255,23,68,0.1);border:1px solid rgba(255,23,68,0.3);border-radius:var(--radius-md);margin-bottom:20px;color:#ff1744;font-weight:500;">
                <?php foreach ($errors as $e): ?><div><?= htmlspecialchars($e) ?></div><?php endforeach; ?>
            </div>
            <?php endif; ?>

            <div class="admin-card" id="pageFormCard" style="display:none;margin-bottom:24px;">
                <div class="admin-card-header">
                    <div class="admin-card-title" id="pageFormTitle">Create Hidden Page</div>
                    <button class="btn btn-sm btn-ghost" onclick="closePageForm()">✕ Close</button>
                </div>
                <div class="admin-card-body">
                    <form method="POST" class="admin-form admin-form-wide">
                        <input type="hidden" name="action" id="pageAction" value="create_page">
                        <input type="hidden" name="page_id" id="editPageId" value="0">
                        <div class="form-group">
                            <label class="form-label">Title *</label>
                            <input class="form-input" name="title" id="pageTitle" required maxlength="255" placeholder="e.g. Class 9 Topper Notes">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Description</label>
                            <textarea class="form-input" name="description" id="pageDescription" rows="2" placeholder="Brief description of this hidden page..."></textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Access Code</label>
                            <div style="display:flex;gap:8px;">
                                <input class="form-input" name="access_code" id="pageAccessCode" value="<?= generateAccessCode() ?>" style="font-family:monospace;font-weight:700;letter-spacing:0.1em;flex:1;">
                                <button type="button" class="btn btn-sm btn-secondary" onclick="generateNewCode()">🔄 Generate</button>
                                <button type="button" class="btn btn-sm btn-ghost" onclick="copyAccessCode()">📋 Copy</button>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Content</label>
                            <textarea class="form-input" name="content" id="pageContent" rows="10" placeholder="Write the content for this hidden page... HTML supported."></textarea>
                        </div>
                        <div style="display:flex;gap:12px;">
                            <button type="submit" class="btn btn-primary" id="pageSubmitBtn">Create Hidden Page</button>
                            <button type="button" class="btn btn-ghost" onclick="closePageForm()">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>

            <?php if ($pages): foreach ($pages as $p): ?>
            <div class="admin-card" style="margin-bottom:16px;border-left:3px solid <?= $p['is_active'] ? 'var(--accent)' : 'var(--border-color)' ?>;">
                <div class="admin-card-header">
                    <div style="display:flex;align-items:center;gap:12px;">
                        <span style="font-size:1.3rem;">🔒</span>
                        <div>
                            <div class="admin-card-title"><?= htmlspecialchars($p['title']) ?></div>
                            <div style="font-size:0.8rem;color:var(--text-muted);">
                                Code: <span class="access-code"><?= htmlspecialchars($p['access_code']) ?></span>
                                · <?= (int)$p['access_count'] ?> accesses
                                · <?= timeAgo($p['created_at']) ?>
                            </div>
                        </div>
                    </div>
                    <div style="display:flex;gap:8px;align-items:center;">
                        <form method="POST" style="display:inline;">
                            <input type="hidden" name="action" value="toggle_status">
                            <input type="hidden" name="page_id" value="<?= $p['id'] ?>">
                            <button type="submit" class="btn btn-sm <?= $p['is_active'] ? 'btn-primary' : 'btn-ghost' ?>" title="Toggle ON/OFF">
                                <?= $p['is_active'] ? '🟢 ON' : '🔴 OFF' ?>
                            </button>
                        </form>
                        <button onclick="editPage(<?= $p['id'] ?>)" class="btn btn-sm btn-ghost" title="Edit">✏️</button>
                        <button onclick="managePageItems(<?= $p['id'] ?>)" class="btn btn-sm btn-ghost" title="Add Items">📦</button>
                        <a href="/hidden?page=<?= $p['id'] ?>" target="_blank" class="btn btn-sm btn-ghost" title="Preview">👁️</a>
                        <form method="POST" style="display:inline;" onsubmit="return confirm('Delete this hidden page and all associated data?')">
                            <input type="hidden" name="action" value="delete_page">
                            <input type="hidden" name="page_id" value="<?= $p['id'] ?>">
                            <button type="submit" class="btn btn-sm btn-ghost" style="color:#ff1744;" title="Delete">🗑</button>
                        </form>
                    </div>
                </div>
                <?php if (!empty($p['description'])): ?>
                <div class="admin-card-body" style="padding-top:0;">
                    <p style="color:var(--text-secondary);font-size:0.9rem;"><?= htmlspecialchars($p['description']) ?></p>
                </div>
                <?php endif; ?>
            </div>
            <?php endforeach; else: ?>
            <div class="admin-card">
                <div class="admin-card-body">
                    <div class="table-empty">
                        <div class="empty-icon">🔒</div>
                        <div>No hidden pages yet</div>
                        <button class="btn btn-primary btn-sm" style="margin-top:12px;" onclick="openPageForm()">Create First Page</button>
                    </div>
                </div>
            </div>
            <?php endif; ?>

            <div class="admin-card" id="itemManager" style="display:none;">
                <div class="admin-card-header">
                    <div class="admin-card-title" id="itemManagerTitle">Manage Page Items</div>
                    <button class="btn btn-sm btn-ghost" onclick="closeItemManager()">✕ Close</button>
                </div>
                <div class="admin-card-body">
                    <div id="itemList"></div>
                    <hr style="border:none;border-top:1px solid var(--border-color);margin:20px 0;">
                    <h4 style="font-weight:600;margin-bottom:16px;">Add Item</h4>
                    <form method="POST" enctype="multipart/form-data" class="admin-form admin-form-wide">
                        <input type="hidden" name="action" value="add_page_item">
                        <input type="hidden" name="page_id" id="itemPageId" value="0">
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
                            <div class="form-group">
                                <label class="form-label">Item Title</label>
                                <input class="form-input" name="item_title" placeholder="e.g. Chapter 1 Notes">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Type</label>
                                <select class="form-select" name="item_type">
                                    <option value="book">Book</option>
                                    <option value="note">Note</option>
                                    <option value="assignment">Assignment</option>
                                    <option value="pdf">PDF</option>
                                    <option value="video">Video</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Content (optional)</label>
                            <textarea class="form-input" name="item_content" rows="4" placeholder="Enter text content or description..."></textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label">File Upload</label>
                            <input type="file" name="item_file" style="padding:8px;">
                            <div style="font-size:0.78rem;color:var(--text-muted);margin-top:4px;">PDF, images, documents, videos</div>
                        </div>
                        <button type="submit" class="btn btn-primary btn-sm">Add Item</button>
                    </form>
                </div>
            </div>
        </main>
    </div>
</div>

<script src="/assets/js/main.js"></script>
<script src="/assets/js/admin.js"></script>
<script>
const pageData = <?= json_encode($pages) ?>;

function openPageForm() {
    document.getElementById('pageFormCard').style.display = 'block';
    document.getElementById('pageFormCard').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('pageFormTitle').textContent = 'Create Hidden Page';
    document.getElementById('pageAction').value = 'create_page';
    document.getElementById('editPageId').value = '0';
    document.getElementById('pageSubmitBtn').textContent = 'Create Hidden Page';
    document.getElementById('pageTitle').value = '';
    document.getElementById('pageDescription').value = '';
    document.getElementById('pageContent').value = '';
    generateNewCode();
}

function closePageForm() {
    document.getElementById('pageFormCard').style.display = 'none';
}

function editPage(id) {
    const p = pageData.find(x => x.id == id);
    if (!p) return;
    document.getElementById('pageFormCard').style.display = 'block';
    document.getElementById('pageFormCard').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('pageFormTitle').textContent = 'Edit Hidden Page';
    document.getElementById('pageAction').value = 'edit_page';
    document.getElementById('editPageId').value = p.id;
    document.getElementById('pageSubmitBtn').textContent = 'Update Page';
    document.getElementById('pageTitle').value = p.title || '';
    document.getElementById('pageDescription').value = p.description || '';
    document.getElementById('pageAccessCode').value = p.access_code || '';
    document.getElementById('pageContent').value = p.content || '';
}

function generateNewCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    document.getElementById('pageAccessCode').value = code;
}

function copyAccessCode() {
    const code = document.getElementById('pageAccessCode');
    if (code) {
        navigator.clipboard.writeText(code.value);
        window.showToast?.('Access code copied', 'success');
    }
}

async function managePageItems(pageId) {
    const manager = document.getElementById('itemManager');
    document.getElementById('itemPageId').value = pageId;
    document.getElementById('itemManagerTitle').textContent = `Items for Page #${pageId}`;
    manager.style.display = 'block';
    manager.scrollIntoView({ behavior: 'smooth' });

    try {
        const res = await fetch('/api/pages.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'list_items', page_id: pageId }) });
        const data = await res.json();
        const list = document.getElementById('itemList');
        if (data.length > 0) {
            list.innerHTML = data.map(item => `
                <div class="access-code-card">
                    <div>
                        <div style="font-weight:600;">${item.title || 'Untitled'}</div>
                        <div class="access-code-uses">${item.item_type} · ${item.file_path ? '📄 has file' : '📝 text content'}</div>
                    </div>
                    <form method="POST" style="display:inline;" onsubmit="return confirm('Remove this item?')">
                        <input type="hidden" name="action" value="delete_page_item">
                        <input type="hidden" name="item_id" value="${item.id}">
                        <button type="submit" class="btn btn-sm btn-ghost" style="color:#ff1744;">🗑</button>
                    </form>
                </div>
            `).join('');
        } else {
            list.innerHTML = '<div class="text-muted" style="text-align:center;padding:20px;">No items added yet.</div>';
        }
    } catch (err) {
        document.getElementById('itemList').innerHTML = '<div class="text-muted" style="text-align:center;padding:20px;">Failed to load items</div>';
    }
}

function closeItemManager() {
    document.getElementById('itemManager').style.display = 'none';
}
</script>
</body>
</html>
