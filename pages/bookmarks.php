<?php
$user = getCurrentUser();
if (!$user) { header('Location: /login'); exit; }

$bookmarks = getBookmarks($user['id']);
?>
<section class="section" style="padding-top:120px;">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;margin-bottom:32px;" data-animate="fade-in-up">
        <div>
            <h1 style="font-family:var(--font-display);font-size:clamp(1.5rem,3vw,2rem);font-weight:800;margin-bottom:6px;">My <span class="text-accent">Bookmarks</span></h1>
            <p style="color:var(--text-muted);font-size:0.9rem;"><?= count($bookmarks) ?> bookmark<?= count($bookmarks) !== 1 ? 's' : '' ?> saved</p>
        </div>
    </div>

    <?php if ($bookmarks): ?>
    <div style="display:flex;flex-direction:column;gap:12px;" data-animate="fade-in-up" data-delay="50">
        <?php foreach ($bookmarks as $bm): ?>
        <div class="card" style="display:flex;align-items:center;gap:16px;padding:16px 20px;">
            <div style="width:40px;height:40px;border-radius:var(--radius-md);background:var(--accent-glow);display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;">🔖</div>
            <div style="flex:1;min-width:0;">
                <h3 style="font-size:0.95rem;font-weight:600;margin-bottom:2px;"><?= htmlspecialchars($bm['book_title'] ?? 'Unknown Book') ?></h3>
                <div style="display:flex;flex-wrap:wrap;gap:8px;font-size:0.8rem;color:var(--text-muted);">
                    <?php if (!empty($bm['chapter_title'])): ?>
                    <span>Chapter: <?= htmlspecialchars($bm['chapter_title']) ?></span>
                    <?php endif; ?>
                    <?php if (!empty($bm['page'])): ?>
                    <span>Page <?= (int)$bm['page'] ?></span>
                    <?php endif; ?>
                    <span>• <?= timeAgo($bm['created_at']) ?></span>
                </div>
                <?php if (!empty($bm['note'])): ?>
                <p style="font-size:0.85rem;color:var(--text-secondary);margin-top:4px;font-style:italic;"><?= htmlspecialchars($bm['note']) ?></p>
                <?php endif; ?>
            </div>
            <div style="display:flex;gap:6px;flex-shrink:0;">
                <a href="/reader?book=<?= $bm['book_id'] ?><?= $bm['page'] ? '&page=' . $bm['page'] : '' ?>" class="btn btn-sm btn-primary">Read</a>
                <button class="btn btn-sm btn-secondary remove-bookmark" data-bookmark-id="<?= $bm['id'] ?>">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            </div>
        </div>
        <?php endforeach; ?>
    </div>
    <?php else: ?>
    <div style="text-align:center;padding:80px 24px;" data-animate="fade-in-up">
        <div style="font-size:4rem;margin-bottom:20px;">🔖</div>
        <h3 style="font-family:var(--font-display);font-size:1.3rem;font-weight:600;margin-bottom:8px;">No bookmarks yet</h3>
        <p style="color:var(--text-muted);margin-bottom:24px;">Start reading and bookmark your favourite pages to access them quickly.</p>
        <a href="/books" class="btn btn-primary">Browse Books</a>
    </div>
    <?php endif; ?>
</section>

<script>
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.remove-bookmark').forEach(function(btn) {
        btn.addEventListener('click', async function() {
            var id = this.getAttribute('data-bookmark-id');
            var card = this.closest('.card');
            if (!confirm('Remove this bookmark?')) return;

            try {
                var res = await fetch('/api/bookmarks.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'remove', id: parseInt(id) }) });
                if (res.ok) {
                    card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                    card.style.opacity = '0';
                    card.style.transform = 'translateX(20px)';
                    setTimeout(function() { card.remove(); }, 300);
                    if (window.showToast) window.showToast('Bookmark removed', 'info');
                } else {
                    if (window.showToast) window.showToast('Failed to remove bookmark', 'error');
                }
            } catch (e) {
                if (window.showToast) window.showToast('Error removing bookmark', 'error');
            }
        });
    });
});
</script>
