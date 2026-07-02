<?php
$user = getCurrentUser();
if (!$user) { header('Location: /login'); exit; }

$booksRead = 0;
$totalBookmarks = 0;
$continueReading = [];

try {
    $stmt = getDB()->prepare("SELECT COUNT(DISTINCT book_id) as count FROM reading_progress WHERE user_id = ? AND progress >= 95");
    $stmt->execute([$user['id']]);
    $booksRead = (int)$stmt->fetch()['count'];

    $stmt = getDB()->prepare("SELECT COUNT(*) as count FROM bookmarks WHERE user_id = ?");
    $stmt->execute([$user['id']]);
    $totalBookmarks = (int)$stmt->fetch()['count'];

    $stmt = getDB()->prepare("SELECT b.*, rp.progress, rp.page, rp.updated_at FROM reading_progress rp JOIN books b ON rp.book_id = b.id WHERE rp.user_id = ? AND rp.progress > 0 AND rp.progress < 95 ORDER BY rp.updated_at DESC LIMIT 4");
    $stmt->execute([$user['id']]);
    $continueReading = $stmt->fetchAll();
} catch (Exception $e) {}

$books = getBooks(6);
$categories = getCategories();
$announcements = getAnnouncements(4);
?>
<section class="section dashboard-page" style="padding-top:120px;">
    <div class="page-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;margin-bottom:40px;" data-animate="fade-in-up">
        <div>
            <h1 style="font-family:var(--font-display);font-size:clamp(1.5rem,3vw,2rem);font-weight:800;margin-bottom:6px;">
                Welcome back, <span class="text-accent"><?= htmlspecialchars(explode(' ', $user['username'])[0]) ?></span> 👋
            </h1>
            <p style="color:var(--text-muted);font-size:0.95rem;">Here's your learning overview for today</p>
        </div>
        <a href="/books" class="btn btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            Browse Books
        </a>
    </div>

    <div class="stats-grid" id="dashboardStats" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:40px;" data-animate="fade-in-up" data-delay="50">
        <div class="card" style="display:flex;align-items:center;gap:16px;padding:20px;border-color:var(--border-accent);">
            <div style="width:48px;height:48px;border-radius:var(--radius-md);background:var(--accent-glow);display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0;">📚</div>
            <div>
                <div style="font-family:var(--font-display);font-size:1.5rem;font-weight:800;"><?= $booksRead ?></div>
                <div style="font-size:0.85rem;color:var(--text-muted);">Books Read</div>
            </div>
        </div>
        <div class="card" style="display:flex;align-items:center;gap:16px;padding:20px;">
            <div style="width:48px;height:48px;border-radius:var(--radius-md);background:var(--bg-glass-strong);display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0;">🔖</div>
            <div>
                <div style="font-family:var(--font-display);font-size:1.5rem;font-weight:800;"><?= $totalBookmarks ?></div>
                <div style="font-size:0.85rem;color:var(--text-muted);">Bookmarks</div>
            </div>
        </div>
        <div class="card" style="display:flex;align-items:center;gap:16px;padding:20px;">
            <div style="width:48px;height:48px;border-radius:var(--radius-md);background:var(--bg-glass-strong);display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0;">⏱</div>
            <div>
                <div style="font-family:var(--font-display);font-size:1.5rem;font-weight:800;" id="daysActive">-</div>
                <div style="font-size:0.85rem;color:var(--text-muted);">Days Active</div>
            </div>
        </div>
        <div class="card" style="display:flex;align-items:center;gap:16px;padding:20px;">
            <div style="width:48px;height:48px;border-radius:var(--radius-md);background:var(--bg-glass-strong);display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0;">📖</div>
            <div>
                <div style="font-family:var(--font-display);font-size:1.5rem;font-weight:800;"><?= count($continueReading) ?></div>
                <div style="font-size:0.85rem;color:var(--text-muted);">Continue Reading</div>
            </div>
        </div>
    </div>

    <?php if ($continueReading): ?>
    <div style="margin-bottom:40px;" data-animate="fade-in-up" data-delay="100">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
            <h2 style="font-family:var(--font-display);font-size:1.25rem;font-weight:700;">Continue Reading</h2>
            <a href="/books" style="font-size:0.85rem;color:var(--accent);font-weight:500;">View all →</a>
        </div>
        <div class="book-grid" id="continueReading">
            <?php foreach ($continueReading as $book): ?>
            <a href="/reader?book=<?= $book['id'] ?>" class="book-card" style="cursor:pointer;">
                <div class="book-card-cover">
                    <?php if (!empty($book['thumbnail'])): ?>
                    <img src="<?= htmlspecialchars($book['thumbnail']) ?>" alt="<?= htmlspecialchars($book['title']) ?>" loading="lazy">
                    <?php else: ?>
                    <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:3rem;background:var(--bg-glass-strong);color:var(--text-muted);">📘</div>
                    <?php endif; ?>
                </div>
                <div class="book-card-body">
                    <h3 class="book-card-title"><?= htmlspecialchars($book['title']) ?></h3>
                    <?php if (!empty($book['author'])): ?>
                    <p class="book-card-author"><?= htmlspecialchars($book['author']) ?></p>
                    <?php endif; ?>
                    <div style="margin-top:12px;">
                        <div style="height:4px;background:var(--bg-glass-strong);border-radius:4px;overflow:hidden;">
                            <div style="height:100%;width:<?= min((int)$book['progress'], 100) ?>%;background:var(--accent-gradient);border-radius:4px;transition:width 0.5s ease;"></div>
                        </div>
                        <div style="font-size:0.78rem;color:var(--text-muted);margin-top:6px;"><?= min((int)$book['progress'], 100) ?>% complete</div>
                    </div>
                </div>
            </a>
            <?php endforeach; ?>
        </div>
    </div>
    <?php endif; ?>

    <?php if ($books): ?>
    <div style="margin-bottom:40px;" data-animate="fade-in-up" data-delay="150">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
            <h2 style="font-family:var(--font-display);font-size:1.25rem;font-weight:700;">Latest Books</h2>
            <a href="/books" style="font-size:0.85rem;color:var(--accent);font-weight:500;">View all →</a>
        </div>
        <div class="book-grid" id="recentBooks">
            <?php foreach ($books as $book): ?>
            <a href="/book?id=<?= $book['id'] ?>" class="book-card">
                <div class="book-card-cover">
                    <?php if (!empty($book['thumbnail'])): ?>
                    <img src="<?= htmlspecialchars($book['thumbnail']) ?>" alt="<?= htmlspecialchars($book['title']) ?>" loading="lazy">
                    <?php else: ?>
                    <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:3rem;background:var(--bg-glass-strong);color:var(--text-muted);">📘</div>
                    <?php endif; ?>
                    <?php if (!empty($book['category_name'])): ?>
                    <span class="badge badge-accent book-card-badge"><?= htmlspecialchars($book['category_name']) ?></span>
                    <?php endif; ?>
                </div>
                <div class="book-card-body">
                    <h3 class="book-card-title"><?= htmlspecialchars($book['title']) ?></h3>
                    <?php if (!empty($book['author'])): ?>
                    <p class="book-card-author"><?= htmlspecialchars($book['author']) ?></p>
                    <?php endif; ?>
                    <div class="book-card-meta">
                        <span><?= htmlspecialchars($book['subject'] ?? 'General') ?></span>
                        <span>📄 <?= $book['page_count'] ?? 'N/A' ?> pages</span>
                    </div>
                </div>
            </a>
            <?php endforeach; ?>
        </div>
    </div>
    <?php endif; ?>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:40px;" data-animate="fade-in-up" data-delay="200">
        <div>
            <h3 style="font-family:var(--font-display);font-size:1.1rem;font-weight:600;margin-bottom:16px;">Categories</h3>
            <?php if ($categories): ?>
            <div style="display:flex;flex-wrap:wrap;gap:8px;">
                <?php $icons = ['📖','🔬','🧮','🌍','📜','📏','🔤','💻','🎨','🎵']; $i = 0; ?>
                <?php foreach ($categories as $cat): ?>
                <a href="/categories?id=<?= $cat['id'] ?>" class="btn btn-sm btn-secondary" style="display:inline-flex;gap:6px;">
                    <span><?= $icons[$i++ % count($icons)] ?></span>
                    <?= htmlspecialchars($cat['name']) ?>
                </a>
                <?php endforeach; ?>
            </div>
            <?php else: ?>
            <p style="color:var(--text-muted);font-size:0.9rem;">No categories yet.</p>
            <?php endif; ?>
        </div>
        <div>
            <h3 style="font-family:var(--font-display);font-size:1.1rem;font-weight:600;margin-bottom:16px;">Recent Announcements</h3>
            <?php if ($announcements): ?>
            <?php foreach ($announcements as $ann): ?>
            <div style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid var(--border-color);">
                <span style="font-size:1.1rem;flex-shrink:0;"><?= $ann['is_pinned'] ? '📌' : '📢' ?></span>
                <div style="flex:1;min-width:0;">
                    <p style="font-size:0.9rem;font-weight:500;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"><?= htmlspecialchars($ann['title']) ?></p>
                    <p style="font-size:0.78rem;color:var(--text-muted);margin:0;"><?= timeAgo($ann['created_at']) ?></p>
                </div>
            </div>
            <?php endforeach; ?>
            <?php else: ?>
            <p style="color:var(--text-muted);font-size:0.9rem;">No announcements yet.</p>
            <?php endif; ?>
        </div>
    </div>
</section>

<style>
.stats-grid > .card:hover { transform:translateY(-2px);box-shadow:var(--shadow-glow);border-color:var(--border-accent); }
@media (max-width:768px) {
    .page-header { flex-direction:column; }
    [style*="grid-template-columns: 1fr 1fr"] { grid-template-columns:1fr !important; }
}
</style>
