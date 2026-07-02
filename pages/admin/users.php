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

$search = $_GET['search'] ?? '';
$roleFilter = $_GET['role'] ?? '';
$page = isset($_GET['p']) ? max(1, (int)$_GET['p']) : 1;
$perPage = 20;
$offset = ($page - 1) * $perPage;

$where = [];
$params = [];
if ($search) {
    $where[] = "(u.username LIKE ? OR u.name LIKE ? OR u.email LIKE ? OR u.role_number LIKE ? OR u.school LIKE ?)";
    $s = "%$search%";
    $params[] = $s; $params[] = $s; $params[] = $s; $params[] = $s; $params[] = $s;
}
if ($roleFilter) {
    $where[] = "u.role = ?";
    $params[] = $roleFilter;
}
$whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

$stmt = $db->prepare("SELECT COUNT(*) as c FROM users u $whereClause");
$stmt->execute($params);
$totalUsers = (int)$stmt->fetch()['c'];
$totalPages = max(1, ceil($totalUsers / $perPage));

$stmt = $db->prepare("SELECT u.*, (SELECT COUNT(*) FROM reading_progress WHERE user_id = u.id AND progress >= 95) as books_read, (SELECT COUNT(*) FROM bookmarks WHERE user_id = u.id) as bookmarks FROM users u $whereClause ORDER BY u.created_at DESC LIMIT ? OFFSET ?");
$stmt->execute(array_merge($params, [$perPage, $offset]));
$users = $stmt->fetchAll();

