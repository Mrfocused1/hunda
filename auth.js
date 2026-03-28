/**
 * Authentication System
 *
 * Client-side authentication for demo purposes.
 * In production, replace with backend authentication.
 */

const Auth = (function () {
    const STORAGE_KEY = '1hundred_auth_user';
    const SESSION_KEY = '1hundred_session';

    // Demo users (in production, this would be on the backend)
    const demoUsers = [
        {
            email: 'demo@1hundredornothing.co.uk',
            password: 'password123',
            firstName: 'Demo',
            lastName: 'User'
        }
    ];

    // Get stored users from localStorage
    function getStoredUsers() {
        const stored = localStorage.getItem('1hundred_users');
        return stored ? JSON.parse(stored) : [...demoUsers];
    }

    // Save users to localStorage
    function saveUsers(users) {
        localStorage.setItem('1hundred_users', JSON.stringify(users));
    }

    // Get current user
    function getCurrentUser() {
        const stored = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
    }

    // Set current user
    function setCurrentUser(user, remember = false) {
        const userData = {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            loggedInAt: new Date().toISOString()
        };

        if (remember) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
        } else {
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(userData));
        }
    }

    // Clear current user
    function clearCurrentUser() {
        sessionStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(STORAGE_KEY);
    }

    // Public API
    return {
        /**
         * Check if user is logged in
         * @returns {boolean}
         */
        isLoggedIn: function () {
            return getCurrentUser() !== null;
        },

        /**
         * Get current user info
         * @returns {Object|null}
         */
        getUser: function () {
            return getCurrentUser();
        },

        /**
         * Login user
         * @param {string} email
         * @param {string} password
         * @param {boolean} rememberMe
         * @returns {Object} { success: boolean, message: string }
         */
        login: function (email, password, rememberMe = false) {
            const users = getStoredUsers();
            const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

            if (!user) {
                return { success: false, message: 'Invalid email or password' };
            }

            if (user.password !== password) {
                return { success: false, message: 'Invalid email or password' };
            }

            setCurrentUser(user, rememberMe);

            // Dispatch auth change event
            window.dispatchEvent(
                new CustomEvent('authchange', {
                    detail: { loggedIn: true, user: getCurrentUser() }
                })
            );

            return { success: true, message: 'Login successful' };
        },

        /**
         * Register new user
         * @param {Object} userData
         * @returns {Object} { success: boolean, message: string }
         */
        register: function (userData) {
            const users = getStoredUsers();

            // Check if email already exists
            if (users.some((u) => u.email.toLowerCase() === userData.email.toLowerCase())) {
                return { success: false, message: 'An account with this email already exists' };
            }

            // Add new user
            users.push({
                email: userData.email,
                password: userData.password,
                firstName: userData.firstName,
                lastName: userData.lastName
            });

            saveUsers(users);

            // Auto-login after registration
            setCurrentUser(userData, false);

            // Dispatch auth change event
            window.dispatchEvent(
                new CustomEvent('authchange', {
                    detail: { loggedIn: true, user: getCurrentUser() }
                })
            );

            return { success: true, message: 'Account created successfully' };
        },

        /**
         * Logout user
         */
        logout: function () {
            clearCurrentUser();

            // Dispatch auth change event
            window.dispatchEvent(
                new CustomEvent('authchange', {
                    detail: { loggedIn: false, user: null }
                })
            );

            return { success: true, message: 'Logged out successfully' };
        },

        /**
         * Require authentication (redirect if not logged in)
         * @param {string} redirectUrl - URL to redirect back to after login
         */
        requireAuth: function (redirectUrl = window.location.pathname) {
            if (!this.isLoggedIn()) {
                window.location.href = `/login?redirect=${encodeURIComponent(redirectUrl)}`;
                return false;
            }
            return true;
        },

        /**
         * Update UI based on auth state
         * Call this on page load
         */
        updateUI: function () {
            const user = getCurrentUser();
            const isLoggedIn = user !== null;

            // Update account links
            const accountLinks = document.querySelectorAll('a[href="/account"], a[href="/login"]');
            accountLinks.forEach((link) => {
                if (link.closest('#mobile-menu')) {
                    // Mobile menu link
                    if (isLoggedIn) {
                        link.href = '/account';
                        const span = link.querySelector('span');
                        if (span) span.textContent = 'My Account';
                    } else {
                        link.href = '/login';
                        const span = link.querySelector('span');
                        if (span) span.textContent = 'Sign In';
                    }
                }
            });

            // Update header account icon
            const headerAccountIcons = document.querySelectorAll(
                '#main-header .header-action[aria-label="Sign In"], #main-header .header-action[aria-label="Account"]'
            );
            headerAccountIcons.forEach((icon) => {
                if (isLoggedIn) {
                    icon.href = '/account';
                    icon.setAttribute('aria-label', 'Account');
                } else {
                    icon.href = '/login';
                    icon.setAttribute('aria-label', 'Sign In');
                }
            });
        }
    };
})();

// Auto-update UI on page load
document.addEventListener('DOMContentLoaded', function () {
    Auth.updateUI();
});
