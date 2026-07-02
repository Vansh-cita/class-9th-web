<?php
$user = getCurrentUser();
if (!$user) { header('Location: /login'); exit; }

$savedTheme = $user['theme'] ?? 'dark';
$savedFontFamily = $user['font_family'] ?? 'Inter';
$savedFontSize = $user['font_size'] ?? 100;
$savedNotifyReading = isset($user['notify_reading']) ? (int)$user['notify_reading'] : 1;
$savedNotifyBookmarks = isset($user['notify_bookmarks']) ? (int)$user['notify_bookmarks'] : 1;
$savedNotifyAnnouncements = isset($user['notify_announcements']) ? (int)$user['notify_announcements'] : 1;
?>
<section class="section" style="padding-top:120px;">
    <div style="max-width:600px;margin:0 auto;">
        <div style="margin-bottom:32px;" data-animate="fade-in-up">
            <h1 style="font-family:var(--font-display);font-size:clamp(1.5rem,3vw,2rem);font-weight:800;margin-bottom:6px;">Settings</h1>
            <p style="color:var(--text-muted);font-size:0.9rem;">Customize your reading experience</p>
        </div>

        <div class="card" style="padding:32px;margin-bottom:24px;" data-animate="fade-in-up" data-delay="50">
            <h3 style="font-family:var(--font-display);font-size:1.1rem;font-weight:600;margin-bottom:20px;">Appearance</h3>
            <div class="form-group">
                <label class="form-label" for="settingTheme">Theme</label>
                <select id="settingTheme" name="theme" class="form-select">
                    <option value="dark" <?= $savedTheme === 'dark' ? 'selected' : '' ?>>🌙 Dark</option>
                    <option value="light" <?= $savedTheme === 'light' ? 'selected' : '' ?>>☀️ Light</option>
                </select>
            </div>
        </div>

        <div class="card" style="padding:32px;margin-bottom:24px;" data-animate="fade-in-up" data-delay="80">
            <h3 style="font-family:var(--font-display);font-size:1.1rem;font-weight:600;margin-bottom:20px;">Reading Preferences</h3>
            <div class="form-group">
                <label class="form-label" for="settingFont">Font Family</label>
                <select id="settingFont" name="font" class="form-select">
                    <option value="outfit" <?= $savedFontFamily === 'Outfit' ? 'selected' : '' ?>>Outfit</option>
                    <option value="inter" <?= $savedFontFamily === 'Inter' ? 'selected' : '' ?>>Inter</option>
                    <option value="poppins" <?= $savedFontFamily === 'Poppins' ? 'selected' : '' ?>>Poppins</option>
                    <option value="noto" <?= $savedFontFamily === 'Noto Serif' ? 'selected' : '' ?>>Noto Serif</option>
                    <option value="roboto" <?= $savedFontFamily === 'Roboto' ? 'selected' : '' ?>>Roboto</option>
                    <option value="opensans" <?= $savedFontFamily === 'Open Sans' ? 'selected' : '' ?>>Open Sans</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label" for="settingFontSize">Font Size: <span id="fontSizeLabel" style="color:var(--accent);"><?= $savedFontSize ?>%</span></label>
                <div style="display:flex;align-items:center;gap:16px;">
                    <span style="font-size:0.85rem;color:var(--text-muted);">A</span>
                    <input type="range" id="settingFontSize" name="fontSize" min="70" max="200" value="<?= $savedFontSize ?>" style="flex:1;accent-color:var(--accent);">
                    <span style="font-size:1.3rem;color:var(--text-muted);">A</span>
                </div>
            </div>
        </div>

        <div class="card" style="padding:32px;margin-bottom:24px;" data-animate="fade-in-up" data-delay="110">
            <h3 style="font-family:var(--font-display);font-size:1.1rem;font-weight:600;margin-bottom:20px;">Notification Preferences</h3>
            <label class="form-checkbox" style="margin-bottom:12px;">
                <input type="checkbox" id="notifyReading" <?= $savedNotifyReading ? 'checked' : '' ?>> Reading reminders
            </label>
            <label class="form-checkbox" style="margin-bottom:12px;">
                <input type="checkbox" id="notifyBookmarks" <?= $savedNotifyBookmarks ? 'checked' : '' ?>> Bookmark updates
            </label>
            <label class="form-checkbox">
                <input type="checkbox" id="notifyAnnouncements" <?= $savedNotifyAnnouncements ? 'checked' : '' ?>> Announcements & news
            </label>
        </div>

        <div class="card" style="padding:32px;margin-bottom:24px;" data-animate="fade-in-up" data-delay="140">
            <h3 style="font-family:var(--font-display);font-size:1.1rem;font-weight:600;margin-bottom:20px;">Change Password</h3>
            <form id="passwordForm">
                <div class="form-group">
                    <label class="form-label" for="currentPassword">Current Password</label>
                    <input type="password" id="currentPassword" name="current_password" class="form-input" placeholder="Enter current password">
                </div>
                <div class="form-group">
                    <label class="form-label" for="newPassword">New Password</label>
                    <input type="password" id="newPassword" name="new_password" class="form-input" placeholder="Enter new password">
                </div>
                <div class="form-group">
                    <label class="form-label" for="confirmPassword">Confirm New Password</label>
                    <input type="password" id="confirmPassword" name="confirm_password" class="form-input" placeholder="Confirm new password">
                </div>
                <button type="submit" class="btn btn-secondary">Update Password</button>
            </form>
        </div>

        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;" data-animate="fade-in-up" data-delay="170">
            <a href="#" class="btn btn-primary btn-lg" id="saveAllSettings">Save All Settings</a>
            <a href="#" class="btn btn-danger btn-lg" style="background:rgba(255,23,68,0.15);color:#ff1744;border:1px solid rgba(255,23,68,0.3);" id="logoutBtn" data-logout>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Logout
            </a>
        </div>
    </div>
