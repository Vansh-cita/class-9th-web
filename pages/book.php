<?php
$user = getCurrentUser();
if (!$user) { header('Location: /login'); exit; }

$bookId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
$book = getBook($bookId);
if (!$book) {
    header('Location: /404');
    exit;
}

$chapters = getChapters($bookId);
$progress = getReadingProgress($user['id'], $bookId);

$isBookmarked = false;
try {
    $stmt = getDB()->prepare("SELECT COUNT(*) as count FROM bookmarks WHERE user_id = ? AND book_id = ?");
    $stmt->execute([$user['id'], $bookId]);
    $isBookmarked = (int)$stmt->fetch()['count'] > 0;
} catch (Exception $e) {}

$relatedBooks = [];
try {
    $stmt = getDB()->prepare("SELECT b.*, c.name as category_name FROM books b LEFT JOIN categories c ON b.category_id = c.id WHERE b.category_id = ? AND b.id != ? ORDER BY RANDOM() LIMIT 4");
    $stmt->execute([$book['category_id'], $bookId]);
    $relatedBooks = $stmt->fetchAll();
} catch (Exception $e) {}
?>
<section class="section" style="padding-top:120px;">
    <div style="margin-bottom:24px;" data-animate="fade-in-up">
        <a href="/books" style="color:var(--text-muted);font-size:0.9rem;">← Back to Books</a>
    </div>

    <div style="display:grid;grid-template-columns:300px 1fr;gap:40px;margin-bottom:48px;" data-animate="fade-in-up" data-delay="50">
        <div>
            <div class="card" style="padding:0;overflow:hidden;aspect-ratio:3/4;display:flex;align-items:center;justify-content:center;background:var(--bg-glass-strong);">
                <?php if (!empty($book['thumbnail'])): ?>
                <img src="<?= htmlspecialchars($book['thumbnail']) ?>" alt="<?= htmlspecialchars($book['title']) ?>" style="width:100%;height:100%;object-fit:cover;">
                <?php else: ?>
                <span style="font-size:5rem;color:var(--text-muted);">📘</span>
                <?php endif; ?>
            </div>
        </div>
        <div>
            <?php if (!empty($book['category_name'])): ?>
            <span class="badge badge-accent" style="margin-bottom:12px;"><?= htmlspecialchars($book['category_name']) ?></span>
            <?php endif; ?>
            <h1 style="font-family:var(--font-display);font-size:clamp(1.5rem,3vw,2rem);font-weight:800;margin-bottom:8px;"><?= htmlspecialchars($book['title']) ?></h1>
            <?php if (!empty($book['author'])): ?>
            <p style="color:var(--text-muted);font-size:0.95rem;margin-bottom:16px;">by <span style="color:var(--text-secondary);"><?= htmlspecialchars($book['author']) ?></span></p>
            <?php endif; ?>

            <div style="display:flex;flex-wrap:wrap;gap:16px;margin-bottom:20px;">
                <?php if (!empty($book['subject'])): ?>
                <div><span style="font-size:0.8rem;color:var(--text-muted);">Subject</span><p style="font-size:0.9rem;font-weight:500;margin:2px 0 0;"><?= htmlspecialchars($book['subject']) ?></p></div>
                <?php endif; ?>
                <?php if (!empty($book['language'])): ?>
                <div><span style="font-size:0.8rem;color:var(--text-muted);">Language</span><p style="font-size:0.9rem;font-weight:500;margin:2px 0 0;"><?= htmlspecialchars($book['language']) ?></p></div>
                <?php endif; ?>
                <div><span style="font-size:0.8rem;color:var(--text-muted);">Pages</span><p style="font-size:0.9rem;font-weight:500;margin:2px 0 0;"><?= $book['page_count'] ?? 'N/A' ?></p></div>
            </div>

            <?php if (!empty($book['description'])): ?>
            <p style="color:var(--text-secondary);font-size:0.95rem;line-height:1.7;margin-bottom:24px;"><?= nl2br(htmlspecialchars($book['description'])) ?></p>
            <?php endif; ?>

            <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;">
                <?php if ($progress && (int)$progress['progress'] > 0): ?>
                <a href="/reader?book=<?= $bookId ?>" class="btn btn-primary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    Continue Reading (<?= min((int)$progress['progress'], 100) ?>%)
                </a>
                <?php else: ?>
                <a href="/reader?book=<?= $bookId ?>" class="btn btn-primary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    Start Reading
                </a>
                <?php endif; ?>

                <button class="btn btn-secondary" id="bookmarkBtn" data-book-id="<?= $bookId ?>" data-bookmarked="<?= $isBookmarked ? '1' : '0' ?>">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="<?= $isBookmarked ? 'currentColor' : 'none' ?>" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                    <span id="bookmarkText"><?= $isBookmarked ? 'Bookmarked' : 'Bookmark' ?></span>
                </button>

                <?php if (!empty($book['file_path'])): ?>
                <a href="<?= htmlspecialchars($book['file_path']) ?>" class="btn btn-outline" download>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Download PDF
                </a>
                <?php endif; ?>
            </div>

            <?php if ($progress && (int)$progress['progress'] > 0): ?>
            <div style="margin-top:20px;">
                <div style="display:flex;justify-content:space-between;font-size:0.8rem;color:var(--text-muted);margin-bottom:6px;">
                    <span>Reading Progress</span>
                    <span><?= min((int)$progress['progress'], 100) ?>%</span>
                </div>
                <div style="height:6px;background:var(--bg-glass-strong);border-radius:6px;overflow:hidden;">
                    <div style="height:100%;width:<?= min((int)$progress['progress'], 100) ?>%;background:var(--accent-gradient);border-radius:6px;"></div>
                </div>
            </div>
            <?php endif; ?>
        </div>
    </div>

    <?php if ($chapters): ?>
    <div style="margin-bottom:48px;" data-animate="fade-in-up" data-delay="100">
        <h2 style="font-family:var(--font-display);font-size:1.25rem;font-weight:700;margin-bottom:20px;">Chapters</h2>
        <div style="display:flex;flex-direction:column;gap:6px;max-width:700px;">
            <?php foreach ($chapters as $ch): ?>
            <div class="card" style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;gap:12px;">
                <div style="display:flex;align-items:center;gap:12px;flex:1;min-width:0;">
                    <span style="width:32px;height:32px;border-radius:var(--radius-full);background:var(--bg-glass-strong);display:flex;align-items:center;justify-content:center;font-size:0.8rem;font-weight:600;flex-shrink:0;"><?= $ch['chapter_number'] ?? ($loop->index + 1) ?></span>
                    <div style="min-width:0;">
                        <p style="font-weight:500;font-size:0.95rem;margin:0;"><?= htmlspecialchars($ch['title']) ?></p>
                        <?php if (!empty($ch['page_count'])): ?>
                        <span style="font-size:0.8rem;color:var(--text-muted);"><?= $ch['page_count'] ?> pages</span>
                        <?php endif; ?>
                    </div>
                </div>
                <div style="display:flex;gap:6px;flex-shrink:0;">
                    <a href="/reader?book=<?= $bookId ?>&chapter=<?= $ch['id'] ?>" class="btn btn-sm btn-primary">Read</a>
                    <?php if (!empty($ch['file_path'])): ?>
                    <a href="<?= htmlspecialchars($ch['file_path']) ?>" class="btn btn-sm btn-secondary" download>PDF</a>
                    <?php endif; ?>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
    </div>
    <?php endif; ?>

    <?php if ($relatedBooks): ?>
    <div data-animate="fade-in-up" data-delay="150">
        <h2 style="font-family:var(--font-display);font-size:1.25rem;font-weight:700;margin-bottom:20px;">Related Books</h2>
        <div class="book-grid">
            <?php foreach ($relatedBooks as $rb): ?>
            <a href="/book?id=<?= $rb['id'] ?>" class="book-card">
                <div class="book-card-cover">
                    <?php if (!empty($rb['thumbnail'])): ?>
                    <img src="<?= htmlspecialchars($rb['thumbnail']) ?>" alt="<?= htmlspecialchars($rb['title']) ?>" loading="lazy">
                    <?php else: ?>
                    <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:3rem;background:var(--bg-glass-strong);color:var(--text-muted);">📘</div>
                    <?php endif; ?>
                </div>
                <div class="book-card-body">
                    <h3 class="book-card-title"><?= htmlspecialchars($rb['title']) ?></h3>
                    <?php if (!empty($rb['author'])): ?>
                    <p class="book-card-author"><?= htmlspecialchars($rb['author']) ?></p>
                    <?php endif; ?>
                </div>
            </a>
            <?php endforeach; ?>
        </div>
    </div>
    <?php endif; ?>
