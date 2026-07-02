/**
 * 🔐 CBSE Class 9 Learning Portal - Authentication Module
 * Login, Registration, Session management, Hidden admin redirect.
 */
(function () {
  'use strict';

  const AUTH_API = '/api/auth.php';
  const HIDDEN_ADMIN_ID = '3795@lgvns';

  /* ─── DOM Ready ─── */
  document.addEventListener('DOMContentLoaded', () => {
    initLoginForm();
    initRegisterForm();
    initPasswordToggle();
    initLogout();
    checkSession();
    checkHiddenRedirect();
    autoFocus();
  });

  /* ═══════════════════════════════════════
     Login Form
     ═══════════════════════════════════════ */

  function initLoginForm() {
    const form = document.getElementById('loginForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = form.querySelector('#email');
      const password = form.querySelector('#password');
      const errorDiv = form.querySelector('.form-error-global') || createErrorDiv(form);
      const submitBtn = form.querySelector('button[type="submit"]');

      // Clear errors
      clearErrors(form);
      errorDiv.classList.remove('show');

      // Client validation
      if (!email.value.trim()) {
        showFieldError(email, 'Email is required');
        return;
      }
      if (!password.value) {
        showFieldError(password, 'Password is required');
        return;
      }

      // Loading state
      const originalText = submitBtn.innerHTML;
      setLoading(submitBtn, true);

      try {
        const res = await fetch(`${AUTH_API}?action=login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'login',
            username: email.value.trim(),
            password: password.value,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          errorDiv.textContent = data.message || 'Login failed. Please try again.';
          errorDiv.classList.add('show');
          setLoading(submitBtn, false, originalText);
          return;
        }

        // Save token
        if (data.token) localStorage.setItem('token', data.token);
        if (data.user) localStorage.setItem('user', JSON.stringify(data.user));

        window.showToast?.('Welcome back!', 'success', 'Login successful');

        // Redirect
        setTimeout(() => {
          const redirect = data.redirect || getRedirectUrl(data.user) || '/dashboard';
          window.location.href = redirect;
        }, 500);
      } catch (err) {
        errorDiv.textContent = 'Connection error. Please try again.';
        errorDiv.classList.add('show');
        setLoading(submitBtn, false, originalText);
      }
    });
  }

  /* ═══════════════════════════════════════
     Registration Form
     ═══════════════════════════════════════ */

  function initRegisterForm() {
    const form = document.getElementById('registerForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = form.querySelector('#name');
      const email = form.querySelector('#email');
      const password = form.querySelector('#password');
      const confirmPassword = form.querySelector('#confirmPassword');
      const errorDiv = form.querySelector('.form-error-global') || createErrorDiv(form);
      const submitBtn = form.querySelector('button[type="submit"]');

      clearErrors(form);
      errorDiv.classList.remove('show');

      // Validation
      if (!name.value.trim()) { showFieldError(name, 'Name is required'); return; }
      if (name.value.trim().length < 2) { showFieldError(name, 'Name must be at least 2 characters'); return; }
      if (!email.value.trim()) { showFieldError(email, 'Email is required'); return; }
      if (!isValidEmail(email.value.trim())) { showFieldError(email, 'Please enter a valid email'); return; }
      if (!password.value) { showFieldError(password, 'Password is required'); return; }
      if (password.value.length < 6) { showFieldError(password, 'Password must be at least 6 characters'); return; }
      if (password.value !== confirmPassword.value) { showFieldError(confirmPassword, 'Passwords do not match'); return; }

      const originalText = submitBtn.innerHTML;
      setLoading(submitBtn, true);

      try {
        const res = await fetch(`${AUTH_API}?action=register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'register',
            username: name.value.trim(),
            password: password.value,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          errorDiv.textContent = data.message || 'Registration failed.';
          errorDiv.classList.add('show');
          setLoading(submitBtn, false, originalText);
          return;
        }

        if (data.token) localStorage.setItem('token', data.token);
        if (data.user) localStorage.setItem('user', JSON.stringify(data.user));

        window.showToast?.('Account created!', 'success', 'Welcome');

        setTimeout(() => {
          window.location.href = data.redirect || '/dashboard';
        }, 500);
      } catch (err) {
        errorDiv.textContent = 'Connection error. Please try again.';
        errorDiv.classList.add('show');
        setLoading(submitBtn, false, originalText);
      }
    });
  }

  /* ═══════════════════════════════════════
     Hidden Admin Auto-Redirect Detection
     ═══════════════════════════════════════ */

  function checkHiddenRedirect() {
    // Check URL params for hidden admin access
    const params = new URLSearchParams(window.location.search);
    const accessCode = params.get('access');

    if (accessCode === HIDDEN_ADMIN_ID) {
      // Check if user is already logged in
      const token = localStorage.getItem('token');
      const user = getUser();

      if (token && user) {
        // Silently redirect to admin
        window.location.href = '/admin';
        return;
      }

      // Pre-fill login form with hidden hint
      const emailField = document.getElementById('email');
      if (emailField) {
        emailField.value = 'admin@portal.com';
        // Add a subtle visual indicator
        emailField.style.borderColor = 'var(--accent)';
      }

      // Remove from URL without reload
      if (window.history.replaceState) {
        const cleanUrl = window.location.pathname + window.location.search.replace(/[?&]access=[^&]*/, '').replace(/^&/, '?');
        window.history.replaceState({}, '', cleanUrl);
      }
    }
  }

  /* ═══════════════════════════════════════
     Session Check
     ═══════════════════════════════════════ */

  async function checkSession() {
    const token = localStorage.getItem('token');
    const user = getUser();

    if (!token || !user) return;

    // If on auth pages, redirect to dashboard
    const authPages = ['/login', '/register', '/auth'];
    if (authPages.includes(window.location.pathname)) {
      window.location.href = '/dashboard';
      return;
    }

    // Verify token is still valid
    try {
      const res = await fetch(`${AUTH_API}?action=check`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        // Token expired
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (!authPages.includes(window.location.pathname)) {
          window.location.href = '/login';
        }
        return;
      }

      const data = await res.json();
      // Update stored user data
      localStorage.setItem('user', JSON.stringify(data.user || data));
    } catch (e) {
      // Offline - allow cached session
    }
  }

  /* ═══════════════════════════════════════
     Logout Handler
     ═══════════════════════════════════════ */

  function initLogout() {
    document.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-logout]');
      if (!btn) return;

      e.preventDefault();

      // Optional confirmation
      if (btn.getAttribute('data-confirm') !== 'false') {
        const confirmed = confirm('Are you sure you want to logout?');
        if (!confirmed) return;
      }

      try {
        const token = localStorage.getItem('token');
        await fetch(`${AUTH_API}?action=logout`, {
          method: 'POST',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
      } catch (e) {
        // Ignore server errors on logout
      }

      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.showToast?.('You have been logged out', 'info');

      setTimeout(() => {
        window.location.href = '/login';
      }, 300);
    });
  }

  /* ═══════════════════════════════════════
     Password Show/Hide Toggle
     ═══════════════════════════════════════ */

  function initPasswordToggle() {
    document.addEventListener('click', (e) => {
      const toggle = e.target.closest('[data-toggle-password]');
      if (!toggle) return;

      const targetId = toggle.getAttribute('data-toggle-password');
      const input = document.getElementById(targetId) || toggle.previousElementSibling;
      if (!input || input.type !== 'password' && input.type !== 'text') return;

      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      toggle.textContent = isPassword ? '🙈' : '👁';
    });
  }

  /* ═══════════════════════════════════════
     Helpers
     ═══════════════════════════════════════ */

  function createErrorDiv(form) {
    const div = document.createElement('div');
    div.className = 'form-error form-error-global show';
    div.style.cssText = 'text-align:center;margin-bottom:16px;padding:12px;background:rgba(255,23,68,0.1);border-radius:8px;color:#ff1744;';
    form.insertBefore(div, form.firstChild);
    return div;
  }

  function showFieldError(input, message) {
    input.classList.add('error');
    const error = input.parentElement.querySelector('.form-error');
    if (error) {
      error.textContent = message;
      error.classList.add('show');
    }
    input.focus();
  }

  function clearErrors(form) {
    form.querySelectorAll('.form-error.show').forEach(el => el.classList.remove('show'));
    form.querySelectorAll('.form-input.error, input.error').forEach(el => el.classList.remove('error'));
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

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function getUser() {
    try {
      const data = localStorage.getItem('user');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  function getRedirectUrl(user) {
    if (!user) return null;
    // Hidden admin redirect
    if (user.id === HIDDEN_ADMIN_ID || user.role === 'admin') {
      return '/admin';
    }
    return '/dashboard';
  }

  function autoFocus() {
    const firstInput = document.querySelector('form:not([data-no-autofocus]) input:not([type="hidden"]):first-child');
    if (firstInput) firstInput.focus();
  }

  /* ─── Expose helpers globally ─── */
  window.getUser = getUser;
  window.isAuthenticated = () => !!localStorage.getItem('token');

  console.log('🔐 Auth module loaded');
})();
