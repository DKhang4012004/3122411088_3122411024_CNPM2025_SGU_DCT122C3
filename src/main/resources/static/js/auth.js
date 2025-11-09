// Authentication Manager
// Note: STORAGE_KEYS is defined in config.js which loads first
class AuthManager {
    constructor() {
        this.token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        this.user = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || 'null');
    }

    isAuthenticated() {
        return !!this.token;
    }

    getUser() {
        return this.user;
    }

    async login(username, password) {
        try {
            const response = await api.login(username, password);

            if (response.result && response.result.token) {
                this.token = response.result.token;
                // Backend returns user info directly in result (userId, username, email, fullName, roles)
                this.user = {
                    id: response.result.userId,
                    username: response.result.username,
                    email: response.result.email,
                    fullName: response.result.fullName,
                    roles: response.result.roles
                };

                localStorage.setItem(STORAGE_KEYS.TOKEN, this.token);
                localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(this.user));

                console.log('User logged in:', this.user);
                return { success: true, user: this.user };
            } else {
                throw new Error('Invalid login response');
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: error.message };
        }
    }

    async signup(userData) {
        try {
            const response = await api.signup(userData);

            if (response.code === 200 || response.result) {
                return { success: true, message: 'Đăng ký thành công! Vui lòng đăng nhập.' };
            } else {
                throw new Error(response.message || 'Đăng ký thất bại');
            }
        } catch (error) {
            console.error('Signup error:', error);
            return { success: false, message: error.message };
        }
    }

    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        window.location.href = 'index.html';
    }

    hasRole(role) {
        return this.user && this.user.roles && this.user.roles.includes(role);
    }

    isAdmin() {
        return this.hasRole('ADMIN');
    }

    isStoreOwner() {
        return this.hasRole('STORE_OWNER');
    }

    isCustomer() {
        return this.hasRole('CUSTOMER');
    }

    updateNavbar() {
        // Hide/show navbar items based on authentication and roles
        const storeManagementLink = document.getElementById('storeManagementNav');
        const cartLink = document.getElementById('cartNav');
        const ordersLink = document.getElementById('ordersNav');
        
        if (storeManagementLink) {
            // "Quản lý" chỉ hiển thị cho ADMIN và STORE_OWNER
            if (this.isAuthenticated() && (this.isAdmin() || this.isStoreOwner())) {
                storeManagementLink.style.display = '';
            } else {
                storeManagementLink.style.display = 'none';
            }
        }

        // "Giỏ hàng" và "Đơn hàng" chỉ hiển thị khi đã đăng nhập
        if (cartLink) {
            cartLink.style.display = this.isAuthenticated() ? '' : 'none';
        }
        if (ordersLink) {
            ordersLink.style.display = this.isAuthenticated() ? '' : 'none';
        }
    }

    updateUI() {
        const userMenu = document.getElementById('userMenu');
        if (!userMenu) {
            return;
        }

        if (this.isAuthenticated()) {
            // Build dropdown menu items based on roles
            let dropdownItems = '';
            
            // Admin panel link for ADMIN and STORE_OWNER
            if (this.isAdmin() || this.isStoreOwner()) {
                dropdownItems += `<a href="admin.html"><i class="fas fa-cog"></i> Quản trị</a>`;
            }
            
            // Store management for STORE_OWNER
            if (this.isStoreOwner()) {
                dropdownItems += `<a href="store-management.html"><i class="fas fa-store"></i> Quản lý cửa hàng</a>`;
            }
            
            // Common items for all users
            dropdownItems += `
                <a href="profile.html"><i class="fas fa-user"></i> Tài khoản</a>
                <a href="orders.html"><i class="fas fa-box"></i> Đơn hàng của tôi</a>
                <a href="#" id="logoutBtn"><i class="fas fa-sign-out-alt"></i> Đăng xuất</a>
            `;

            // Get user role badges
            const roleBadges = this.user?.roles?.map(role => {
                const roleNames = {
                    'ADMIN': 'Admin',
                    'STORE_OWNER': 'Chủ cửa hàng',
                    'CUSTOMER': 'Khách hàng'
                };
                const roleColors = {
                    'ADMIN': '#ff6b6b',
                    'STORE_OWNER': '#4ecdc4',
                    'CUSTOMER': '#95e1d3'
                };
                return `<span style="display: inline-block; padding: 2px 8px; background: ${roleColors[role] || '#ddd'}; color: white; border-radius: 10px; font-size: 0.75rem; margin-right: 4px;">${roleNames[role] || role}</span>`;
            }).join('') || '';

            userMenu.innerHTML = `
                <div class="user-dropdown" id="userDropdown">
                    <button class="user-avatar" id="userAvatar">
                        <i class="fas fa-user-circle"></i>
                        <span>${this.user?.username || 'User'}</span>
                    </button>
                    <div class="dropdown-menu" id="dropdownMenu">
                        <div style="padding: 12px 16px; border-bottom: 1px solid #eee; background: #f8f9fa;">
                            <div style="font-weight: 600; color: #333; margin-bottom: 4px;">${this.user?.fullName || this.user?.username || 'User'}</div>
                            <div style="font-size: 0.875rem; color: #666; margin-bottom: 6px;">${this.user?.email || ''}</div>
                            <div>${roleBadges}</div>
                        </div>
                        ${dropdownItems}
                    </div>
                </div>
            `;

            // Add dropdown toggle
            const userAvatar = document.getElementById('userAvatar');
            const dropdownMenu = document.getElementById('dropdownMenu');

            if (userAvatar && dropdownMenu) {
                userAvatar.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdownMenu.classList.toggle('show');
                });

                document.addEventListener('click', () => {
                    dropdownMenu.classList.remove('show');
                });
            }

            // Add logout handler
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.logout();
                });
            }
        } else {
            userMenu.innerHTML = `
                <button class="btn btn-outline btn-sm" id="loginBtn">Đăng nhập</button>
                <button class="btn btn-primary btn-sm" id="signupBtn">Đăng ký</button>
            `;

            // Add modal handlers
            const loginBtn = document.getElementById('loginBtn');
            const signupBtn = document.getElementById('signupBtn');

            if (loginBtn) {
                loginBtn.addEventListener('click', () => {
                    if (typeof showLoginModal !== 'undefined') {
                        showLoginModal();
                    } else {
                        // Fallback
                        const modal = document.getElementById('loginModal');
                        if (modal) modal.classList.add('show');
                    }
                });
            }

            if (signupBtn) {
                signupBtn.addEventListener('click', () => {
                    if (typeof showRegisterModal !== 'undefined') {
                        showRegisterModal();
                    } else {
                        // Fallback
                        const modal = document.getElementById('registerModal');
                        if (modal) modal.classList.add('show');
                    }
                });
            }
        }
        
        // Update navbar visibility
        this.updateNavbar();
    }
}

