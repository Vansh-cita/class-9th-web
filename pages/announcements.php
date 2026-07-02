<?php
$announcements = getAnnouncements(50);
?>
<div class="section" style="padding-top: 120px;">
    <div class="section-header" data-animate="fade-up">
        <h2 class="section-title">Latest <span class="text-accent">Announcements</span></h2>
        <p class="section-subtitle">Stay updated with the latest news, events, and academic information</p>
    </div>
    <?php if ($announcements && count($announcements) > 0): ?>
    <div style="max-width: 800px; margin: 0 auto;" data-animate="fade-up" data-delay="100">
        <?php foreach ($announcements as $ann): ?>
        <div class="glass-card" style="margin-bottom: 16px; padding: 24px; display: flex; gap: 16px; align-items: flex-start;">
            <div style="width: 44px; height: 44px; border-radius: 50%; background: <?= $ann['is_pinned'] ? 'var(--accent-gradient)' : 'var(--bg-glass-strong)' ?>; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 1.2rem;">
                <?= $ann['is_pinned'] ? '📌' : ($ann['type'] === 'exam' ? '📝' : ($ann['type'] === 'event' ? '🎉' : '📢')) ?>
            </div>
            <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px; flex-wrap: wrap;">
                    <h3 style="font-family: var(--font-display); font-weight: 600; font-size: 1.1rem; color: #fff;"><?= htmlspecialchars($ann['title']) ?></h3>
                    <?php if ($ann['is_pinned']): ?>
                    <span class="badge badge-accent">Pinned</span>
                    <?php endif; ?>
                    <span class="badge" style="background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.5);"><?= htmlspecialchars($ann['type']) ?></span>
                </div>
                <p style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.7; margin-bottom: 12px;"><?= nl2br(htmlspecialchars($ann['content'] ?? $ann['message'] ?? '')) ?></p>
                <span style="font-size: 0.8rem; color: var(--text-muted);"><?= timeAgo($ann['created_at']) ?></span>
            </div>
        </div>
        <?php endforeach; ?>
    </div>
    <?php else: ?>
    <div class="text-center" style="padding: 80px 24px; color: var(--text-muted);" data-animate="fade-up">
        <div style="font-size: 4rem; margin-bottom: 16px;">📣</div>
        <p style="font-size: 1.1rem;">No announcements yet. Check back soon!</p>
    </div>
    <?php endif; ?>
</div>
