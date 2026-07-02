<?php
$user = getCurrentUser();
if (!$user) { header('Location: /login'); exit; }

$q = isset($_GET['q']) ? trim($_GET['q']) : '';
$category = isset($_GET['category']) ? (int)$_GET['category'] : null;
$subject = isset($_GET['subject']) ? trim($_GET['subject']) : '';
$language = isset($_GET['language']) ? trim($_GET['language']) : '';
$page_no = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
$perPage = 12;
$offset = ($page_no - 1) * $perPage;

$categories = getCategories();
$results = [];
$totalResults = 0;

try {
    $db = getDB();
    $where = [];
    $params = [];

    if ($q) {
        $where[] = '(b.title LIKE ? OR b.author LIKE ? OR b.subject LIKE ? OR b.description LIKE ?)';
        $s = '%' . $q . '%';
        array_push($params, $s, $s, $s, $s);
    }
    if ($category) {
        $where[] = 'b.category_id = ?';
        $params[] = $category;
    }
    if ($subject) {
        $where[] = 'b.subject = ?';
        $params[] = $subject;
    }
    if ($language) {
        $where[] = 'b.language = ?';
        $params[] = $language;
    }

    $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    $stmt = $db->prepare("SELECT COUNT(*) as total FROM books b $whereClause");
    $stmt->execute($params);
    $totalResults = (int)$stmt->fetch()['total'];

    $sql = "SELECT b.*, c.name as category_name FROM books b LEFT JOIN categories c ON b.category_id = c.id $whereClause ORDER BY b.created_at DESC LIMIT ? OFFSET ?";
    $params[] = $perPage;
    $params[] = $offset;
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $results = $stmt->fetchAll();
} catch (Exception $e) {}

$totalPages = max(1, ceil($totalResults / $perPage));

$subjects = [];
try {
    $stmt = getDB()->prepare("SELECT DISTINCT subject FROM books WHERE subject IS NOT NULL AND subject != '' ORDER BY subject");
    $stmt->execute();
    $subjects = $stmt->fetchAll();
} catch (Exception $e) {}

$languages = [];
try {
    $stmt = getDB()->prepare("SELECT DISTINCT language FROM books WHERE language IS NOT NULL AND language != '' ORDER BY language");
    $stmt->execute();
    $languages = $stmt->fetchAll();
} catch (Exception $e) {}
?>
<section class="section" style="padding-top:120px;">
    <div style="margin-bottom:32px;" data-animate="fade-in-up">
        <h1 style="font-family:var(--font-display);font-size:clamp(1.5rem,3vw,2rem);font-weight:800;margin-bottom:20px;">Search <span class="text-accent">Books</span></h1>
        <form action="/search" method="GET" style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;">
            <div class="search-bar" style="flex:1;min-width:200px;">
                <span class="search-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </span>
                <input type="text" name="q" placeholder="Search by title, author, or keyword..." value="<?= htmlspecialchars($q) ?>" aria-label="Search" style="padding-left:44px;">
            </div>
            <select name="category" style="width:auto;min-width:140px;">
                <option value="">All Categories</option>
                <?php foreach ($categories as $cat): ?>
                <option value="<?= $cat['id'] ?>" <?= $category == $cat['id'] ? 'selected' : '' ?>><?= htmlspecialchars($cat['name']) ?></option>
                <?php endforeach; ?>
            </select>
            <select name="subject" style="width:auto;min-width:140px;">
                <option value="">All Subjects</option>
                <?php foreach ($subjects as $s): ?>
                <option value="<?= htmlspecialchars($s['subject']) ?>" <?= $subject === $s['subject'] ? 'selected' : '' ?>><?= htmlspecialchars($s['subject']) ?></option>
                <?php endforeach; ?>
            </select>
            <select name="language" style="width:auto;min-width:120px;">
                <option value="">All Languages</option>
                <?php foreach ($languages as $l): ?>
                <option value="<?= htmlspecialchars($l['language']) ?>" <?= $language === $l['language'] ? 'selected' : '' ?>><?= htmlspecialchars($l['language']) ?></option>
                <?php endforeach; ?>
            </select>
            <button type="submit" class="btn btn-primary">Search</button>
            <?php if ($q || $category || $subject || $language): ?>
            <a href="/search" class="btn btn-secondary">Clear</a>
            <?php endif; ?>
        </form>
    </div>

    <?php if ($q || $category || $subject || $language): ?>
    <div style="margin-bottom:24px;" data-animate="fade-in-up" data-delay="50">
        <p style="color:var(--text-muted);font-size:0.9rem;">
            <?php if ($totalResults > 0): ?>
            Found <strong style="color:var(--text-primary);"><?= $totalResults ?></strong> result<?= $totalResults !== 1 ? 's' : '' ?> for your search
            <?php else: ?>
            No results found
            <?php endif; ?>
            <?php if ($q): ?> — "<strong style="color:var(--text-primary);"><?= htmlspecialchars($q) ?></strong>"<?php endif; ?>
        </p>
    </div>
    <?php endif; ?>

    <?php if ($results): ?>
    <div class="book-grid" data-animate="fade-in-up" data-delay="100">
        <?php foreach ($results as $book): ?>
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
        <a href="?<?= http_build_query(array_merge($_GET, ['page' => $page_no - 1])) ?>" class="btn btn-secondary btn-sm">← Prev</a>
        <?php endif; ?>
        <?php for ($i = max(1, $page_no - 2); $i <= min($totalPages, $page_no + 2); $i++): ?>
        <a href="?<?= http_build_query(array_merge($_GET, ['page' => $i])) ?>" class="btn btn-sm <?= $i === $page_no ? 'btn-primary' : 'btn-secondary' ?>"><?= $i ?></a>
        <?php endfor; ?>
        <?php if ($page_no < $totalPages): ?>
        <a href="?<?= http_build_query(array_merge($_GET, ['page' => $page_no + 1])) ?>" class="btn btn-secondary btn-sm">Next →</a>
        <?php endif; ?>
    </div>
    <?php endif; ?>

    <?php elseif ($q || $category || $subject || $language): ?>
    <div style="text-align:center;padding:80px 24px;" data-animate="fade-in-up">
        <div style="font-size:4rem;margin-bottom:20px;">🔍</div>
        <h3 style="font-family:var(--font-display);font-size:1.3rem;font-weight:600;margin-bottom:8px;">No results found</h3>
        <p style="color:var(--text-muted);margin-bottom:4px;">We couldn't find any books matching your search.</p>
        <p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:24px;">Try different keywords or browse by category.</p>
        <a href="/books" class="btn btn-primary">Browse All Books</a>
    </div>
    <?php else: ?>
    <div style="text-align:center;padding:80px 24px;" data-animate="fade-in-up">
        <div style="font-size:4rem;margin-bottom:20px;">🔍</div>
        <h3 style="font-family:var(--font-display);font-size:1.3rem;font-weight:600;margin-bottom:8px;">Search our library</h3>
        <p style="color:var(--text-muted);margin-bottom:24px;">Use the search bar above to find books by title, author, subject, or keyword.</p>
    </div>
    <?php endif; ?>
</section>
