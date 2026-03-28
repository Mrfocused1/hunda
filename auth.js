/**
 * Authentication System
 *
 * Client-side authentication for demo purposes.
 * In production, replace with backend authentication.
 */

/**
 * Authentication System
 *
 * SECURITY NOTICE: This is client-side authentication for demo purposes.
 * In production, use server-side authentication with secure sessions.
 */
const Auth = (function () {
    const STORAGE_PREFIX = '1hundred_';
    const STORAGE_KEY = `${STORAGE_PREFIX}auth_user`;
    const SESSION_KEY = `${STORAGE_PREFIX}session`;
    const USERS_KEY = `${STORAGE_PREFIX}users`;

    // Simple hash function (client-side obfuscation only - NOT secure for production)
    async function hashPassword(password) {
        const encoder = new TextEncoder();
        const salt = '1hundred_' + (typeof window !== 'undefined' ? window.location.hostname : 'salt');
        const data = encoder.encode(password + salt);

        if (typeof crypto !== 'undefined' && crypto.subtle) {
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
        }

        // Fallback for older browsers
        return btoa(password + salt);
    }

    // Demo users with hashed passwords (in production, this would be on the backend)
    let demoUsers = [];

    // Initialize demo users with hashed passwords
    async function initDemoUsers() {
        demoUsers = [
            {
                email: 'demo@1hundredornothing.co.uk',
                password: await hashPassword('password123'),
                firstName: 'Demo',
                lastName: 'User'
            }
        ];
    }
    initDemoUsers();

    // Get stored users from localStorage
    function getStoredUsers() {
        const stored = localStorage.getItem(USERS_KEY);
        if (stored) {
            const users = JSON.parse(stored);
            // Check if users have hashed passwords (migration)
            return users.map((u) => {
                // Detect if password is hashed (64 hex chars for SHA-256) or base64 encoded
                const isHashed =
                    u.password &&
                    (/^[a-f0-9]{64}$/i.test(u.password) || // SHA-256 hex
                        /^[A-Za-z0-9+/]{20,}={0,2}$/.test(u.password)); // Base64 fallback

                return {
                    ...u,
                    password: u.password || '', // Ensure password field exists
                    _needsPasswordMigration: !isHashed && u.password && u.password.length > 0
                };
            });
        }
        return [...demoUsers];
    }

    // Save users to localStorage
    function saveUsers(users) {
        try {
            localStorage.setItem(USERS_KEY, JSON.stringify(users));
        } catch (e) {
            debugError('Failed to save users:', e);
        }
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
        // Clear CSRF token on logout
        sessionStorage.removeItem('csrf_token');
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
         * @returns {Promise<Object>} { success: boolean, message: string }
         */
        login: async function (email, password, rememberMe = false) {
            // Rate limiting
            if (typeof Security !== 'undefined') {
                const rateCheck = Security.checkRateLimit('login', 5, 60000);
                if (!rateCheck.allowed) {
                    return {
                        success: false,
                        message: `Too many attempts. Please wait ${rateCheck.waitTime} seconds.`
                    };
                }
            }

            const users = getStoredUsers();
            const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

            if (!user) {
                return { success: false, message: 'Invalid email or password' };
            }

            // Handle plain text password migration
            let passwordValid = false;

            if (user._needsPasswordMigration) {
                // Check plain text password
                if (user.password === password) {
                    passwordValid = true;
                    // Migrate to hashed password
                    user.password = await hashPassword(password);
                    delete user._needsPasswordMigration;
                    saveUsers(users);
                }
            } else {
                // Normal hashed password comparison
                const hashedPassword = await hashPassword(password);
                if (user.password === hashedPassword) {
                    passwordValid = true;
                }
            }

            if (!passwordValid) {
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
         * @returns {Promise<Object>} { success: boolean, message: string }
         */
        register: async function (userData) {
            // Rate limiting
            if (typeof Security !== 'undefined') {
                const rateCheck = Security.checkRateLimit('register', 3, 300000);
                if (!rateCheck.allowed) {
                    return {
                        success: false,
                        message: `Too many attempts. Please wait ${rateCheck.waitTime} seconds.`
                    };
                }
            }

            const users = getStoredUsers();

            // Check if email already exists
            if (users.some((u) => u.email.toLowerCase() === userData.email.toLowerCase())) {
                return { success: false, message: 'An account with this email already exists' };
            }

            // Hash password before storing
            const hashedPassword = await hashPassword(userData.password);

            // Add new user
            users.push({
                email: userData.email,
                password: hashedPassword,
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
         * Update user profile
         * @param {Object} updates
         * @returns {Object}
         */
        updateProfile: function (updates) {
            const currentUser = getCurrentUser();
            if (!currentUser) {
                return { success: false, message: 'Not logged in' };
            }

            const users = getStoredUsers();
            const userIndex = users.findIndex((u) => u.email === currentUser.email);

            if (userIndex === -1) {
                return { success: false, message: 'User not found' };
            }

            // Update user data
            users[userIndex] = {
                ...users[userIndex],
                firstName: updates.firstName || users[userIndex].firstName,
                lastName: updates.lastName || users[userIndex].lastName,
                phone: updates.phone || users[userIndex].phone
            };

            saveUsers(users);

            // Update current session
            setCurrentUser(users[userIndex], localStorage.getItem(STORAGE_KEY) !== null);

            return { success: true, message: 'Profile updated' };
        },

        /**
         * Change password
         * @param {string} currentPassword
         * @param {string} newPassword
         * @returns {Promise<Object>}
         */
        changePassword: async function (currentPassword, newPassword) {
            const currentUser = getCurrentUser();
            if (!currentUser) {
                return { success: false, message: 'Not logged in' };
            }

            const users = getStoredUsers();
            const userIndex = users.findIndex((u) => u.email === currentUser.email);

            if (userIndex === -1) {
                return { success: false, message: 'User not found' };
            }

            // Verify current password
            const hashedCurrentPassword = await hashPassword(currentPassword);
            if (users[userIndex].password !== hashedCurrentPassword) {
                return { success: false, message: 'Current password is incorrect' };
            }

            // Update to new hashed password
            users[userIndex].password = await hashPassword(newPassword);
            saveUsers(users);

            return { success: true, message: 'Password changed successfully' };
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
                if (isLoggedIn) {
                    link.href = '/account';
                    if (link.querySelector('.mobile-label')) {
                        link.querySelector('.mobile-label').textContent = 'Account';
                    }
                } else {
                    link.href = '/login';
                    if (link.querySelector('.mobile-label')) {
                        link.querySelector('.mobile-label').textContent = 'Login';
                    }
                }
            });

            // Update user name displays
            const userNameElements = document.querySelectorAll('.user-name');
            userNameElements.forEach((el) => {
                el.textContent = isLoggedIn ? user.firstName || 'Member' : 'Guest';
            });

            // Show/hide logged-in only elements
            document.querySelectorAll('.logged-in-only').forEach((el) => {
                el.style.display = isLoggedIn ? '' : 'none';
            });

            document.querySelectorAll('.logged-out-only').forEach((el) => {
                el.style.display = isLoggedIn ? 'none' : '';
            });
        }
    };
})();

// Auto-update UI on load
document.addEventListener('DOMContentLoaded', () => {
    Auth.updateUI();
});
