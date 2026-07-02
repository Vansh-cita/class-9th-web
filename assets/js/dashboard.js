/**
 * 📊 CBSE Class 9 Learning Portal - Dashboard Module
 * Stats, continue reading, books, bookmarks, notifications, search, settings.
 */
(function () {
  'use strict';

  const API = '/api';

  document.addEventListener('DOMContentLoaded', () => {
    if (!document.querySelector('.dashboard-page')) return;

    initDashboardStats();
    initContinueReading();
    initRecentBooks();
    initBookmarks();
    initNotifications();
    initDashboardSearch();
    initCategoryFilter();
    initProfileUpdate();
    initSettings();
    initReadingProgress();
  });

  /* ═══════════════════════════════════════
     Dashboard Stats
     ═══════════════════════════════════════ */

  async function initDashboardStats() {
    const container = document.getElementById('dashboardStats');
    if (!container) return;

    try {
      const res = await fetch(`/api/dashboard.php?action=stats`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error('Failed to load stats');

      const data = await res.json();
      renderStats(container, data);
    } catch (err) {
      container.innerHTML = `<div class="text-muted" style="grid-column:1/-1;text-align:center;padding:40px;">Failed to load stats</div>`;
    }
  }

  function renderStats(container, data) {
    const stats = [
      { icon: '📚', value: data.booksRead || 0, label: 'Books Read', color: 'accent' },
      { icon: '📖', value: data.inProgress || 0, label: 'In Progress', color: 'blue' },
      { icon: '🔖', value: data.bookmarks || 0, label: 'Bookmarks', color: 'green' },
      { icon: '⏱', value: formatHours(data.hoursSpent || 0), label: 'Hours Spent', color: 'orange' },
    ];

    container.innerHTML = stats.map(stat => `
      <div class="admin-stat-card">
        <div class="admin-stat-header">
          <div class="admin-stat-icon ${stat.color}">${stat.icon}</div>
        </div>
        <div class="admin-stat-value">${stat.value}</div>
        <div class="admin-stat-label">${stat.label}</div>
      </div>
    `).join('');
  }

  function formatHours(hours) {
    if (hours >= 1000) return (hours / 1000).toFixed(1) + 'K';
    return Math.round(hours);
  }

  /* ═══════════════════════════════════════
     Continue Reading
     ═══════════════════════════════════════ */

  async function initContinueReading() {
    const container = document.getElementById('continueReading');
    if (!container) return;

    try {
      const res = await fetch(`/api/dashboard.php?action=continue-reading`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error('Failed');

      const data = await res.json();

      if (!data.items || data.items.length === 0) {
        container.innerHTML = `<div class="text-muted" style="text-align:center;padding:40px;">No books in progress. <a href="/books" style="color:var(--accent);">Browse books</a></div>`;
        return;
      }

      container.innerHTML = data.items.map(book => `
        <div class="book-card" onclick="location.href='/read/${book.id}'">
          <div class="book-card-cover">
            <img src="${book.cover || '/assets/img/placeholder.svg'}" alt="${book.title}" loading="lazy">
          </div>
          <div class="book-card-body">
            <div class="book-card-title">${book.title}</div>
            <div class="book-card-author">${book.author || ''}</div>
            <div style="margin-top:12px;">
              <div style="height:4px;background:var(--bg-glass-strong);border-radius:4px;overflow:hidden;">
                <div style="height:100%;width:${book.progress || 0}%;background:var(--accent-gradient);border-radius:4px;transition:width 0.5s ease;"></div>
              </div>
              <div style="font-size:0.78rem;color:var(--text-muted);margin-top:6px;">${book.progress || 0}% complete</div>
            </div>
          </div>
        </div>
      `).join('');
    } catch (err) {
      container.innerHTML = `<div class="text-muted" style="text-align:center;padding:40px;">Could not load reading list</div>`;
    }
  }

  /* ═══════════════════════════════════════
     Recent Books
     ═══════════════════════════════════════ */

  async function initRecentBooks() {
    const container = document.getElementById('recentBooks');
    if (!container) return;

    try {
      const res = await fetch(`/api/books.php?action=recent`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error('Failed');

      const data = await res.json();

      if (!data.items || data.items.length === 0) {
        container.innerHTML = `<div class="text-muted" style="text-align:center;padding:40px;">No books available yet</div>`;
        return;
      }

      container.innerHTML = data.items.map(book => `
        <div class="book-card" onclick="location.href='/books/${book.id}'">
          <div class="book-card-cover">
            <img src="${book.cover || '/assets/img/placeholder.svg'}" alt="${book.title}" loading="lazy">
            ${book.badge ? `<div class="badge badge-accent book-card-badge">${book.badge}</div>` : ''}
          </div>
          <div class="book-card-body">
            <div class="book-card-title">${book.title}</div>
            <div class="book-card-author">${book.author || ''}</div>
            <div class="book-card-meta">
              <span>${book.subject || ''}</span>
              <span>${book.pages || ''} pages</span>
            </div>
          </div>
        </div>
      `).join('');
    } catch (err) {
      container.innerHTML = `<div class="text-muted" style="text-align:center;padding:40px;">Could not load books</div>`;
    }
  }

  /* ═══════════════════════════════════════
     Bookmarks
     ═══════════════════════════════════════ */

  async function initBookmarks() {
    const container = document.getElementById('bookmarkList');
    if (!container) return;

    try {
      const res = await fetch(`/api/bookmarks.php?action=list`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error('Failed');

      const data = await res.json();

      if (!data.items || data.items.length === 0) {
        container.innerHTML = `<div class="text-muted" style="text-align:center;padding:40px;">No bookmarks yet</div>`;
        return;
      }

      container.innerHTML = data.items.map(bm => `
        <div class="notification-item" onclick="location.href='/read/${bm.bookId}?page=${bm.page}'">
          <div class="notification-icon">🔖</div>
          <div class="notification-content">
            <div class="notification-text">${bm.bookTitle || 'Book'}</div>
            <div class="notification-time">Page ${bm.page || 1} ${bm.chapter ? `· ${bm.chapter}` : ''}</div>
          </div>
        </div>
      `).join('');
    } catch (err) {
      container.innerHTML = `<div class="text-muted" style="text-align:center;padding:40px;">Could not load bookmarks</div>`;
    }
  }

  /* ═══════════════════════════════════════
     Notifications
     ═══════════════════════════════════════ */

  async function initNotifications() {
    const container = document.getElementById('notificationList');
    if (!container) return;

    try {
      const res = await fetch(`/api/notifications.php?action=list`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error('Failed');

      const data = await res.json();

      if (!data.items || data.items.length === 0) {
        container.innerHTML = `<div class="text-muted" style="text-align:center;padding:40px;">No notifications</div>`;
        return;
      }

      container.innerHTML = data.items.map(notif => `
        <div class="notification-item ${notif.read ? '' : 'unread'}" data-id="${notif.id}" onclick="markNotificationRead('${notif.id}')">
          <div class="notification-icon">${notif.icon || 'ℹ️'}</div>
          <div class="notification-content">
            <div class="notification-text">${notif.message || notif.title}</div>
            <div class="notification-time">${window.timeAgo ? timeAgo(notif.createdAt) : notif.createdAt || ''}</div>
          </div>
          ${notif.read ? '' : '<div class="notification-dot"></div>'}
        </div>
      `).join('');
    } catch (err) {
      container.innerHTML = `<div class="text-muted" style="text-align:center;padding:40px;">Could not load notifications</div>`;
    }
  }

  async function markNotificationRead(id) {
    try {
      await fetch(`/api/notifications.php?action=mark_read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ id }),
      });
      const item = document.querySelector(`.notification-item[data-id="${id}"]`);
      if (item) {
        item.classList.remove('unread');
        const dot = item.querySelector('.notification-dot');
        if (dot) dot.remove();
      }
      window.updateNotificationBadge?.();
    } catch (e) {
      // silently fail
    }
  }

  window.markNotificationRead = markNotificationRead;

  /* ═══════════════════════════════════════
     Search with Autocomplete
     ═══════════════════════════════════════ */

  function initDashboardSearch() {
    const searchInput = document.getElementById('dashboardSearch');
    if (!searchInput) return;

    const resultsContainer = document.getElementById('searchResults');

    let debounceTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      const query = searchInput.value.trim();

      if (query.length < 2) {
        if (resultsContainer) resultsContainer.innerHTML = '';
        return;
      }

      debounceTimer = setTimeout(async () => {
        try {
          const res = await fetch(`/api/search.php?action=search&q=${encodeURIComponent(query)}&limit=5`, {
            headers: getAuthHeaders(),
          });
          if (!res.ok) return;
          const data = await res.json();

          if (resultsContainer) {
            if (!data.items || data.items.length === 0) {
              resultsContainer.innerHTML = `<div class="text-muted" style="padding:16px;text-align:center;">No results found</div>`;
              return;
            }
            resultsContainer.innerHTML = data.items.map(item => `
              <div class="search-result-item" onclick="location.href='${item.url || '/books/' + item.id}'">
                ${item.cover ? `<img src="${item.cover}" alt="${item.title}">` : ''}
                <div class="search-result-info">
                  <h4>${item.title}</h4>
                  <p>${item.author || item.subject || ''}</p>
                </div>
              </div>
            `).join('');
          }
        } catch (e) {
          // silently fail
        }
      }, 300);
    });
  }

  /* ═══════════════════════════════════════
     Category Filtering
     ═══════════════════════════════════════ */

  function initCategoryFilter() {
    const filterBtns = document.querySelectorAll('[data-filter]');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const category = btn.getAttribute('data-filter');

        // Update active state
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const container = document.getElementById('recentBooks');
        if (!container) return;

        // Show skeleton
        container.innerHTML = Array(4).fill(0).map(() => `
          <div class="skeleton-card">
            <div class="skeleton-image"></div>
            <div class="skeleton-line skeleton-line-lg"></div>
            <div class="skeleton-line skeleton-line-sm"></div>
          </div>
        `).join('');

        try {
          const url = category === 'all'
            ? `/api/books.php?action=recent`
            : `/api/books.php?action=list&category=${encodeURIComponent(category)}`;

          const res = await fetch(url, { headers: getAuthHeaders() });
          if (!res.ok) throw new Error('Failed');
          const data = await res.json();

          if (!data.items || data.items.length === 0) {
            container.innerHTML = `<div class="text-muted" style="text-align:center;padding:40px;">No books in this category</div>`;
            return;
          }

          container.innerHTML = data.items.map(book => `
            <div class="book-card" onclick="location.href='/books/${book.id}'">
              <div class="book-card-cover">
                <img src="${book.cover || '/assets/img/placeholder.svg'}" alt="${book.title}" loading="lazy">
              </div>
              <div class="book-card-body">
                <div class="book-card-title">${book.title}</div>
                <div class="book-card-author">${book.author || ''}</div>
                <div class="book-card-meta"><span>${book.subject || ''}</span></div>
              </div>
            </div>
          `).join('');
        } catch (err) {
          container.innerHTML = `<div class="text-muted" style="text-align:center;padding:40px;">Failed to load books</div>`;
        }
      });
    });
  }

  /* ═══════════════════════════════════════
     Profile Update
     ═══════════════════════════════════════ */

  function initProfileUpdate() {
    const form = document.getElementById('profileForm');
    if (!form) return;

    // Pre-fill user data
    const user = getUser();
    if (user) {
      const nameField = form.querySelector('#profileName');
      const emailField = form.querySelector('#profileEmail');
      if (nameField) nameField.value = user.name || '';
      if (emailField) emailField.value = user.email || '';
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = form.querySelector('#profileName')?.value.trim();
      const email = form.querySelector('#profileEmail')?.value.trim();
      const submitBtn = form.querySelector('button[type="submit"]');

      if (!name) {
        window.showToast?.('Name is required', 'error');
        return;
      }

      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner spinner-sm" style="margin:0;"></span>`;

      try {
        const res = await fetch(`/api/auth.php?action=update_profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify({ action: 'update_profile', name, email }),
        });

        if (!res.ok) throw new Error('Failed');

        const data = await res.json();
        if (data.user) localStorage.setItem('user', JSON.stringify(data.user));

        window.showToast?.('Profile updated', 'success');
      } catch (err) {
        window.showToast?.('Failed to update profile', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }

  /* ═══════════════════════════════════════
     Settings (theme, font, font size)
     ═══════════════════════════════════════ */

  function initSettings() {
    const settingsForm = document.getElementById('settingsForm');

    // Theme
    const themeSelect = document.getElementById('settingTheme') || document.querySelector('[name="theme"]');
    if (themeSelect) {
      themeSelect.value = localStorage.getItem('theme') || 'dark';
      themeSelect.addEventListener('change', () => {
        document.documentElement.setAttribute('data-theme', themeSelect.value);
        localStorage.setItem('theme', themeSelect.value);
        saveSetting('theme', themeSelect.value);
      });
    }

    // Font family
    const fontSelect = document.getElementById('settingFont') || document.querySelector('[name="font"]');
    if (fontSelect) {
      fontSelect.value = localStorage.getItem('reader-font') || 'inter';
      fontSelect.addEventListener('change', () => {
        document.documentElement.style.setProperty('--font-body',
          fontSelect.value === 'outfit' ? "'Outfit', sans-serif" : "'Inter', sans-serif"
        );
        localStorage.setItem('reader-font', fontSelect.value);
        saveSetting('font', fontSelect.value);
      });
    }

    // Font size
    const fontSizeRange = document.getElementById('settingFontSize') || document.querySelector('[name="fontSize"]');
    const fontSizeLabel = document.getElementById('fontSizeLabel');
    if (fontSizeRange) {
      fontSizeRange.value = localStorage.getItem('reader-font-size') || '100';
      if (fontSizeLabel) fontSizeLabel.textContent = fontSizeRange.value + '%';
      fontSizeRange.addEventListener('input', () => {
        const val = fontSizeRange.value;
        if (fontSizeLabel) fontSizeLabel.textContent = val + '%';
        document.documentElement.style.setProperty('--reader-font-size', `${val}%`);
        localStorage.setItem('reader-font-size', val);
      });
      fontSizeRange.addEventListener('change', () => saveSetting('fontSize', fontSizeRange.value));
    }

    // Save settings form
    if (settingsForm) {
      settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        window.showToast?.('Settings saved', 'success');
      });
    }
  }

  async function saveSetting(key, value) {
    try {
      await fetch(`/api/auth.php?action=update_settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ action: 'update_settings', [key]: value }),
      });
    } catch (e) {
      // silently fail
    }
  }

  /* ═══════════════════════════════════════
     Reading Progress Syncing
     ═══════════════════════════════════════ */

  function initReadingProgress() {
    // This is also used in reader.js, but we expose a helper here
  }

  async function syncReadingProgress(bookId, page, progress) {
    try {
      await fetch(`/api/progress.php?action=save`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ action: 'save', bookId, page, progress }),
      });
    } catch (e) {
      // silently fail - progress saved locally as fallback
    }

    // Local fallback
    const key = `reading-progress-${bookId}`;
    localStorage.setItem(key, JSON.stringify({ page, progress, updatedAt: new Date().toISOString() }));
  }

  window.syncReadingProgress = syncReadingProgress;

  /* ═══════════════════════════════════════
     Helpers
     ═══════════════════════════════════════ */

  function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  function getUser() {
    try {
      const data = localStorage.getItem('user');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  console.log('📊 Dashboard module loaded');
})();
