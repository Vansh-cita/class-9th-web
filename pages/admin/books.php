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
$page = isset($_GET['p']) ? max(1, (int)$_GET['p']) : 1;
$perPage = 15;
$offset = ($page - 1) * $perPage;
$search = $_GET['search'] ?? '';
$categoryFilter = $_GET['category'] ?? '';

$where = [];
$params = [];
if ($search) {
    $where[] = "(b.title LIKE ? OR b.author LIKE ? OR b.subject LIKE ?)";
    $params[] = "%$search%"; $params[] = "%$search%"; $params[] = "%$search%";
}
if ($categoryFilter) {
    $where[] = "b.category_id = ?";
    $params[] = (int)$categoryFilter;
}
$whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

$stmt = $db->prepare("SELECT COUNT(*) as c FROM books b $whereClause");
$stmt->execute($params);
$totalBooks = (int)$stmt->fetch()['c'];
$totalPages = max(1, ceil($totalBooks / $perPage));

$stmt = $db->prepare("SELECT b.*, c.name as category_name FROM books b LEFT JOIN categories c ON b.category_id = c.id $whereClause ORDER BY b.created_at DESC LIMIT ? OFFSET ?");
$stmt->execute(array_merge($params, [$perPage, $offset]));
$books = $stmt->fetchAll();

$categories = getCategories();

