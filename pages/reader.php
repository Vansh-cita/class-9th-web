<?php
$user = getCurrentUser();
if (!$user) { header('Location: /login'); exit; }

$siteName = getSetting('site_name', 'CBSE Class 9 Portal');
$bookId = isset($_GET['book']) ? (int)$_GET['book'] : 0;
$book = getBook($bookId);
if (!$book) { header('Location: /404'); exit; }

$chapters = getChapters($bookId);
$chapterId = isset($_GET['chapter']) ? (int)$_GET['chapter'] : null;
$currentChapter = null;
if ($chapterId) {
    foreach ($chapters as $ch) {
        if ($ch['id'] == $chapterId) { $currentChapter = $ch; break; }
    }
}

$progress = getReadingProgress($user['id'], $bookId);
$page = $progress ? (int)$progress['last_page'] : 1;

$hasBookmark = false;
try {
    $stmt = getDB()->prepare("SELECT COUNT(*) as count FROM bookmarks WHERE user_id = ? AND book_id = ?");
    $stmt->execute([$user['id'], $bookId]);
    $hasBookmark = (int)$stmt->fetch()['count'] > 0;
} catch (Exception $e) {}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($book['title']) ?> - Reader - <?= htmlspecialchars($siteName) ?></title>
    <meta name="theme-color" content="#050505">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="/assets/css/style.css">
    <link rel="stylesheet" href="/assets/css/reader.css">
    <link rel="icon" type="image/svg+xml" href="/assets/images/favicon.svg">
    <style>
        .reader-wrapper { opacity:1; pointer-events:auto; position:relative; z-index:1; }
        .kb-hint { position:fixed; bottom:80px; left:50%; transform:translateX(-50%); background:rgba(0,0,0,0.8); backdrop-filter:blur(10px); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:12px 20px; display:none; gap:16px; z-index:100; font-size:0.85rem; color:var(--text-secondary); }
        .kb-hint.show { display:flex; }
        .kb-hint kbd { background:var(--bg-glass-strong); padding:2px 8px; border-radius:4px; font-size:0.75rem; font-family:inherit; color:var(--text-primary); border:1px solid var(--border-color); }
        .reader-pdf-frame { width:100%; height:100%; border:none; }
    </style>