// Create global auth manager
const auth = new AuthManager();

// Modal functions
function showLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.add('show');
    }
}

function hideLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function showRegisterModal() {
    const modal = document.getElementById('registerModal');
    if (modal) {
        modal.classList.add('show');
    }
}

function hideRegisterModal() {
    const modal = document.getElementById('registerModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// Initialize auth UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Update UI immediately
    auth.updateUI();
    auth.updateNavbar();

    // Login modal handlers
    const closeLoginModal = document.getElementById('closeLoginModal');
    if (closeLoginModal) {
        closeLoginModal.addEventListener('click', hideLoginModal);
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;

            const result = await auth.login(username, password);
            if (result.success) {
                hideLoginModal();
                auth.updateUI();
                window.location.reload();
            } else {
                alert('Đăng nhập thất bại: ' + result.message);
            }
        });
    }

    // Register modal handlers
    const closeRegisterModal = document.getElementById('closeRegisterModal');
    if (closeRegisterModal) {
        closeRegisterModal.addEventListener('click', hideRegisterModal);
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const userData = {
                username: document.getElementById('registerUsername').value,
                email: document.getElementById('registerEmail').value,
                phone: document.getElementById('registerPhone').value,
                fullName: document.getElementById('registerFullName').value,
                password: document.getElementById('registerPassword').value
            };

            const result = await auth.signup(userData);
            if (result.success) {
                alert(result.message);
                hideRegisterModal();
                showLoginModal();
            } else {
                alert('Đăng ký thất bại: ' + result.message);
            }
        });
    }

    // Switch between login and signup
    const switchToRegister = document.getElementById('switchToRegister');
    if (switchToRegister) {
        switchToRegister.addEventListener('click', (e) => {
            e.preventDefault();
            hideLoginModal();
            showRegisterModal();
        });
    }

    const switchToLogin = document.getElementById('switchToLogin');
    if (switchToLogin) {
        switchToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            hideRegisterModal();
            showLoginModal();
        });
    }

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        const loginModal = document.getElementById('loginModal');
        const registerModal = document.getElementById('registerModal');

        if (e.target === loginModal) {
            hideLoginModal();
        }
        if (e.target === registerModal) {
            hideRegisterModal();
        }
    });
});

// Note: API_CONFIG and buildUrl are defined in config.js

