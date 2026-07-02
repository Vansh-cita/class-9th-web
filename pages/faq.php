<?php
$siteName = getSetting('site_name', 'CBSE Class 9 Portal');

$faqCategories = [
    'Getting Started' => [
        ['q' => 'What is this CBSE Class 9 Learning Portal?', 'a' => 'This portal is a free, comprehensive learning platform designed specifically for CBSE Class 9 students. It provides access to NCERT textbooks, chapter-wise solutions, practice papers, reading progress tracking, bookmarks, and much more — all in one place with a modern, easy-to-use interface.'],
        ['q' => 'Is this portal really free?', 'a' => 'Yes, absolutely free. All resources including NCERT textbooks, solutions, practice materials, and reading tools are available at no cost. We believe quality education should be accessible to every student.'],
        ['q' => 'How do I create an account?', 'a' => 'Click the "Register" button on the top right corner. Fill in your username (must be at least 3 characters), create a strong password, enter your school role number, and provide your school name. You can also optionally enter a User-ID code if you have one for special access.'],
    ],
    'Books & Reading' => [
        ['q' => 'What books are available on the portal?', 'a' => 'We have all NCERT textbooks for CBSE Class 9 including Mathematics, Science, Social Science, English (Beehive & Moments), Hindi (Kshitij & Kritika), Sanskrit, and Information Technology. All books are available in the latest 2025-26 edition.'],
        ['q' => 'Can I read books offline?', 'a' => 'Yes, you can download books as PDF files for offline reading. Simply open any book and look for the download button in the reader toolbar. Downloaded books can be accessed anytime without an internet connection.'],
        ['q' => 'How does the reading progress tracking work?', 'a' => 'Your reading progress is automatically saved as you read. The reader remembers your last position in each book and chapter. You can see your progress percentage on the book card and in your dashboard. Progress syncs across all your devices when you are logged in.'],
        ['q' => 'Can I bookmark pages for later reference?', 'a' => 'Absolutely. While reading, click the bookmark icon on any page to save it. You can view all your bookmarks from the Bookmarks section in the navigation menu. Bookmarks include the book title, chapter name, and a preview of the saved content.'],
    ],
    'Account & Settings' => [
        ['q' => 'How do I reset my password?', 'a' => 'On the login page, click the "Forgot Password" link. Enter the email address associated with your account, and we will send you a password reset link. If you haven\'t set an email, please contact your school administrator or our support team.'],
        ['q' => 'Can I change my username or school name?', 'a' => 'Yes, you can update your profile information from the Settings page. Go to your profile dropdown and select "Settings". You can change your username, school name, and other details there. Note that some changes may require admin approval.'],
        ['q' => 'How do I delete my account?', 'a' => 'Account deletion can be requested from the Settings page. Click "Delete Account" at the bottom of the settings panel. Please note that this action is irreversible and will permanently remove all your data including reading progress and bookmarks.'],
    ],
    'Technical Support' => [
        ['q' => 'What devices are supported?', 'a' => 'The portal works on all modern devices including desktop computers, laptops, tablets, and smartphones. It is optimized for Chrome, Firefox, Safari, and Edge browsers. For the best reading experience, we recommend using a tablet or a computer with a screen resolution of at least 1024px.'],
        ['q' => 'The reader is not loading properly. What should I do?', 'a' => 'First, try refreshing the page. If the issue persists, clear your browser cache and cookies. Make sure you are using an updated browser. If you still face issues, check your internet connection and try disabling browser extensions that might block content. Contact support if the problem continues.'],
        ['q' => 'How do I enable dark mode?', 'a' => 'The portal uses a dark theme by default for comfortable reading. You can toggle between dark and light themes using the theme button in the navigation bar (if available). Your preference is saved and will be applied across sessions.'],
    ],
];
?>
<section class="section" style="padding-top:120px;">
    <div class="section-header" data-animate="fade-in-up">
        <span class="hero-badge" style="margin-bottom:16px;">
            <span class="dot"></span>
            Help Center
        </span>
        <h1 class="section-title" style="font-size:clamp(2rem,5vw,3rem);">Frequently Asked <span class="text-accent">Questions</span></h1>
        <p class="section-subtitle">Everything you need to know about the CBSE Class 9 Learning Portal</p>
    </div>

    <div style="max-width:600px;margin:-16px auto 48px;" data-animate="fade-in-up" data-delay="100">
        <div class="search-bar" style="margin:0 auto;">
            <span class="search-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <input type="text" id="faqSearch" placeholder="Search FAQs..." aria-label="Search FAQs">
            <button class="search-clear" id="faqSearchClear" aria-label="Clear search">✕</button>
        </div>
    </div>

    <div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-bottom:48px;" data-animate="fade-in-up" data-delay="150">
        <?php $catIndex = 0; ?>
        <?php foreach ($faqCategories as $catName => $items): ?>
        <button class="btn btn-sm <?= $catIndex === 0 ? 'btn-primary' : 'btn-secondary' ?> faq-cat-filter" data-cat="<?= $catIndex ?>"><?= htmlspecialchars($catName) ?></button>
        <?php $catIndex++; endforeach; ?>
        <button class="btn btn-sm btn-ghost faq-cat-filter active" data-cat="all">All Questions</button>
    </div>

    <div style="max-width:800px;margin:0 auto;">
        <?php $globalIndex = 0; ?>
        <?php foreach ($faqCategories as $catName => $items): ?>
        <?php foreach ($items as $faq): ?>
        <div class="faq-item faq-entry" data-category="<?= $catIndex ?>" data-animate="fade-in-up" data-delay="<?= ($globalIndex % 5) * 50 ?>" data-search="<?= htmlspecialchars(strtolower($faq['q'] . ' ' . $faq['a'] . ' ' . $catName)) ?>">
            <div class="faq-question">
                <span><?= htmlspecialchars($faq['q']) ?></span>
                <span class="faq-icon">+</span>
            </div>
            <div class="faq-answer"><?= nl2br(htmlspecialchars($faq['a'])) ?></div>
        </div>
        <?php $globalIndex++; endforeach; ?>
        <?php $catIndexDisplay = $catIndex++; ?>
        <?php endforeach; ?>
    </div>

    <div class="text-center mt-xl" data-animate="fade-in-up">
        <div class="card" style="max-width:500px;margin:0 auto;text-align:center;">
            <div style="font-size:2rem;margin-bottom:12px;">💬</div>
            <h3 style="font-family:var(--font-display);font-weight:600;margin-bottom:8px;">Still have questions?</h3>
            <p style="color:var(--text-secondary);font-size:0.95rem;margin-bottom:20px;">Can\'t find the answer you\'re looking for? Reach out to our support team.</p>
            <a href="/contact" class="btn btn-primary">Contact Support</a>
        </div>
    </div>
