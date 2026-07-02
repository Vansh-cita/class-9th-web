/**
 * 📖 CBSE Class 9 Learning Portal - Book Reader Module
 * Fullscreen, navigation, bookmarks, progress, keyboard/touch support.
 */
(function () {
  'use strict';

  const API = '/api';

  let readerState = {
    bookId: null,
    currentPage: 1,
    totalPages: 1,
    currentChapter: null,
    chapters: [],
    isFullscreen: false,
    isNightMode: localStorage.getItem('reader-night-mode') === 'true',
    fontSize: localStorage.getItem('reader-font-size') || 'md',
    zoom: 1,
    bookmarks: [],
  };

  document.addEventListener('DOMContentLoaded', () => {
    const wrapper = document.querySelector('.reader-wrapper');
    if (!wrapper) return;

    initReader();
  });

  function initReader() {
    const wrapper = document.querySelector('.reader-wrapper');
    const bookId = wrapper?.getAttribute('data-book-id');
    if (!bookId) return;

    readerState.bookId = bookId;

    initReaderToolbar();
    initReaderNavigation();
    initChapterSidebar();
    initBookmarkButton();
    initZoomControls();
    initProgressBar();
    initFontSizeControls();
    initNightMode();
    initKeyboardShortcuts();
    initTouchSupport();
    initFullscreenToggle();
    loadBookData(bookId);
    restoreLastPage(bookId);
  }

  /* ═══════════════════════════════════════
     Load Book Data
     ═══════════════════════════════════════ */

  async function loadBookData(bookId) {
    const content = document.getElementById('readerContent');
    const loadingEl = document.getElementById('readerLoading');

    if (loadingEl) loadingEl.style.display = 'flex';
    if (content) content.style.display = 'none';

    try {
      const res = await fetch(`${API}/books/${bookId}/read`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error('Failed to load book');

      const data = await res.json();

      readerState.totalPages = data.totalPages || 1;
      readerState.chapters = data.chapters || [];
      readerState.bookmarks = data.bookmarks || [];

      // Set title
      const titleEl = document.getElementById('readerBookTitle');
      if (titleEl) titleEl.textContent = data.title || 'Reader';

      // Load chapters sidebar
      renderChapterSidebar();

      // Load bookmarks state
      updateBookmarkButton();

      // Load first page or last page
      const startPage = readerState.currentPage || 1;
      await loadPage(startPage);
    } catch (err) {
      if (content) {
        content.innerHTML = `<div style="text-align:center;padding:80px;color:var(--text-muted);">Failed to load book. <button onclick="location.reload()" class="btn btn-primary" style="display:inline-flex;margin-top:16px;">Retry</button></div>`;
        content.style.display = 'block';
      }
    } finally {
      if (loadingEl) loadingEl.style.display = 'none';
      if (content) content.style.display = 'block';
    }
  }

  async function loadPage(page) {
    const content = document.getElementById('readerContent');
    if (!content) return;

    if (page < 1 || page > readerState.totalPages) return;

    readerState.currentPage = page;

    // Animate out
    content.classList.remove('page-enter');
    content.classList.add('page-exit');

    setTimeout(async () => {
      try {
        const res = await fetch(`${API}/books/${readerState.bookId}/page/${page}`, {
          headers: getAuthHeaders(),
        });

        if (!res.ok) throw new Error('Failed');

        const data = await res.json();

        content.innerHTML = data.html || data.content || '<p>Page content not available.</p>';
        content.classList.remove('page-exit');
        content.classList.add('page-enter');

        // Update navigation
        updateNavigation();
        updateProgress();
        syncReadingProgress(page);

        // Scroll to top
        content.scrollTop = 0;
      } catch (err) {
        content.innerHTML = `<p style="color:var(--text-muted);text-align:center;">Failed to load page ${page}</p>`;
        content.classList.remove('page-exit');
        content.classList.add('page-enter');
      }
    }, 250);
  }

  /* ═══════════════════════════════════════
     Reader Toolbar
     ═══════════════════════════════════════ */

  function initReaderToolbar() {
    const closeBtn = document.querySelector('[data-reader-close]');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeReader);
    }

    const chapterBtn = document.querySelector('[data-toggle-chapters]');
    if (chapterBtn) {
      chapterBtn.addEventListener('click', () => {
        document.querySelector('.reader-chapter-sidebar')?.classList.toggle('open');
      });
    }
  }

  function closeReader() {
    const wrapper = document.querySelector('.reader-wrapper');
    if (wrapper) {
      wrapper.classList.remove('open');
      document.body.style.overflow = '';
    }
    if (readerState.isFullscreen) {
      document.exitFullscreen?.();
    }
  }

  window.closeReader = closeReader;

  /* ═══════════════════════════════════════
     Page Navigation
     ═══════════════════════════════════════ */

  function initReaderNavigation() {
    const prevBtn = document.getElementById('pagePrev');
    const nextBtn = document.getElementById('pageNext');

    if (prevBtn) prevBtn.addEventListener('click', goToPrevPage);
    if (nextBtn) nextBtn.addEventListener('click', goToNextPage);
  }

  function goToPrevPage() {
    if (readerState.currentPage > 1) {
      loadPage(readerState.currentPage - 1);
    }
  }

  function goToNextPage() {
    if (readerState.currentPage < readerState.totalPages) {
      loadPage(readerState.currentPage + 1);
    }
  }

  function updateNavigation() {
    const prevBtn = document.getElementById('pagePrev');
    const nextBtn = document.getElementById('pageNext');
    const pageInfo = document.getElementById('pageInfo');

    if (prevBtn) prevBtn.disabled = readerState.currentPage <= 1;
    if (nextBtn) nextBtn.disabled = readerState.currentPage >= readerState.totalPages;
    if (pageInfo) pageInfo.textContent = `${readerState.currentPage} / ${readerState.totalPages}`;
  }

  window.goToNextPage = goToNextPage;
  window.goToPrevPage = goToPrevPage;

  /* ═══════════════════════════════════════
     Chapter Sidebar
     ═══════════════════════════════════════ */

  function initChapterSidebar() {
    // Setup is done after loading chapters
  }

  function renderChapterSidebar() {
    const sidebar = document.querySelector('.reader-chapter-sidebar');
    if (!sidebar) return;

    const heading = sidebar.querySelector('h3') || document.createElement('h3');
    heading.textContent = 'Chapters';

    const list = document.createElement('div');

    if (readerState.chapters.length === 0) {
      list.innerHTML = `<div style="padding:16px;color:var(--text-muted);font-size:0.85rem;">No chapters</div>`;
    } else {
      list.innerHTML = readerState.chapters.map((ch, i) => `
        <button class="chapter-item ${ch.page === readerState.currentPage || (i === 0 && !readerState.currentPage) ? 'active' : ''}"
                data-chapter-page="${ch.page || (i + 1)}">
          ${ch.title || `Chapter ${i + 1}`}
        </button>
      `).join('');
    }

    // Replace content
    const existingList = sidebar.querySelector('div');
    if (existingList) {
      sidebar.replaceChild(list, existingList);
    } else {
      sidebar.appendChild(list);
    }

    // Add click handlers
    list.querySelectorAll('.chapter-item').forEach(item => {
      item.addEventListener('click', () => {
        const page = parseInt(item.getAttribute('data-chapter-page'));
        if (page) {
          loadPage(page);
          sidebar.classList.remove('open');
        }
      });
    });
  }

  /* ═══════════════════════════════════════
     Bookmark Button
     ═══════════════════════════════════════ */

  function initBookmarkButton() {
    const btn = document.querySelector('[data-toggle-bookmark]');
    if (!btn) return;

    btn.addEventListener('click', toggleBookmark);
  }

  function updateBookmarkButton() {
    const btn = document.querySelector('[data-toggle-bookmark]');
    if (!btn) return;

    const isBookmarked = readerState.bookmarks.some(
      bm => bm.page === readerState.currentPage
    );

    btn.classList.toggle('active', isBookmarked);
    btn.setAttribute('aria-label', isBookmarked ? 'Remove bookmark' : 'Add bookmark');
  }

  async function toggleBookmark() {
    const btn = document.querySelector('[data-toggle-bookmark]');
    if (!btn) return;

    const existing = readerState.bookmarks.findIndex(
      bm => bm.page === readerState.currentPage
    );

    try {
      if (existing >= 0) {
        // Remove bookmark
        const bmId = readerState.bookmarks[existing].id;
        const res = await fetch(`${API}/bookmarks/${bmId}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });

        if (!res.ok) throw new Error('Failed');
        readerState.bookmarks.splice(existing, 1);
        window.showToast?.('Bookmark removed', 'info');
      } else {
        // Add bookmark
        const res = await fetch(`${API}/bookmarks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            bookId: readerState.bookId,
            page: readerState.currentPage,
            chapter: readerState.currentChapter,
          }),
        });

        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        readerState.bookmarks.push({ id: data.id, page: readerState.currentPage });
        window.showToast?.('Bookmark added', 'success');
      }

      updateBookmarkButton();
    } catch (err) {
      window.showToast?.('Failed to update bookmark', 'error');
    }
  }

  /* ═══════════════════════════════════════
     Zoom Controls
     ═══════════════════════════════════════ */

  function initZoomControls() {
    const zoomIn = document.querySelector('[data-zoom-in]');
    const zoomOut = document.querySelector('[data-zoom-out]');
    const zoomReset = document.querySelector('[data-zoom-reset]');
    const content = document.getElementById('readerContent');

    if (zoomIn && content) {
      zoomIn.addEventListener('click', () => {
        readerState.zoom = Math.min(readerState.zoom + 0.1, 2);
        content.style.zoom = readerState.zoom;
      });
    }

    if (zoomOut && content) {
      zoomOut.addEventListener('click', () => {
        readerState.zoom = Math.max(readerState.zoom - 0.1, 0.5);
        content.style.zoom = readerState.zoom;
      });
    }

    if (zoomReset && content) {
      zoomReset.addEventListener('click', () => {
        readerState.zoom = 1;
        content.style.zoom = 1;
      });
    }
  }

  /* ═══════════════════════════════════════
     Progress Bar
     ═══════════════════════════════════════ */

  function initProgressBar() {
    // Bar updates on page load
  }

  function updateProgress() {
    const bar = document.querySelector('.reader-progress-bar');
    if (!bar) return;

    const progress = readerState.totalPages > 1
      ? ((readerState.currentPage / readerState.totalPages) * 100)
      : 0;

    bar.style.width = `${Math.min(progress, 100)}%`;
  }

  /* ═══════════════════════════════════════
     Font Size Controls
     ═══════════════════════════════════════ */

  function initFontSizeControls() {
    const content = document.getElementById('readerContent');
    if (!content) return;

    // Restore saved font size
    content.className = content.className.replace(/size-\w+/, '') + ` size-${readerState.fontSize}`;

    document.querySelectorAll('[data-font-size]').forEach(btn => {
      btn.addEventListener('click', () => {
        const size = btn.getAttribute('data-font-size');
        if (size) {
          readerState.fontSize = size;
          content.className = content.className.replace(/size-\w+/, '') + ` size-${size}`;
          localStorage.setItem('reader-font-size', size);
        }
      });
    });
  }

  /* ═══════════════════════════════════════
     Night Mode
     ═══════════════════════════════════════ */

  function initNightMode() {
    const wrapper = document.querySelector('.reader-wrapper');

    if (readerState.isNightMode) {
      wrapper?.classList.add('night-mode');
    }

    document.querySelectorAll('[data-toggle-night-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        readerState.isNightMode = !readerState.isNightMode;
        wrapper?.classList.toggle('night-mode', readerState.isNightMode);
        localStorage.setItem('reader-night-mode', readerState.isNightMode);
        btn.classList.toggle('active', readerState.isNightMode);
      });
    });
  }

  /* ═══════════════════════════════════════
     Keyboard Shortcuts
     ═══════════════════════════════════════ */

  function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      const wrapper = document.querySelector('.reader-wrapper');
      if (!wrapper?.classList.contains('open')) return;

      // Don't handle if user is typing in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          goToNextPage();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevPage();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'Escape':
          if (readerState.isFullscreen) {
            exitFullscreen();
          } else {
            closeReader();
          }
          break;
      }
    });
  }

  /* ═══════════════════════════════════════
     Touch / Swipe Support
     ═══════════════════════════════════════ */

  function initTouchSupport() {
    const content = document.getElementById('readerContent');
    if (!content) return;

    let touchStartX = 0;
    let touchEndX = 0;

    content.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    content.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });

    function handleSwipe() {
      const diff = touchStartX - touchEndX;
      const threshold = 50;

      if (Math.abs(diff) > threshold) {
        if (diff > 0) {
          goToNextPage();
        } else {
          goToPrevPage();
        }
      }
    }
  }

  /* ═══════════════════════════════════════
     Fullscreen Toggle
     ═══════════════════════════════════════ */

  function initFullscreenToggle() {
    document.querySelectorAll('[data-toggle-fullscreen]').forEach(btn => {
      btn.addEventListener('click', toggleFullscreen);
    });

    document.addEventListener('fullscreenchange', () => {
      readerState.isFullscreen = !!document.fullscreenElement;
      const wrapper = document.querySelector('.reader-wrapper');
      wrapper?.classList.toggle('fullscreen', readerState.isFullscreen);
    });
  }

  function toggleFullscreen() {
    const wrapper = document.querySelector('.reader-wrapper');
    if (!wrapper) return;

    if (!document.fullscreenElement) {
      wrapper.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.();
    }
  }

  function exitFullscreen() {
    document.exitFullscreen?.();
  }

  /* ═══════════════════════════════════════
     Last Page Memory Restore
     ═══════════════════════════════════════ */

  function restoreLastPage(bookId) {
    try {
      const saved = localStorage.getItem(`reading-progress-${bookId}`);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.page && data.page > 0) {
          readerState.currentPage = data.page;
        }
      }
    } catch (e) {
      // ignore
    }
  }

  /* ═══════════════════════════════════════
     Sync Reading Progress
     ═══════════════════════════════════════ */

  async function syncReadingProgress(page) {
    const progress = readerState.totalPages > 1
      ? Math.round((page / readerState.totalPages) * 100)
      : 0;

    // Local save
    const key = `reading-progress-${readerState.bookId}`;
    localStorage.setItem(key, JSON.stringify({
      page,
      progress,
      updatedAt: new Date().toISOString(),
    }));

    // Server sync (fire and forget)
    try {
      await fetch(`${API}/reading-progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          bookId: readerState.bookId,
          page,
          progress,
        }),
      });
    } catch (e) {
      // silently fail
    }
  }

  /* ═══════════════════════════════════════
     Page Loading States
     ═══════════════════════════════════════ */

  // Handled within loadPage()

  /* ═══════════════════════════════════════
     Helpers
     ═══════════════════════════════════════ */

  function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  console.log('📖 Reader module loaded');
})();