</section>

<script>
document.addEventListener('DOMContentLoaded', function() {
    var themeSelect = document.getElementById('settingTheme');
    var fontSelect = document.getElementById('settingFont');
    var fontSizeRange = document.getElementById('settingFontSize');
    var fontSizeLabel = document.getElementById('fontSizeLabel');

    if (themeSelect) {
        themeSelect.addEventListener('change', function() {
            document.documentElement.setAttribute('data-theme', this.value);
            localStorage.setItem('theme', this.value);
        });
    }

    if (fontSelect) {
        fontSelect.addEventListener('change', function() {
            var fonts = {
                outfit: '"Outfit", sans-serif',
                inter: '"Inter", sans-serif',
                poppins: '"Poppins", sans-serif',
                noto: '"Noto Serif", serif',
                roboto: '"Roboto", sans-serif',
                opensans: '"Open Sans", sans-serif'
            };
            document.documentElement.style.setProperty('--font-body', fonts[this.value] || fonts.inter);
            localStorage.setItem('reader-font', this.value);
        });
    }

    if (fontSizeRange && fontSizeLabel) {
        var savedSize = localStorage.getItem('reader-font-size') || '100';
        fontSizeRange.value = savedSize;
        fontSizeLabel.textContent = savedSize + '%';

        fontSizeRange.addEventListener('input', function() {
            fontSizeLabel.textContent = this.value + '%';
            localStorage.setItem('reader-font-size', this.value);
        });
    }

    document.getElementById('saveAllSettings')?.addEventListener('click', async function(e) {
        e.preventDefault();
        var btn = this;
        var orig = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner spinner-sm" style="margin:0;"></span>';

        try {
            var res = await fetch('/api/auth.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_settings',
                    theme: themeSelect?.value || 'dark',
                    font_family: fontSelect?.value || 'Inter',
                    font_size: parseInt(fontSizeRange?.value || 100),
                    notify_reading: document.getElementById('notifyReading')?.checked ? 1 : 0,
                    notify_bookmarks: document.getElementById('notifyBookmarks')?.checked ? 1 : 0,
                    notify_announcements: document.getElementById('notifyAnnouncements')?.checked ? 1 : 0
                })
            });

            if (res.ok) {
                if (window.showToast) window.showToast('Settings saved successfully', 'success');
            } else {
                if (window.showToast) window.showToast('Failed to save settings', 'error');
            }
        } catch (e) {
            if (window.showToast) window.showToast('Connection error', 'error');
        }

        btn.disabled = false;
        btn.innerHTML = orig;
    });

    document.getElementById('passwordForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        var current = document.getElementById('currentPassword').value;
        var newPass = document.getElementById('newPassword').value;
        var confirm = document.getElementById('confirmPassword').value;

        if (!current || !newPass) {
            if (window.showToast) window.showToast('Please fill in all fields', 'error');
            return;
        }
        if (newPass !== confirm) {
            if (window.showToast) window.showToast('Passwords do not match', 'error');
            return;
        }
        if (newPass.length < 6) {
            if (window.showToast) window.showToast('Password must be at least 6 characters', 'error');
            return;
        }

        var btn = this.querySelector('button[type="submit"]');
        var orig = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner spinner-sm" style="margin:0;"></span>';

        try {
            var res = await fetch('/api/auth.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'change_password', old_password: current, new_password: newPass })
            });

            if (res.ok) {
                if (window.showToast) window.showToast('Password updated successfully', 'success');
                this.reset();
            } else {
                var data = await res.json();
                if (window.showToast) window.showToast(data.message || 'Failed to update password', 'error');
            }
        } catch (e) {
            if (window.showToast) window.showToast('Connection error', 'error');
        }

        btn.disabled = false;
        btn.innerHTML = orig;
    });
});
</script>
