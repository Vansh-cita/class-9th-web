<?php
session_start();
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/functions.php';

$user = getCurrentUser();
if (!$user || ($_SESSION['role'] ?? '') !== 'admin') {
    header('Location: /login');
    exit;
}

$db = getDB();
$allowedTypes = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'zip', 'mp4', 'mp3'];

$search = $_GET['search'] ?? '';
$typeFilter = $_GET['type'] ?? '';
$page = isset($_GET['p']) ? max(1, (int)$_GET['p']) : 1;
$perPage = 20;
$offset = ($page - 1) * $perPage;

$where = [];
$params = [];
if ($search) {
    $where[] = "u.filename LIKE ? OR u.original_name LIKE ?";
    $s = "%$search%";
    $params[] = $s; $params[] = $s;
}
if ($typeFilter) {
    $where[] = "u.file_type = ?";
    $params[] = $typeFilter;
}
$whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

$stmt = $db->prepare("SELECT COUNT(*) as c FROM uploads u $whereClause");
$stmt->execute($params);
$totalFiles = (int)$stmt->fetch()['c'];
$totalPages = max(1, ceil($totalFiles / $perPage));

$stmt = $db->prepare("SELECT u.*, us.username as uploaded_by_name, b.title as book_title FROM uploads u LEFT JOIN users us ON u.user_id = us.id LEFT JOIN books b ON u.book_id = b.id $whereClause ORDER BY u.created_at DESC LIMIT ? OFFSET ?");
$stmt->execute(array_merge($params, [$perPage, $offset]));
$files = $stmt->fetchAll();

