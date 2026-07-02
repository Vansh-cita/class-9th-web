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

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if ($_POST['action'] === 'create_announcement' || $_POST['action'] === 'edit_announcement') {
        $title = sanitize($_POST['title'] ?? '');
        $content = $_POST['content'] ?? '';
        $type = sanitize($_POST['type'] ?? 'general');
        $isPinned = isset($_POST['is_pinned']) ? 1 : 0;
        $notifyUsers = isset($_POST['notify_users']) ? 1 : 0;
        $announcementId = (int)($_POST['announcement_id'] ?? 0);

        if (empty($title)) $errors[] = 'Title is required';
        if (empty($content)) $errors[] = 'Content is required';

        if (empty($errors)) {
            if ($_POST['action'] === 'create_announcement') {
                $stmt = $db->prepare("INSERT INTO announcements (title, content, type, is_pinned, created_by, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))");
                $stmt->execute([$title, $content, $type, $isPinned, $user['id']]);
                $announcementId = $db->lastInsertId();
                logActivity($user['id'], 'create_announcement', "Created announcement: $title");
                $success = 'Announcement created';
            } else {
                $stmt = $db->prepare("UPDATE announcements SET title=?, content=?, type=?, is_pinned=? WHERE id=?");
                $stmt->execute([$title, $content, $type, $isPinned, $announcementId]);
                logActivity($user['id'], 'update_announcement', "Updated announcement: $title");
                $success = 'Announcement updated';
            }

            if ($notifyUsers) {
                $stmt = $db->query("SELECT id FROM users WHERE role='student'");
                $users = $stmt->fetchAll();
                foreach ($users as $u) {
                    createNotification($u['id'], $title, substr(strip_tags($content), 0, 200), 'announcement');
                }
                $success .= ' and notifications sent';
            }
        }
    }

    if ($_POST['action'] === 'delete_announcement' && isset($_POST['announcement_id'])) {
        $stmt = $db->prepare("DELETE FROM announcements WHERE id=?");
        $stmt->execute([(int)$_POST['announcement_id']]);
        logActivity($user['id'], 'delete_announcement', "Deleted announcement #{$_POST['announcement_id']}");
        $success = 'Announcement deleted';
    }

    if ($_POST['action'] === 'toggle_pin' && isset($_POST['announcement_id'])) {
        $stmt = $db->prepare("UPDATE announcements SET is_pinned = NOT is_pinned WHERE id=?");
        $stmt->execute([(int)$_POST['announcement_id']]);
        $success = 'Pin status toggled';
    }
}