</section>

<script>
document.addEventListener('DOMContentLoaded', function() {
    var searchInput = document.getElementById('faqSearch');
    var searchClear = document.getElementById('faqSearchClear');
    var faqItems = document.querySelectorAll('.faq-entry');
    var catFilters = document.querySelectorAll('.faq-cat-filter');
    var activeCat = 'all';

    if (searchClear) {
        searchClear.addEventListener('click', function() {
            searchInput.value = '';
            searchClear.classList.remove('visible');
            filterFaqs('', activeCat);
            searchInput.focus();
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', function() {
            var q = this.value.trim();
            if (searchClear) searchClear.classList.toggle('visible', q.length > 0);
            filterFaqs(q.toLowerCase(), activeCat);
        });
    }

    catFilters.forEach(function(btn) {
        btn.addEventListener('click', function() {
            catFilters.forEach(function(b) { b.classList.remove('btn-primary'); b.classList.add('btn-secondary'); });
            this.classList.remove('btn-secondary');
            this.classList.add('btn-primary');
            activeCat = this.getAttribute('data-cat');
            filterFaqs(searchInput ? searchInput.value.trim().toLowerCase() : '', activeCat);
        });
    });

    function filterFaqs(query, cat) {
        faqItems.forEach(function(item) {
            var searchData = item.getAttribute('data-search') || '';
            var itemCat = item.getAttribute('data-category');
            var matchesSearch = !query || searchData.indexOf(query) !== -1;
            var matchesCat = cat === 'all' || itemCat === cat;
            item.style.display = matchesSearch && matchesCat ? '' : 'none';
        });
    }
});
</script>
