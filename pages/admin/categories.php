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

$errors = [];
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['action']) && $_POST['action'] === 'add_category') {
        $name = sanitize($_POST['name'] ?? '');
        $slug = sanitize($_POST['slug'] ?? slugify($name));
        $description = sanitize($_POST['description'] ?? '');
        $icon = sanitize($_POST['icon'] ?? '📖');

        if (empty($name)) {
            $errors[] = 'Category name is required';
        }

        $stmt = $db->prepare("SELECT COUNT(*) as c FROM categories WHERE slug = ?");
        $stmt->execute([$slug]);
        if ((int)$stmt->fetch()['c'] > 0) {
            $errors[] = 'A category with this slug already exists';
        }

        if (empty($errors)) {
            $stmt = $db->prepare("INSERT INTO categories (name, slug, description, icon) VALUES (?, ?, ?, ?)");
            $stmt->execute([$name, $slug, $description, $icon]);
            logActivity($user['id'], 'create_category', "Created category: $name");
            $success = 'Category created successfully';
        }
    }

    if (isset($_POST['action']) && $_POST['action'] === 'edit_category') {
        $id = (int)($_POST['category_id'] ?? 0);
        $name = sanitize($_POST['name'] ?? '');
        $slug = sanitize($_POST['slug'] ?? slugify($name));
        $description = sanitize($_POST['description'] ?? '');
        $icon = sanitize($_POST['icon'] ?? '📖');

        if (empty($name)) $errors[] = 'Category name is required';

        $stmt = $db->prepare("SELECT COUNT(*) as c FROM categories WHERE slug = ? AND id != ?");
        $stmt->execute([$slug, $id]);
        if ((int)$stmt->fetch()['c'] > 0) {
            $errors[] = 'A category with this slug already exists';
        }

        if (empty($errors)) {
            $stmt = $db->prepare("UPDATE categories SET name=?, slug=?, description=?, icon=? WHERE id=?");
            $stmt->execute([$name, $slug, $description, $icon, $id]);
            logActivity($user['id'], 'update_category', "Updated category: $name");
            $success = 'Category updated successfully';
        }
    }

    if (isset($_POST['action']) && $_POST['action'] === 'delete_category') {
        $id = (int)($_POST['category_id'] ?? 0);
        $stmt = $db->prepare("SELECT COUNT(*) as c FROM books WHERE category_id=?");
        $stmt->execute([$id]);
        if ((int)$stmt->fetch()['c'] > 0) {
            $errors[] = 'Cannot delete category with existing books. Move books to another category first.';
        } else {
            $stmt = $db->prepare("DELETE FROM categories WHERE id=?");
            $stmt->execute([$id]);
            logActivity($user['id'], 'delete_category', "Deleted category #$id");
            $success = 'Category deleted';
        }
    }
}

