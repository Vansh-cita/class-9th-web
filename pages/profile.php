<?php
$user = getCurrentUser();
if (!$user) { header('Location: /login'); exit; }

$stats = [
    'books_read' => 0,
    'chapters_read' => 0,
    'total_bookmarks' => 0,
];
try {
    $db = getDB();
    $stmt = $db->prepare("SELECT COUNT(DISTINCT book_id) as count FROM reading_progress WHERE user_id = ? AND progress >= 95");
    $stmt->execute([$user['id']]); $stats['books_read'] = (int)$stmt->fetch()['count'];

    $stmt = $db->prepare("SELECT COUNT(*) as count FROM bookmarks WHERE user_id = ?");
    $stmt->execute([$user['id']]); $stats['total_bookmarks'] = (int)$stmt->fetch()['count'];
} catch (Exception $e) {}

$memberSince = !empty($user['created_at']) ? date('F j, Y', strtotime($user['created_at'])) : 'Unknown';
?>
<section class="section" style="padding-top:120px;">
    <div style="max-width:800px;margin:0 auto;">
        <div style="text-align:center;margin-bottom:40px;" data-animate="fade-in-up">
            <div style="position:relative;display:inline-block;margin-bottom:16px;">
                <?php if (!empty($user['avatar'])): ?>
                <img src="<?= htmlspecialchars($user['avatar']) ?>" alt="Avatar" class="avatar avatar-xl">
                <?php else: ?>
                <div class="avatar-initials avatar-xl" style="width:100px;height:100px;font-size:2.5rem;margin:0 auto;"><?= strtoupper(substr($user['username'], 0, 1)) ?></div>
                <?php endif; ?>
                <label for="avatarUpload" style="position:absolute;bottom:0;right:0;width:32px;height:32px;border-radius:50%;background:var(--accent-gradient);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:0.9rem;border:2px solid var(--bg-primary);">
                    📷
                </label>
                <input type="file" id="avatarUpload" accept="image/*" style="display:none;" data-upload-avatar>
            </div>
            <h1 style="font-family:var(--font-display);font-size:1.5rem;font-weight:800;"><?= htmlspecialchars($user['username']) ?></h1>
            <p style="color:var(--text-muted);font-size:0.9rem;">Member since <?= $memberSince ?></p>
        </div>

        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:40px;" data-animate="fade-in-up" data-delay="50">
            <div class="card" style="text-align:center;padding:20px;">
                <div style="font-family:var(--font-display);font-size:1.5rem;font-weight:800;"><?= $stats['books_read'] ?></div>
                <div style="font-size:0.85rem;color:var(--text-muted);">Books Read</div>
            </div>
            <div class="card" style="text-align:center;padding:20px;">
                <div style="font-family:var(--font-display);font-size:1.5rem;font-weight:800;"><?= $stats['total_bookmarks'] ?></div>
                <div style="font-size:0.85rem;color:var(--text-muted);">Bookmarks</div>
            </div>
            <div class="card" style="text-align:center;padding:20px;">
                <div style="font-family:var(--font-display);font-size:1.5rem;font-weight:800;" id="streakCount">-</div>
                <div style="font-size:0.85rem;color:var(--text-muted);">Day Streak</div>
            </div>
        </div>

        <div class="card" style="padding:32px;max-width:500px;margin:0 auto;" data-animate="fade-in-up" data-delay="100">
            <h2 style="font-family:var(--font-display);font-size:1.15rem;font-weight:600;margin-bottom:24px;">Edit Profile</h2>
            <form id="profileForm">
                <div class="form-group">
                    <label class="form-label">Username</label>
                    <input type="text" class="form-input" value="<?= htmlspecialchars($user['username']) ?>" readonly style="opacity:0.6;cursor:not-allowed;">
                </div>
                <div class="form-group">
                    <label class="form-label" for="profileName">Display Name</label>
                    <input type="text" id="profileName" name="name" class="form-input" value="<?= htmlspecialchars($user['name'] ?? $user['username']) ?>" placeholder="Your display name">
                </div>
                <div class="form-group">
                    <label class="form-label" for="profileEmail">Email</label>
                    <input type="email" id="profileEmail" name="email" class="form-input" value="<?= htmlspecialchars($user['email'] ?? '') ?>" placeholder="your@email.com">
                </div>
                <div class="form-group">
                    <label class="form-label">Role Number</label>
                    <input type="text" class="form-input" value="<?= htmlspecialchars($user['role_number'] ?? '') ?>" readonly style="opacity:0.6;cursor:not-allowed;">
                </div>
                <div class="form-group">
                    <label class="form-label" for="profileSchool">School Name</label>
                    <input type="text" id="profileSchool" name="school" class="form-input" value="<?= htmlspecialchars($user['school'] ?? '') ?>" placeholder="Your school name">
                </div>
                <?php if (!empty($user['user_id'])): ?>
                <div class="form-group">
                    <label class="form-label">User ID</label>
                    <input type="text" class="form-input" value="<?= htmlspecialchars($user['user_id']) ?>" readonly style="opacity:0.6;cursor:not-allowed;">
                </div>
                <?php endif; ?>
                <button type="submit" class="btn btn-primary btn-lg btn-block">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    Save Changes
                </button>
            </form>
        </div>
    </div>
</section>

<script>
document.addEventListener('DOMContentLoaded', function() {
    var form = document.getElementById('profileForm');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            var btn = this.querySelector('button[type="submit"]');
            var origText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner spinner-sm" style="margin:0;"></span>';

            try {
                var res = await fetch('/api/auth.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'update_profile',
                        username: document.getElementById('profileName')?.value || '',
                        school_name: document.getElementById('profileSchool')?.value || ''
                    })
                });
                var data = await res.json();
                if (res.ok) {
                    if (window.showToast) window.showToast('Profile updated successfully', 'success');
                    if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
                } else {
                    if (window.showToast) window.showToast(data.message || 'Failed to update', 'error');
                }
            } catch (e) {
                if (window.showToast) window.showToast('Connection error', 'error');
            }

            btn.disabled = false;
            btn.innerHTML = origText;
        });
    }

    var avatarInput = document.getElementById('avatarUpload');
    if (avatarInput) {
        avatarInput.addEventListener('change', async function() {
            if (!this.files || !this.files[0]) return;
            var fd = new FormData();
            fd.append('avatar', this.files[0]);

            fd.append('action', 'upload');
            try {
                var res = await fetch('/api/uploads.php', {
                    method: 'POST',
                    body: fd
                });
                var data = await res.json();
                if (res.ok && data.avatar) {
                    location.reload();
                } else {
                    if (window.showToast) window.showToast(data.message || 'Upload failed', 'error');
                }
            } catch (e) {
                if (window.showToast) window.showToast('Upload failed', 'error');
            }
        });
    }
});
</script>
