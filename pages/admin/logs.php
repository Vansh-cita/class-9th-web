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

$actionFilter = $_GET['action'] ?? '';
$userFilter = $_GET['user_id'] ?? '';
$dateFrom = $_GET['date_from'] ?? '';
$dateTo = $_GET['date_to'] ?? '';
$search = $_GET['search'] ?? '';
$page = isset($_GET['p']) ? max(1, (int)$_GET['p']) : 1;
$perPage = 50;
$offset = ($page - 1) * $perPage;

$where = [];
$params = [];
if ($actionFilter) {
    $where[] = "l.action = ?";
    $params[] = $actionFilter;
}
if ($userFilter) {
    $where[] = "l.user_id = ?";
    $params[] = (int)$userFilter;
}
if ($dateFrom) {
    $where[] = "l.created_at >= ?";
    $params[] = $dateFrom . ' 00:00:00';
}
if ($dateTo) {
    $where[] = "l.created_at <= ?";
    $params[] = $dateTo . ' 23:59:59';
}
if ($search) {
    $where[] = "(l.details LIKE ? OR l.action LIKE ? OR l.ip_address LIKE ?)";
    $s = "%$search%";
    $params[] = $s; $params[] = $s; $params[] = $s;
}
$whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

$stmt = $db->prepare("SELECT COUNT(*) as c FROM logs l $whereClause");
$stmt->execute($params);
$totalLogs = (int)$stmt->fetch()['c'];
$totalPages = max(1, ceil($totalLogs / $perPage));

$stmt = $db->prepare("SELECT l.*, u.username FROM logs l LEFT JOIN users u ON l.user_id = u.id $whereClause ORDER BY l.created_at DESC LIMIT ? OFFSET ?");
$stmt->execute(array_merge($params, [$perPage, $offset]));
$logs = $stmt->fetchAll();

$stmt = $db->query("SELECT DISTINCT action FROM logs ORDER BY action ASC");
$distinctActions = $stmt->fetchAll();

$stmt = $db->query("SELECT id, username FROM users ORDER BY username ASC");
$allUsers = $stmt->fetchAll();

$success = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['action']) && $_POST['action'] === 'clear_logs') {
        $db->exec("TRUNCATE TABLE logs");
        logActivity($user['id'], 'clear_logs', 'Cleared all activity logs');
        $success = 'All logs cleared';
    }
}

