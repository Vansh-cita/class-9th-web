<?php
$user = getCurrentUser();
$isLoggedIn = $user !== null;
$siteName = getSetting('site_name', 'CBSE Class 9 Portal');
$books = getBooks(6);
$categories = getCategories();
$announcements = getAnnouncements(3);
?>
<section class="hero">
    <div class="hero-bg"></div>
    <div class="floating-elements">
        <div class="floating-element" style="border-color:var(--border-accent);box-shadow:0 0 30px var(--accent-glow);">📚</div>
        <div class="floating-element">📝</div>
        <div class="floating-element" style="border-color:var(--border-accent);box-shadow:0 0 30px var(--accent-glow);">🎯</div>
        <div class="floating-element">⭐</div>
        <div class="floating-element">📖</div>
        <div class="floating-element" style="border-color:var(--border-accent);box-shadow:0 0 30px var(--accent-glow);">🏆</div>
    </div>
    <div class="hero-content">
        <div class="hero-badge" data-animate="fade-in-up">
            <span class="dot"></span>
            New NCERT 2026-27 Edition Books Available
        </div>
        <h1 class="hero-title" data-animate="fade-in-up" data-delay="100">
            Master <span class="gradient-text">CBSE Class 9</span>
        </h1>
        <p class="hero-subtitle" data-animate="fade-in-up" data-delay="200">
            Access the latest NCERT textbooks, chapter-wise solutions, practice materials, and interactive learning resources — all in one place, completely free.
        </p>
        <div class="hero-actions" data-animate="fade-in-up" data-delay="300">
            <?php if ($isLoggedIn): ?>
                <a href="/dashboard" class="btn btn-primary btn-lg">Go to Dashboard</a>
                <a href="/books" class="btn btn-secondary btn-lg">Browse Books</a>
            <?php else: ?>
                <a href="/register" class="btn btn-primary btn-lg">Get Started Free</a>
                <a href="/login" class="btn btn-secondary btn-lg">Portal Login</a>
            <?php endif; ?>
        </div>
        <div style="margin-top:44px;" data-animate="fade-in-up" data-delay="400">
            <div class="search-bar" style="margin:0 auto;">
                <span class="search-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </span>
                <input type="text" placeholder="Search for books, subjects, chapters..." aria-label="Search books">
                <button class="search-clear" aria-label="Clear search">✕</button>
                <div class="search-results"></div>
            </div>
        </div>
    </div>
</section>

<div class="divider"></div>

<section class="section" id="books">
    <div class="section-header" data-animate="fade-in-up">
        <h2 class="section-title">Latest <span class="text-accent">NCERT Books</span></h2>
        <p class="section-subtitle">Browse the newest CBSE Class 9 NCERT textbooks across all subjects for the 2026-27 session</p>
    </div>
    <?php if ($books && count($books) > 0): ?>
    <div class="book-grid" data-animate="fade-in-up" data-delay="100">
        <?php foreach ($books as $book): ?>
        <a href="<?= $isLoggedIn ? '/book?id=' . $book['id'] : '/login' ?>" class="book-card">
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
                <p class="book-card-author">by <?= htmlspecialchars($book['author']) ?></p>
                <?php endif; ?>
                <div class="book-card-meta">
                    <span><?= htmlspecialchars($book['subject'] ?? 'General') ?></span>
                    <span>📄 <?= $book['page_count'] ?? 'N/A' ?> pages</span>
                </div>
            </div>
        </a>
        <?php endforeach; ?>
    </div>
    <?php else: ?>
    <div class="text-center" style="padding:80px 24px;color:var(--text-muted);" data-animate="fade-in-up">
        <div style="font-size:4rem;margin-bottom:20px;">📚</div>
        <p style="font-size:1.1rem;font-weight:500;">Books are being added. Check back soon!</p>
    </div>
    <?php endif; ?>
    <div class="text-center mt-xl" data-animate="fade-in-up">
        <a href="/books" class="btn btn-outline btn-lg">View All Books →</a>
    </div>
</section>

<div class="divider"></div>

