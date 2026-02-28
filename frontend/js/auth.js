// User Authentication System
class AuthManager {
    constructor() {
        this.apiBaseUrl = 'http://localhost/api';
        this.currentUser = null;
        this.token = localStorage.getItem('omekan_token');
        this.init();
    }

    init() {
        this.checkAuthStatus();
        this.setupAuthUI();
        this.setupEventListeners();
    }

    async checkAuthStatus() {
        if (this.token) {
            try {
                const response = await fetch(`${this.apiBaseUrl}/auth/verify`, {
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.currentUser = data.user;
                    this.updateAuthUI(true);
                } else {
                    this.logout();
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                this.logout();
            }
        }
    }

    setupAuthUI() {
        // Add auth modal to page
        const authModalHTML = `
            <div id="auth-modal" class="auth-modal" style="display: none;">
                <div class="modal-backdrop" onclick="authManager.closeAuthModal()"></div>
                <div class="auth-container">
                    <div class="auth-header">
                        <h2 id="auth-title">Anmelden</h2>
                        <button class="auth-close" onclick="authManager.closeAuthModal()">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    
                    <div class="auth-tabs">
                        <button class="auth-tab active" data-tab="login">Anmelden</button>
                        <button class="auth-tab" data-tab="register">Registrieren</button>
                    </div>

                    <form id="auth-form" class="auth-form">
                        <div id="login-fields">
                            <div class="form-group">
                                <label for="login-email">E-Mail</label>
                                <input type="email" id="login-email" name="email" required>
                            </div>
                            <div class="form-group">
                                <label for="login-password">Passwort</label>
                                <input type="password" id="login-password" name="password" required>
                            </div>
                        </div>

                        <div id="register-fields" style="display: none;">
                            <div class="form-group">
                                <label for="register-name">Name</label>
                                <input type="text" id="register-name" name="name" required>
                            </div>
                            <div class="form-group">
                                <label for="register-email">E-Mail</label>
                                <input type="email" id="register-email" name="email" required>
                            </div>
                            <div class="form-group">
                                <label for="register-password">Passwort</label>
                                <input type="password" id="register-password" name="password" required minlength="6">
                            </div>
                            <div class="form-group">
                                <label for="register-password-confirm">Passwort bestätigen</label>
                                <input type="password" id="register-password-confirm" name="password_confirm" required>
                            </div>
                        </div>

                        <button type="submit" class="auth-submit" id="auth-submit-btn">
                            Anmelden
                        </button>

                        <div class="auth-divider">
                            <span>oder</span>
                        </div>

                        <div class="social-auth">
                            <button type="button" class="social-btn google-btn" onclick="authManager.socialLogin('google')">
                                <svg width="20" height="20" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                                Mit Google anmelden
                            </button>
                        </div>

                        <div class="auth-links">
                            <a href="#" onclick="authManager.showForgotPassword()">Passwort vergessen?</a>
                        </div>
                    </form>

                    <div id="auth-loading" class="auth-loading" style="display: none;">
                        <div class="loading-spinner"></div>
                        <p>Wird verarbeitet...</p>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', authModalHTML);

        // Add user menu to navigation
        this.addUserMenuToNav();
    }

    addUserMenuToNav() {
        const navs = document.querySelectorAll('nav, .nav-links');
        navs.forEach(nav => {
            const userMenuHTML = `
                <div class="user-menu" id="user-menu" style="display: none;">
                    <div class="user-avatar">
                        <img id="user-avatar" src="/frontend/images/default-avatar.svg" alt="User">
                    </div>
                    <div class="user-dropdown">
                        <div class="user-info">
                            <div class="user-name" id="user-name">Benutzer</div>
                            <div class="user-email" id="user-email">user@example.com</div>
                        </div>
                        <div class="dropdown-divider"></div>
                        <a href="#" class="dropdown-item" onclick="authManager.showProfile()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            Profil
                        </a>
                        <a href="#" class="dropdown-item" onclick="authManager.showFavorites()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                            Favoriten
                        </a>
                        <div class="dropdown-divider"></div>
                        <a href="#" class="dropdown-item" onclick="authManager.logout()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                <polyline points="16,17 21,12 16,7"></polyline>
                                <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                            Abmelden
                        </a>
                    </div>
                </div>
                <button class="auth-login-btn" id="auth-login-btn" onclick="authManager.openAuthModal('login')">
                    Anmelden
                </button>
            `;
            nav.insertAdjacentHTML('beforeend', userMenuHTML);
        });
    }

    setupEventListeners() {
        // Auth form submission
        const authForm = document.getElementById('auth-form');
        if (authForm) {
            authForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAuthSubmit();
            });
        }

        // Tab switching
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabType = e.target.dataset.tab;
                this.switchAuthTab(tabType);
            });
        });

        // User menu toggle
        const userMenu = document.getElementById('user-menu');
        if (userMenu) {
            userMenu.addEventListener('click', (e) => {
                e.stopPropagation();
                userMenu.querySelector('.user-dropdown').classList.toggle('show');
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            const dropdown = document.querySelector('.user-dropdown.show');
            if (dropdown) {
                dropdown.classList.remove('show');
            }
        });
    }

    openAuthModal(mode = 'login') {
        const modal = document.getElementById('auth-modal');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        this.switchAuthTab(mode);
    }

    closeAuthModal() {
        const modal = document.getElementById('auth-modal');
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }

    switchAuthTab(tabType) {
        // Update tabs
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabType);
        });

        // Update form fields
        const loginFields = document.getElementById('login-fields');
        const registerFields = document.getElementById('register-fields');
        const authTitle = document.getElementById('auth-title');
        const submitBtn = document.getElementById('auth-submit-btn');

        if (tabType === 'register') {
            loginFields.style.display = 'none';
            registerFields.style.display = 'block';
            authTitle.textContent = 'Registrieren';
            submitBtn.textContent = 'Registrieren';
        } else {
            loginFields.style.display = 'block';
            registerFields.style.display = 'none';
            authTitle.textContent = 'Anmelden';
            submitBtn.textContent = 'Anmelden';
        }
    }

    async handleAuthSubmit() {
        const form = document.getElementById('auth-form');
        const formData = new FormData(form);
        const isRegister = document.querySelector('.auth-tab.active').dataset.tab === 'register';

        // Show loading
        this.showAuthLoading(true);

        try {
            const endpoint = isRegister ? '/auth/register' : '/auth/login';
            const data = Object.fromEntries(formData);

            // Validate passwords match for registration
            if (isRegister && data.password !== data.password_confirm) {
                throw new Error('Passwörter stimmen nicht überein');
            }

            const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                if (isRegister) {
                    this.showToast('Registrierung erfolgreich! Bitte melden Sie sich an.', 'success');
                    this.switchAuthTab('login');
                } else {
                    this.token = result.token;
                    this.currentUser = result.user;
                    localStorage.setItem('omekan_token', this.token);
                    this.updateAuthUI(true);
                    this.closeAuthModal();
                    this.showToast('Erfolgreich angemeldet!', 'success');
                }
            } else {
                throw new Error(result.message || 'Authentifizierung fehlgeschlagen');
            }
        } catch (error) {
            console.error('Auth error:', error);
            this.showToast(error.message, 'error');
        } finally {
            this.showAuthLoading(false);
        }
    }

    async socialLogin(provider) {
        // Simulate social login - would integrate with actual OAuth providers
        this.showToast('Social Login wird implementiert...', 'info');
    }

    logout() {
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('omekan_token');
        this.updateAuthUI(false);
        this.showToast('Erfolgreich abgemeldet', 'success');
    }

    updateAuthUI(isLoggedIn) {
        const userMenu = document.getElementById('user-menu');
        const loginBtn = document.getElementById('auth-login-btn');

        if (isLoggedIn && this.currentUser) {
            userMenu.style.display = 'flex';
            loginBtn.style.display = 'none';
            
            // Update user info
            document.getElementById('user-name').textContent = this.currentUser.name || 'Benutzer';
            document.getElementById('user-email').textContent = this.currentUser.email || '';
        } else {
            userMenu.style.display = 'none';
            loginBtn.style.display = 'block';
        }
    }

    showAuthLoading(show) {
        const form = document.getElementById('auth-form');
        const loading = document.getElementById('auth-loading');
        
        if (show) {
            form.style.display = 'none';
            loading.style.display = 'flex';
        } else {
            form.style.display = 'block';
            loading.style.display = 'none';
        }
    }

    showForgotPassword() {
        this.showToast('Passwort-Reset wird implementiert...', 'info');
    }

    showProfile() {
        this.showToast('Profil-Seite wird implementiert...', 'info');
    }

    showFavorites() {
        // Show user's favorite events
        const favorites = JSON.parse(localStorage.getItem('omekan_favorites') || '[]');
        if (favorites.length === 0) {
            this.showToast('Keine Favoriten vorhanden', 'info');
        } else {
            this.showToast(`${favorites.length} Favoriten gefunden`, 'success');
            // Could open a favorites modal or redirect to favorites page
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }

    // API helper with auth headers
    async apiRequest(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers.Authorization = `Bearer ${this.token}`;
        }

        return fetch(`${this.apiBaseUrl}${endpoint}`, {
            ...options,
            headers
        });
    }
}

// Initialize auth manager
let authManager;
document.addEventListener('DOMContentLoaded', () => {
    authManager = new AuthManager();
});

// Export for global access
window.authManager = authManager;
