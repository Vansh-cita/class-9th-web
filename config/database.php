<?php
class Database {
    private static $instance = null;
    private $conn;
    private $dbPath;

    private function __construct() {
        $this->dbPath = getenv('DB_PATH') ?: __DIR__ . '/../database/database.db';
        $this->connect();
        $this->initialize();
    }

    private function connect() {
        try {
            $dir = dirname($this->dbPath);
            if (!is_dir($dir)) {
                mkdir($dir, 0755, true);
            }
            $exists = file_exists($this->dbPath);
            $this->conn = new PDO(
                "sqlite:{$this->dbPath}",
                null,
                null,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]
            );
            $this->conn->exec('PRAGMA journal_mode=WAL');
            $this->conn->exec('PRAGMA foreign_keys=ON');
            $this->conn->exec('PRAGMA busy_timeout=5000');
        } catch (PDOException $e) {
            die(json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]));
        }
    }

    private function initialize() {
        $stmt = $this->conn->query("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
        if ($stmt->fetch()) {
            return;
        }

        $this->conn->exec('
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                role_number TEXT NOT NULL,
                school_name TEXT NOT NULL,
                user_id TEXT DEFAULT NULL UNIQUE,
                role TEXT DEFAULT "student" CHECK(role IN ("student","admin")),
                avatar TEXT DEFAULT "default.png",
                theme TEXT DEFAULT "dark",
                reading_font TEXT DEFAULT "Outfit",
                reading_font_size INTEGER DEFAULT 18,
                created_at TEXT DEFAULT (datetime("now")),
                updated_at TEXT DEFAULT (datetime("now"))
            )
        ');

        $this->conn->exec('
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                slug TEXT NOT NULL UNIQUE,
                description TEXT,
                icon TEXT DEFAULT "book",
                created_at TEXT DEFAULT (datetime("now"))
            )
        ');

        $this->conn->exec('
            CREATE TABLE IF NOT EXISTS books (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                slug TEXT NOT NULL UNIQUE,
                description TEXT,
                subject TEXT,
                language TEXT DEFAULT "English",
                category_id INTEGER,
                thumbnail TEXT DEFAULT "default-book.png",
                author TEXT DEFAULT "NCERT",
                is_chapter_wise INTEGER DEFAULT 0,
                page_count INTEGER DEFAULT 0,
                created_at TEXT DEFAULT (datetime("now")),
                updated_at TEXT DEFAULT (datetime("now")),
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
            )
        ');

        $this->conn->exec('
            CREATE TABLE IF NOT EXISTS chapters (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                book_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                chapter_number INTEGER NOT NULL,
                pdf_file TEXT DEFAULT NULL,
                file_path TEXT DEFAULT NULL,
                page_number INTEGER DEFAULT 0,
                page_count INTEGER DEFAULT 0,
                content TEXT,
                created_at TEXT DEFAULT (datetime("now")),
                FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
            )
        ');

        $this->conn->exec('
            CREATE TABLE IF NOT EXISTS uploads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                book_id INTEGER DEFAULT NULL,
                filename TEXT NOT NULL,
                original_name TEXT DEFAULT NULL,
                file_path TEXT NOT NULL,
                file_type TEXT NOT NULL,
                file_size INTEGER DEFAULT 0,
                created_at TEXT DEFAULT (datetime("now")),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE SET NULL
            )
        ');

        $this->conn->exec('
            CREATE TABLE IF NOT EXISTS bookmarks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                book_id INTEGER NOT NULL,
                chapter_id INTEGER DEFAULT NULL,
                page INTEGER DEFAULT 1,
                note TEXT,
                created_at TEXT DEFAULT (datetime("now")),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
                FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE SET NULL,
                UNIQUE (user_id, book_id, chapter_id, page)
            )
        ');

        $this->conn->exec('
            CREATE TABLE IF NOT EXISTS reading_progress (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                book_id INTEGER NOT NULL,
                chapter_id INTEGER DEFAULT NULL,
                last_page INTEGER DEFAULT 1,
                total_pages INTEGER DEFAULT 0,
                progress_percent REAL DEFAULT 0.00,
                last_read_at TEXT DEFAULT (datetime("now")),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
                FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE SET NULL,
                UNIQUE (user_id, book_id)
            )
        ');

        $this->conn->exec('
            CREATE TABLE IF NOT EXISTS announcements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                type TEXT DEFAULT "general" CHECK(type IN ("general","academic","exam","event")),
                is_pinned INTEGER DEFAULT 0,
                created_by INTEGER DEFAULT NULL,
                created_at TEXT DEFAULT (datetime("now")),
                updated_at TEXT DEFAULT (datetime("now")),
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
            )
        ');

        $this->conn->exec('
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                message TEXT,
                type TEXT DEFAULT "info",
                is_read INTEGER DEFAULT 0,
                created_at TEXT DEFAULT (datetime("now")),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        ');

        $this->conn->exec('
            CREATE TABLE IF NOT EXISTS hidden_pages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                slug TEXT NOT NULL UNIQUE,
                description TEXT,
                content TEXT,
                access_code TEXT NOT NULL,
                is_active INTEGER DEFAULT 0,
                created_by INTEGER DEFAULT NULL,
                created_at TEXT DEFAULT (datetime("now")),
                updated_at TEXT DEFAULT (datetime("now")),
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
            )
        ');

        $this->conn->exec('
            CREATE TABLE IF NOT EXISTS hidden_page_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                page_id INTEGER NOT NULL,
                item_type TEXT NOT NULL CHECK(item_type IN ("book","note","assignment","pdf")),
                item_id INTEGER DEFAULT NULL,
                title TEXT NOT NULL,
                description TEXT,
                file_path TEXT DEFAULT NULL,
                created_at TEXT DEFAULT (datetime("now")),
                FOREIGN KEY (page_id) REFERENCES hidden_pages(id) ON DELETE CASCADE
            )
        ');

        $this->conn->exec('
            CREATE TABLE IF NOT EXISTS access_codes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT NOT NULL,
                page_id INTEGER NOT NULL,
                used_by INTEGER DEFAULT NULL,
                is_active INTEGER DEFAULT 1,
                used_at TEXT DEFAULT NULL,
                created_at TEXT DEFAULT (datetime("now")),
                FOREIGN KEY (page_id) REFERENCES hidden_pages(id) ON DELETE CASCADE,
                FOREIGN KEY (used_by) REFERENCES users(id) ON DELETE SET NULL
            )
        ');

        $this->conn->exec('
            CREATE TABLE IF NOT EXISTS user_access (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                page_id INTEGER NOT NULL,
                granted_at TEXT DEFAULT (datetime("now")),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (page_id) REFERENCES hidden_pages(id) ON DELETE CASCADE,
                UNIQUE (user_id, page_id)
            )
        ');

        $this->conn->exec('
            CREATE TABLE IF NOT EXISTS logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER DEFAULT NULL,
                action TEXT NOT NULL,
                details TEXT,
                ip_address TEXT DEFAULT NULL,
                user_agent TEXT,
                created_at TEXT DEFAULT (datetime("now")),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        ');

        $this->conn->exec('
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                setting_key TEXT NOT NULL UNIQUE,
                setting_value TEXT,
                updated_at TEXT DEFAULT (datetime("now"))
            )
        ');

        $this->conn->exec("
            INSERT INTO settings (setting_key, setting_value) VALUES
                ('site_name', 'Class 9 Learning Portal'),
                ('site_tagline', 'Your Gateway to CBSE Excellence'),
                ('site_description', 'Premium learning portal for CBSE Class 9 students'),
                ('footer_text', '© 2026 Class 9 Learning Portal. All rights reserved.'),
                ('logo_text', 'Class 9'),
                ('contact_email', 'admin@class9learning.com'),
                ('enable_registration', '1'),
                ('maintenance_mode', '0'),
                ('default_theme', 'dark'),
                ('primary_color', '#FF0F7B'),
                ('background_color', '#050505'),
                ('font_family', 'Outfit, sans-serif')
        ");

        $hash = password_hash('#3795@lgvns', PASSWORD_DEFAULT);
        $stmt = $this->conn->prepare("INSERT INTO users (username, password, role_number, school_name, user_id, role) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute(['Admin', $hash, 'ADMIN001', 'Learning Portal', '#3795@lgvns', 'admin']);

        $this->conn->exec('CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id)');
        $this->conn->exec('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');
        $this->conn->exec('CREATE INDEX IF NOT EXISTS idx_books_category ON books(category_id)');
        $this->conn->exec('CREATE INDEX IF NOT EXISTS idx_books_subject ON books(subject)');
        $this->conn->exec('CREATE INDEX IF NOT EXISTS idx_chapters_book ON chapters(book_id)');
        $this->conn->exec('CREATE INDEX IF NOT EXISTS idx_chapters_num ON chapters(book_id, chapter_number)');
        $this->conn->exec('CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read)');
        $this->conn->exec('CREATE INDEX IF NOT EXISTS idx_logs_user ON logs(user_id)');
        $this->conn->exec('CREATE INDEX IF NOT EXISTS idx_logs_action ON logs(action)');
        $this->conn->exec('CREATE INDEX IF NOT EXISTS idx_logs_created ON logs(created_at)');
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection() {
        return $this->conn;
    }

    public function prepare($sql) {
        return $this->conn->prepare($sql);
    }

    public function lastInsertId() {
        return $this->conn->lastInsertId();
    }
}