$stmt = $db->query("SELECT c.*, COUNT(b.id) as book_count FROM categories c LEFT JOIN books b ON c.id = b.category_id GROUP BY c.id, c.name, c.slug, c.description, c.icon, c.created_at ORDER BY c.name ASC");
$categories = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Categories - Admin - CBSE Class 9 Portal</title>
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
            <a href="/admin/categories" class="active"><span class="nav-icon">🏷️</span> Categories</a>
            <a href="/admin/users"><span class="nav-icon">👥</span> Users</a>
            <a href="/admin/uploads"><span class="nav-icon">📁</span> Uploads</a>
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
                <div class="admin-topbar-title">Category Management</div>
            </div>
            <div class="admin-topbar-actions">
                <a href="/" class="btn btn-sm btn-ghost">View Site</a>
                <a href="/logout" class="btn btn-sm btn-ghost" style="color:#ff1744;">Logout</a>
            </div>
        </header>

        <main class="admin-content">
            <div class="admin-page-header">
                <div>
                    <h1 class="admin-page-title">🏷️ Categories</h1>
                    <p class="admin-page-desc">Organize books into categories (<?= count($categories) ?> total)</p>
                </div>
                <button class="btn btn-primary" onclick="openCategoryModal()">➕ Add Category</button>
            </div>

            <?php if ($success): ?>
            <div style="padding:12px 16px;background:rgba(0,200,83,0.1);border:1px solid rgba(0,200,83,0.3);border-radius:var(--radius-md);margin-bottom:20px;color:#00c853;font-weight:500;"><?= htmlspecialchars($success) ?></div>
            <?php endif; ?>
            <?php if (!empty($errors)): ?>
            <div style="padding:12px 16px;background:rgba(255,23,68,0.1);border:1px solid rgba(255,23,68,0.3);border-radius:var(--radius-md);margin-bottom:20px;color:#ff1744;font-weight:500;">
                <?php foreach ($errors as $e): ?><div><?= htmlspecialchars($e) ?></div><?php endforeach; ?>
            </div>
            <?php endif; ?>

            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;" id="categoryList">
                <?php foreach ($categories as $cat): ?>
                <div class="admin-card" style="margin-bottom:0;">
                    <div class="admin-card-body">
                        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
                            <div style="display:flex;align-items:center;gap:12px;">
                                <span style="font-size:2rem;"><?= htmlspecialchars($cat['icon'] ?? '📖') ?></span>
                                <div>
                                    <h3 style="font-weight:600;font-size:1.05rem;"><?= htmlspecialchars($cat['name']) ?></h3>
                                    <?php if (!empty($cat['description'])): ?>
                                    <p style="font-size:0.85rem;color:var(--text-muted);margin-top:2px;"><?= htmlspecialchars(truncateText($cat['description'], 80)) ?></p>
                                    <?php endif; ?>
                                    <div style="font-size:0.78rem;color:var(--text-muted);margin-top:4px;">
                                        <span class="status-badge status-active"><?= $cat['book_count'] ?> books</span>
                                        <span style="margin-left:8px;">/<?= htmlspecialchars($cat['slug']) ?></span>
                                    </div>
                                </div>
                            </div>
                            <div style="display:flex;gap:6px;flex-shrink:0;">
                                <button onclick="openEditCategoryModal(<?= $cat['id'] ?>)" class="btn btn-sm btn-ghost" title="Edit">✏️</button>
                                <form method="POST" style="display:inline;" onsubmit="return confirm('<?= $cat['book_count'] > 0 ? 'This category has books. Are you sure?' : 'Delete this category?' ?>')">
                                    <input type="hidden" name="action" value="delete_category">
                                    <input type="hidden" name="category_id" value="<?= $cat['id'] ?>">
                                    <button type="submit" class="btn btn-sm btn-ghost" style="color:#ff1744;" title="Delete">🗑</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
                <?php endforeach; ?>
                <?php if (empty($categories)): ?>
                <div class="admin-card" style="margin-bottom:0;">
                    <div class="admin-card-body">
                        <div class="table-empty">
                            <div class="empty-icon">🏷️</div>
                            <div>No categories yet</div>
                            <button class="btn btn-primary btn-sm" style="margin-top:12px;" onclick="openCategoryModal()">Create First Category</button>
                        </div>
                    </div>
                </div>
                <?php endif; ?>
            </div>

            <div class="admin-card" id="categoryFormCard" style="display:none;margin-top:24px;">
                <div class="admin-card-header">
                    <div class="admin-card-title" id="categoryFormTitle">Add New Category</div>
                    <button class="btn btn-sm btn-ghost" onclick="closeCategoryModal()">✕ Close</button>
                </div>
                <div class="admin-card-body">
                    <form method="POST" class="admin-form">
                        <input type="hidden" name="action" id="catFormAction" value="add_category">
                        <input type="hidden" name="category_id" id="editCategoryId" value="0">
                        <div class="form-group">
                            <label class="form-label">Name *</label>
                            <input class="form-input" name="name" id="catName" required placeholder="e.g. Mathematics">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Slug</label>
                            <input class="form-input" name="slug" id="catSlug" placeholder="Auto-generated from name" oninput="this.value=this.value.toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/--+/g,'-').replace(/^-|-$/g,'')">
                            <div style="font-size:0.78rem;color:var(--text-muted);margin-top:4px;">URL-friendly identifier. Auto-generated if left empty.</div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Icon (emoji)</label>
                            <input class="form-input" name="icon" id="catIcon" value="📖" maxlength="10" style="max-width:100px;">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Description</label>
                            <textarea class="form-input" name="description" id="catDescription" rows="3" placeholder="Brief description of this category..."></textarea>
                        </div>
                        <div style="display:flex;gap:12px;">
                            <button type="submit" class="btn btn-primary" id="catSubmitBtn">Create Category</button>
                            <button type="button" class="btn btn-ghost" onclick="closeCategoryModal()">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    </div>
</div>

<script src="/assets/js/main.js"></script>
<script src="/assets/js/admin.js"></script>
<script>
const catData = <?= json_encode($categories) ?>;

document.getElementById('catName')?.addEventListener('input', function() {
    const slugField = document.getElementById('catSlug');
    if (!slugField.value || slugField.dataset.auto === 'true' || !slugField.dataset.auto) {
        slugField.value = this.value.toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/--+/g,'-').replace(/^-|-$/g,'');
        slugField.dataset.auto = 'true';
    }
});

function openCategoryModal() {
    const card = document.getElementById('categoryFormCard');
    card.style.display = 'block';
    card.scrollIntoView({ behavior: 'smooth' });
    document.getElementById('categoryFormTitle').textContent = 'Add New Category';
    document.getElementById('catFormAction').value = 'add_category';
    document.getElementById('editCategoryId').value = '0';
    document.getElementById('catSubmitBtn').textContent = 'Create Category';
    document.getElementById('catName').value = '';
    document.getElementById('catSlug').value = '';
    document.getElementById('catIcon').value = '📖';
    document.getElementById('catDescription').value = '';
    document.getElementById('catSlug').dataset.auto = 'true';
}

function openEditCategoryModal(id) {
    const cat = catData.find(c => c.id == id);
    if (!cat) return;
    const card = document.getElementById('categoryFormCard');
    card.style.display = 'block';
    card.scrollIntoView({ behavior: 'smooth' });
    document.getElementById('categoryFormTitle').textContent = 'Edit Category';
    document.getElementById('catFormAction').value = 'edit_category';
    document.getElementById('editCategoryId').value = cat.id;
    document.getElementById('catSubmitBtn').textContent = 'Update Category';
    document.getElementById('catName').value = cat.name || '';
    document.getElementById('catSlug').value = cat.slug || '';
    document.getElementById('catSlug').dataset.auto = 'false';
    document.getElementById('catIcon').value = cat.icon || '📖';
    document.getElementById('catDescription').value = cat.description || '';
}

function closeCategoryModal() {
    document.getElementById('categoryFormCard').style.display = 'none';
}
</script>
</body>
</html>
