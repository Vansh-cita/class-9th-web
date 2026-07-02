<?php
$user = getCurrentUser();
$siteName = getSetting('site_name', 'CBSE Class 9 Portal');
$isLoggedIn = $user !== null;
$isAdmin = $isLoggedIn && ($_SESSION['role'] ?? '') === 'admin';
$unreadCount = $isLoggedIn ? getUnreadNotificationCount($user['id']) : 0;
$activePage = $page ?? '';
?>
<nav class="navbar" role="navigation" aria-label="Main navigation">
    <div class="navbar-inner">
        <div class="flex items-center gap-md">
            <button class="hamburger" aria-label="Toggle navigation menu" aria-expanded="false">
                <span></span>
                <span></span>
                <span></span>
            </button>
            <a href="/" class="navbar-brand">
                <span class="brand-icon">C9</span>
                <span class="hidden sm:inline"><?= htmlspecialchars($siteName) ?></span>
            </a>
        </div>

        <div class="navbar-links">
            <a href="/" class="<?= $activePage === 'home' ? 'active' : '' ?>">Home</a>
            <a href="#books" class="nav-scroll">Books</a>
            <a href="#categories" class="nav-scroll">Categories</a>
            <a href="#announcements" class="nav-scroll">Announcements</a>
        </div>

        <div class="navbar-actions">
            <button class="btn-icon" id="searchToggle" aria-label="Toggle search">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </button>

            <?php if ($isLoggedIn): ?>
                <a href="/dashboard" class="btn-icon tooltip" data-tooltip="Dashboard">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                </a>
                <a href="/bookmarks" class="btn-icon tooltip" data-tooltip="Bookmarks">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                </a>
                <a href="/notifications" class="btn-icon tooltip" data-tooltip="Notifications">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                    <span class="badge notification-badge-count" style="<?= $unreadCount > 0 ? '' : 'display:none;' ?>"><?= min($unreadCount, 99) ?></span>
                </a>
                <div class="relative">
                    <button class="btn-icon" data-dropdown-toggle="#profileDropdown" aria-label="Profile menu">
                        <span class="avatar-initials" style="width:32px;height:32px;font-size:0.8rem;">
                            <?= strtoupper(substr($user['username'] ?? $user['name'] ?? 'U', 0, 1)) ?>
                        </span>
                    </button>
                    <div id="profileDropdown" class="dropdown" style="position:absolute;top:calc(100% + 8px);right:0;min-width:200px;padding:8px;display:none;z-index:var(--z-dropdown);">
                        <a href="/profile">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            Profile
                        </a>
                        <a href="/settings">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                            Settings
                        </a>
                        <?php if ($isAdmin): ?>
                        <a href="/admin">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                            Admin Panel
                        </a>
                        <?php endif; ?>
                        <hr style="border:none;border-top:1px solid var(--border-color);margin:4px 0;">
                        <a href="#" data-logout style="color:#ff1744;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                            Logout
                        </a>
                    </div>
                </div>
            <?php else: ?>
                <a href="/login" class="btn btn-secondary btn-sm">Portal Login</a>
                <a href="/register" class="btn btn-primary btn-sm">Get Started</a>
            <?php endif; ?>
        </div>
    </div>

    <div class="mobile-nav" aria-label="Mobile navigation">
        <a href="/" class="<?= $activePage === 'home' ? 'active' : '' ?>">Home</a>
        <a href="#books" class="nav-scroll">Books</a>
        <a href="#categories" class="nav-scroll">Categories</a>
        <a href="#announcements" class="nav-scroll">Announcements</a>
        <?php if ($isLoggedIn): ?>
        <hr style="border:none;border-top:1px solid var(--border-color);margin:12px 0;">
        <a href="/dashboard">Dashboard</a>
        <a href="/bookmarks">Bookmarks</a>
        <a href="/notifications">Notifications</a>
        <a href="/profile">Profile</a>
        <a href="/settings">Settings</a>
        <?php if ($isAdmin): ?>
        <a href="/admin">Admin Panel</a>
        <?php endif; ?>
        <a href="#" data-logout style="color:#ff1744;">Logout</a>
        <?php else: ?>
        <hr style="border:none;border-top:1px solid var(--border-color);margin:12px 0;">
        <a href="/login">Portal Login</a>
        <a href="/register">Get Started</a>
        <?php endif; ?>
    </div>
</nav>