$errors = [];
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if ($_POST['action'] === 'upload_file') {
        if (!empty($_FILES['upload_file']['name'])) {
            $targetDir = __DIR__ . '/../../uploads/files';
            $result = uploadFile($_FILES['upload_file'], $targetDir, $allowedTypes);
            if (isset($result['error'])) {
                $errors[] = $result['error'];
            } else {
                $bookId = !empty($_POST['book_id']) ? (int)$_POST['book_id'] : null;
                $stmt = $db->prepare("INSERT INTO uploads (filename, original_name, file_type, file_size, user_id, book_id, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))");
                $stmt->execute([
                    $result['filename'],
                    $_FILES['upload_file']['name'],
                    strtolower(pathinfo($_FILES['upload_file']['name'], PATHINFO_EXTENSION)),
                    $_FILES['upload_file']['size'],
                    $user['id'],
                    $bookId
                ]);
                $success = 'File uploaded successfully';
                logActivity($user['id'], 'upload_file', "Uploaded: {$_FILES['upload_file']['name']}");
            }
        } else {
            $errors[] = 'Please select a file to upload';
        }
    }

    if ($_POST['action'] === 'delete_file' && isset($_POST['file_id'])) {
        $fileId = (int)$_POST['file_id'];
        $stmt = $db->prepare("SELECT filename FROM uploads WHERE id=?");
        $stmt->execute([$fileId]);
        $file = $stmt->fetch();
        if ($file) {
            deleteFile(__DIR__ . '/../../uploads/files/' . $file['filename']);
            $stmt = $db->prepare("DELETE FROM uploads WHERE id=?");
            $stmt->execute([$fileId]);
            $success = 'File deleted';
            logActivity($user['id'], 'delete_file', "Deleted file #$fileId: {$file['filename']}");
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Uploads - Admin - CBSE Class 9 Portal</title>
    <link rel="stylesheet" href="/assets/css/style.css">
    <link rel="stylesheet" href="/assets/css/admin.css">
</head>
<body>
<div class="admin-layout">
    <aside class="admin-sidebar">
        <div class="admin-sidebar-header">
            <div>
                <div style="font-weight:800;font-size:1.15rem;">C9 Admin</div>
                <a href="/" class="back-link">← Back to site</a>
            </div>
        </div>
        <nav class="admin-sidebar-nav">
            <a href="/admin"><span class="nav-icon">📊</span> Dashboard</a>
            <a href="/admin/books"><span class="nav-icon">📚</span> Books</a>
            <a href="/admin/categories"><span class="nav-icon">🏷️</span> Categories</a>
            <a href="/admin/users"><span class="nav-icon">👥</span> Users</a>
            <a href="/admin/uploads" class="active"><span class="nav-icon">📁</span> Uploads</a>
            <a href="/admin/announcements"><span class="nav-icon">📢</span> Announcements</a>
            <a href="/admin/pages"><span class="nav-icon">🔒</span> Hidden Pages</a>
            <a href="/admin/settings"><span class="nav-icon">⚙️</span> Settings</a>
            <a href="/admin/logs"><span class="nav-icon">📋</span> Logs</a>
        </nav>
        <div class="admin-sidebar-footer">
            <div class="admin-avatar"><?= strtoupper(substr($user['username'] ?? 'A', 0, 1)) ?></div>
            <div class="admin-info">
                <div class="admin-name"><?= htmlspecialchars($user['username'] ?? 'Admin') ?></div>
                <div class="admin-role">Administrator</div>
            </div>
        </div>
    </aside>
    <div class="admin-sidebar-overlay"></div>

    <div class="admin-main">
        <header class="admin-topbar">
            <div style="display:flex;align-items:center;gap:12px;">
                <button class="admin-sidebar-toggle" aria-label="Toggle sidebar">☰</button>
                <div class="admin-topbar-title">Upload Management</div>
            </div>
            <div class="admin-topbar-actions">
                <a href="/" class="btn btn-sm btn-ghost">View Site</a>
                <a href="/logout" class="btn btn-sm btn-ghost" style="color:#ff1744;">Logout</a>
            </div>
        </header>

        <main class="admin-content">
            <div class="admin-page-header">
                <div>
                    <h1 class="admin-page-title">📁 Uploads</h1>
                    <p class="admin-page-desc">Manage uploaded files (<?= $totalFiles ?> total)</p>
                </div>
            </div>

            <?php if ($success): ?>
            <div style="padding:12px 16px;background:rgba(0,200,83,0.1);border:1px solid rgba(0,200,83,0.3);border-radius:var(--radius-md);margin-bottom:20px;color:#00c853;font-weight:500;"><?= htmlspecialchars($success) ?></div>
            <?php endif; ?>
            <?php if (!empty($errors)): ?>
            <div style="padding:12px 16px;background:rgba(255,23,68,0.1);border:1px solid rgba(255,23,68,0.3);border-radius:var(--radius-md);margin-bottom:20px;color:#ff1744;font-weight:500;">
                <?php foreach ($errors as $e): ?><div><?= htmlspecialchars($e) ?></div><?php endforeach; ?>
            </div>
            <?php endif; ?>

            <div class="admin-card">
                <div class="admin-card-header">
                    <div class="admin-card-title">Upload New File</div>
                </div>
                <div class="admin-card-body">
                    <form method="POST" enctype="multipart/form-data" class="admin-form admin-form-wide">
                        <input type="hidden" name="action" value="upload_file">
                        <div class="upload-zone" id="uploadZone">
                            <div class="upload-icon">📤</div>
                            <div class="upload-text">Drag & drop files here or click to browse</div>
                            <div class="upload-hint">Allowed: <?= implode(', ', array_map('strtoupper', $allowedTypes)) ?> (max 100MB)</div>
                            <input type="file" name="upload_file" id="fileInput" style="display:none;">
                        </div>
                        <div class="upload-preview" id="uploadPreview"></div>
                        <div style="margin-top:16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
                            <select name="book_id" style="width:200px;padding:8px 12px;font-size:0.85rem;">
                                <option value="">No book association</option>
                                <?php
                                $books = getBooks(1000);
                                foreach ($books as $b):
                                ?>
                                <option value="<?= $b['id'] ?>"><?= htmlspecialchars($b['title']) ?></option>
                                <?php endforeach; ?>
                            </select>
                            <div id="uploadProgress" style="display:none;flex:1;height:8px;background:var(--bg-glass-strong);border-radius:4px;overflow:hidden;">
                                <div id="uploadProgressBar" style="height:100%;width:0%;background:var(--accent-gradient);border-radius:4px;transition:width 0.3s;"></div>
                            </div>
                            <button type="submit" class="btn btn-primary" id="uploadBtn">Upload File</button>
                        </div>
                    </form>
                </div>
            </div>

            <div class="admin-card">
                <div class="admin-card-header">
                    <div class="admin-card-title">All Files</div>
                    <form method="GET" action="/admin/uploads" style="display:flex;gap:12px;flex-wrap:wrap;">
                        <input type="text" name="search" placeholder="Search files..." value="<?= htmlspecialchars($search) ?>" style="width:200px;padding:8px 12px;font-size:0.85rem;">
                        <select name="type" style="width:140px;padding:8px 12px;font-size:0.85rem;">
                            <option value="">All Types</option>
                            <?php foreach ($allowedTypes as $t): ?>
                            <option value="<?= $t ?>" <?= $typeFilter === $t ? 'selected' : '' ?>><?= strtoupper($t) ?></option>
                            <?php endforeach; ?>
                        </select>
                        <button type="submit" class="btn btn-sm btn-secondary">Filter</button>
                        <a href="/admin/uploads" class="btn btn-sm btn-ghost">Clear</a>
                    </form>
                </div>
                <div class="admin-card-body" style="padding:0;">
                    <div class="admin-table-wrap">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>File Name</th>
                                    <th>Type</th>
                                    <th>Size</th>
                                    <th>Uploaded By</th>
                                    <th>Book</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if ($files): foreach ($files as $f):
                                    $ext = strtolower(pathinfo($f['filename'], PATHINFO_EXTENSION));
                                    $isImage = in_array($ext, ['jpg','jpeg','png','gif','webp']);
                                ?>
                                <tr>
                                    <td>
                                        <div style="display:flex;align-items:center;gap:10px;">
                                            <span style="font-size:1.3rem;"><?= $isImage ? '🖼️' : '📄' ?></span>
                                            <div>
                                                <div style="font-weight:500;font-size:0.9rem;"><?= htmlspecialchars($f['original_name'] ?? $f['filename']) ?></div>
                                                <div style="font-size:0.78rem;color:var(--text-muted);font-family:monospace;"><?= htmlspecialchars($f['filename']) ?></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td><span class="status-badge status-active"><?= strtoupper($ext) ?></span></td>
                                    <td style="font-size:0.85rem;color:var(--text-muted);"><?= $f['file_size'] ? number_format($f['file_size'] / 1024, 1) . ' KB' : '-' ?></td>
                                    <td style="font-size:0.85rem;color:var(--text-muted);"><?= htmlspecialchars($f['uploaded_by_name'] ?? 'System') ?></td>
                                    <td style="font-size:0.85rem;color:var(--text-muted);"><?= htmlspecialchars($f['book_title'] ?? '-') ?></td>
                                    <td style="font-size:0.85rem;color:var(--text-muted);"><?= timeAgo($f['created_at']) ?></td>
                                    <td>
                                        <div class="actions">
                                            <?php if ($isImage): ?>
                                            <button onclick="previewFile('<?= htmlspecialchars($f['filename']) ?>')" title="Preview">👁️</button>
                                            <?php endif; ?>
                                            <a href="/uploads/files/<?= urlencode($f['filename']) ?>" target="_blank" class="btn btn-sm btn-ghost" title="Download">⬇️</a>
                                            <form method="POST" style="display:inline;" onsubmit="return confirm('Delete this file?')">
                                                <input type="hidden" name="action" value="delete_file">
                                                <input type="hidden" name="file_id" value="<?= $f['id'] ?>">
                                                <button type="submit" class="btn-delete" title="Delete">🗑</button>
                                            </form>
                                        </div>
                                    </td>
                                </tr>
                                <?php endforeach; else: ?>
                                <tr><td colspan="7"><div class="table-empty"><div class="empty-icon">📁</div>No files uploaded yet</div></td></tr>
                                <?php endif; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
                <?php if ($totalPages > 1): ?>
                <div style="display:flex;justify-content:center;gap:8px;padding:16px 24px;border-top:1px solid var(--border-color);">
                    <?php for ($i = 1; $i <= $totalPages; $i++): ?>
                    <a href="/admin/uploads?p=<?= $i ?>&search=<?= urlencode($search) ?>&type=<?= urlencode($typeFilter) ?>" class="btn btn-sm <?= $i === $page ? 'btn-primary' : 'btn-ghost' ?>"><?= $i ?></a>
                    <?php endfor; ?>
                </div>
                <?php endif; ?>
            </div>
        </main>
    </div>
</div>

<div id="filePreviewModal" style="display:none;position:fixed;inset:0;z-index:var(--z-modal);background:rgba(0,0,0,0.9);display:none;align-items:center;justify-content:center;padding:24px;">
    <div style="position:relative;max-width:90vw;max-height:90vh;">
        <button onclick="closePreview()" style="position:absolute;top:-40px;right:0;color:#fff;font-size:1.5rem;background:none;border:none;cursor:pointer;">✕</button>
        <img id="previewImage" src="" alt="Preview" style="max-width:100%;max-height:85vh;border-radius:var(--radius-md);">
    </div>
</div>

<script src="/assets/js/main.js"></script>
<script src="/assets/js/admin.js"></script>
<script>
const zone = document.getElementById('uploadZone');
const input = document.getElementById('fileInput');
const preview = document.getElementById('uploadPreview');

if (zone && input) {
    zone.addEventListener('click', () => input.click());
    input.addEventListener('change', () => handleFiles(input.files));
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            input.files = e.dataTransfer.files;
            handleFiles(e.dataTransfer.files);
        }
    });
}

function handleFiles(files) {
    preview.innerHTML = '';
    Array.from(files).forEach((file, idx) => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.innerHTML += `<div class="upload-preview-item"><img src="${e.target.result}" alt="Preview"><button class="remove" onclick="this.parentElement.remove()">✕</button></div>`;
            };
            reader.readAsDataURL(file);
        } else {
            preview.innerHTML += `<div class="upload-preview-item" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;"><div style="font-size:1.5rem;">📄</div><div style="font-size:0.75rem;text-align:center;">${file.name}</div><button class="remove" onclick="this.parentElement.remove()">✕</button></div>`;
        }
    });
}

document.querySelector('form[enctype="multipart/form-data"]')?.addEventListener('submit', function() {
    document.getElementById('uploadProgress').style.display = 'block';
    document.getElementById('uploadBtn').disabled = true;
    document.getElementById('uploadBtn').innerHTML = 'Uploading...';
});

function previewFile(filename) {
    const modal = document.getElementById('filePreviewModal');
    const img = document.getElementById('previewImage');
    modal.style.display = 'flex';
    img.src = '/uploads/files/' + encodeURIComponent(filename);
}

function closePreview() {
    document.getElementById('filePreviewModal').style.display = 'none';
}
</script>
</body>
</html>
