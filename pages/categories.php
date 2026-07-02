<?php
$user = getCurrentUser();
if (!$user) { header('Location: /login'); exit; }

$categories = getCategories();
$icons = ['📖','🔬','🧮','🌍','📜','📏','🔤','💻','🎨','🎵','🎭','🏛️'];
?>
<section class="section" style="padding-top:120px;">
    <div class="section-header" data-animate="fade-in-up">
        <h1 style="font-family:var(--font-display);font-size:clamp(1.5rem,4vw,2.5rem);font-weight:800;margin-bottom:12px;">Browse by <span class="text-accent">Category</span></h1>
        <p style="color:var(--text-secondary);font-size:1rem;">Find NCERT books organized by subject and topic</p>
    </div>

    <?php if ($categories): ?>
    <div class="category-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:24px;" data-animate="fade-in-up" data-delay="100">
        <?php $i = 0; ?>
        <?php foreach ($categories as $cat): ?>
        <a href="/books?category=<?= $cat['id'] ?>" class="card" style="display:flex;flex-direction:column;align-items:center;text-align:center;padding:32px 20px;gap:12px;transition:transform var(--transition-base),box-shadow var(--transition-base),border-color var(--transition-base);">
            <div style="width:64px;height:64px;border-radius:var(--radius-lg);background:var(--bg-glass-strong);display:flex;align-items:center;justify-content:center;font-size:2rem;">
                <?= $icons[$i % count($icons)] ?>
            </div>
            <h3 style="font-family:var(--font-display);font-size:1.1rem;font-weight:600;"><?= htmlspecialchars($cat['name']) ?></h3>
            <p style="font-size:0.85rem;color:var(--text-muted);margin:0;"><?= $cat['book_count'] ?? '0' ?> books</p>
            <span class="btn btn-sm btn-outline" style="margin-top:4px;">Browse →</span>
        </a>
        <?php $i++; endforeach; ?>
    </div>
    <?php else: ?>
    <div style="text-align:center;padding:80px 24px;" data-animate="fade-in-up">
        <div style="font-size:4rem;margin-bottom:20px;">🏷️</div>
        <h3 style="font-family:var(--font-display);font-size:1.3rem;font-weight:600;margin-bottom:8px;">No categories yet</h3>
        <p style="color:var(--text-muted);">Categories are being added. Check back soon!</p>
    </div>
    <?php endif; ?>

    <div style="margin-top:48px;text-align:center;" data-animate="fade-in-up" data-delay="150">
        <a href="/books" class="btn btn-primary btn-lg">View All Books</a>
    </div>
</section>
