/**
 * Universal Navbar Module
 * Single source of truth for the site navigation
 */

const Navbar = {
    // Navigation links configuration
    links: [
        { href: '/', label: 'Home', isHome: true },
        { href: '/#about', label: 'About' },
        { href: '/#work', label: 'Work' },
        { href: '/waves/', label: 'Waves' },
        { href: '/#contact', label: 'Contact' }
    ],

    /**
     * Initialize the navbar
     * @param {Object} options - Configuration options
     * @param {string} options.pageTitle - Optional page title to display (e.g., "Waves")
     * @param {string} options.activeLink - Which link should be marked active (href value)
     */
    init(options = {}) {
        const container = document.getElementById('navbar-container');
        if (!container) {
            console.warn('Navbar container not found');
            return;
        }

        const { pageTitle, activeLink } = options;

        // Determine active link from current URL if not specified
        const currentPath = window.location.pathname;
        const currentActive = activeLink || this.detectActiveLink(currentPath);

        // Generate navbar HTML
        container.innerHTML = this.generateHTML(pageTitle, currentActive);

        // Initialize scroll behavior for wave pages
        if (pageTitle) {
            this.initScrollBehavior();
        }

        // Initialize Auth
        this.initAuth();
    },

    /**
     * Detect which link should be active based on current URL
     */
    detectActiveLink(path) {
        if (path === '/' || path === '/index.html') {
            return '/';
        }
        if (path === '/waves/' || path === '/waves') {
            return '/waves/';
        }
        // Wave detail pages should highlight "Waves"
        if (path.length > 1 && !path.includes('.html')) {
            return '/waves/';
        }
        return '/';
    },

    /**
     * Generate the navbar HTML
     */
    generateHTML(pageTitle, activeLink) {
        const linksHTML = this.links.map(link => {
            const isActive = link.href === activeLink;
            const href = link.isHome && window.location.pathname !== '/' ? '/' : link.href;
            return `<li><a href="${href}"${isActive ? ' class="active"' : ''}>${link.label}</a></li>`;
        }).join('\n                    ');

        // Full wave navbar with animated background
        return `
    <header class="wave-navbar" id="wave-navbar">
        <div class="wave-navbar-bg">
            <svg class="wave-navbar-wave wave-deep" viewBox="0 0 1440 320" preserveAspectRatio="none">
                <path d="M0,160 C320,220 420,100 720,160 C1020,220 1120,100 1440,160 L1440,320 L0,320 Z"></path>
            </svg>
            <svg class="wave-navbar-wave wave-mid" viewBox="0 0 1440 320" preserveAspectRatio="none">
                <path d="M0,200 C240,140 480,260 720,200 C960,140 1200,260 1440,200 L1440,320 L0,320 Z"></path>
            </svg>
            <svg class="wave-navbar-wave wave-surface" viewBox="0 0 1440 320" preserveAspectRatio="none">
                <path d="M0,240 C180,200 360,280 540,240 C720,200 900,280 1080,240 C1260,200 1350,280 1440,240 L1440,320 L0,320 Z"></path>
            </svg>
        </div>
        <div class="wave-navbar-content">
            ${pageTitle ? `<h1 class="wave-navbar-title">${pageTitle}</h1>` : '<div class="wave-navbar-logo"><a href="/"><img src="/favicon.png" alt="VDR"></a></div>'}
            <nav>
                <ul class="wave-navbar-links">
                    ${linksHTML}
                </ul>
            </nav>
            <div id="auth-container" class="auth-container">
                <!-- Auth button will be injected here -->
            </div>
        </div>
    </header>`;
    },

    /**
     * Initialize scroll behavior for collapsing navbar
     */
    initScrollBehavior() {
        const navbar = document.getElementById('wave-navbar');
        if (!navbar) return;

        let lastScrollY = 0;
        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const scrollY = window.scrollY;

                    if (scrollY > 100) {
                        navbar.classList.add('scrolled');
                    } else {
                        navbar.classList.remove('scrolled');
                    }

                    lastScrollY = scrollY;
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    },

    /**
     * Initialize Authentication
     */
    initAuth() {
        if (window.SupabaseClient) {
            // Initialize auth in SupabaseClient
            window.SupabaseClient.initAuth();

            // Subscribe to auth state changes
            window.SupabaseClient.onAuthStateChange((user) => {
                this.updateAuthUI(user);
            });

            // Listen for new user welcome event
            window.addEventListener('supabase:new-user', (e) => {
                this.showWelcomeModal(e.detail.user);
            });
        } else {
            // Retry if SupabaseClient is not yet loaded
            setTimeout(() => this.initAuth(), 100);
        }
    },

    /**
     * Show welcome modal for new users
     */
    showWelcomeModal(user) {
        // Create modal container
        const modal = document.createElement('div');
        modal.className = 'welcome-modal-overlay';
        modal.innerHTML = `
            <div class="welcome-modal">
                <div class="welcome-icon">👋</div>
                <h2>Welcome, ${user.display_name.split(' ')[0]}!</h2>
                <p>You are now subscribed for updates.</p>
                <button class="welcome-btn" id="welcome-close-btn">Awesome!</button>
            </div>
        `;

        // Add to body
        document.body.appendChild(modal);
        document.body.classList.add('modal-open');

        // Add styles dynamically if not present
        if (!document.getElementById('welcome-modal-styles')) {
            const style = document.createElement('style');
            style.id = 'welcome-modal-styles';
            style.textContent = `
                .welcome-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.4);
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    animation: fadeIn 0.5s ease forwards;
                }
                .welcome-modal {
                    background: white;
                    padding: 40px;
                    border-radius: 24px;
                    text-align: center;
                    max-width: 400px;
                    width: 90%;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.2);
                    transform: scale(0.9);
                    animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards 0.1s;
                }
                .welcome-icon {
                    font-size: 48px;
                    margin-bottom: 16px;
                    animation: wave 2s infinite;
                    display: inline-block;
                    transform-origin: 70% 70%;
                }
                .welcome-modal h2 {
                    margin: 0 0 12px;
                    color: #1a1a1a;
                    font-size: 24px;
                }
                .welcome-modal p {
                    margin: 0 0 24px;
                    color: #666;
                    font-size: 16px;
                    line-height: 1.5;
                }
                .welcome-btn {
                    background: linear-gradient(135deg, #FFD700 0%, #FDB931 100%);
                    color: #5c4000;
                    border: none;
                    padding: 12px 32px;
                    border-radius: 100px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: transform 0.2s;
                    box-shadow: 0 4px 12px rgba(253, 185, 49, 0.3);
                }
                .welcome-btn:hover {
                    transform: scale(1.05);
                }
                body.modal-open {
                    overflow: hidden;
                }
                @keyframes fadeIn { to { opacity: 1; } }
                @keyframes popIn { to { transform: scale(1); } }
                @keyframes wave {
                    0% { transform: rotate(0deg); }
                    10% { transform: rotate(14deg); }
                    20% { transform: rotate(-8deg); }
                    30% { transform: rotate(14deg); }
                    40% { transform: rotate(-4deg); }
                    50% { transform: rotate(10deg); }
                    60% { transform: rotate(0deg); }
                    100% { transform: rotate(0deg); }
                }
            `;
            document.head.appendChild(style);
        }

        // Close handler
        document.getElementById('welcome-close-btn').addEventListener('click', () => {
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.remove();
                document.body.classList.remove('modal-open');
            }, 300);
        });
    },

    /**
     * Update Auth UI based on user state
     */
    updateAuthUI(user) {
        const container = document.getElementById('auth-container');
        if (!container) return;

        const navbar = document.getElementById('wave-navbar');

        if (user) {
            // User is logged in
            const avatarUrl = user.user_metadata.avatar_url || user.user_metadata.picture;
            const name = user.user_metadata.full_name || user.user_metadata.name || user.email;

            const userProfile = window.SupabaseClient.getUserProfile();
            const isSubscribed = userProfile?.is_subscribed !== false; // Default to true
            const userTimezone = userProfile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

            // Common timezones
            const timezones = [
                'UTC',
                'America/New_York',
                'America/Los_Angeles',
                'America/Chicago',
                'Europe/London',
                'Europe/Paris',
                'Europe/Berlin',
                'Asia/Tokyo',
                'Asia/Dubai',
                'Australia/Sydney'
            ];

            // Add user's detected timezone if not in list
            if (!timezones.includes(userTimezone)) {
                timezones.push(userTimezone);
                timezones.sort();
            }

            const timezoneOptions = timezones.map(tz =>
                `<option value="${tz}" ${tz === userTimezone ? 'selected' : ''}>${tz.replace('_', ' ')}</option>`
            ).join('');

            container.innerHTML = `
                <div class="user-profile" id="user-profile-btn">
                    <img src="${avatarUrl}" alt="${name}" class="user-avatar">
                    <div class="user-dropdown">
                        <div class="user-info">
                            <span class="user-name">${name}</span>
                            <span class="user-email">${user.email}</span>
                        </div>
                        <div class="dropdown-divider"></div>
                        
                        <div class="subscription-container">
                            <label class="dropdown-item checkbox-item">
                                <input type="checkbox" id="subscribe-checkbox" ${isSubscribed ? 'checked' : ''}>
                                <span>Subscribed to email updates</span>
                            </label>
                            <p id="subscription-warning" class="subscription-warning" style="display: none;">
                                You will receive no more email updates.
                            </p>
                        </div>

                        <div class="timezone-container">
                            <label for="timezone-select" class="timezone-label">Email Timezone</label>
                            <select id="timezone-select" class="timezone-select">
                                ${timezoneOptions}
                            </select>
                        </div>

                        <button id="delete-account-btn" class="dropdown-item delete-item">
                            Delete Account
                        </button>
                        <div class="dropdown-divider"></div>
                        <button id="logout-btn" class="logout-btn">Sign Out</button>
                    </div>
                </div>
            `;

            // Add event listeners

            // Timezone selector
            const tzSelect = document.getElementById('timezone-select');
            if (tzSelect) {
                tzSelect.addEventListener('change', async (e) => {
                    try {
                        await window.SupabaseClient.updateTimezone(e.target.value);
                    } catch (err) {
                        console.error('Failed to update timezone', err);
                        alert('Failed to update timezone.');
                    }
                });
            }

            // Subscription toggle
            const subCheckbox = document.getElementById('subscribe-checkbox');
            const subWarning = document.getElementById('subscription-warning');

            // Initial state check
            if (subCheckbox && subWarning) {
                subWarning.style.display = subCheckbox.checked ? 'none' : 'block';
            }

            if (subCheckbox) {
                subCheckbox.addEventListener('change', async (e) => {
                    const isChecked = e.target.checked;
                    // Toggle warning immediately for responsiveness
                    if (subWarning) {
                        subWarning.style.display = isChecked ? 'none' : 'block';
                    }

                    try {
                        await window.SupabaseClient.updateSubscription(isChecked);
                    } catch (err) {
                        console.error('Failed to update subscription', err);
                        e.target.checked = !isChecked; // Revert on error
                        if (subWarning) {
                            subWarning.style.display = !isChecked ? 'none' : 'block';
                        }
                        alert('Failed to update subscription. Please try again.');
                    }
                });
            }

            // Delete account
            const deleteBtn = document.getElementById('delete-account-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', async () => {
                    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                        try {
                            await window.SupabaseClient.deleteAccount();
                        } catch (err) {
                            console.error('Failed to delete account', err);
                            alert('Failed to delete account. Please try again.');
                        }
                    }
                });
            }

            document.getElementById('logout-btn').addEventListener('click', () => {
                window.SupabaseClient.signOut();
            });

            // Toggle dropdown on click
            const profileBtn = document.getElementById('user-profile-btn');
            profileBtn.addEventListener('click', (e) => {
                if (e.target.closest('.user-dropdown')) return;
                profileBtn.classList.toggle('active');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!profileBtn.contains(e.target)) {
                    profileBtn.classList.remove('active');
                }
            });

        } else {
            // User is logged out
            container.innerHTML = `
                <button id="login-btn" class="login-btn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span>Sign in</span>
                </button>
            `;

            document.getElementById('login-btn').addEventListener('click', () => {
                window.SupabaseClient.signInWithGoogle();
            });
        }
    }
};

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Only auto-init if data attributes are present
        const container = document.getElementById('navbar-container');
        if (container && container.dataset.autoInit !== 'false') {
            Navbar.init({
                pageTitle: container.dataset.pageTitle || null,
                activeLink: container.dataset.activeLink || null
            });
        }
    });
} else {
    const container = document.getElementById('navbar-container');
    if (container && container.dataset.autoInit !== 'false') {
        Navbar.init({
            pageTitle: container.dataset.pageTitle || null,
            activeLink: container.dataset.activeLink || null
        });
    }
}

// Export for manual initialization
window.Navbar = Navbar;