$errors = [];
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if ($_POST['action'] === 'add_book' || $_POST['action'] === 'edit_book') {
        $title = sanitize($_POST['title'] ?? '');
        $description = sanitize($_POST['description'] ?? '');
        $subject = sanitize($_POST['subject'] ?? '');
        $language = sanitize($_POST['language'] ?? '');
        $category_id = (int)($_POST['category_id'] ?? 0);
        $author = sanitize($_POST['author'] ?? '');
        $isChapterWise = isset($_POST['is_chapter_wise']) ? 1 : 0;
        $bookId = (int)($_POST['book_id'] ?? 0);

        $rules = ['title' => 'required|min:2|max:255'];
        $errors = validateInput($_POST, $rules);

        if (empty($errors)) {
            $thumbnail = '';
            if (!empty($_FILES['thumbnail']['name'])) {
                $upload = uploadFile($_FILES['thumbnail'], __DIR__ . '/../../uploads/thumbnails', ['jpg','jpeg','png','gif','webp']);
                if (isset($upload['error'])) {
                    $errors[] = $upload['error'];
                } else {
                    $thumbnail = '/uploads/thumbnails/' . $upload['filename'];
                }
            }

            if (empty($errors)) {
                if ($_POST['action'] === 'add_book') {
                    $stmt = $db->prepare("INSERT INTO books (title, description, subject, language, category_id, author, thumbnail, is_chapter_wise, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))");
                    $stmt->execute([$title, $description, $subject, $language, $category_id ?: null, $author, $thumbnail ?: null, $isChapterWise]);
                    $bookId = $db->lastInsertId();
                    logActivity($user['id'], 'create_book', "Created book: $title");
                    $success = 'Book created successfully';
                } else {
                    if ($thumbnail) {
                        $stmt = $db->prepare("UPDATE books SET title=?, description=?, subject=?, language=?, category_id=?, author=?, thumbnail=?, is_chapter_wise=? WHERE id=?");
                        $stmt->execute([$title, $description, $subject, $language, $category_id ?: null, $author, $thumbnail, $isChapterWise, $bookId]);
                    } else {
                        $stmt = $db->prepare("UPDATE books SET title=?, description=?, subject=?, language=?, category_id=?, author=?, is_chapter_wise=? WHERE id=?");
                        $stmt->execute([$title, $description, $subject, $language, $category_id ?: null, $author, $isChapterWise, $bookId]);
                    }
                    logActivity($user['id'], 'update_book', "Updated book: $title");
                    $success = 'Book updated successfully';
                }
            }
        }
    }

    if ($_POST['action'] === 'add_chapter' && isset($_POST['book_id'])) {
        $bookId = (int)$_POST['book_id'];
        $chapterTitle = sanitize($_POST['chapter_title'] ?? '');
        $chapterNumber = (int)($_POST['chapter_number'] ?? 0);
        $content = $_POST['content'] ?? '';
        $chapterId = (int)($_POST['chapter_id'] ?? 0);

        $pdfPath = '';
        if (!empty($_FILES['chapter_pdf']['name'])) {
            $upload = uploadFile($_FILES['chapter_pdf'], __DIR__ . '/../../uploads/chapters', ['pdf']);
            if (isset($upload['error'])) {
                $errors[] = $upload['error'];
            } else {
                $pdfPath = '/uploads/chapters/' . $upload['filename'];
            }
        }

        if (empty($errors)) {
            if ($chapterId) {
                if ($pdfPath) {
                    $stmt = $db->prepare("UPDATE chapters SET title=?, chapter_number=?, content=?, pdf_path=? WHERE id=? AND book_id=?");
                    $stmt->execute([$chapterTitle, $chapterNumber, $content, $pdfPath, $chapterId, $bookId]);
                } else {
                    $stmt = $db->prepare("UPDATE chapters SET title=?, chapter_number=?, content=? WHERE id=? AND book_id=?");
                    $stmt->execute([$chapterTitle, $chapterNumber, $content, $chapterId, $bookId]);
                }
                logActivity($user['id'], 'update_chapter', "Updated chapter: $chapterTitle for book #$bookId");
                $success = 'Chapter updated';
            } else {
                $stmt = $db->prepare("INSERT INTO chapters (book_id, title, chapter_number, content, pdf_path) VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([$bookId, $chapterTitle, $chapterNumber, $content, $pdfPath ?: null]);
                logActivity($user['id'], 'add_chapter', "Added chapter: $chapterTitle to book #$bookId");
                $success = 'Chapter added';
            }
        }
    }

    if ($_POST['action'] === 'delete_chapter' && isset($_POST['chapter_id'])) {
        $stmt = $db->prepare("DELETE FROM chapters WHERE id=?");
        $stmt->execute([(int)$_POST['chapter_id']]);
        logActivity($user['id'], 'delete_chapter', "Deleted chapter #{$_POST['chapter_id']}");
        $success = 'Chapter deleted';
    }

    if ($_POST['action'] === 'delete_book' && isset($_POST['book_id'])) {
        $bookId = (int)$_POST['book_id'];
        $stmt = $db->prepare("DELETE FROM chapters WHERE book_id=?");
        $stmt->execute([$bookId]);
        $stmt = $db->prepare("DELETE FROM books WHERE id=?");
        $stmt->execute([$bookId]);
        logActivity($user['id'], 'delete_book', "Deleted book #$bookId");
        $success = 'Book deleted';
        header('Location: /admin/books?deleted=1');
        exit;
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Books - Admin - CBSE Class 9 Portal</title>
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
            <a href="/admin/books" class="active"><span class="nav-icon">📚</span> Books</a>
            <a href="/admin/categories"><span class="nav-icon">🏷️</span> Categories</a>
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
                <div class="admin-topbar-title">Book Management</div>
            </div>
            <div class="admin-topbar-actions">
                <a href="/" class="btn btn-sm btn-ghost">View Site</a>
                <a href="/logout" class="btn btn-sm btn-ghost" style="color:#ff1744;">Logout</a>
            </div>
        </header>

        <main class="admin-content">
            <div class="admin-page-header">
                <div>
                    <h1 class="admin-page-title">📚 Books</h1>
                    <p class="admin-page-desc">Manage your book collection (<?= $totalBooks ?> total)</p>
                </div>
                <button class="btn btn-primary" onclick="openBookModal()">➕ Add New Book</button>
            </div>

            <?php if ($success): ?>
            <div style="padding:12px 16px;background:rgba(0,200,83,0.1);border:1px solid rgba(0,200,83,0.3);border-radius:var(--radius-md);margin-bottom:20px;color:#00c853;font-weight:500;"><?= htmlspecialchars($success) ?></div>
            <?php endif; ?>
            <?php if (!empty($errors)): ?>
            <div style="padding:12px 16px;background:rgba(255,23,68,0.1);border:1px solid rgba(255,23,68,0.3);border-radius:var(--radius-md);margin-bottom:20px;color:#ff1744;font-weight:500;">
                <?php foreach ($errors as $e): ?><div><?= htmlspecialchars(is_string($e) ? $e : '') ?></div><?php endforeach; ?>
            </div>
            <?php endif; ?>

            <div class="admin-card">
                <div class="admin-card-header">
                    <div class="admin-card-title">All Books</div>
                    <form method="GET" action="/admin/books" style="display:flex;gap:12px;flex-wrap:wrap;">
                        <input type="text" name="search" placeholder="Search books..." value="<?= htmlspecialchars($search) ?>" style="width:200px;padding:8px 12px;font-size:0.85rem;">
                        <select name="category" style="width:160px;padding:8px 12px;font-size:0.85rem;">
                            <option value="">All Categories</option>
                            <?php foreach ($categories as $cat): ?>
                            <option value="<?= $cat['id'] ?>" <?= $categoryFilter == $cat['id'] ? 'selected' : '' ?>><?= htmlspecialchars($cat['name']) ?></option>
                            <?php endforeach; ?>
                        </select>
                        <button type="submit" class="btn btn-sm btn-secondary">Filter</button>
                        <a href="/admin/books" class="btn btn-sm btn-ghost">Clear</a>
                    </form>
                </div>
                <div class="admin-card-body" style="padding:0;">
                    <div class="admin-table-wrap">
                        <table class="admin-table" id="bookTable">
                            <thead>
                                <tr>
                                    <th style="width:40px;"></th>
                                    <th>Title</th>
                                    <th>Subject</th>
                                    <th>Category</th>
                                    <th>Language</th>
                                    <th>Chapters</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if ($books): foreach ($books as $book):
                                    $stmt = $db->prepare("SELECT COUNT(*) as c FROM chapters WHERE book_id=?");
                                    $stmt->execute([$book['id']]);
                                    $chapterCount = (int)$stmt->fetch()['c'];
                                ?>
                                <tr>
                                    <td>
                                        <?php if (!empty($book['thumbnail'])): ?>
                                        <img src="<?= htmlspecialchars($book['thumbnail']) ?>" alt="" style="width:36px;height:48px;object-fit:cover;border-radius:4px;">
                                        <?php else: ?>
                                        <div style="width:36px;height:48px;background:var(--bg-glass-strong);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;color:var(--text-muted);">📘</div>
                                        <?php endif; ?>
                                    </td>
                                    <td>
                                        <div style="font-weight:600;font-size:0.9rem;"><?= htmlspecialchars($book['title']) ?></div>
                                        <?php if (!empty($book['author'])): ?>
                                        <div style="font-size:0.78rem;color:var(--text-muted);">by <?= htmlspecialchars($book['author']) ?></div>
                                        <?php endif; ?>
                                    </td>
                                    <td><span class="status-badge status-pending"><?= htmlspecialchars($book['subject'] ?? '-') ?></span></td>
                                    <td style="font-size:0.85rem;color:var(--text-muted);"><?= htmlspecialchars($book['category_name'] ?? '-') ?></td>
                                    <td style="font-size:0.85rem;color:var(--text-muted);"><?= htmlspecialchars($book['language'] ?? 'English') ?></td>
                                    <td style="font-size:0.85rem;color:var(--text-muted);"><?= $chapterCount ?></td>
                                    <td style="font-size:0.85rem;color:var(--text-muted);"><?= timeAgo($book['created_at']) ?></td>
                                    <td>
                                        <div class="actions">
                                            <button onclick="openBookModal(<?= $book['id'] ?>)" title="Edit">✏️</button>
                                            <button onclick="openChapterManager(<?= $book['id'] ?>)" title="Chapters">📄</button>
                                            <form method="POST" style="display:inline;" onsubmit="return confirm('Delete this book and all its chapters?')">
                                                <input type="hidden" name="action" value="delete_book">
                                                <input type="hidden" name="book_id" value="<?= $book['id'] ?>">
                                                <button type="submit" class="btn-delete" title="Delete">🗑</button>
                                            </form>
                                        </div>
                                    </td>
                                </tr>
                                <?php endforeach; else: ?>
                                <tr><td colspan="8"><div class="table-empty"><div class="empty-icon">📚</div>No books found</div></td></tr>
                                <?php endif; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
                <?php if ($totalPages > 1): ?>
                <div style="display:flex;justify-content:center;gap:8px;padding:16px 24px;border-top:1px solid var(--border-color);">
                    <?php for ($i = 1; $i <= $totalPages; $i++): ?>
                    <a href="/admin/books?p=<?= $i ?>&search=<?= urlencode($search) ?>&category=<?= urlencode($categoryFilter) ?>" class="btn btn-sm <?= $i === $page ? 'btn-primary' : 'btn-ghost' ?>"><?= $i ?></a>
                    <?php endfor; ?>
                </div>
                <?php endif; ?>
            </div>

            <div class="admin-card" id="bookFormCard" style="display:none;">
                <div class="admin-card-header">
                    <div class="admin-card-title" id="bookFormTitle">Add New Book</div>
                    <button class="btn btn-sm btn-ghost" onclick="closeBookModal()">✕ Close</button>
                </div>
                <div class="admin-card-body">
                    <form method="POST" enctype="multipart/form-data" class="admin-form admin-form-wide" onsubmit="return validateBookForm()">
                        <input type="hidden" name="action" id="bookFormAction" value="add_book">
                        <input type="hidden" name="book_id" id="editBookId" value="0">
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
                            <div class="form-group">
                                <label class="form-label">Title *</label>
                                <input class="form-input" name="title" id="bookTitle" required maxlength="255" placeholder="e.g. Mathematics NCERT">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Author</label>
                                <input class="form-input" name="author" id="bookAuthor" placeholder="e.g. NCERT">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Subject</label>
                                <input class="form-input" name="subject" id="bookSubject" placeholder="e.g. Mathematics">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Language</label>
                                <select class="form-select" name="language" id="bookLanguage">
                                    <option value="English">English</option>
                                    <option value="Hindi">Hindi</option>
                                    <option value="Sanskrit">Sanskrit</option>
                                    <option value="Urdu">Urdu</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Category</label>
                                <select class="form-select" name="category_id" id="bookCategory">
                                    <option value="">No Category</option>
                                    <?php foreach ($categories as $cat): ?>
                                    <option value="<?= $cat['id'] ?>"><?= htmlspecialchars($cat['name']) ?></option>
                                    <?php endforeach; ?>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Thumbnail</label>
                                <div class="upload-zone" style="padding:24px;">
                                    <div class="upload-icon">📸</div>
                                    <div class="upload-text">Click or drag image here</div>
                                    <div class="upload-hint">JPG, PNG, WEBP (max 5MB)</div>
                                    <input type="file" name="thumbnail" accept="image/jpeg,image/png,image/gif,image/webp" style="display:none;" onchange="previewThumbnail(this)">
                                </div>
                                <div class="upload-preview" id="thumbnailPreview"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Description</label>
                            <textarea class="form-input" name="description" id="bookDescription" rows="3" placeholder="Brief description of the book..."></textarea>
                        </div>
                        <div class="form-group" style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
                            <input type="checkbox" name="is_chapter_wise" id="isChapterWise" value="1" style="width:auto;">
                            <label for="isChapterWise" style="font-size:0.9rem;">This book has chapters (chapter-wise content)</label>
                        </div>
                        <div style="display:flex;gap:12px;">
                            <button type="submit" class="btn btn-primary" id="bookSubmitBtn">Add Book</button>
                            <button type="button" class="btn btn-ghost" onclick="closeBookModal()">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>

            <div class="admin-card" id="chapterManager" style="display:none;">
                <div class="admin-card-header">
                    <div class="admin-card-title" id="chapterManagerTitle">Manage Chapters</div>
                    <button class="btn btn-sm btn-ghost" onclick="closeChapterManager()">✕ Close</button>
                </div>
                <div class="admin-card-body">
                    <div id="chapterList"></div>
                    <hr style="border:none;border-top:1px solid var(--border-color);margin:20px 0;">
                    <h4 style="font-weight:600;margin-bottom:16px;">Add / Edit Chapter</h4>
                    <form method="POST" enctype="multipart/form-data" class="admin-form admin-form-wide">
                        <input type="hidden" name="action" value="add_chapter">
                        <input type="hidden" name="book_id" id="chapterBookId" value="0">
                        <input type="hidden" name="chapter_id" id="editChapterId" value="0">
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
                            <div class="form-group">
                                <label class="form-label">Chapter Title *</label>
                                <input class="form-input" name="chapter_title" id="chapterTitle" required placeholder="e.g. Real Numbers">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Chapter Number</label>
                                <input class="form-input" name="chapter_number" id="chapterNumber" type="number" min="1" placeholder="1">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Content (HTML / Text)</label>
                            <textarea class="form-input" name="content" id="chapterContent" rows="6" placeholder="Enter chapter content or leave empty to use PDF only..."></textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label">PDF Upload</label>
                            <input type="file" name="chapter_pdf" accept=".pdf" style="padding:8px;">
                            <div style="font-size:0.78rem;color:var(--text-muted);margin-top:4px;">Upload a PDF file for this chapter</div>
                        </div>
                        <div style="display:flex;gap:12px;">
                            <button type="submit" class="btn btn-primary btn-sm">Save Chapter</button>
                            <button type="button" class="btn btn-sm btn-ghost" onclick="resetChapterForm()">Reset</button>
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
const bookData = <?= json_encode($books) ?>;

function openBookModal(id) {
    const card = document.getElementById('bookFormCard');
    card.style.display = 'block';
    card.scrollIntoView({ behavior: 'smooth' });

    if (id) {
        document.getElementById('bookFormTitle').textContent = 'Edit Book';
        document.getElementById('bookFormAction').value = 'edit_book';
        document.getElementById('editBookId').value = id;
        document.getElementById('bookSubmitBtn').textContent = 'Update Book';

        const book = bookData.find(b => b.id == id);
        if (book) {
            document.getElementById('bookTitle').value = book.title || '';
            document.getElementById('bookAuthor').value = book.author || '';
            document.getElementById('bookSubject').value = book.subject || '';
            document.getElementById('bookLanguage').value = book.language || 'English';
            document.getElementById('bookCategory').value = book.category_id || '';
            document.getElementById('bookDescription').value = book.description || '';
            document.getElementById('isChapterWise').checked = book.is_chapter_wise == 1;
        }
    } else {
        document.getElementById('bookFormTitle').textContent = 'Add New Book';
        document.getElementById('bookFormAction').value = 'add_book';
        document.getElementById('editBookId').value = '0';
        document.getElementById('bookSubmitBtn').textContent = 'Add Book';
        document.getElementById('bookForm').reset();
    }
}

function closeBookModal() {
    document.getElementById('bookFormCard').style.display = 'none';
}

function validateBookForm() {
    const title = document.getElementById('bookTitle').value.trim();
    if (!title) {
        window.showToast?.('Please enter a book title', 'error');
        return false;
    }
    return true;
}

function previewThumbnail(input) {
    const preview = document.getElementById('thumbnailPreview');
    preview.innerHTML = '';
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = e => {
            preview.innerHTML = `<div class="upload-preview-item"><img src="${e.target.result}" alt="Preview"><button class="remove" onclick="this.parentElement.remove()">✕</button></div>`;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

async function openChapterManager(bookId) {
    const manager = document.getElementById('chapterManager');
    document.getElementById('chapterBookId').value = bookId;
    document.getElementById('chapterManagerTitle').textContent = `Manage Chapters - Book #${bookId}`;
    manager.style.display = 'block';
    manager.scrollIntoView({ behavior: 'smooth' });

    try {
        const res = await fetch('/api/chapters.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'list', book_id: bookId }) });
        const data = await res.json();
        const list = document.getElementById('chapterList');
        if (data.length > 0) {
            list.innerHTML = data.map(ch => `
                <div class="access-code-card">
                    <div>
                        <div style="font-weight:600;">${ch.chapter_number ? 'Ch ' + ch.chapter_number + ': ' : ''}${ch.title}</div>
                        <div class="access-code-uses">${ch.pdf_path ? '📄 PDF' : '📝 Text'} · ${ch.content ? ch.content.substring(0, 60) + '...' : ''}</div>
                    </div>
                    <div style="display:flex;gap:8px;">
                        <button onclick="editChapter(${ch.id}, '${ch.title.replace(/'/g, "\\'")}', ${ch.chapter_number || 0}, '${(ch.content || '').replace(/'/g, "\\'")}')" class="btn btn-sm btn-ghost">✏️</button>
                        <form method="POST" style="display:inline;" onsubmit="return confirm('Delete this chapter?')">
                            <input type="hidden" name="action" value="delete_chapter">
                            <input type="hidden" name="chapter_id" value="${ch.id}">
                            <button type="submit" class="btn btn-sm btn-ghost" style="color:#ff1744;">🗑</button>
                        </form>
                    </div>
                </div>
            `).join('');
        } else {
            list.innerHTML = '<div class="text-muted" style="text-align:center;padding:20px;">No chapters yet. Add one below.</div>';
        }
    } catch (err) {
        document.getElementById('chapterList').innerHTML = '<div class="text-muted" style="text-align:center;padding:20px;">Failed to load chapters</div>';
    }
}

function closeChapterManager() {
    document.getElementById('chapterManager').style.display = 'none';
}

function editChapter(id, title, number, content) {
    document.getElementById('editChapterId').value = id;
    document.getElementById('chapterTitle').value = title;
    document.getElementById('chapterNumber').value = number || '';
    document.getElementById('chapterContent').value = content;
}

function resetChapterForm() {
    document.getElementById('editChapterId').value = '0';
    document.getElementById('chapterTitle').value = '';
    document.getElementById('chapterNumber').value = '';
    document.getElementById('chapterContent').value = '';
}
</script>
</body>
</html>