</section>

<script>
document.addEventListener('DOMContentLoaded', function() {
    var bookmarkBtn = document.getElementById('bookmarkBtn');
    if (bookmarkBtn) {
        bookmarkBtn.addEventListener('click', async function() {
            var bookId = this.getAttribute('data-book-id');
            var isBookmarked = this.getAttribute('data-bookmarked') === '1';
            var textEl = document.getElementById('bookmarkText');
            var svg = this.querySelector('svg');

            try {
                if (isBookmarked) {
                    var res = await fetch('/api/bookmarks.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'remove', book_id: parseInt(bookId) })
                    });
                    if (res.ok) {
                        this.setAttribute('data-bookmarked', '0');
                        textEl.textContent = 'Bookmark';
                        svg.setAttribute('fill', 'none');
                        if (window.showToast) window.showToast('Bookmark removed', 'info');
                    }
                } else {
                    var res = await fetch('/api/bookmarks.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'add', book_id: parseInt(bookId) })
                    });
                    if (res.ok) {
                        this.setAttribute('data-bookmarked', '1');
                        textEl.textContent = 'Bookmarked';
                        svg.setAttribute('fill', 'currentColor');
                        if (window.showToast) window.showToast('Bookmark added', 'success');
                    }
                }
            } catch (e) {
                if (window.showToast) window.showToast('Failed to update bookmark', 'error');
            }
        });
    }
});
</script>