</head>
<body>
    <div class="reader-wrapper" data-book-id="<?= $bookId ?>">
        <div class="reader-progress">
            <div class="reader-progress-bar" style="width:<?= $progress ? min((float)$progress['progress_percent'], 100) : 0 ?>%;"></div>
        </div>

        <div class="reader-toolbar">
            <div class="reader-toolbar-left">
                <button data-reader-close onclick="location.href='/book?id=<?= $bookId ?>'" aria-label="Close reader">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                </button>
                <span class="reader-title" id="readerBookTitle"><?= htmlspecialchars($book['title']) ?></span>
                <?php if ($currentChapter): ?>
                <span style="color:var(--text-muted);font-size:0.85rem;">— <?= htmlspecialchars($currentChapter['title']) ?></span>
                <?php endif; ?>
            </div>

            <div class="reader-toolbar-center">
                <button data-toggle-chapters aria-label="Toggle chapters sidebar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                </button>
                <button data-toggle-bookmark aria-label="<?= $hasBookmark ? 'Remove bookmark' : 'Add bookmark' ?>" class="<?= $hasBookmark ? 'active' : '' ?>">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="<?= $hasBookmark ? 'currentColor' : 'none' ?>" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                </button>
                <span style="width:1px;height:24px;background:var(--border-color);margin:0 4px;"></span>
                <button data-zoom-out aria-label="Zoom out">−</button>
                <button data-zoom-reset aria-label="Reset zoom" style="font-size:0.75rem;font-weight:600;">1×</button>
                <button data-zoom-in aria-label="Zoom in">+</button>
                <span style="width:1px;height:24px;background:var(--border-color);margin:0 4px;"></span>
                <button data-font-size="sm" aria-label="Small font">A</button>
                <button data-font-size="md" aria-label="Medium font" class="active" style="font-weight:700;">A</button>
                <button data-font-size="lg" aria-label="Large font" style="font-size:1.1rem;">A</button>
                <button data-font-size="xl" aria-label="Extra large font" style="font-size:1.2rem;">A</button>
                <span style="width:1px;height:24px;background:var(--border-color);margin:0 4px;"></span>
                <button data-toggle-night-mode aria-label="Toggle night mode">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                </button>
                <button data-toggle-fullscreen aria-label="Toggle fullscreen">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
                </button>
            </div>

            <div class="reader-toolbar-right">
                <span style="font-size:0.85rem;color:var(--text-muted);" id="pageInfo"><?= $page ?> / <?= $book['page_count'] ?? '?' ?></span>
            </div>
        </div>

        <div class="reader-chapter-sidebar">
            <h3>Chapters</h3>
            <div>
                <?php if ($chapters): ?>
                <?php foreach ($chapters as $i => $ch): ?>
                <button class="chapter-item <?= ($chapterId && $ch['id'] == $chapterId) ? 'active' : '' ?>" data-chapter-page="<?= $ch['page_number'] ?? ($i + 1) ?>">
                    <?= htmlspecialchars($ch['title']) ?>
                </button>
                <?php endforeach; ?>
                <?php else: ?>
                <div style="padding:16px;color:var(--text-muted);font-size:0.85rem;">No chapters</div>
                <?php endif; ?>
            </div>
        </div>

        <div class="reader-loading" id="readerLoading" style="display:flex;">
            <div class="spinner spinner-lg"></div>
            <p style="color:var(--text-muted);font-size:0.95rem;">Loading content...</p>
        </div>

        <div class="reader-content" id="readerContent" style="display:none;">
            <?php if (!empty($book['file_path'])): ?>
            <iframe src="<?= htmlspecialchars($book['file_path']) ?>#page=<?= $page ?>" class="reader-pdf-frame" style="height:100%;border:none;"></iframe>
            <?php else: ?>
            <div style="text-align:center;padding:60px;color:var(--text-muted);">
                <p>Content is loading dynamically...</p>
            </div>
            <?php endif; ?>
        </div>

        <div class="reader-nav">
            <button id="pagePrev" <?= $page <= 1 ? 'disabled' : '' ?>>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
                Previous
            </button>
            <input type="number" id="pageJump" value="<?= $page ?>" min="1" max="<?= $book['page_count'] ?? 999 ?>" style="width:60px;text-align:center;padding:8px;border-radius:var(--radius-sm);background:var(--bg-glass-strong);border:1px solid var(--border-color);color:var(--text-primary);font-size:0.85rem;">
            <span class="page-info" id="pageInfoCenter"><?= $page ?> / <?= $book['page_count'] ?? '?' ?></span>
            <button id="pageNext" <?= $page >= ($book['page_count'] ?? 999) ? 'disabled' : '' ?>>
                Next
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
        </div>
    </div>

    <div class="kb-hint" id="kbHint">
        <span><kbd>←</kbd> <kbd>→</kbd> Navigate</span>
        <span><kbd>F</kbd> Fullscreen</span>
        <span><kbd>B</kbd> Bookmark</span>
        <span><kbd>Esc</kbd> Close</span>
        <span><kbd>M</kbd> Night Mode</span>
    </div>

    <script src="/assets/js/main.js"></script>
    <script src="/assets/js/reader.js"></script>
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        var pageJump = document.getElementById('pageJump');
        var pagePrev = document.getElementById('pagePrev');
        var pageNext = document.getElementById('pageNext');
        var pageInfoCenter = document.getElementById('pageInfoCenter');
        var readerContent = document.getElementById('readerContent');

        if (pageJump) {
            pageJump.addEventListener('change', function() {
                var page = parseInt(this.value);
                if (page > 0 && window.loadPage) {
                    window.loadPage(page);
                }
            });
            pageJump.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') this.blur();
            });
        }

        if (pagePrev) {
            pagePrev.addEventListener('click', function() {
                if (window.goToPrevPage) window.goToPrevPage();
            });
        }
        if (pageNext) {
            pageNext.addEventListener('click', function() {
                if (window.goToNextPage) window.goToNextPage();
            });
        }

        document.addEventListener('keydown', function(e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.key === '?' || e.key === '/') {
                e.preventDefault();
                document.getElementById('kbHint')?.classList.toggle('show');
            }
        });

        setTimeout(function() {
            var hint = document.getElementById('kbHint');
            if (hint) {
                hint.classList.add('show');
                setTimeout(function() { hint.classList.remove('show'); }, 4000);
            }
        }, 1000);
    });
    </script>
</body>
</html>
