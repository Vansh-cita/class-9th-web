<?php
$user = getCurrentUser();
if (!$user) { header('Location: /login'); exit; }

$notifications = getNotifications($user['id'], 50);
$unreadCount = getUnreadNotificationCount($user['id']);
?>
<section class="section" style="padding-top:120px;">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;margin-bottom:32px;" data-animate="fade-in-up">
        <div>
            <h1 style="font-family:var(--font-display);font-size:clamp(1.5rem,3vw,2rem);font-weight:800;margin-bottom:6px;">Notifications</h1>
            <p style="color:var(--text-muted);font-size:0.9rem;"><?= count($notifications) ?> notification<?= count($notifications) !== 1 ? 's' : '' ?><?= $unreadCount > 0 ? ' (' . $unreadCount . ' unread)' : '' ?></p>
        </div>
        <?php if ($unreadCount > 0): ?>
        <button class="btn btn-primary btn-sm" id="markAllRead">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            Mark All as Read
        </button>
        <?php endif; ?>
    </div>

    <?php if ($notifications): ?>
    <div class="notification-list" data-animate="fade-in-up" data-delay="50">
        <?php
        $typeIcons = ['info' => 'ℹ️', 'success' => '✅', 'warning' => '⚠️', 'error' => '❌', 'book' => '📚', 'bookmark' => '🔖', 'reading' => '📖', 'announcement' => '📢', 'system' => '⚙️'];
        ?>
        <?php foreach ($notifications as $notif): ?>
        <div class="notification-item <?= $notif['is_read'] ? '' : 'unread' ?>" data-id="<?= $notif['id'] ?>">
            <div class="notification-icon"><?= $typeIcons[$notif['type']] ?? 'ℹ️' ?></div>
            <div class="notification-content">
                <div class="notification-text">
                    <strong><?= htmlspecialchars($notif['title']) ?></strong>
                    <?php if (!empty($notif['message'])): ?>
                    <br><?= htmlspecialchars(truncateText($notif['message'], 150)) ?>
                    <?php endif; ?>
                </div>
                <div class="notification-time"><?= timeAgo($notif['created_at']) ?></div>
            </div>
            <?php if (!$notif['is_read']): ?>
            <div class="notification-dot"></div>
            <?php endif; ?>
        </div>
        <?php endforeach; ?>
    </div>
    <?php else: ?>
    <div style="text-align:center;padding:80px 24px;" data-animate="fade-in-up">
        <div style="font-size:4rem;margin-bottom:20px;">🔔</div>
        <h3 style="font-family:var(--font-display);font-size:1.3rem;font-weight:600;margin-bottom:8px;">No notifications</h3>
        <p style="color:var(--text-muted);margin-bottom:24px;">You're all caught up! Notifications will appear here when there's something new.</p>
        <a href="/dashboard" class="btn btn-primary">Go to Dashboard</a>
    </div>
    <?php endif; ?>
</section>

<script>
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.notification-item.unread').forEach(function(item) {
        item.addEventListener('click', async function() {
            var id = this.getAttribute('data-id');
            if (!id) return;

            try {
                var res = await fetch('/api/notifications.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'mark_read', id: parseInt(id) }) });
                if (res.ok) {
                    this.classList.remove('unread');
                    var dot = this.querySelector('.notification-dot');
                    if (dot) dot.remove();
                    if (window.updateNotificationBadge) window.updateNotificationBadge();
                }
            } catch (e) {}
        });
    });

    document.getElementById('markAllRead')?.addEventListener('click', async function() {
        try {
            var res = await fetch('/api/notifications.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'mark_all_read' }) });
            if (res.ok) {
                document.querySelectorAll('.notification-item.unread').forEach(function(item) {
                    item.classList.remove('unread');
                    var dot = item.querySelector('.notification-dot');
                    if (dot) dot.remove();
                });
                if (window.updateNotificationBadge) window.updateNotificationBadge();
                if (window.showToast) window.showToast('All notifications marked as read', 'success');
            }
        } catch (e) {
            if (window.showToast) window.showToast('Failed to mark all as read', 'error');
        }
    });
});
</script>