$logLevels = [
    'create' => 'info',
    'update' => 'info',
    'delete' => 'warn',
    'login' => 'success',
    'logout' => 'info',
    'error' => 'error',
    'upload' => 'info',
    'settings' => 'info',
    'clear' => 'warn',
];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Logs - Admin - CBSE Class 9 Portal</title>
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
            <a href="/admin/settings"><span class="nav-icon">⚙️</span> Settings</a>
            <a href="/admin/logs" class="active"><span class="nav-icon">📋</span> Logs</a>
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
                <div class="admin-topbar-title">Activity Logs</div>
            </div>
            <div class="admin-topbar-actions">
                <label style="display:flex;align-items:center;gap:6px;font-size:0.85rem;color:var(--text-muted);cursor:pointer;">
                    <input type="checkbox" id="autoRefreshToggle" checked style="width:auto;"> Auto-refresh
                </label>
                <a href="/admin/logs?export=csv" class="btn btn-sm btn-secondary" id="exportLogsBtn">📥 Export CSV</a>
                <form method="POST" style="display:inline;" onsubmit="return confirm('Clear ALL activity logs? This cannot be undone.')">
                    <input type="hidden" name="action" value="clear_logs">
                    <button type="submit" class="btn btn-sm btn-ghost" style="color:#ff1744;">🗑 Clear Logs</button>
                </form>
                <a href="/" class="btn btn-sm btn-ghost">View Site</a>
                <a href="/logout" class="btn btn-sm btn-ghost" style="color:#ff1744;">Logout</a>
            </div>
        </header>

        <main class="admin-content">
            <div class="admin-page-header">
                <div>
                    <h1 class="admin-page-title">📋 Activity Logs</h1>
                    <p class="admin-page-desc">Monitor all system activity (<?= $totalLogs ?> total entries)</p>
                </div>
            </div>

            <?php if ($success): ?>
            <div style="padding:12px 16px;background:rgba(0,200,83,0.1);border:1px solid rgba(0,200,83,0.3);border-radius:var(--radius-md);margin-bottom:20px;color:#00c853;font-weight:500;"><?= htmlspecialchars($success) ?></div>
            <?php endif; ?>

            <div class="admin-card">
                <div class="admin-card-header">
                    <div class="admin-card-title">Filters</div>
                    <form method="GET" action="/admin/logs" style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;">
                        <div>
                            <label style="font-size:0.78rem;color:var(--text-muted);display:block;margin-bottom:4px;">Action</label>
                            <select name="action" style="width:150px;padding:8px 12px;font-size:0.85rem;">
                                <option value="">All Actions</option>
                                <?php foreach ($distinctActions as $a): ?>
                                <option value="<?= htmlspecialchars($a['action']) ?>" <?= $actionFilter === $a['action'] ? 'selected' : '' ?>><?= htmlspecialchars($a['action']) ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div>
                            <label style="font-size:0.78rem;color:var(--text-muted);display:block;margin-bottom:4px;">User</label>
                            <select name="user_id" style="width:150px;padding:8px 12px;font-size:0.85rem;">
                                <option value="">All Users</option>
                                <?php foreach ($allUsers as $u): ?>
                                <option value="<?= $u['id'] ?>" <?= $userFilter == $u['id'] ? 'selected' : '' ?>><?= htmlspecialchars($u['username']) ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div>
                            <label style="font-size:0.78rem;color:var(--text-muted);display:block;margin-bottom:4px;">From</label>
                            <input type="date" name="date_from" value="<?= htmlspecialchars($dateFrom) ?>" style="width:150px;padding:8px 12px;font-size:0.85rem;">
                        </div>
                        <div>
                            <label style="font-size:0.78rem;color:var(--text-muted);display:block;margin-bottom:4px;">To</label>
                            <input type="date" name="date_to" value="<?= htmlspecialchars($dateTo) ?>" style="width:150px;padding:8px 12px;font-size:0.85rem;">
                        </div>
                        <div>
                            <label style="font-size:0.78rem;color:var(--text-muted);display:block;margin-bottom:4px;">Search</label>
                            <input type="text" name="search" placeholder="Search logs..." value="<?= htmlspecialchars($search) ?>" style="width:160px;padding:8px 12px;font-size:0.85rem;">
                        </div>
                        <button type="submit" class="btn btn-sm btn-secondary" style="margin-bottom:0;">Filter</button>
                        <a href="/admin/logs" class="btn btn-sm btn-ghost" style="margin-bottom:0;">Clear</a>
                    </form>
                </div>
                <div class="admin-card-body" style="padding:0;">
                    <div class="admin-table-wrap">
                        <table class="admin-table" id="logsTable">
                            <thead>
                                <tr>
                                    <th>Timestamp</th>
                                    <th>User</th>
                                    <th>Action</th>
                                    <th>Details</th>
                                    <th>IP Address</th>
                                    <th>User Agent</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if ($logs): foreach ($logs as $log):
                                    $level = 'info';
                                    foreach ($logLevels as $key => $l) {
                                        if (strpos($log['action'], $key) !== false) {
                                            $level = $l;
                                            break;
                                        }
                                    }
                                ?>
                                <tr>
                                    <td style="white-space:nowrap;font-size:0.8rem;color:var(--text-muted);font-family:monospace;">
                                        <?= date('M j, Y g:i A', strtotime($log['created_at'])) ?>
                                    </td>
                                    <td>
                                        <div style="display:flex;align-items:center;gap:6px;">
                                            <div style="width:28px;height:28px;border-radius:50%;background:var(--bg-glass-strong);display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:700;">
                                                <?= strtoupper(substr($log['username'] ?? 'S', 0, 1)) ?>
                                            </div>
                                            <span style="font-size:0.85rem;"><?= htmlspecialchars($log['username'] ?? 'System') ?></span>
                                        </div>
                                    </td>
                                    <td>
                                        <span class="log-level <?= $level ?>"><?= htmlspecialchars($log['action']) ?></span>
                                    </td>
                                    <td style="font-size:0.85rem;color:var(--text-secondary);max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                                        <?= htmlspecialchars(truncateText($log['details'] ?? '', 100)) ?>
                                    </td>
                                    <td style="font-size:0.8rem;color:var(--text-muted);font-family:monospace;"><?= htmlspecialchars($log['ip_address'] ?? '-') ?></td>
                                    <td style="font-size:0.75rem;color:var(--text-muted);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                                        <?= htmlspecialchars(truncateText($log['user_agent'] ?? '', 60)) ?>
                                    </td>
                                </tr>
                                <?php endforeach; else: ?>
                                <tr><td colspan="6"><div class="table-empty"><div class="empty-icon">📋</div>No logs found matching your criteria</div></td></tr>
                                <?php endif; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
                <?php if ($totalPages > 1): ?>
                <div style="display:flex;justify-content:center;gap:8px;padding:16px 24px;border-top:1px solid var(--border-color);flex-wrap:wrap;">
                    <?php
                    $queryParams = [];
                    if ($actionFilter) $queryParams['action'] = $actionFilter;
                    if ($userFilter) $queryParams['user_id'] = $userFilter;
                    if ($dateFrom) $queryParams['date_from'] = $dateFrom;
                    if ($dateTo) $queryParams['date_to'] = $dateTo;
                    if ($search) $queryParams['search'] = $search;
                    ?>
                    <?php for ($i = 1; $i <= $totalPages; $i++): ?>
                    <a href="/admin/logs?<?= http_build_query(array_merge($queryParams, ['p' => $i])) ?>" class="btn btn-sm <?= $i === $page ? 'btn-primary' : 'btn-ghost' ?>"><?= $i ?></a>
                    <?php endfor; ?>
                </div>
                <?php endif; ?>
            </div>
        </main>
    </div>
</div>

<script src="/assets/js/main.js"></script>
<script src="/assets/js/admin.js"></script>
<script>
document.getElementById('exportLogsBtn')?.addEventListener('click', function(e) {
    const params = new URLSearchParams(window.location.search);
    params.set('export', 'csv');
    this.href = '/admin/logs?' + params.toString();
});

const refreshToggle = document.getElementById('autoRefreshToggle');
let refreshInterval;

function startAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(() => {
        if (refreshToggle?.checked) {
            const table = document.getElementById('logsTable');
            if (table) {
                fetch(window.location.href, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
                    .then(r => r.text())
                    .then(html => {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(html, 'text/html');
                        const newTbody = doc.querySelector('#logsTable tbody');
                        if (newTbody) {
                            table.querySelector('tbody').innerHTML = newTbody.innerHTML;
                        }
                    })
                    .catch(() => {});
            }
        }
    }, 30000);
}

if (refreshToggle) {
    startAutoRefresh();
    refreshToggle.addEventListener('change', () => {
        if (refreshToggle.checked) startAutoRefresh();
        else if (refreshInterval) clearInterval(refreshInterval);
    });
}
</script>
</body>
</html>