$errors = [];
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['action']) && $_POST['action'] === 'edit_user') {
        $userId = (int)($_POST['user_id'] ?? 0);
        $role = sanitize($_POST['role'] ?? 'student');
        $status = sanitize($_POST['status'] ?? 'active');
        $newPassword = $_POST['new_password'] ?? '';

        $stmt = $db->prepare("UPDATE users SET role=?, status=? WHERE id=?");
        $stmt->execute([$role, $status, $userId]);

        if (!empty($newPassword)) {
            $hashed = password_hash($newPassword, PASSWORD_DEFAULT);
            $stmt = $db->prepare("UPDATE users SET password=? WHERE id=?");
            $stmt->execute([$hashed, $userId]);
            $success = 'User updated and password reset';
        } else {
            $success = 'User updated successfully';
        }
        logActivity($user['id'], 'update_user', "Updated user #$userId: role=$role, status=$status");
    }

    if (isset($_POST['action']) && $_POST['action'] === 'delete_user') {
        $userId = (int)($_POST['user_id'] ?? 0);
        $stmt = $db->prepare("DELETE FROM users WHERE id=? AND role != 'admin'");
        $stmt->execute([$userId]);
        if ($stmt->rowCount() > 0) {
            $stmt = $db->prepare("DELETE FROM reading_progress WHERE user_id=?");
            $stmt->execute([$userId]);
            $stmt = $db->prepare("DELETE FROM bookmarks WHERE user_id=?");
            $stmt->execute([$userId]);
            $success = 'User deleted';
            logActivity($user['id'], 'delete_user', "Deleted user #$userId");
        } else {
            $errors[] = 'Cannot delete admin users';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Users - Admin - CBSE Class 9 Portal</title>
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
            <a href="/admin/users" class="active"><span class="nav-icon">👥</span> Users</a>
            <a href="/admin/uploads"><span class="nav-icon">📁</span> Uploads</a>
            <a href="/admin/announcements"><span class="nav-icon">📢</span> Announcements</a>
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
                <div class="admin-topbar-title">User Management</div>
            </div>
            <div class="admin-topbar-actions">
                <a href="/" class="btn btn-sm btn-ghost">View Site</a>
                <a href="/logout" class="btn btn-sm btn-ghost" style="color:#ff1744;">Logout</a>
            </div>
        </header>

        <main class="admin-content">
            <div class="admin-page-header">
                <div>
                    <h1 class="admin-page-title">👥 Users</h1>
                    <p class="admin-page-desc">Manage registered users (<?= $totalUsers ?> total)</p>
                </div>
            </div>

            <?php if ($success): ?>
            <div style="padding:12px 16px;background:rgba(0,200,83,0.1);border:1px solid rgba(0,200,83,0.3);border-radius:var(--radius-md);margin-bottom:20px;color:#00c853;font-weight:500;"><?= htmlspecialchars($success) ?></div>
            <?php endif; ?>
            <?php if (!empty($errors)): ?>
            <div style="padding:12px 16px;background:rgba(255,23,68,0.1);border:1px solid rgba(255,23,68,0.3);border-radius:var(--radius-md);margin-bottom:20px;color:#ff1744;font-weight:500;">
                <?php foreach ($errors as $e): ?><div><?= htmlspecialchars($e) ?></div><?php endforeach; ?>
            </div>
            <?php endif; ?>

            <div class="admin-card">
                <div class="admin-card-header">
                    <div class="admin-card-title">All Users</div>
                    <form method="GET" action="/admin/users" style="display:flex;gap:12px;flex-wrap:wrap;">
                        <input type="text" name="search" placeholder="Search name, email, school..." value="<?= htmlspecialchars($search) ?>" style="width:220px;padding:8px 12px;font-size:0.85rem;">
                        <select name="role" style="width:130px;padding:8px 12px;font-size:0.85rem;">
                            <option value="">All Roles</option>
                            <option value="student" <?= $roleFilter === 'student' ? 'selected' : '' ?>>Student</option>
                            <option value="admin" <?= $roleFilter === 'admin' ? 'selected' : '' ?>>Admin</option>
                        </select>
                        <button type="submit" class="btn btn-sm btn-secondary">Filter</button>
                        <a href="/admin/users" class="btn btn-sm btn-ghost">Clear</a>
                    </form>
                </div>
                <div class="admin-card-body" style="padding:0;">
                    <div class="admin-table-wrap">
                        <table class="admin-table" id="userTable">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Role Number</th>
                                    <th>School</th>
                                    <th>User ID</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Books Read</th>
                                    <th>Joined</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if ($users): foreach ($users as $u): ?>
                                <tr>
                                    <td>
                                        <div style="display:flex;align-items:center;gap:10px;">
                                            <div style="width:34px;height:34px;border-radius:50%;background:var(--accent-glow);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.8rem;color:var(--accent);flex-shrink:0;">
                                                <?= strtoupper(substr($u['username'] ?? 'U', 0, 1)) ?>
                                            </div>
                                            <div>
                                                <div style="font-weight:600;font-size:0.9rem;"><?= htmlspecialchars($u['username'] ?? $u['name'] ?? 'N/A') ?></div>
                                                <div style="font-size:0.78rem;color:var(--text-muted);"><?= htmlspecialchars($u['email'] ?? '') ?></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style="font-size:0.85rem;color:var(--text-muted);"><?= htmlspecialchars($u['role_number'] ?? '-') ?></td>
                                    <td style="font-size:0.85rem;color:var(--text-muted);"><?= htmlspecialchars($u['school'] ?? '-') ?></td>
                                    <td style="font-size:0.78rem;color:var(--text-muted);font-family:monospace;">#<?= $u['id'] ?></td>
                                    <td><span class="status-badge <?= ($u['role'] ?? '') === 'admin' ? 'status-active' : 'status-pending' ?>"><?= htmlspecialchars($u['role'] ?? 'student') ?></span></td>
                                    <td><span class="status-badge <?= ($u['status'] ?? 'active') === 'active' ? 'status-active' : ($u['status'] === 'blocked' ? 'status-blocked' : 'status-inactive') ?>"><?= htmlspecialchars($u['status'] ?? 'active') ?></span></td>
                                    <td style="font-size:0.85rem;color:var(--text-muted);"><?= (int)$u['books_read'] ?> read · <?= (int)$u['bookmarks'] ?> bookmarks</td>
                                    <td style="font-size:0.85rem;color:var(--text-muted);"><?= timeAgo($u['created_at']) ?></td>
                                    <td>
                                        <div class="actions">
                                            <button onclick="openEditUserModal(<?= $u['id'] ?>)" title="Edit">✏️</button>
                                            <form method="POST" style="display:inline;" onsubmit="return confirm('Delete user <?= htmlspecialchars($u['username']) ?>? This cannot be undone.')">
                                                <input type="hidden" name="action" value="delete_user">
                                                <input type="hidden" name="user_id" value="<?= $u['id'] ?>">
                                                <button type="submit" class="btn-delete" title="Delete">🗑</button>
                                            </form>
                                        </div>
                                    </td>
                                </tr>
                                <?php endforeach; else: ?>
                                <tr><td colspan="9"><div class="table-empty"><div class="empty-icon">👥</div>No users found</div></td></tr>
                                <?php endif; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
                <?php if ($totalPages > 1): ?>
                <div style="display:flex;justify-content:center;gap:8px;padding:16px 24px;border-top:1px solid var(--border-color);">
                    <?php for ($i = 1; $i <= $totalPages; $i++): ?>
                    <a href="/admin/users?p=<?= $i ?>&search=<?= urlencode($search) ?>&role=<?= urlencode($roleFilter) ?>" class="btn btn-sm <?= $i === $page ? 'btn-primary' : 'btn-ghost' ?>"><?= $i ?></a>
                    <?php endfor; ?>
                </div>
                <?php endif; ?>
            </div>

            <div class="admin-card" id="editUserCard" style="display:none;">
                <div class="admin-card-header">
                    <div class="admin-card-title">Edit User</div>
                    <button class="btn btn-sm btn-ghost" onclick="closeEditUserModal()">✕ Close</button>
                </div>
                <div class="admin-card-body">
                    <form method="POST" class="admin-form">
                        <input type="hidden" name="action" value="edit_user">
                        <input type="hidden" name="user_id" id="editUserId" value="0">
                        <div class="form-group">
                            <label class="form-label">Username</label>
                            <input class="form-input" id="editUsername" disabled style="opacity:0.6;">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Email</label>
                            <input class="form-input" id="editEmail" disabled style="opacity:0.6;">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Role</label>
                            <select class="form-select" name="role" id="editRole">
                                <option value="student">Student</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Status</label>
                            <select class="form-select" name="status" id="editStatus">
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="blocked">Blocked</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">New Password <span style="font-weight:400;color:var(--text-muted);font-size:0.8rem;">(leave empty to keep current)</span></label>
                            <input class="form-input" name="new_password" type="text" placeholder="Enter new password" autocomplete="off">
                        </div>
                        <div style="display:flex;gap:12px;">
                            <button type="submit" class="btn btn-primary">Save Changes</button>
                            <button type="button" class="btn btn-ghost" onclick="closeEditUserModal()">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    </div>
</div>

<script src="/assets/js/main.js"></script>
<script src="/assets/js/admin.js"></script>
<script>
const userData = <?= json_encode($users) ?>;

function openEditUserModal(id) {
    const u = userData.find(u => u.id == id);
    if (!u) return;
    const card = document.getElementById('editUserCard');
    card.style.display = 'block';
    card.scrollIntoView({ behavior: 'smooth' });
    document.getElementById('editUserId').value = u.id;
    document.getElementById('editUsername').value = u.username || u.name || '';
    document.getElementById('editEmail').value = u.email || '';
    document.getElementById('editRole').value = u.role || 'student';
    document.getElementById('editStatus').value = u.status || 'active';
}

function closeEditUserModal() {
    document.getElementById('editUserCard').style.display = 'none';
}
</script>
</body>
</html>
