<?php
@session_start();
require_once __DIR__ . '/../includes/functions.php';

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$_POST = array_merge($_POST, $input);

$db = getDB();
$action = $_REQUEST['action'] ?? $input['action'] ?? '';

switch ($action) {
    case 'login':
        $username = trim($_POST['username'] ?? '');
        $password = $_POST['password'] ?? '';

        if (empty($username) || empty($password)) {
            jsonResponse(['error' => 'Username and password are required'], 400);
        }

        $stmt = $db->prepare("SELECT * FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password'])) {
            jsonResponse(['error' => 'Invalid username or password'], 401);
        }

        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['role'] = $user['role'];
        $_SESSION['user_id_field'] = $user['user_id'];

        logActivity($user['id'], 'login', 'User logged in');

        $redirect = ($user['user_id'] === '#3795@lgvns') ? '/admin/dashboard' : '/dashboard';

        jsonResponse([
            'success' => true,
            'message' => 'Login successful',
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'role' => $user['role'],
                'user_id' => $user['user_id'],
                'avatar' => $user['avatar'],
                'school_name' => $user['school_name']
            ],
            'redirect' => $redirect
        ]);

    case 'register':
        $username = trim($_POST['username'] ?? '');
        $password = $_POST['password'] ?? '';
        $role_number = trim($_POST['role_number'] ?? '');
        $school_name = trim($_POST['school_name'] ?? '');
        $user_id = trim($_POST['user_id'] ?? '');

        $rules = ['username' => 'required', 'password' => 'required|min:6', 'role_number' => 'required', 'school_name' => 'required'];
        $errors = validateInput($_POST, $rules);
        if (!empty($errors)) {
            jsonResponse(['error' => 'Validation failed', 'errors' => $errors], 400);
        }

        $stmt = $db->prepare("SELECT id FROM users WHERE username = ?");
        $stmt->execute([$username]);
        if ($stmt->fetch()) {
            jsonResponse(['error' => 'Username already taken'], 409);
        }

        if (!empty($user_id)) {
            $stmt = $db->prepare("SELECT id FROM users WHERE user_id = ?");
            $stmt->execute([$user_id]);
            if ($stmt->fetch()) {
                jsonResponse(['error' => 'User ID already taken'], 409);
            }
        }

        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $role = ($user_id === '#3795@lgvns') ? 'admin' : 'student';

        $stmt = $db->prepare("INSERT INTO users (username, password, role_number, school_name, user_id, role) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$username, $hashedPassword, $role_number, $school_name, $user_id ?: null, $role]);

        $userId = $db->lastInsertId();
        logActivity($userId, 'register', 'New user registered');

        jsonResponse(['success' => true, 'message' => 'Registration successful'], 201);

    case 'logout':
        session_destroy();
        jsonResponse(['success' => true, 'message' => 'Logged out successfully']);

    case 'check':
        if (isset($_SESSION['user_id'])) {
            $user = getCurrentUser();
            if ($user) {
                jsonResponse(['logged_in' => true, 'user' => $user]);
            }
        }
        jsonResponse(['logged_in' => false, 'user' => null]);

    case 'update_profile':
        if (!isset($_SESSION['user_id'])) {
            jsonResponse(['error' => 'Not authenticated'], 401);
        }

        $username = trim($_POST['username'] ?? '');
        $school_name = trim($_POST['school_name'] ?? '');

        if (empty($username)) {
            jsonResponse(['error' => 'Username is required'], 400);
        }

        $stmt = $db->prepare("SELECT id FROM users WHERE username = ? AND id != ?");
        $stmt->execute([$username, $_SESSION['user_id']]);
        if ($stmt->fetch()) {
            jsonResponse(['error' => 'Username already taken'], 409);
        }

        $stmt = $db->prepare("UPDATE users SET username = ?, school_name = ? WHERE id = ?");
        $stmt->execute([$username, $school_name, $_SESSION['user_id']]);

        $_SESSION['username'] = $username;
        logActivity($_SESSION['user_id'], 'update_profile', 'Profile updated');

        jsonResponse(['success' => true, 'message' => 'Profile updated']);

    case 'change_password':
        if (!isset($_SESSION['user_id'])) {
            jsonResponse(['error' => 'Not authenticated'], 401);
        }

        $oldPassword = $_POST['old_password'] ?? '';
        $newPassword = $_POST['new_password'] ?? '';

        if (empty($oldPassword) || empty($newPassword)) {
            jsonResponse(['error' => 'Both old and new passwords are required'], 400);
        }

        if (strlen($newPassword) < 6) {
            jsonResponse(['error' => 'New password must be at least 6 characters'], 400);
        }

        $stmt = $db->prepare("SELECT password FROM users WHERE id = ?");
        $stmt->execute([$_SESSION['user_id']]);
        $user = $stmt->fetch();

        if (!password_verify($oldPassword, $user['password'])) {
            jsonResponse(['error' => 'Current password is incorrect'], 403);
        }

        $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
        $stmt = $db->prepare("UPDATE users SET password = ? WHERE id = ?");
        $stmt->execute([$hashedPassword, $_SESSION['user_id']]);

        logActivity($_SESSION['user_id'], 'change_password', 'Password changed');

        jsonResponse(['success' => true, 'message' => 'Password changed successfully']);

    case 'update_settings':
        if (!isset($_SESSION['user_id'])) {
            jsonResponse(['error' => 'Not authenticated'], 401);
        }

        $theme = $_POST['theme'] ?? 'dark';
        $fontFamily = $_POST['font_family'] ?? 'Outfit';
        $fontSize = (int)($_POST['font_size'] ?? 18);
        $notifyReading = isset($_POST['notify_reading']) ? (int)$_POST['notify_reading'] : 1;
        $notifyBookmarks = isset($_POST['notify_bookmarks']) ? (int)$_POST['notify_bookmarks'] : 1;
        $notifyAnnouncements = isset($_POST['notify_announcements']) ? (int)$_POST['notify_announcements'] : 1;

        $stmt = $db->prepare("UPDATE users SET theme = ?, reading_font = ?, reading_font_size = ? WHERE id = ?");
        $stmt->execute([$theme, $fontFamily, $fontSize, $_SESSION['user_id']]);

        logActivity($_SESSION['user_id'], 'update_settings', 'User settings updated');

        jsonResponse(['success' => true, 'message' => 'Settings updated']);

    default:
        jsonResponse(['error' => 'Invalid action'], 400);
}
