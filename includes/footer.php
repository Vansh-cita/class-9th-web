    </div>

    <footer class="footer">
        <div class="footer-inner">
            <div class="footer-grid">
                <div>
                    <div class="footer-brand">
                        <span style="display:inline-flex;align-items:center;gap:10px;">
                            <span style="width:36px;height:36px;background:var(--accent-gradient);border-radius:var(--radius-md);display:inline-flex;align-items:center;justify-content:center;font-size:1rem;font-weight:900;color:var(--text-inverse);">C9</span>
                            <?= htmlspecialchars(getSetting('site_name', 'CBSE Class 9 Portal')) ?>
                        </span>
                    </div>
                    <p class="footer-desc"><?= htmlspecialchars(getSetting('site_description', 'Your complete learning portal for CBSE Class 9 with NCERT books, study materials, and resources.')) ?></p>
                </div>
                <div>
                    <h4 class="footer-heading">Quick Links</h4>
                    <div class="footer-links">
                        <a href="/">Home</a>
                        <a href="/books">Books</a>
                        <a href="/categories">Categories</a>
                        <a href="/announcements">Announcements</a>
                        <a href="/faq">FAQ</a>
                    </div>
                </div>
                <div>
                    <h4 class="footer-heading">Support</h4>
                    <div class="footer-links">
                        <a href="/faq">Help Center</a>
                        <a href="/contact">Contact Us</a>
                        <a href="/privacy">Privacy Policy</a>
                        <a href="/terms">Terms of Service</a>
                    </div>
                </div>
                <div>
                    <h4 class="footer-heading">Connect</h4>
                    <p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:16px;">Stay updated with the latest resources and announcements.</p>
                    <div class="footer-social">
                        <a href="#" aria-label="Facebook">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                        </a>
                        <a href="#" aria-label="Twitter">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>
                        </a>
                        <a href="#" aria-label="YouTube">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48" fill="currentColor"/></svg>
                        </a>
                        <a href="#" aria-label="Instagram">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                        </a>
                    </div>
                </div>
            </div>
            <div class="footer-bottom">
                <span class="footer-copyright">&copy; <?= date('Y') ?> <?= htmlspecialchars(getSetting('site_name', 'CBSE Class 9 Portal')) ?>. All rights reserved.</span>
                <span class="footer-copyright">Made with ❤️ for CBSE Class 9 Students</span>
            </div>
        </div>
    </footer>

    <button id="backToTop" aria-label="Back to top" style="position:fixed;bottom:24px;right:24px;width:44px;height:44px;border-radius:50%;background:var(--accent-gradient);color:var(--text-inverse);border:none;cursor:pointer;display:none;align-items:center;justify-content:center;font-size:1.2rem;z-index:50;box-shadow:0 0 20px var(--accent-glow);transition:transform var(--transition-fast),opacity var(--transition-fast);">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
    </button>

    <script src="/assets/js/main.js"></script>
    <script src="/assets/js/auth.js"></script>
    <?php if ($isAdminPage): ?>
    <script src="/assets/js/admin.js"></script>
    <?php endif; ?>
    <?php if ($isReaderPage): ?>
    <script src="/assets/js/reader.js"></script>
    <?php endif; ?>
    <?php if ($page === 'dashboard'): ?>
    <script src="/assets/js/dashboard.js"></script>
    <?php endif; ?>

    <script>
    document.addEventListener('DOMContentLoaded', function() {
        var backToTop = document.getElementById('backToTop');
        if (backToTop) {
            window.addEventListener('scroll', function() {
                backToTop.style.display = window.scrollY > 300 ? 'flex' : 'none';
            }, { passive: true });
            backToTop.addEventListener('click', function() {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
    });
    </script>
</body>
</html>
