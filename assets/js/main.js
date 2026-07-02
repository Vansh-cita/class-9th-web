/**
 * 📚 CBSE Class 9 Learning Portal - Main JavaScript Module
 * Self-contained vanilla JS module with all UI interactions.
 */
(function () {
  'use strict';

  /* ─── Configuration ─── */
  const CONFIG = {
    scrollThreshold: 50,
    searchDebounce: 300,
    toastDuration: 4000,
    skeletonDelay: 800,
    animationOffset: 50,
  };

  /* ═══════════════════════════════════════
     DOM Ready
     ═══════════════════════════════════════ */

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    initNavbar();
    initMobileMenu();
    initSkeletonLoader();
    initRippleEffect();
    initSmoothScroll();
    initFaqAccordion();
    initSearch();
    initToastSystem();
    initModalSystem();
    initLazyLoading();
    initScrollAnimations();
    initThemeToggle();
    initNotificationBadge();
    initCopyToClipboard();
    initPageTransitions();
    initTooltips();
    initFormValidation();
    initDropdowns();
    initTabs();
  }

  /* ═══════════════════════════════════════
     Navbar Scroll Effect
     ═══════════════════════════════════════ */

  function initNavbar() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    const onScroll = () => {
      navbar.classList.toggle('scrolled', window.scrollY > CONFIG.scrollThreshold);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ═══════════════════════════════════════
     Mobile Menu
     ═══════════════════════════════════════ */

  function initMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const mobileNav = document.querySelector('.mobile-nav');
    if (!hamburger || !mobileNav) return;

    hamburger.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('open');
      hamburger.classList.toggle('active', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        hamburger.classList.remove('active');
        document.body.style.overflow = '';
      });
    });

    document.addEventListener('click', (e) => {
      if (!hamburger.contains(e.target) && !mobileNav.contains(e.target) && mobileNav.classList.contains('open')) {
        mobileNav.classList.remove('open');
        hamburger.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  /* ═══════════════════════════════════════
     Skeleton Loader
     ═══════════════════════════════════════ */

  function initSkeletonLoader() {
    document.querySelectorAll('[data-skeleton]').forEach(container => {
      const template = container.getAttribute('data-skeleton');
      const count = parseInt(container.getAttribute('data-skeleton-count')) || 1;
      const items = [];

      for (let i = 0; i < count; i++) {
        if (template === 'card') {
          items.push(`
            <div class="skeleton-card">
              <div class="skeleton-image"></div>
              <div class="skeleton-line skeleton-line-lg"></div>
              <div class="skeleton-line"></div>
              <div class="skeleton-line skeleton-line-sm"></div>
            </div>
          `);
        } else if (template === 'line') {
          items.push(`<div class="skeleton-line"></div>`);
        } else if (template === 'avatar') {
          items.push(`
            <div style="display:flex;align-items:center;gap:12px;padding:8px 0;">
              <div class="skeleton-avatar"></div>
              <div style="flex:1;">
                <div class="skeleton-line"></div>
                <div class="skeleton-line skeleton-line-sm"></div>
              </div>
            </div>
          `);
        } else {
          items.push(`<div class="skeleton-line"></div>`);
        }
      }

      container.innerHTML = items.join('');
    });
  }

  function showSkeleton(container) {
    if (!container) return;
    container.style.position = 'relative';
    const overlay = document.createElement('div');
    overlay.className = 'skeleton-overlay';
    overlay.style.cssText = `
      position: absolute; inset: 0; background: var(--bg-card);
      border-radius: inherit; z-index: 5;
      display: flex; align-items: center; justify-content: center;
    `;
    overlay.innerHTML = `<div class="spinner spinner-lg"></div>`;
    container.appendChild(overlay);
    return overlay;
  }

  function hideSkeleton(overlay) {
    if (overlay && overlay.parentNode) {
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.3s ease';
      setTimeout(() => overlay.remove(), 300);
    }
  }

  window.showSkeleton = showSkeleton;
  window.hideSkeleton = hideSkeleton;

  /* ═══════════════════════════════════════
     Ripple Button Effect
     ═══════════════════════════════════════ */

  function initRippleEffect() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn');
      if (!btn) return;

      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      btn.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  }

  /* ═══════════════════════════════════════
     Smooth Scroll
     ═══════════════════════════════════════ */

  function initSmoothScroll() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;

      const targetId = link.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();
      const offset = parseInt(link.getAttribute('data-offset')) || 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;

      window.scrollTo({
        top,
        behavior: 'smooth',
      });
    });
  }

  /* ═══════════════════════════════════════
     FAQ Accordion
     ═══════════════════════════════════════ */

  function initFaqAccordion() {
    document.addEventListener('click', (e) => {
      const question = e.target.closest('.faq-question');
      if (!question) return;

      const item = question.closest('.faq-item');
      if (!item) return;

      const isActive = item.classList.contains('active');

      // Close all siblings
      const parent = item.parentElement;
      if (parent) {
        parent.querySelectorAll('.faq-item.active').forEach(el => {
          if (el !== item) el.classList.remove('active');
        });
      }

      item.classList.toggle('active', !isActive);
    });
  }

  /* ═══════════════════════════════════════
     Search Functionality with Debounce
     ═══════════════════════════════════════ */

  function initSearch() {
    const searchBars = document.querySelectorAll('.search-bar');
    searchBars.forEach(bar => {
      const input = bar.querySelector('input[type="text"], input[type="search"]');
      const clearBtn = bar.querySelector('.search-clear');
      const results = bar.querySelector('.search-results');
      if (!input) return;

      // Debounced search
      let debounceTimer;
      input.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        const query = input.value.trim();
        if (clearBtn) clearBtn.classList.toggle('visible', query.length > 0);

        if (query.length < 2) {
          if (results) results.classList.remove('open');
          return;
        }

        debounceTimer = setTimeout(() => {
          performSearch(query, results, bar);
        }, CONFIG.searchDebounce);
      });

      // Clear
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          input.value = '';
          clearBtn.classList.remove('visible');
          if (results) results.classList.remove('open');
          input.focus();
        });
      }

      // Close on outside click
      document.addEventListener('click', (e) => {
        if (results && !bar.contains(e.target)) {
          results.classList.remove('open');
        }
      });

      // Keyboard navigation
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          if (results) results.classList.remove('open');
          input.blur();
        }
        if (e.key === 'Enter') {
          const active = results?.querySelector('.search-result-item');
          if (active) active.click();
        }
      });
    });
  }

  async function performSearch(query, results, bar) {
    if (!results) return;

    // Show loading
    results.innerHTML = `<div style="padding:20px;text-align:center;color:var(--text-muted);"><div class="spinner" style="margin:0 auto;"></div></div>`;
    results.classList.add('open');

    try {
      const response = await fetch(`/api/search.php?action=search&q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();

      var allItems = [];
      if (data.results) {
        if (data.results.books) {
          allItems = allItems.concat(data.results.books.map(function(b) { return { title: b.title, url: '/book?id=' + b.id, image: b.thumbnail || '', description: b.subject + ' - ' + (b.author || ''), type: 'book' }; }));
        }
        if (data.results.categories) {
          allItems = allItems.concat(data.results.categories.map(function(c) { return { title: c.name, url: '/categories?id=' + c.id, image: '', description: c.description || c.name + ' category', type: 'category' }; }));
        }
      }

      if (allItems.length === 0) {
        results.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);">No results found</div>';
        return;
      }

      results.innerHTML = allItems.map(function(item) { return '<a href="' + item.url + '" class="search-result-item">' + (item.image ? '<img src="' + item.image + '" alt="' + item.title + '" loading="lazy">' : '<div style="width:40px;height:40px;border-radius:8px;background:var(--bg-glass-strong);display:flex;align-items:center;justify-content:center;flex-shrink:0;">' + (item.type === 'book' ? '📚' : '📁') + '</div>') + '<div class="search-result-info"><h4>' + item.title + '</h4><p>' + item.description + '</p></div></a>'; }).join('');
    } catch (err) {
      results.innerHTML = `<div style="padding:20px;text-align:center;color:var(--text-muted);">Search unavailable</div>`;
    }
  }

  /* ═══════════════════════════════════════
     Toast Notification System
     ═══════════════════════════════════════ */

  function initToastSystem() {
    if (!document.querySelector('.toast-container')) {
      const container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
  }

  function showToast(message, type = 'info', title = '') {
    const container = document.querySelector('.toast-container');
    if (!container) return;

    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close">✕</button>
    `;

    container.appendChild(toast);

    // Close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
      removeToast(toast);
    });

    // Auto remove
    setTimeout(() => removeToast(toast), CONFIG.toastDuration);
  }

  function removeToast(toast) {
    if (!toast || toast.classList.contains('removing')) return;
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove());
  }

  window.showToast = showToast;

  /* ═══════════════════════════════════════
     Modal System
     ═══════════════════════════════════════ */

  function initModalSystem() {
    // Create modal container if not exists
    if (!document.querySelector('.modal-overlay')) {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `<div class="modal"><div class="modal-header"><div class="modal-title"></div><button class="modal-close">✕</button></div><div class="modal-body"></div><div class="modal-footer"></div></div>`;
      document.body.appendChild(overlay);
    }
  }

  function openModal(options = {}) {
    const overlay = document.querySelector('.modal-overlay');
    const modal = overlay?.querySelector('.modal');
    if (!overlay || !modal) return;

    const { title = '', content = '', footer = '', size = '', onClose } = options;

    modal.className = 'modal' + (size ? ` modal-${size}` : '');
    modal.querySelector('.modal-title').textContent = title;
    modal.querySelector('.modal-body').innerHTML = content;
    modal.querySelector('.modal-footer').innerHTML = footer;

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Close handlers
    const closeModal = () => {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      if (onClose) onClose();
    };

    const closeBtn = modal.querySelector('.modal-close');
    const newCloseBtn = closeBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
    newCloseBtn.addEventListener('click', closeModal);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    document.addEventListener('keydown', escHandler = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escHandler);
      }
    });

    return { overlay, modal, close: closeModal };
  }

  window.openModal = openModal;

  function closeModal() {
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  window.closeModal = closeModal;

  /* ═══════════════════════════════════════
     Lazy Loading Images
     ═══════════════════════════════════════ */

  function initLazyLoading() {
    if ('loading' in HTMLImageElement.prototype) {
      document.querySelectorAll('img[loading="lazy"]').forEach(img => {
        img.src = img.src || img.getAttribute('data-src') || '';
        img.removeAttribute('data-src');
      });
    } else {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const src = img.getAttribute('data-src');
            if (src) {
              img.src = src;
              img.removeAttribute('data-src');
            }
            observer.unobserve(img);
          }
        });
      }, { rootMargin: '200px' });

      document.querySelectorAll('img[data-src]').forEach(img => observer.observe(img));
    }
  }

  /* ═══════════════════════════════════════
     Scroll Animations (Intersection Observer)
     ═══════════════════════════════════════ */

  function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('[data-animate]');

    if (animatedElements.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const animation = el.getAttribute('data-animate') || 'fade-in-up';
          const delay = parseInt(el.getAttribute('data-delay')) || (index * 100);
          const once = el.getAttribute('data-once') !== 'false';

          setTimeout(() => {
            el.classList.add(animation);
            el.style.opacity = '1';
          }, delay);

          if (once) observer.unobserve(el);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    });

    animatedElements.forEach(el => {
      el.style.opacity = '0';
      observer.observe(el);
    });
  }

  /* ═══════════════════════════════════════
     Theme Toggle
     ═══════════════════════════════════════ */

  function initThemeToggle() {
    const toggleBtns = document.querySelectorAll('[data-toggle-theme]');
    toggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        btn.innerHTML = next === 'dark' ? '🌙' : '☀️';
      });
    });

    // Restore theme
    const saved = localStorage.getItem('theme');
    if (saved) {
      document.documentElement.setAttribute('data-theme', saved);
    }
  }

  /* ═══════════════════════════════════════
     Notification Badge
     ═══════════════════════════════════════ */

  function initNotificationBadge() {
    updateNotificationBadge();
  }

  async function updateNotificationBadge() {
    try {
      const res = await fetch('/api/notifications.php?action=unread_count');
      if (!res.ok) return;
      const data = await res.json();
      const badges = document.querySelectorAll('.notification-badge-count');
      badges.forEach(badge => {
        const count = data.unread_count || data.count || 0;
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = count > 0 ? 'flex' : 'none';
      });
    } catch (e) {
      // silently fail
    }
  }

  window.updateNotificationBadge = updateNotificationBadge;

  /* ═══════════════════════════════════════
     Copy to Clipboard
     ═══════════════════════════════════════ */

  function initCopyToClipboard() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-copy]');
      if (!btn) return;

      const text = btn.getAttribute('data-copy') || btn.getAttribute('data-clipboard-text') || '';
      if (!text) return;

      navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard', 'success', 'Copied!');
      }).catch(() => {
        showToast('Failed to copy', 'error', 'Error');
      });
    });
  }

  /* ═══════════════════════════════════════
     Page Transitions
     ═══════════════════════════════════════ */

  function initPageTransitions() {
    document.body.classList.add('page-transition');
  }

  /* ═══════════════════════════════════════
     Tooltips (Dynamic)
     ═══════════════════════════════════════ */

  function initTooltips() {
    // Tooltips are handled via CSS :hover on .tooltip elements
    // This function just ensures dynamic tooltips work
  }

  /* ═══════════════════════════════════════
     Form Validation Helpers
     ═══════════════════════════════════════ */

  function initFormValidation() {
    document.addEventListener('submit', (e) => {
      const form = e.target.closest('[data-validate]');
      if (!form) return;

      e.preventDefault();
      if (validateForm(form)) {
        form.submit();
      }
    });
  }

  function validateForm(form) {
    let valid = true;
    const inputs = form.querySelectorAll('[required]');

    inputs.forEach(input => {
      const error = input.parentElement.querySelector('.form-error');
      if (!input.value.trim()) {
        input.classList.add('error');
        if (error) {
          error.textContent = input.getAttribute('data-error') || 'This field is required';
          error.classList.add('show');
        }
        valid = false;
      } else {
        input.classList.remove('error');
        if (error) error.classList.remove('show');

        // Email validation
        if (input.type === 'email' && !isValidEmail(input.value)) {
          input.classList.add('error');
          if (error) {
            error.textContent = 'Please enter a valid email';
            error.classList.add('show');
          }
          valid = false;
        }
      }
    });

    return valid;
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function isValidPhone(phone) {
    return /^[\d\s\-+()]{7,15}$/.test(phone);
  }

  window.validateForm = validateForm;
  window.isValidEmail = isValidEmail;
  window.isValidPhone = isValidPhone;

  /* ═══════════════════════════════════════
     Dropdowns
     ═══════════════════════════════════════ */

  function initDropdowns() {
    document.addEventListener('click', (e) => {
      const toggle = e.target.closest('[data-dropdown-toggle]');
      if (!toggle) return;

      const target = document.querySelector(toggle.getAttribute('data-dropdown-toggle'));
      if (!target) return;

      const isOpen = target.classList.contains('open');
      // Close all dropdowns
      document.querySelectorAll('.dropdown.open').forEach(d => d.classList.remove('open'));
      target.classList.toggle('open', !isOpen);
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('[data-dropdown-toggle]') && !e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown.open').forEach(d => d.classList.remove('open'));
      }
    });
  }

  /* ═══════════════════════════════════════
     Tabs
     ═══════════════════════════════════════ */

  function initTabs() {
    document.addEventListener('click', (e) => {
      const tab = e.target.closest('[data-tab]');
      if (!tab) return;

      const group = tab.closest('[data-tabs]') || tab.parentElement;
      const target = tab.getAttribute('data-tab');

      group.querySelectorAll('[data-tab]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const panels = document.querySelectorAll(tab.getAttribute('data-tab-panel') || `[data-tab-panel="${target}"]`);
      panels.forEach(p => {
        document.querySelectorAll(`[data-tab-panel]`).forEach(pp => pp.classList.remove('active'));
        p.classList.add('active');
      });
    });
  }

  /* ═══════════════════════════════════════
     Time Ago Formatter
     ═══════════════════════════════════════ */

  function timeAgo(dateInput) {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;

    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  window.timeAgo = timeAgo;

  /* ═══════════════════════════════════════
     Utility: Debounce
     ═══════════════════════════════════════ */

  function debounce(fn, delay = 300) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  window.debounce = debounce;

  /* ═══════════════════════════════════════
     Utility: Throttle
     ═══════════════════════════════════════ */

  function throttle(fn, limit = 100) {
    let inThrottle = false;
    return function (...args) {
      if (!inThrottle) {
        fn.apply(this, args);
        inThrottle = true;
        setTimeout(() => { inThrottle = false; }, limit);
      }
    };
  }

  window.throttle = throttle;

  /* ═══════════════════════════════════════
     Utility: Format Number
     ═══════════════════════════════════════ */

  function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  window.formatNumber = formatNumber;

  console.log('📚 CBSE Class 9 Portal - Main JS loaded');
})();
