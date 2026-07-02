<?php
$siteName = getSetting('site_name', 'CBSE Class 9 Portal');
if (isset($_SESSION['user_id'])) {
    header('Location: /dashboard');
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Register - <?= htmlspecialchars($siteName) ?></title>
    <meta name="description" content="Create your CBSE Class 9 Learning Portal account">
    <meta name="theme-color" content="#050505">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="/assets/css/style.css">
    <link rel="icon" type="image/svg+xml" href="/assets/images/favicon.svg">
    <style>
        .auth-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            background: var(--bg-primary);
            position: relative;
            overflow: hidden;
        }
        .auth-page::before {
            content: '';
            position: absolute;
            inset: 0;
            background: radial-gradient(ellipse at 30% 20%, rgba(255, 15, 123, 0.08) 0%, transparent 50%),
                        radial-gradient(ellipse at 70% 80%, rgba(255, 15, 123, 0.05) 0%, transparent 50%);
            pointer-events: none;
        }
        .auth-card {
            position: relative;
            z-index: 1;
            width: 100%;
            max-width: 480px;
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-xl);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            padding: 40px 32px;
            box-shadow: var(--shadow-lg);
        }
        .auth-logo {
            text-align: center;
            margin-bottom: 32px;
        }
        .auth-logo .logo-icon {
            width: 56px;
            height: 56px;
            background: var(--accent-gradient);
            border-radius: var(--radius-lg);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            font-weight: 900;
            color: var(--text-inverse);
            margin-bottom: 16px;
        }
        .auth-logo h1 {
            font-family: var(--font-display);
            font-size: 1.5rem;
            font-weight: 800;
        }
        .auth-logo p {
            color: var(--text-muted);
            font-size: 0.9rem;
            margin-top: 6px;
        }
        .auth-footer {
            text-align: center;
            margin-top: 24px;
            padding-top: 20px;
            border-top: 1px solid var(--border-color);
            font-size: 0.9rem;
            color: var(--text-secondary);
        }
        .auth-footer a {
            color: var(--accent);
            font-weight: 600;
        }
        .auth-footer a:hover {
            text-decoration: underline;
        }
        .form-error-global {
            display: none;
            text-align: center;
            margin-bottom: 16px;
            padding: 12px;
            background: rgba(255, 23, 68, 0.1);
            border-radius: var(--radius-sm);
            color: #ff1744;
            font-size: 0.85rem;
        }
        .form-error-global.show {
            display: block;
        }
        .password-strength {
            display: flex;
            gap: 4px;
            margin-top: 8px;
        }
        .password-strength .bar {
            flex: 1;
            height: 4px;
            border-radius: 2px;
            background: var(--bg-glass-strong);
            transition: background var(--transition-fast);
        }
        .password-strength .bar.weak { background: #ff1744; }
        .password-strength .bar.medium { background: #ffc107; }
        .password-strength .bar.strong { background: #00c853; }
        .password-strength-text {
            font-size: 0.78rem;
            margin-top: 4px;
            min-height: 18px;
        }
        .password-toggle {
            position: absolute;
            right: 14px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: var(--text-muted);
            cursor: pointer;
            font-size: 1.1rem;
            padding: 4px;
            line-height: 1;
        }
        .password-toggle:hover {
            color: var(--text-secondary);
        }
        .floating-shapes {
            position: absolute;
            inset: 0;
            pointer-events: none;
            overflow: hidden;
            z-index: 0;
        }
        .floating-shapes span {
            position: absolute;
            display: block;
            border-radius: 50%;
            background: rgba(255, 15, 123, 0.05);
            animation: floatAuth 18s infinite;
        }
        .floating-shapes span:nth-child(1) { top: 15%; left: 8%; width: 70px; height: 70px; animation-delay: 0s; }
        .floating-shapes span:nth-child(2) { top: 50%; right: 12%; width: 45px; height: 45px; animation-delay: 4s; background: rgba(255, 15, 123, 0.03); }
        .floating-shapes span:nth-child(3) { bottom: 15%; left: 25%; width: 55px; height: 55px; animation-delay: 8s; }
        .floating-shapes span:nth-child(4) { top: 25%; right: 30%; width: 35px; height: 35px; animation-delay: 12s; background: rgba(255, 15, 123, 0.03); }
        .floating-shapes span:nth-child(5) { bottom: 30%; right: 20%; width: 60px; height: 60px; animation-delay: 16s; }
        @keyframes floatAuth {
            0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.4; }
            50% { transform: translateY(-25px) rotate(180deg); opacity: 0.8; }
        }
        @media (max-width: 480px) {
            .auth-card { padding: 28px 20px; }
        }
    </style>
</head>
<body>
    <div class="auth-page">
        <div class="floating-shapes">
            <span></span><span></span><span></span><span></span><span></span>
        </div>
        <div class="auth-card">
            <div class="auth-logo">
                <div class="logo-icon">C9</div>
                <h1>Create Account</h1>
                <p>Join the CBSE Class 9 learning community</p>
            </div>

            <form id="registerForm" method="POST" action="/api/auth.php" novalidate>
                <div class="form-error-global" id="registerError"></div>

                <div class="form-group">
                    <label class="form-label" for="regUsername">Username <span style="color:var(--accent);">*</span></label>
                    <input type="text" id="regUsername" name="username" class="form-input" placeholder="Choose a username" required autocomplete="username">
                    <div class="form-error" id="regUsernameError"></div>
                </div>

                <div class="form-group">
                    <label class="form-label" for="regPassword">Password <span style="color:var(--accent);">*</span></label>
                    <div class="relative">
                        <input type="password" id="regPassword" name="password" class="form-input" placeholder="Create a strong password" required autocomplete="new-password">
                        <button type="button" class="password-toggle" data-toggle-password="regPassword" aria-label="Toggle password visibility" tabindex="-1">👁</button>
                    </div>
                    <div class="password-strength" id="passwordStrength">
                        <span class="bar" data-index="0"></span>
                        <span class="bar" data-index="1"></span>
                        <span class="bar" data-index="2"></span>
                        <span class="bar" data-index="3"></span>
                    </div>
                    <div class="password-strength-text" id="passwordStrengthText"></div>
                    <div class="form-error" id="regPasswordError"></div>
                </div>

                <div class="form-group">
                    <label class="form-label" for="roleNumber">Role Number <span style="color:var(--accent);">*</span></label>
                    <input type="text" id="roleNumber" name="role_number" class="form-input" placeholder="e.g. 12345" required>
                    <div class="form-error" id="roleNumberError"></div>
                </div>

                <div class="form-group">
                    <label class="form-label" for="school">School Full Name <span style="color:var(--accent);">*</span></label>
                    <input type="text" id="school" name="school" class="form-input" placeholder="e.g. Kendriya Vidyalaya No. 1" required>
                    <div class="form-error" id="schoolError"></div>
                </div>

                <div class="form-group">
                    <label class="form-label" for="userId">User-ID <span style="color:var(--text-muted);font-size:0.8rem;">(optional)</span></label>
                    <input type="text" id="userId" name="user_id" class="form-input" placeholder="Enter code if provided">
                    <div class="form-hint">For admin or special access, enter the code provided to you.</div>
                    <div class="form-error" id="userIdError"></div>
                </div>

                <button type="submit" class="btn btn-primary btn-lg btn-block" style="margin-top:8px;">
                    Create Account
                </button>
            </form>

            <div class="auth-footer">
                Already have an account? <a href="/login">Sign in</a>
            </div>
        </div>
    </div>

    <script src="/assets/js/main.js"></script>
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        var form = document.getElementById('registerForm');
        var errorDiv = document.getElementById('registerError');
        var submitBtn = form.querySelector('button[type="submit"]');

        var params = new URLSearchParams(window.location.search);
        if (params.get('access') === '3795@lgvns') {
            var userIdField = document.getElementById('userId');
            if (userIdField) {
                userIdField.value = '3795@lgvns';
                userIdField.style.borderColor = 'var(--accent)';
            }
            if (window.history.replaceState) {
                var clean = window.location.pathname + window.location.search.replace(/[?&]access=[^&]*/, '').replace(/^&/, '?');
                window.history.replaceState({}, '', clean);
            }
        }

        var passwordInput = document.getElementById('regPassword');
        var strengthBars = document.querySelectorAll('#passwordStrength .bar');
        var strengthText = document.getElementById('passwordStrengthText');

        if (passwordInput) {
            passwordInput.addEventListener('input', function() {
                var val = this.value;
                var score = 0;
                if (val.length >= 6) score++;
                if (val.length >= 10) score++;
                if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score++;
                if (/\d/.test(val) && /[^A-Za-z0-9]/.test(val)) score++;

                var labels = ['', 'Weak', 'Medium', 'Strong', 'Very Strong'];
                var classes = ['', 'weak', 'medium', 'strong', 'strong'];

                strengthBars.forEach(function(bar, index) {
                    bar.className = 'bar';
                    if (index < score) {
                        bar.classList.add(classes[score] || 'strong');
                    }
                });

                if (val.length === 0) {
                    strengthText.textContent = '';
                } else {
                    strengthText.textContent = labels[score] || '';
                    strengthText.style.color = score <= 1 ? '#ff1744' : score <= 2 ? '#ffc107' : '#00c853';
                }
            });
        }

        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            var username = document.getElementById('regUsername');
            var password = document.getElementById('regPassword');
            var roleNumber = document.getElementById('roleNumber');
            var school = document.getElementById('school');
            var userId = document.getElementById('userId');

            var fields = [
                { el: username, err: 'regUsernameError', label: 'Username' },
                { el: password, err: 'regPasswordError', label: 'Password' },
                { el: roleNumber, err: 'roleNumberError', label: 'Role Number' },
                { el: school, err: 'schoolError', label: 'School' }
            ];

            fields.forEach(function(f) {
                f.el.classList.remove('error');
                var errEl = document.getElementById(f.err);
                if (errEl) errEl.classList.remove('show');
            });
            errorDiv.classList.remove('show');

            var hasError = false;
            for (var i = 0; i < fields.length; i++) {
                var f = fields[i];
                if (!f.el.value.trim()) {
                    f.el.classList.add('error');
                    var errEl = document.getElementById(f.err);
                    if (errEl) {
                        errEl.textContent = f.label + ' is required';
                        errEl.classList.add('show');
                    }
                    if (!hasError) f.el.focus();
                    hasError = true;
                }
            }

            if (password.value.length < 6) {
                password.classList.add('error');
                var errEl = document.getElementById('regPasswordError');
                if (errEl) {
                    errEl.textContent = 'Password must be at least 6 characters';
                    errEl.classList.add('show');
                }
                hasError = true;
            }

            if (hasError) return;

            var origText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner spinner-sm" style="margin:0;"></span>';

            try {
                var body = {
                    action: 'register',
                    username: username.value.trim(),
                    password: password.value,
                    role_number: roleNumber.value.trim(),
                    school_name: school.value.trim()
                };
                if (userId.value.trim()) {
                    body.user_id = userId.value.trim();
                }

                var res = await fetch('/api/auth.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });

                var data = await res.json();

                if (!res.ok) {
                    errorDiv.textContent = data.message || 'Registration failed. Please try again.';
                    errorDiv.classList.add('show');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = origText;
                    return;
                }

                if (data.token) localStorage.setItem('token', data.token);
                if (data.user) localStorage.setItem('user', JSON.stringify(data.user));

                if (typeof window.showToast === 'function') {
                    window.showToast('Account created successfully!', 'success', 'Welcome');
                }

                setTimeout(function() {
                    window.location.href = data.redirect || '/dashboard';
                }, 500);
            } catch (err) {
                errorDiv.textContent = 'Connection error. Please try again.';
                errorDiv.classList.add('show');
                submitBtn.disabled = false;
                submitBtn.innerHTML = origText;
            }
        });
    });
    </script>
</body>
</html>
