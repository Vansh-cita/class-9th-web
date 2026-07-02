<?php
$user = getCurrentUser();
if (!$user) { header('Location: /login'); exit; }

$page_no = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
$perPage = 12;
$offset = ($page_no - 1) * $perPage;
$categoryId = isset($_GET['category']) ? (int)$_GET['category'] : null;
$search = isset($_GET['q']) ? trim($_GET['q']) : '';

$categories = getCategories();
$books = [];
$totalBooks = 0;

try {
    $db = getDB();
    $where = '';
    $params = [];
    if ($categoryId) {
        $where = 'WHERE b.category_id = ?';
        $params[] = $categoryId;
    }
    if ($search) {
        $where .= ($where ? ' AND' : 'WHERE') . ' (b.title LIKE ? OR b.author LIKE ? OR b.subject LIKE ?)';
        $s = '%' . $search . '%';
        $params[] = $s; $params[] = $s; $params[] = $s;
    }
    $stmt = $db->prepare("SELECT COUNT(*) as total FROM books b $where");
    $stmt->execute($params);
    $totalBooks = (int)$stmt->fetch()['total'];

    $sql = "SELECT b.*, c.name as category_name FROM books b LEFT JOIN categories c ON b.category_id = c.id $where ORDER BY b.created_at DESC LIMIT ? OFFSET ?";
    $params[] = $perPage;
    $params[] = $offset;
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $books = $stmt->fetchAll();
} catch (Exception $e) {}

$totalPages = max(1, ceil($totalBooks / $perPage));
?>
<section class="section" style="padding-top:120px;">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;margin-bottom:32px;" data-animate="fade-in-up">
        <div>
            <h1 style="font-family:var(--font-display);font-size:clamp(1.5rem,3vw,2rem);font-weight:800;">Browse <span class="text-accent">Books</span></h1>
            <p style="color:var(--text-muted);font-size:0.9rem;margin-top:4px;"><?= $totalBooks ?> books available</p>
        </div>
        <div class="search-bar" style="max-width:360px;">
            <span class="search-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <form action="/books" method="GET" style="display:contents;">
                <input type="text" name="q" placeholder="Search books..." value="<?= htmlspecialchars($search) ?>" aria-label="Search books" style="padding-left:44px;">
                <?php if ($categoryId): ?>
                <input type="hidden" name="category" value="<?= $categoryId ?>">
                <?php endif; ?>
            </form>
        </div>
    </div>

    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:32px;" data-animate="fade-in-up" data-delay="50">
        <a href="/books" class="btn btn-sm <?= $categoryId ? 'btn-secondary' : 'btn-primary' ?>">All</a>
        <?php foreach ($categories as $cat): ?>
        <a href="/books?category=<?= $cat['id'] ?><?= $search ? '&q=' . urlencode($search) : '' ?>" class="btn btn-sm <?= $categoryId == $cat['id'] ? 'btn-primary' : 'btn-secondary' ?>"><?= htmlspecialchars($cat['name']) ?></a>
        <?php endforeach; ?>
    </div>

    <?php if ($books): ?>
    <div class="book-grid" data-animate="fade-in-up" data-delay="100">
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
                    <span><?= htmlspecialchars($book['language'] ?? 'English') ?></span>
                </div>
            </div>
        </a>
        <?php endforeach; ?>
    </div>

    <?php if ($totalPages > 1): ?>
    <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:40px;" data-animate="fade-in-up">
        <?php if ($page_no > 1): ?>
        <a href="?page=<?= $page_no - 1 ?><?= $categoryId ? '&category=' . $categoryId : '' ?><?= $search ? '&q=' . urlencode($search) : '' ?>" class="btn btn-secondary btn-sm">← Prev</a>
        <?php endif; ?>
        <?php for ($i = max(1, $page_no - 2); $i <= min($totalPages, $page_no + 2); $i++): ?>
        <a href="?page=<?= $i ?><?= $categoryId ? '&category=' . $categoryId : '' ?><?= $search ? '&q=' . urlencode($search) : '' ?>" class="btn btn-sm <?= $i === $page_no ? 'btn-primary' : 'btn-secondary' ?>"><?= $i ?></a>
        <?php endfor; ?>
        <?php if ($page_no < $totalPages): ?>
        <a href="?page=<?= $page_no + 1 ?><?= $categoryId ? '&category=' . $categoryId : '' ?><?= $search ? '&q=' . urlencode($search) : '' ?>" class="btn btn-secondary btn-sm">Next →</a>
        <?php endif; ?>
    </div>
    <?php endif; ?>

    <?php else: ?>
    <div style="text-align:center;padding:80px 24px;" data-animate="fade-in-up">
        <div style="font-size:4rem;margin-bottom:20px;">📚</div>
        <h3 style="font-family:var(--font-display);font-size:1.3rem;font-weight:600;margin-bottom:8px;">No books found</h3>
        <p style="color:var(--text-muted);margin-bottom:24px;"><?= $search ? 'No books match your search. Try different keywords.' : 'Books are being added. Check back soon!' ?></p>
        <a href="/books" class="btn btn-primary">Browse All Books</a>
    </div>
    <?php endif; ?>
</section>
