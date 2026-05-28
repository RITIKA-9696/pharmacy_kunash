/**
 * auth.js - Client-side session management for PharmaCare Admin Portal
 * Uses localStorage with 24-hour expiration (no JWT)
 */

const AUTH_KEY = 'adminSession'; // Key used in localStorage

/**
 * Save session after successful login
 * @param {Object} admin - Admin object returned from backend
 */
function setSession(admin) {
    const sessionData = {
        admin: admin,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(sessionData));
}

/**
 * Get current session (if valid)
 * @returns {Object|null} Session object with admin data or null if not logged in / expired
 */
function getSession() {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;

    try {
        const session = JSON.parse(raw);
        
        // Check if session has expired
        if (Date.now() > session.expiresAt) {
            logout(); // Clean up expired session
            return null;
        }

        return session;
    } catch (e) {
        console.error("Invalid session data:", e);
        logout();
        return null;
    }
}

/**
 * Check if user is currently authenticated
 * @returns {boolean}
 */
function isAuthenticated() {
    return getSession() !== null;
}

/**
 * Get the currently logged-in admin data
 * @returns {Object|null}
 */
function getCurrentAdmin() {
    const session = getSession();
    return session ? session.admin : null;
}

/**
 * Logout - clear session and redirect to login
 */
function logout() {
    localStorage.removeItem(AUTH_KEY);
    // Optional: you can also remove old keys if they exist
    localStorage.removeItem('admin');
    localStorage.removeItem('isLoggedIn');

    window.location.href = '/Login/login.html'; // Adjust path if needed
}

/**
 * Protect page - redirect to login if not authenticated
 * Call this at the top of every protected page
 */
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/Login/login.html'; // Adjust path as needed
        return false;
    }
    return true;
}

/**
 * Optional: Auto logout when session expires (checks every minute)
 */
function startSessionTimer() {
    setInterval(() => {
        if (localStorage.getItem(AUTH_KEY)) {
            const session = getSession();
            if (!session) {
                alert("Your session has expired. Please log in again.");
                logout();
            }
        }
    }, 60 * 1000); // Check every minute
}

// Export for use in other scripts (if using modules) or attach to window
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        setSession,
        getSession,
        isAuthenticated,
        getCurrentAdmin,
        logout,
        requireAuth,
        startSessionTimer
    };
} else {
    window.Auth = {
        setSession,
        getSession,
        isAuthenticated,
        getCurrentAdmin,
        logout,
        requireAuth,
        startSessionTimer
    };
}