<?php
session_start();
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/functions.php';

$user = getCurrentUser();
if (!$user || ($_SESSION['role'] ?? '') !== 'admin') {
    header('Location: /login');
    exit;
}

try {
    $db = getDB();

    $stmt = $db->query("SELECT COUNT(*) as c FROM books");
    $totalBooks = (int)$stmt->fetch()['c'];

    $stmt = $db->query("SELECT COUNT(*) as c FROM users");
    $totalUsers = (int)$stmt->fetch()['c'];

    $stmt = $db->query("SELECT COUNT(*) as c FROM categories");
    $totalCategories = (int)$stmt->fetch()['c'];

    $stmt = $db->query("SELECT COUNT(*) as c FROM uploads");
    $totalUploads = (int)$stmt->fetch()['c'];

    $stmt = $db->query("SELECT u.*, b.title as book_title FROM uploads u LEFT JOIN books b ON u.book_id = b.id ORDER BY u.created_at DESC LIMIT 5");
    $recentUploads = $stmt->fetchAll();

    $stmt = $db->query("SELECT id, username, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 5");
    $recentUsers = $stmt->fetchAll();

    $stmt = $db->query("SELECT c.name, COUNT(b.id) as book_count FROM categories c LEFT JOIN books b ON c.id = b.category_id GROUP BY c.id, c.name ORDER BY book_count DESC");
    $booksByCategory = $stmt->fetchAll();

    $stmt = $db->query("SELECT DATE(created_at) as date, COUNT(*) as count FROM users WHERE created_at >= datetime('now', '-30 days') GROUP BY DATE(created_at) ORDER BY date ASC");
    $registrationData = $stmt->fetchAll();

    $stmt = $db->query("SELECT * FROM logs ORDER BY created_at DESC LIMIT 10");
    $recentLogs = $stmt->fetchAll();

} catch (Exception $e) {
    $totalBooks = 0; $totalUsers = 0; $totalCategories = 0; $totalUploads = 0;
    $recentUploads = []; $recentUsers = []; $booksByCategory = []; $registrationData = [];
    $recentLogs = [];
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Admin - CBSE Class 9 Portal</title>
    <link rel="stylesheet" href="/assets/css/style.css">
    <link rel="stylesheet" href="/assets/css/admin.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
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
            <a href="/admin" class="active"><span class="nav-icon">📊</span> Dashboard</a>
            <a href="/admin/books"><span class="nav-icon">📚</span> Books</a>
            <a href="/admin/categories"><span class="nav-icon">🏷️</span> Categories</a>
            <a href="/admin/users"><span class="nav-icon">👥</span> Users</a>
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
                <div class="admin-topbar-title">Dashboard</div>
            </div>
            <div class="admin-topbar-actions">
                <a href="/" class="btn btn-sm btn-ghost">View Site</a>
                <a href="/logout" class="btn btn-sm btn-ghost" style="color:#ff1744;">Logout</a>
            </div>
        </header>

        <main class="admin-content">
            <div class="admin-page-header">
                <div>
                    <h1 class="admin-page-title">Welcome back, <?= htmlspecialchars(explode(' ', $user['username'])[0]) ?> 👋</h1>
                    <p class="admin-page-desc">Here's what's happening with your learning portal</p>
                </div>
                <div style="display:flex;gap:12px;flex-wrap:wrap;">
                    <a href="/admin/books" class="btn btn-primary btn-sm">➕ Add Book</a>
                    <a href="/admin/categories" class="btn btn-secondary btn-sm">➕ Add Category</a>
                    <a href="/admin/announcements" class="btn btn-secondary btn-sm">📢 Send Notification</a>
                </div>
            </div>

            <div class="admin-stats-grid" id="adminStats">
                <div class="admin-stat-card">
                    <div class="admin-stat-header">
                        <div class="admin-stat-icon accent">📚</div>
                    </div>
                    <div class="admin-stat-value"><?= $totalBooks ?></div>
                    <div class="admin-stat-label">Total Books</div>
                </div>
                <div class="admin-stat-card">
                    <div class="admin-stat-header">
                        <div class="admin-stat-icon blue">👥</div>
                    </div>
                    <div class="admin-stat-value"><?= $totalUsers ?></div>
                    <div class="admin-stat-label">Total Users</div>
                </div>
                <div class="admin-stat-card">
                    <div class="admin-stat-header">
                        <div class="admin-stat-icon green">🏷️</div>
                    </div>
                    <div class="admin-stat-value"><?= $totalCategories ?></div>
                    <div class="admin-stat-label">Total Categories</div>
                </div>
                <div class="admin-stat-card">
                    <div class="admin-stat-header">
                        <div class="admin-stat-icon orange">📁</div>
                    </div>
                    <div class="admin-stat-value"><?= $totalUploads ?></div>
                    <div class="admin-stat-label">Total Uploads</div>
                </div>
            </div>

            <div class="analytics-grid">
                <div class="admin-card">
                    <div class="admin-card-header">
                        <div class="admin-card-title">📊 Books by Category</div>
                    </div>
                    <div class="admin-card-body">
                        <div class="chart-container">
                            <canvas id="booksByCategoryChart"
                                data-labels='<?= htmlspecialchars(json_encode(array_column($booksByCategory, 'name')), ENT_QUOTES) ?>'
                                data-values='<?= htmlspecialchars(json_encode(array_column($booksByCategory, 'book_count')), ENT_QUOTES) ?>'>
                            </canvas>
                        </div>
                    </div>
                </div>
                <div class="admin-card">
                    <div class="admin-card-header">
                        <div class="admin-card-title">📈 User Registrations (30 days)</div>
                    </div>
                    <div class="admin-card-body">
                        <div class="chart-container">
                            <canvas id="registrationChart"
                                data-labels='<?= htmlspecialchars(json_encode(array_column($registrationData, 'date')), ENT_QUOTES) ?>'
                                data-values='<?= htmlspecialchars(json_encode(array_column($registrationData, 'count')), ENT_QUOTES) ?>'>
                            </canvas>
                        </div>
                    </div>
                </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px;">
                <div class="admin-card">
                    <div class="admin-card-header">
                        <div class="admin-card-title">📁 Recent Uploads</div>
                        <a href="/admin/uploads" class="btn btn-sm btn-ghost">View All</a>
                    </div>
                    <div class="admin-card-body" style="padding:0;">
                        <div class="admin-table-wrap">
                            <table class="admin-table">
                                <thead>
                                    <tr>
                                        <th>File</th>
                                        <th>Type</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php if ($recentUploads): ?>
                                        <?php foreach ($recentUploads as $u): ?>
                                        <tr>
                                            <td>
                                                <div style="font-weight:500;font-size:0.9rem;"><?= htmlspecialchars($u['filename'] ?? 'N/A') ?></div>
                                                <?php if (!empty($u['book_title'])): ?>
                                                <div style="font-size:0.8rem;color:var(--text-muted);">Book: <?= htmlspecialchars($u['book_title']) ?></div>
                                                <?php endif; ?>
                                            </td>
                                            <td><span class="status-badge status-active"><?= htmlspecialchars($u['file_type'] ?? 'N/A') ?></span></td>
                                            <td style="font-size:0.85rem;color:var(--text-muted);"><?= timeAgo($u['created_at']) ?></td>
                                        </tr>
                                        <?php endforeach; ?>
                                    <?php else: ?>
                                    <tr><td colspan="3"><div class="table-empty"><div class="empty-icon">📁</div>No uploads yet</div></td></tr>
                                    <?php endif; ?>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div class="admin-card">
                    <div class="admin-card-header">
                        <div class="admin-card-title">👥 Recent Users</div>
                        <a href="/admin/users" class="btn btn-sm btn-ghost">View All</a>
                    </div>
                    <div class="admin-card-body" style="padding:0;">
                        <div class="admin-table-wrap">
                            <table class="admin-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Role</th>
                                        <th>Joined</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php if ($recentUsers): ?>
                                        <?php foreach ($recentUsers as $u): ?>
                                        <tr>
                                            <td>
                                                <div style="display:flex;align-items:center;gap:10px;">
                                                    <div class="avatar avatar-sm" style="width:32px;height:32px;border-radius:50%;background:var(--accent-glow);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.8rem;color:var(--accent);">
                                                        <?= strtoupper(substr($u['username'] ?? 'U', 0, 1)) ?>
                                                    </div>
                                                    <div>
                                                        <div style="font-weight:500;font-size:0.9rem;"><?= htmlspecialchars($u['username'] ?? $u['name'] ?? 'N/A') ?></div>
                                                        <div style="font-size:0.78rem;color:var(--text-muted);"><?= htmlspecialchars($u['email'] ?? '') ?></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td><span class="status-badge <?= ($u['role'] ?? '') === 'admin' ? 'status-active' : 'status-inactive' ?>"><?= htmlspecialchars($u['role'] ?? 'user') ?></span></td>
                                            <td style="font-size:0.85rem;color:var(--text-muted);"><?= timeAgo($u['created_at']) ?></td>
                                        </tr>
                                        <?php endforeach; ?>
                                    <?php else: ?>
                                    <tr><td colspan="3"><div class="table-empty"><div class="empty-icon">👥</div>No users yet</div></td></tr>
                                    <?php endif; ?>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <div class="admin-card">
                <div class="admin-card-header">
                    <div class="admin-card-title">📋 Recent Activity Log</div>
                    <a href="/admin/logs" class="btn btn-sm btn-ghost">View All</a>
                </div>
                <div class="admin-card-body" style="padding:0;">
                    <div class="log-viewer" style="max-height:300px;">
                        <?php if ($recentLogs): ?>
                            <?php foreach ($recentLogs as $log): ?>
                            <div class="log-entry">
                                <span class="log-time"><?= timeAgo($log['created_at']) ?></span>
                                <span class="log-level info"><?= htmlspecialchars($log['action']) ?></span>
                                <span class="log-message"><?= htmlspecialchars(truncateText($log['details'] ?? '', 80)) ?></span>
                            </div>
                            <?php endforeach; ?>
                        <?php else: ?>
                            <div class="log-entry"><span class="log-message" style="color:var(--text-muted);">No activity recorded yet</span></div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </main>
    </div>
</div>

<script src="/assets/js/main.js"></script>
<script src="/assets/js/admin.js"></script>
<script>
document.addEventListener('DOMContentLoaded', () => {
    const bcCanvas = document.getElementById('booksByCategoryChart');
    const regCanvas = document.getElementById('registrationChart');

    if (bcCanvas && window.Chart) {
        new Chart(bcCanvas, {
            type: 'bar',
            data: {
                labels: JSON.parse(bcCanvas.dataset.labels || '[]'),
                datasets: [{
                    label: 'Books',
                    data: JSON.parse(bcCanvas.dataset.values || '[]'),
                    backgroundColor: 'rgba(255, 15, 123, 0.3)',
                    borderColor: '#FF0F7B',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#606060' } },
                    x: { grid: { display: false }, ticks: { color: '#606060' } }
                }
            }
        });
    }

    if (regCanvas && window.Chart) {
        new Chart(regCanvas, {
            type: 'line',
            data: {
                labels: JSON.parse(regCanvas.dataset.labels || '[]'),
                datasets: [{
                    label: 'Registrations',
                    data: JSON.parse(regCanvas.dataset.values || '[]'),
                    borderColor: '#29b6f6',
                    backgroundColor: 'rgba(41, 182, 246, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#606060' } },
                    x: { grid: { display: false }, ticks: { color: '#606060', maxTicksLimit: 10 } }
                }
            }
        });
    }
});
</script>
</body>
</html>