$stmt = $db->query("SELECT a.*, u.username as author_name FROM announcements a LEFT JOIN users u ON a.created_by = u.id ORDER BY a.is_pinned DESC, a.created_at DESC");
$announcements = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Announcements - Admin - CBSE Class 9 Portal</title>
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
            <a href="/admin/announcements" class="active"><span class="nav-icon">📢</span> Announcements</a>
            <a href="/admin/pages"><span class="nav-icon">🔒</span> Hidden Pages</a>
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
                <div class="admin-topbar-title">Announcement Management</div>
            </div>
            <div class="admin-topbar-actions">
                <a href="/" class="btn btn-sm btn-ghost">View Site</a>
                <a href="/logout" class="btn btn-sm btn-ghost" style="color:#ff1744;">Logout</a>
            </div>
        </header>

        <main class="admin-content">
            <div class="admin-page-header">
                <div>
                    <h1 class="admin-page-title">📢 Announcements</h1>
                    <p class="admin-page-desc">Create and manage announcements (<?= count($announcements) ?> total)</p>
                </div>
                <button class="btn btn-primary" onclick="openAnnouncementForm()">➕ New Announcement</button>
            </div>

            <?php if ($success): ?>
            <div style="padding:12px 16px;background:rgba(0,200,83,0.1);border:1px solid rgba(0,200,83,0.3);border-radius:var(--radius-md);margin-bottom:20px;color:#00c853;font-weight:500;"><?= htmlspecialchars($success) ?></div>
            <?php endif; ?>
            <?php if (!empty($errors)): ?>
            <div style="padding:12px 16px;background:rgba(255,23,68,0.1);border:1px solid rgba(255,23,68,0.3);border-radius:var(--radius-md);margin-bottom:20px;color:#ff1744;font-weight:500;">
                <?php foreach ($errors as $e): ?><div><?= htmlspecialchars($e) ?></div><?php endforeach; ?>
            </div>
            <?php endif; ?>

            <div class="admin-card" id="announcementFormCard" style="display:none;margin-bottom:24px;">
                <div class="admin-card-header">
                    <div class="admin-card-title" id="annFormTitle">Create Announcement</div>
                    <button class="btn btn-sm btn-ghost" onclick="closeAnnouncementForm()">✕ Close</button>
                </div>
                <div class="admin-card-body">
                    <form method="POST" class="admin-form admin-form-wide" id="announcementForm">
                        <input type="hidden" name="action" id="annAction" value="create_announcement">
                        <input type="hidden" name="announcement_id" id="editAnnId" value="0">
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
                            <div class="form-group">
                                <label class="form-label">Title *</label>
                                <input class="form-input" name="title" id="annTitle" required maxlength="255" placeholder="e.g. Half-Yearly Exam Schedule">
                            </div>
                            <div style="display:flex;gap:16px;">
                                <div class="form-group" style="flex:1;">
                                    <label class="form-label">Type</label>
                                    <select class="form-select" name="type" id="annType">
                                        <option value="general">General</option>
                                        <option value="academic">Academic</option>
                                        <option value="exam">Exam</option>
                                        <option value="event">Event</option>
                                    </select>
                                </div>
                                <div class="form-group" style="display:flex;align-items:flex-end;gap:16px;padding-bottom:4px;">
                                    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:0.9rem;">
                                        <input type="checkbox" name="is_pinned" value="1"> 📌 Pinned
                                    </label>
                                    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:0.9rem;">
                                        <input type="checkbox" name="notify_users" value="1"> 🔔 Notify all users
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Content *</label>
                            <textarea class="form-input" name="content" id="annContent" rows="10" placeholder="Write your announcement content here... You can use HTML for formatting." oninput="updatePreview()"></textarea>
                        </div>
                        <div class="notif-preview" id="annPreview" style="margin-bottom:16px;">
                            <div class="notif-preview-title" id="previewTitle">📢 Announcement Title</div>
                            <div class="notif-preview-body" id="previewBody">Preview will appear here as you type...</div>
                        </div>
                        <div style="display:flex;gap:12px;">
                            <button type="submit" class="btn btn-primary" id="annSubmitBtn">Publish Announcement</button>
                            <button type="button" class="btn btn-ghost" onclick="closeAnnouncementForm()">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>

            <div id="announcementList">
                <?php if ($announcements): foreach ($announcements as $a): ?>
                <div class="admin-card" style="border-left:3px solid <?= $a['is_pinned'] ? 'var(--accent)' : 'var(--border-color)' ?>;">
                    <div class="admin-card-header">
                        <div style="display:flex;align-items:center;gap:12px;">
                            <span style="font-size:1.3rem;"><?= $a['is_pinned'] ? '📌' : '📢' ?></span>
                            <div>
                                <div class="admin-card-title"><?= htmlspecialchars($a['title']) ?></div>
                                <div style="font-size:0.8rem;color:var(--text-muted);">
                                    <span class="status-badge <?= $a['is_pinned'] ? 'status-active' : 'status-inactive' ?>"><?= htmlspecialchars($a['type'] ?? 'general') ?></span>
                                    by <?= htmlspecialchars($a['author_name'] ?? 'Admin') ?> · <?= timeAgo($a['created_at']) ?>
                                </div>
                            </div>
                        </div>
                        <div style="display:flex;gap:8px;">
                            <form method="POST" style="display:inline;">
                                <input type="hidden" name="action" value="toggle_pin">
                                <input type="hidden" name="announcement_id" value="<?= $a['id'] ?>">
                                <button type="submit" class="btn btn-sm btn-ghost" title="Toggle pin">📌</button>
                            </form>
                            <button onclick="editAnnouncement(<?= $a['id'] ?>)" class="btn btn-sm btn-ghost" title="Edit">✏️</button>
                            <form method="POST" style="display:inline;" onsubmit="return confirm('Delete this announcement?')">
                                <input type="hidden" name="action" value="delete_announcement">
                                <input type="hidden" name="announcement_id" value="<?= $a['id'] ?>">
                                <button type="submit" class="btn btn-sm btn-ghost" style="color:#ff1744;" title="Delete">🗑</button>
                            </form>
                        </div>
                    </div>
                    <div class="admin-card-body" style="padding-top:0;">
                        <div style="color:var(--text-secondary);font-size:0.9rem;line-height:1.7;"><?= nl2br(htmlspecialchars($a['content'])) ?></div>
                    </div>
                </div>
                <?php endforeach; else: ?>
                <div class="admin-card">
                    <div class="admin-card-body">
                        <div class="table-empty">
                            <div class="empty-icon">📢</div>
                            <div>No announcements yet</div>
                            <button class="btn btn-primary btn-sm" style="margin-top:12px;" onclick="openAnnouncementForm()">Create First Announcement</button>
                        </div>
                    </div>
                </div>
                <?php endif; ?>
            </div>
        </main>
    </div>
</div>

<script src="/assets/js/main.js"></script>
<script src="/assets/js/admin.js"></script>
<script>
const annData = <?= json_encode($announcements) ?>;

function openAnnouncementForm(data) {
    document.getElementById('announcementFormCard').style.display = 'block';
    document.getElementById('announcementFormCard').scrollIntoView({ behavior: 'smooth' });
    if (data) {
        document.getElementById('annFormTitle').textContent = 'Edit Announcement';
        document.getElementById('annAction').value = 'edit_announcement';
        document.getElementById('editAnnId').value = data.id;
        document.getElementById('annTitle').value = data.title || '';
        document.getElementById('annType').value = data.type || 'general';
        document.getElementById('annContent').value = data.content || '';
        document.getElementById('annSubmitBtn').textContent = 'Update Announcement';
        document.querySelector('[name="is_pinned"]').checked = data.is_pinned == 1;
    } else {
        document.getElementById('annFormTitle').textContent = 'Create Announcement';
        document.getElementById('annAction').value = 'create_announcement';
        document.getElementById('editAnnId').value = '0';
        document.getElementById('announcementForm').reset();
        document.getElementById('annSubmitBtn').textContent = 'Publish Announcement';
    }
    updatePreview();
}

function closeAnnouncementForm() {
    document.getElementById('announcementFormCard').style.display = 'none';
}

function editAnnouncement(id) {
    const a = annData.find(x => x.id == id);
    if (a) openAnnouncementForm(a);
}

function updatePreview() {
    const title = document.getElementById('annTitle').value || 'Announcement Title';
    const content = document.getElementById('annContent').value || 'Preview will appear here as you type...';
    document.getElementById('previewTitle').textContent = '📢 ' + title;
    document.getElementById('previewBody').innerHTML = content;
}
</script>
</body>
</html>