<section class="section" id="categories">
    <div class="section-header" data-animate="fade-in-up">
        <h2 class="section-title">Browse by <span class="text-accent">Category</span></h2>
        <p class="section-subtitle">Find books organized by subject — Mathematics, Science, Social Studies, and more</p>
    </div>
    <?php if ($categories && count($categories) > 0): ?>
    <div class="category-grid" data-animate="fade-in-up" data-delay="100">
        <?php
        $icons = ['📖','🔬','🧮','🌍','📜','📏','🔤','💻','🎨','🎵','🎭','🏛️'];
        $i = 0;
        ?>
        <?php foreach ($categories as $cat): ?>
        <a href="/categories?id=<?= $cat['id'] ?>" class="category-card">
            <div class="category-icon"><?= $icons[$i % count($icons)] ?></div>
            <div class="category-name"><?= htmlspecialchars($cat['name']) ?></div>
            <div class="category-count"><?= $cat['book_count'] ?? '0' ?> books</div>
        </a>
        <?php $i++; endforeach; ?>
    </div>
    <?php else: ?>
    <div class="text-center" style="padding:60px 24px;color:var(--text-muted);" data-animate="fade-in-up">
        <div style="font-size:3rem;margin-bottom:12px;">🏷️</div>
        <p>Categories coming soon.</p>
    </div>
    <?php endif; ?>
</section>

<div class="divider"></div>

<section class="section" id="announcements">
    <div class="section-header" data-animate="fade-in-up">
        <h2 class="section-title">Latest <span class="text-accent">Announcements</span></h2>
        <p class="section-subtitle">Stay updated with academic news, exam schedules, and portal updates</p>
    </div>
    <?php if ($announcements && count($announcements) > 0): ?>
    <div style="max-width:780px;margin:0 auto;" data-animate="fade-in-up" data-delay="100">
        <?php foreach ($announcements as $ann): ?>
        <div class="glass-card" style="margin-bottom:16px;padding:24px;display:flex;gap:18px;align-items:flex-start;transition:all var(--transition-base);">
            <div style="width:44px;height:44px;border-radius:50%;background:<?= $ann['is_pinned'] ? 'var(--accent-gradient)' : 'var(--bg-glass-strong)' ?>;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:1.2rem;box-shadow:<?= $ann['is_pinned'] ? '0 0 20px var(--accent-glow)' : 'none' ?>;">
                <?= $ann['is_pinned'] ? '📌' : '📢' ?>
            </div>
            <div style="flex:1;">
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;flex-wrap:wrap;">
                    <h3 style="font-family:var(--font-display);font-weight:600;font-size:1.05rem;color:var(--text-primary);"><?= htmlspecialchars($ann['title']) ?></h3>
                    <?php if ($ann['is_pinned']): ?>
                    <span class="badge badge-accent">Pinned</span>
                    <?php endif; ?>
                    <span class="badge" style="background:var(--bg-glass-strong);color:var(--text-muted);font-size:0.7rem;"><?= htmlspecialchars($ann['type'] ?? 'general') ?></span>
                </div>
                <p style="color:var(--text-secondary);font-size:0.95rem;line-height:1.7;margin-bottom:12px;"><?= htmlspecialchars(truncateText($ann['content'] ?? $ann['message'] ?? '', 240)) ?></p>
                <span style="font-size:0.8rem;color:var(--text-muted);"><?= timeAgo($ann['created_at']) ?></span>
            </div>
        </div>
        <?php endforeach; ?>
    </div>
    <?php else: ?>
    <div class="text-center" style="padding:80px 24px;color:var(--text-muted);" data-animate="fade-in-up">
        <div style="font-size:4rem;margin-bottom:16px;">📣</div>
        <p style="font-size:1.1rem;">No announcements yet. Stay tuned!</p>
    </div>
    <?php endif; ?>
    <div class="text-center mt-xl" data-animate="fade-in-up">
        <a href="/announcements" class="btn btn-outline btn-lg">View All Announcements →</a>
    </div>
</section>

<div class="divider"></div>

<section class="section" style="text-align:center;padding:100px 24px;">
    <div data-animate="fade-in-up">
        <div style="font-size:3rem;margin-bottom:20px;">🚀</div>
        <h2 class="section-title" style="font-size:clamp(1.5rem,3.5vw,2.2rem);">Ready to Start <span class="text-accent">Learning</span>?</h2>
        <p class="section-subtitle" style="max-width:500px;margin:0 auto 36px;">Join thousands of CBSE Class 9 students already using the portal to excel in their studies.</p>
        <?php if ($isLoggedIn): ?>
            <a href="/dashboard" class="btn btn-primary btn-xl">Go to Dashboard</a>
        <?php else: ?>
            <a href="/register" class="btn btn-primary btn-xl">Create Free Account</a>
        <?php endif; ?>
    </div>
</section>
