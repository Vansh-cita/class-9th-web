/**
 * ⚙️ CBSE Class 9 Learning Portal - Admin Panel Module
 * Full CRUD, file uploads, user management, analytics, and more.
 */
(function () {
  'use strict';

  /* API base paths removed — direct PHP file URLs used instead */

  document.addEventListener('DOMContentLoaded', () => {
    if (!document.querySelector('.admin-page')) return;

    initAdminSidebar();
    initAdminStats();
    initBookManagement();
    initDragDropUpload();
    initCategoryManagement();
    initUserManagement();
    initAnnouncementCRUD();
    initHiddenPageManager();
    initAccessCodeManagement();
    initNotificationPush();
    initAdminSettings();
    initLogViewer();
    initDataTables();
    initConfirmDialogs();
    initImagePreview();
    initAdminFormValidation();
  });

  /* ═══════════════════════════════════════
     Admin Sidebar
     ═══════════════════════════════════════ */

  function initAdminSidebar() {
    const toggle = document.querySelector('.admin-sidebar-toggle');
    const sidebar = document.querySelector('.admin-sidebar');
    const overlay = document.querySelector('.admin-sidebar-overlay');

    if (toggle && sidebar) {
      toggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        if (overlay) overlay.classList.toggle('open');
      });
    }

    if (overlay) {
      overlay.addEventListener('click', () => {
        sidebar?.classList.remove('open');
        overlay.classList.remove('open');
      });
    }

    // Active link highlighting
    const currentPath = window.location.pathname;
    document.querySelectorAll('.admin-sidebar-nav a').forEach(link => {
      if (link.getAttribute('href') === currentPath) {
        link.classList.add('active');
      }
    });
  }

  /* ═══════════════════════════════════════
     Dashboard Analytics
     ═══════════════════════════════════════ */

  async function initAdminStats() {
    const containers = {
      stats: document.getElementById('adminStats'),
      charts: document.getElementById('adminCharts'),
    };

    if (!containers.stats && !containers.charts) return;

    try {
      const res = await fetch('/api/admin.php?action=stats', {
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error('Failed to load analytics');

      const data = await res.json();

      if (containers.stats) renderAdminStats(containers.stats, data);
      if (containers.charts) renderAdminCharts(containers.charts, data);
    } catch (err) {
      if (containers.stats) {
        containers.stats.innerHTML = `<div class="text-muted" style="text-align:center;padding:40px;">Failed to load analytics</div>`;
      }
    }
  }

  function renderAdminStats(container, data) {
    const stats = [
      { icon: '📚', value: data.totalBooks || 0, label: 'Total Books', color: 'accent', change: data.booksChange },
      { icon: '👥', value: data.totalUsers || 0, label: 'Total Users', color: 'blue', change: data.usersChange },
      { icon: '📖', value: data.activeReads || 0, label: 'Active Reads', color: 'green', change: data.readsChange },
      { icon: '📝', value: data.totalPages || 0, label: 'Total Pages', color: 'orange', change: data.pagesChange },
    ];

    container.innerHTML = stats.map(stat => `
      <div class="admin-stat-card">
        <div class="admin-stat-header">
          <div class="admin-stat-icon ${stat.color}">${stat.icon}</div>
        </div>
        <div class="admin-stat-value">${stat.value}</div>
        <div class="admin-stat-label">${stat.label}</div>
        ${stat.change !== undefined ? `
          <div class="admin-stat-change ${stat.change >= 0 ? 'up' : 'down'}">
            ${stat.change >= 0 ? '↑' : '↓'} ${Math.abs(stat.change)}%
          </div>
        ` : ''}
      </div>
    `).join('');
  }

  function renderAdminCharts(container, data) {
    // Simple bar chart placeholder - in production, use Chart.js or similar
    container.innerHTML = `
      <div class="admin-card">
        <div class="admin-card-header">
          <div class="admin-card-title">Reading Activity (Last 7 days)</div>
        </div>
        <div class="admin-card-body">
          <div class="chart-container">
            <div class="chart-placeholder">
              <div style="text-align:center;">
                <div style="font-size:2rem;margin-bottom:8px;">📊</div>
                <div>Chart data loaded</div>
                <div class="text-sm text-muted mt-sm">${data.chartData?.length || 0} data points</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /* ═══════════════════════════════════════
     Book Management CRUD
     ═══════════════════════════════════════ */

  function initBookManagement() {
    const form = document.getElementById('bookForm');
    const bookTable = document.getElementById('bookTable');

    // Load books
    if (bookTable) loadBooks(bookTable);

    // Create / Update book
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        setLoading(submitBtn, true);

        const formData = new FormData(form);
        const isEdit = form.getAttribute('data-edit-id');
        const method = isEdit ? 'PUT' : 'POST';
        const url = `/api/books.php?action=${isEdit ? 'update' : 'create'}`;

        try {
          // Check if it has file
          const hasFile = form.querySelector('input[type="file"]')?.files?.length > 0;

          let res;
          if (hasFile) {
            formData.append('action', isEdit ? 'update' : 'create');
            if (isEdit) formData.append('id', isEdit);
            res = await fetch(url, {
              method,
              headers: getAuthHeaders(),
              body: formData,
            });
          } else {
            const data = Object.fromEntries(formData.entries());
            data.action = isEdit ? 'update' : 'create';
            if (isEdit) data.id = isEdit;
            res = await fetch(url, {
              method,
              headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders(),
              },
              body: JSON.stringify(data),
            });
          }

          if (!res.ok) throw new Error('Failed to save book');

          const result = await res.json();
          window.showToast?.(`Book ${isEdit ? 'updated' : 'created'}`, 'success');
          form.reset();
          form.removeAttribute('data-edit-id');
          if (bookTable) loadBooks(bookTable);

          // Reset submit button
          const btn = form.querySelector('button[type="submit"]');
          if (btn) btn.innerHTML = 'Add Book';
        } catch (err) {
          window.showToast?.(err.message || 'Failed to save book', 'error');
        } finally {
          setLoading(submitBtn, false, originalText);
        }
      });
    }
  }

  async function loadBooks(table) {
    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;"><div class="spinner" style="margin:0 auto;"></div></td></tr>`;

    try {
      const res = await fetch('/api/books.php?action=list', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();

      if (!data.items || data.items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6"><div class="table-empty"><div class="empty-icon">📚</div>No books found</div></td></tr>`;
        return;
      }

      tbody.innerHTML = data.items.map(book => `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:12px;">
              <img src="${book.cover || '/assets/img/placeholder.svg'}" alt="" style="width:40px;height:56px;object-fit:cover;border-radius:4px;">
              <div>
                <div style="font-weight:600;font-size:0.9rem;">${book.title}</div>
                <div style="font-size:0.8rem;color:var(--text-muted);">${book.author || ''}</div>
              </div>
            </div>
          </td>
          <td><span class="status-badge ${book.status === 'active' ? 'status-active' : 'status-inactive'}">${book.status || 'active'}</span></td>
          <td style="color:var(--text-muted);font-size:0.85rem;">${book.subject || '-'}</td>
          <td style="color:var(--text-muted);font-size:0.85rem;">${book.class || '9'}</td>
          <td style="color:var(--text-muted);font-size:0.85rem;">${book.chapters || 0} chapters</td>
          <td>
            <div class="actions">
              <button onclick="editBook('${book.id}')" title="Edit">✏️</button>
              <button onclick="deleteBook('${book.id}')" class="btn-delete" title="Delete">🗑</button>
            </div>
          </td>
        </tr>
      `).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6"><div class="table-empty"><div class="empty-icon">⚠️</div>Failed to load books</div></td></tr>`;
    }
  }

  window.editBook = async (id) => {
    try {
      const res = await fetch(`/api/books.php?action=get&id=${encodeURIComponent(id)}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();

      const form = document.getElementById('bookForm');
      if (!form) return;

      form.setAttribute('data-edit-id', id);
      const fields = ['title', 'author', 'subject', 'description', 'class', 'status'];
      fields.forEach(f => {
        const input = form.querySelector(`[name="${f}"]`);
        if (input) input.value = data[f] || '';
      });

      const btn = form.querySelector('button[type="submit"]');
      if (btn) btn.innerHTML = 'Update Book';

      form.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      window.showToast?.('Failed to load book details', 'error');
    }
  };

  window.deleteBook = async (id) => {
    if (!confirm('Are you sure you want to delete this book?')) return;

    try {
      const res = await fetch(`/api/books.php?action=delete&id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error('Failed');

      window.showToast?.('Book deleted', 'success');
      const table = document.getElementById('bookTable');
      if (table) loadBooks(table);
    } catch (err) {
      window.showToast?.('Failed to delete book', 'error');
    }
  };

  /* ═══════════════════════════════════════
     Drag & Drop File Upload
     ═══════════════════════════════════════ */

  function initDragDropUpload() {
    const zones = document.querySelectorAll('.upload-zone');
    zones.forEach(zone => {
      const input = zone.querySelector('input[type="file"]');
      const preview = zone.parentElement?.querySelector('.upload-preview') || document.createElement('div');

      zone.addEventListener('click', () => input?.click());

      if (input) {
        input.addEventListener('change', () => handleFiles(input.files, zone, preview));
      }

      zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('dragover');
      });

      zone.addEventListener('dragleave', () => {
        zone.classList.remove('dragover');
      });

      zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0 && input) {
          input.files = files;
          handleFiles(files, zone, preview);
        }
      });
    });
  }

  function handleFiles(files, zone, preview) {
    preview.innerHTML = '';
    Array.from(files).forEach((file, index) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const item = document.createElement('div');
          item.className = 'upload-preview-item';
          item.innerHTML = `
            <img src="${e.target.result}" alt="Preview">
            <button class="remove" data-index="${index}">✕</button>
          `;
          item.querySelector('.remove').addEventListener('click', () => item.remove());
          preview.appendChild(item);
        };
        reader.readAsDataURL(file);
      } else {
        const item = document.createElement('div');
        item.className = 'upload-preview-item';
        item.style.cssText = 'display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;';
        item.innerHTML = `
          <div style="font-size:1.5rem;">📄</div>
          <div style="font-size:0.75rem;color:var(--text-muted);text-align:center;">${file.name}</div>
          <button class="remove" data-index="${index}">✕</button>
        `;
        item.querySelector('.remove').addEventListener('click', () => item.remove());
        preview.appendChild(item);
      }
    });
  }

  /* ═══════════════════════════════════════
     Category Management
     ═══════════════════════════════════════ */

  function initCategoryManagement() {
    const form = document.getElementById('categoryForm');
    const list = document.getElementById('categoryList');

    if (list) loadCategories(list);

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = form.querySelector('[name="name"]')?.value.trim();
        if (!name) return;

        try {
          const res = await fetch('/api/categories.php?action=create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders(),
            },
            body: JSON.stringify({ name, action: 'create' }),
          });

          if (!res.ok) throw new Error('Failed');

          window.showToast?.('Category created', 'success');
          form.reset();
          if (list) loadCategories(list);
        } catch (err) {
          window.showToast?.('Failed to create category', 'error');
        }
      });
    }
  }

  async function loadCategories(container) {
    try {
      const res = await fetch('/api/categories.php?action=list', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();

      container.innerHTML = (data.items || data).map(cat => `
        <div class="access-code-card">
          <div>
            <div style="font-weight:600;">${cat.name}</div>
            <div class="access-code-uses">${cat.count || 0} books</div>
          </div>
          <button onclick="deleteCategory('${cat.id}')" class="btn btn-sm btn-ghost" style="color:#ff1744;">Delete</button>
        </div>
      `).join('');
    } catch (err) {
      container.innerHTML = `<div class="text-muted" style="text-align:center;padding:20px;">Failed to load categories</div>`;
    }
  }

  window.deleteCategory = async (id) => {
    if (!confirm('Delete this category?')) return;
    try {
      const res = await fetch(`/api/categories.php?action=delete&id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed');
      window.showToast?.('Category deleted', 'success');
      const list = document.getElementById('categoryList');
      if (list) loadCategories(list);
    } catch (err) {
      window.showToast?.('Failed to delete category', 'error');
    }
  };

  /* ═══════════════════════════════════════
     User Management
     ═══════════════════════════════════════ */

  function initUserManagement() {
    const table = document.getElementById('userTable');
    const searchInput = document.getElementById('userSearch');

    if (table) loadUsers(table, '');

    if (searchInput) {
      searchInput.addEventListener('input', debounce((e) => {
        if (table) loadUsers(table, e.target.value.trim());
      }, 300));
    }
  }

  async function loadUsers(table, query = '') {
    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:40px;"><div class="spinner" style="margin:0 auto;"></div></td></tr>`;

    try {
      const url = query ? `/api/admin.php?action=users&search=${encodeURIComponent(query)}` : '/api/admin.php?action=users';
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();

      if (!data.items || data.items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5"><div class="table-empty"><div class="empty-icon">👥</div>No users found</div></td></tr>`;
        return;
      }

      tbody.innerHTML = data.items.map(user => `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:12px;">
              <div class="avatar avatar-sm avatar-initials" style="width:36px;height:36px;font-size:0.8rem;">${(user.name || 'U')[0].toUpperCase()}</div>
              <div>
                <div style="font-weight:600;font-size:0.9rem;">${user.name || ''}</div>
                <div style="font-size:0.8rem;color:var(--text-muted);">${user.email || ''}</div>
              </div>
            </div>
          </td>
          <td><span class="status-badge ${user.status === 'active' ? 'status-active' : user.status === 'blocked' ? 'status-blocked' : 'status-inactive'}">${user.status || 'active'}</span></td>
          <td style="color:var(--text-muted);font-size:0.85rem;">${user.role || 'user'}</td>
          <td style="color:var(--text-muted);font-size:0.85rem;">${user.booksRead || 0}</td>
          <td>
            <div class="actions">
              <button onclick="editUser('${user.id}')" title="Edit">✏️</button>
              <button onclick="toggleUserStatus('${user.id}')" class="btn-delete" title="Toggle Status">🚫</button>
            </div>
          </td>
        </tr>
      `).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5"><div class="table-empty"><div class="empty-icon">⚠️</div>Failed to load users</div></td></tr>`;
    }
  }

  window.editUser = (id) => {
    window.openModal?.({
      title: 'Edit User',
      size: 'sm',
      content: `
        <form id="editUserForm" data-validate>
          <div class="form-group">
            <label class="form-label">Name</label>
            <input class="form-input" name="name" required>
          </div>
          <div class="form-group">
            <label class="form-label">Role</label>
            <select class="form-select" name="role">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-select" name="status">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary btn-block">Save Changes</button>
        </form>
      `,
    });

    // Fetch and populate
    setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin.php?action=users&id=${encodeURIComponent(id)}`, { headers: getAuthHeaders() });
        if (!res.ok) return;
        const user = await res.json();
        const form = document.getElementById('editUserForm');
        if (form) {
          form.querySelector('[name="name"]').value = user.name || '';
          form.querySelector('[name="role"]').value = user.role || 'user';
          form.querySelector('[name="status"]').value = user.status || 'active';
          form.onsubmit = async (e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(form));
            try {
              data.action = 'update_user';
              const r = await fetch('/api/admin.php?action=update_user', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify(data),
              });
              if (!r.ok) throw new Error('Failed');
              window.showToast?.('User updated', 'success');
              window.closeModal?.();
              const table = document.getElementById('userTable');
              if (table) loadUsers(table);
            } catch (err) {
              window.showToast?.('Failed to update user', 'error');
            }
          };
        }
      } catch (e) { /* ignore */ }
    }, 100);
  };

  window.toggleUserStatus = async (id) => {
    try {
      const res = await fetch('/api/admin.php?action=update_user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ id, status: 'toggle' }),
      });
      if (!res.ok) throw new Error('Failed');
      window.showToast?.('User status updated', 'success');
      const table = document.getElementById('userTable');
      if (table) loadUsers(table);
    } catch (err) {
      window.showToast?.('Failed to update status', 'error');
    }
  };

  /* ═══════════════════════════════════════
     Announcement CRUD
     ═══════════════════════════════════════ */

  function initAnnouncementCRUD() {
    const form = document.getElementById('announcementForm');
    const list = document.getElementById('announcementList');

    if (list) loadAnnouncements(list);

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = form.querySelector('[name="title"]')?.value.trim();
        const content = form.querySelector('[name="content"]')?.value.trim();
        if (!title || !content) return;

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        setLoading(submitBtn, true);

        try {
          const res = await fetch('/api/announcements.php?action=create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders(),
            },
            body: JSON.stringify({ title, content, action: 'create' }),
          });

          if (!res.ok) throw new Error('Failed');

          window.showToast?.('Announcement published', 'success');
          form.reset();
          if (list) loadAnnouncements(list);
        } catch (err) {
          window.showToast?.('Failed to create announcement', 'error');
        } finally {
          setLoading(submitBtn, false, originalText);
        }
      });
    }
  }

  async function loadAnnouncements(container) {
    try {
      const res = await fetch('/api/announcements.php?action=list', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();

      container.innerHTML = (data.items || data).map(a => `
        <div class="admin-card">
          <div class="admin-card-header">
            <div class="admin-card-title">${a.title}</div>
            <div style="display:flex;gap:8px;">
              <button onclick="deleteAnnouncement('${a.id}')" class="btn btn-sm btn-ghost" style="color:#ff1744;">Delete</button>
            </div>
          </div>
          <div class="admin-card-body" style="padding-top:0;">
            <p style="color:var(--text-secondary);font-size:0.9rem;">${a.content}</p>
            <div class="text-sm text-muted mt-sm">${new Date(a.createdAt).toLocaleDateString()}</div>
          </div>
        </div>
      `).join('') || `<div class="text-muted" style="text-align:center;padding:40px;">No announcements</div>`;
    } catch (err) {
      container.innerHTML = `<div class="text-muted" style="text-align:center;padding:40px;">Failed to load</div>`;
    }
  }

  window.deleteAnnouncement = async (id) => {
    if (!confirm('Delete this announcement?')) return;
    try {
      const res = await fetch(`/api/announcements.php?action=delete&id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed');
      window.showToast?.('Announcement deleted', 'success');
      const list = document.getElementById('announcementList');
      if (list) loadAnnouncements(list);
    } catch (err) {
      window.showToast?.('Failed to delete', 'error');
    }
  };

  /* ═══════════════════════════════════════
     Hidden Page Manager
     ═══════════════════════════════════════ */

  function initHiddenPageManager() {
    const form = document.getElementById('hiddenPageForm');
    const list = document.getElementById('hiddenPageList');

    if (list) loadHiddenPages(list);

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form));

        try {
          data.action = 'create';
          const res = await fetch('/api/pages.php?action=create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders(),
            },
            body: JSON.stringify(data),
          });

          if (!res.ok) throw new Error('Failed');

          window.showToast?.('Hidden page created', 'success');
          form.reset();
          if (list) loadHiddenPages(list);
        } catch (err) {
          window.showToast?.('Failed to create', 'error');
        }
      });
    }
  }

  async function loadHiddenPages(container) {
    try {
      const res = await fetch('/api/pages.php?action=list', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();

      container.innerHTML = (data.items || data).map(page => `
        <div class="access-code-card">
          <div>
            <div style="font-weight:600;">${page.title}</div>
            <div class="access-code-uses">/${page.slug} · ${page.visits || 0} visits</div>
          </div>
          <button onclick="deleteHiddenPage('${page.id}')" class="btn btn-sm btn-ghost" style="color:#ff1744;">Delete</button>
        </div>
      `).join('') || `<div class="text-muted" style="text-align:center;padding:20px;">No hidden pages</div>`;
    } catch (err) {
      container.innerHTML = `<div class="text-muted" style="text-align:center;padding:20px;">Failed to load</div>`;
    }
  }

  window.deleteHiddenPage = async (id) => {
    if (!confirm('Delete this hidden page?')) return;
    try {
      await fetch(`/api/pages.php?action=delete&id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      window.showToast?.('Hidden page deleted', 'success');
      const list = document.getElementById('hiddenPageList');
      if (list) loadHiddenPages(list);
    } catch (err) {
      window.showToast?.('Failed to delete', 'error');
    }
  };

  /* ═══════════════════════════════════════
     Access Code Management
     ═══════════════════════════════════════ */

  function initAccessCodeManagement() {
    const generateBtn = document.getElementById('generateAccessCode');
    const list = document.getElementById('accessCodeList');

    if (list) loadAccessCodes(list);

    if (generateBtn) {
      generateBtn.addEventListener('click', async () => {
        try {
          const res = await fetch('/api/pages.php?action=create_code', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders(),
            },
            body: JSON.stringify({ action: 'create_code' }),
          });

          if (!res.ok) throw new Error('Failed');

          window.showToast?.('Access code generated', 'success');
          if (list) loadAccessCodes(list);
        } catch (err) {
          window.showToast?.('Failed to generate code', 'error');
        }
      });
    }
  }

  async function loadAccessCodes(container) {
    try {
      const res = await fetch('/api/pages.php?action=list_codes', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();

      container.innerHTML = (data.items || data).map(code => `
        <div class="access-code-card">
          <div>
            <div class="access-code">${code.code}</div>
            <div class="access-code-uses">${code.uses || 0} uses · ${code.maxUses ? `Max: ${code.maxUses}` : 'Unlimited'}</div>
          </div>
          <div style="display:flex;gap:8px;">
            <button onclick="copyAccessCode('${code.code}')" class="btn btn-sm btn-ghost">Copy</button>
            <button onclick="deleteAccessCode('${code.id}')" class="btn btn-sm btn-ghost" style="color:#ff1744;">Revoke</button>
          </div>
        </div>
      `).join('') || `<div class="text-muted" style="text-align:center;padding:20px;">No access codes</div>`;
    } catch (err) {
      container.innerHTML = `<div class="text-muted" style="text-align:center;padding:20px;">Failed to load</div>`;
    }
  }

  window.copyAccessCode = (code) => {
    navigator.clipboard.writeText(code);
    window.showToast?.('Code copied to clipboard', 'success');
  };

  window.deleteAccessCode = async (id) => {
    if (!confirm('Revoke this access code?')) return;
    try {
      await fetch(`/api/pages.php?action=delete_code&id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      window.showToast?.('Access code revoked', 'success');
      const list = document.getElementById('accessCodeList');
      if (list) loadAccessCodes(list);
    } catch (err) {
      window.showToast?.('Failed to revoke', 'error');
    }
  };

  /* ═══════════════════════════════════════
     Notification Push
     ═══════════════════════════════════════ */

  function initNotificationPush() {
    const form = document.getElementById('pushNotifForm');
    if (!form) return;

    // Preview on input
    const titleInput = form.querySelector('[name="title"]');
    const bodyInput = form.querySelector('[name="body"]');
    const previewTitle = document.getElementById('notifPreviewTitle');
    const previewBody = document.getElementById('notifPreviewBody');

    if (titleInput && previewTitle) {
      titleInput.addEventListener('input', () => {
        previewTitle.textContent = titleInput.value || 'Notification Title';
      });
    }
    if (bodyInput && previewBody) {
      bodyInput.addEventListener('input', () => {
        previewBody.textContent = bodyInput.value || 'Notification message preview will appear here...';
      });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = titleInput?.value.trim();
      const body = bodyInput?.value.trim();
      if (!title || !body) return;

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      setLoading(submitBtn, true);

      try {
        const res = await fetch('/api/notifications.php?action=create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify({ title, body, audience: form.querySelector('[name="audience"]')?.value || 'all', action: 'create' }),
        });

        if (!res.ok) throw new Error('Failed');

        window.showToast?.('Notification sent to users', 'success');
        form.reset();
        if (previewTitle) previewTitle.textContent = 'Notification Title';
        if (previewBody) previewBody.textContent = 'Notification message preview will appear here...';
      } catch (err) {
        window.showToast?.('Failed to send notification', 'error');
      } finally {
        setLoading(submitBtn, false, originalText);
      }
    });
  }

  /* ═══════════════════════════════════════
     Settings Management
     ═══════════════════════════════════════ */

  function initAdminSettings() {
    const form = document.getElementById('adminSettingsForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      data.action = 'settings';

      try {
        const res = await fetch('/api/admin.php?action=settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify(data),
        });

        if (!res.ok) throw new Error('Failed');

        window.showToast?.('Settings saved', 'success');
      } catch (err) {
        window.showToast?.('Failed to save settings', 'error');
      }
    });
  }

  /* ═══════════════════════════════════════
     Log Viewer
     ═══════════════════════════════════════ */

  function initLogViewer() {
    const container = document.getElementById('logViewer');
    const filter = document.getElementById('logFilter');
    if (!container) return;

    loadLogs(container);

    if (filter) {
      filter.addEventListener('change', () => loadLogs(container, filter.value));
    }

    // Auto refresh
    setInterval(() => loadLogs(container, filter?.value || ''), 30000);
  }

  async function loadLogs(container, level = '') {
    try {
      const url = level ? `/api/admin.php?action=logs&level=${level}` : '/api/admin.php?action=logs';
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();

      container.innerHTML = (data.items || data).map(log => `
        <div class="log-entry">
          <span class="log-time">${new Date(log.timestamp).toLocaleTimeString()}</span>
          <span class="log-level ${log.level}">${log.level}</span>
          <span class="log-message">${log.message}</span>
        </div>
      `).join('') || `<div class="log-entry"><span class="log-message" style="color:var(--text-muted)">No logs</span></div>`;

      container.scrollTop = container.scrollHeight;
    } catch (err) {
      container.innerHTML = `<div class="log-entry"><span class="log-message" style="color:var(--text-muted)">Failed to load logs</span></div>`;
    }
  }

  /* ═══════════════════════════════════════
     Data Tables
     ═══════════════════════════════════════ */

  function initDataTables() {
    document.querySelectorAll('.admin-table').forEach(table => {
      const headers = table.querySelectorAll('th');
      headers.forEach((header, index) => {
        header.addEventListener('click', () => {
          const tbody = table.querySelector('tbody');
          if (!tbody) return;

          const rows = Array.from(tbody.querySelectorAll('tr'));
          const dir = header.classList.contains('sort-asc') ? 'desc' : 'asc';
          headers.forEach(h => h.classList.remove('sort-asc', 'sort-desc'));
          header.classList.add(`sort-${dir}`);

          rows.sort((a, b) => {
            const aVal = a.cells[index]?.textContent?.trim() || '';
            const bVal = b.cells[index]?.textContent?.trim() || '';
            const compare = aVal.localeCompare(bVal, undefined, { numeric: true });
            return dir === 'asc' ? compare : -compare;
          });

          rows.forEach(row => tbody.appendChild(row));
        });
      });
    });
  }

  /* ═══════════════════════════════════════
     Confirm Dialogs
     ═══════════════════════════════════════ */

  function initConfirmDialogs() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-confirm]');
      if (!btn) return;
      const message = btn.getAttribute('data-confirm') || 'Are you sure?';
      if (!confirm(message)) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    });
  }

  /* ═══════════════════════════════════════
     Image Preview Before Upload
     ═══════════════════════════════════════ */

  function initImagePreview() {
    document.addEventListener('change', (e) => {
      const input = e.target.closest('input[type="file"][data-preview]');
      if (!input) return;

      const previewEl = document.querySelector(input.getAttribute('data-preview'));
      if (!previewEl) return;

      const file = input.files?.[0];
      if (!file) return;

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          previewEl.src = ev.target.result;
          previewEl.style.display = 'block';
        };
        reader.readAsDataURL(file);
      }
    });
  }

  /* ═══════════════════════════════════════
     Admin Form Validation
     ═══════════════════════════════════════ */

  function initAdminFormValidation() {
    document.addEventListener('submit', (e) => {
      const form = e.target.closest('.admin-form, [data-admin-validate]');
      if (!form) return;

      const required = form.querySelectorAll('[required]');
      let valid = true;

      required.forEach(input => {
        if (!input.value.trim()) {
          input.classList.add('error');
          valid = false;
        } else {
          input.classList.remove('error');
        }
      });

      if (!valid) {
        e.preventDefault();
        window.showToast?.('Please fill all required fields', 'error');
      }
    });
  }

  /* ═══════════════════════════════════════
     Helpers
     ═══════════════════════════════════════ */

  function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  function setLoading(btn, isLoading, originalText = '') {
    if (isLoading) {
      btn.disabled = true;
      btn.dataset.originalText = btn.innerHTML;
      btn.innerHTML = `<span class="spinner spinner-sm" style="margin:0;"></span>`;
    } else {
      btn.disabled = false;
      btn.innerHTML = originalText || btn.dataset.originalText || 'Submit';
    }
  }

  function debounce(fn, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  console.log('⚙️ Admin module loaded');
})();
