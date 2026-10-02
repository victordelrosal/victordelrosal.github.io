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

        // AI Badge promo link
        const aiBadgeHTML = `
            <li class="ai-badge-promo">
                <a href="https://aibadge.fiveinnolabs.com/" target="_blank" rel="noopener">
                    <img src="/img/ai-badge.png" alt="AI Badge" class="ai-badge-icon">
                    <span class="ai-badge-tagline">level up your AI game</span>
                </a>
            </li>
        `;

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
                    ${aiBadgeHTML}
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

            // A LinkedIn connected from the account card (fiveinnolabs-identity)
            window.addEventListener('fil:link-result', (e) => this.showLinkResult(e.detail));

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
                <h2>Welcome, ${String(user.display_name || '').split(' ')[0].replace(/[&<>"']/g, '')}!</h2>
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
                    /* Spring physics transition */
                    transition:
                        transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
                        box-shadow 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                    box-shadow: 0 4px 12px rgba(253, 185, 49, 0.3);
                    transform-origin: center bottom;
                    will-change: transform, box-shadow;
                }
                .welcome-btn:hover {
                    transform: scale(1.08) translateY(-2px);
                    box-shadow: 0 8px 20px rgba(253, 185, 49, 0.4);
                }
                .welcome-btn:active,
                .welcome-btn.pinched {
                    transform: scaleX(1.08) scaleY(0.85) translateY(2px);
                    transition:
                        transform 0.06s cubic-bezier(0.32, 0, 0.67, 0),
                        box-shadow 0.04s ease-out;
                    box-shadow: 0 2px 6px rgba(253, 185, 49, 0.25);
                }
                .welcome-btn.bouncing {
                    animation: squishyBounceSmall 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
                }
                @keyframes squishyBounceSmall {
                    0% { transform: scaleX(1.08) scaleY(0.85) translateY(2px); }
                    20% { transform: scaleX(0.94) scaleY(1.1) translateY(-3px); }
                    40% { transform: scaleX(1.04) scaleY(0.95) translateY(1px); }
                    55% { transform: scaleX(0.98) scaleY(1.03) translateY(-1px); }
                    70% { transform: scaleX(1.01) scaleY(0.99) translateY(0); }
                    100% { transform: scaleX(1) scaleY(1) translateY(0); }
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

        // Close handler with bounce animation
        const welcomeBtn = document.getElementById('welcome-close-btn');
        welcomeBtn.addEventListener('click', () => {
            // Phase 1: Squash down (instant pinch)
            welcomeBtn.classList.add('pinched');

            // Phase 2: Quick release into squishy bounce-back
            setTimeout(() => {
                welcomeBtn.classList.remove('pinched');
                welcomeBtn.classList.add('bouncing');

                // Close modal during bounce
                setTimeout(() => {
                    modal.style.opacity = '0';
                    setTimeout(() => {
                        modal.remove();
                        document.body.classList.remove('modal-open');
                    }, 300);
                }, 150);
            }, 44);
        });
    },

    /**
     * Show delete account confirmation modal
     */
    showDeleteConfirmModal() {
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'delete-modal-overlay';
        modal.innerHTML = `
            <div class="delete-modal">
                <div class="delete-modal-icon">⚠️</div>
                <h2>Delete your data on this site?</h2>
                <p>This permanently deletes your comments and email settings on victordelrosal.com. Your fiveinnolabs account, its XP and level stay, since other sites use them too. This <strong>cannot be undone</strong>.</p>
                <div class="delete-modal-buttons">
                    <button class="delete-modal-cancel" id="delete-cancel-btn">Cancel</button>
                    <button class="delete-modal-confirm" id="delete-confirm-btn">Delete my data</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.classList.add('modal-open');

        // Animate in
        requestAnimationFrame(() => {
            modal.classList.add('visible');
        });

        // Cancel button
        document.getElementById('delete-cancel-btn').addEventListener('click', () => {
            modal.classList.remove('visible');
            setTimeout(() => {
                modal.remove();
                document.body.classList.remove('modal-open');
            }, 300);
        });

        // Confirm delete button
        document.getElementById('delete-confirm-btn').addEventListener('click', async () => {
            const confirmBtn = document.getElementById('delete-confirm-btn');
            confirmBtn.textContent = 'Deleting...';
            confirmBtn.disabled = true;

            try {
                await window.SupabaseClient.deleteAccount();
                modal.remove();
                document.body.classList.remove('modal-open');
            } catch (err) {
                console.error('Failed to delete account', err);
                confirmBtn.textContent = 'Delete my data';
                confirmBtn.disabled = false;
                alert('Could not delete your data. Please try again.');
            }
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('visible');
                setTimeout(() => {
                    modal.remove();
                    document.body.classList.remove('modal-open');
                }, 300);
            }
        });

        // ESC to close
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                modal.classList.remove('visible');
                setTimeout(() => {
                    modal.remove();
                    document.body.classList.remove('modal-open');
                }, 300);
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    },

    /**
     * Update Auth UI based on user state
     */
    updateAuthUI(user) {
        const container = document.getElementById('auth-container');
        if (!container) return;
        this.injectAccountStyles();

        if (user) {
            // Signed in: the one fiveinnolabs account (photo with its sign-in method, level gem and XP, ways in)
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

            const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
            const timezoneOptions = timezones.map(tz =>
                `<option value="${esc(tz)}" ${tz === userTimezone ? 'selected' : ''}>${esc(tz.replace('_', ' '))}</option>`
            ).join('');

            const via = user.provider || '';
            const said = 'Your account' + (via ? ', signed in with ' + this.METHOD_NAME[via] : '');
            const photo = /^https:\/\//.test(avatarUrl || '')
                ? `<img src="${esc(avatarUrl)}" alt="" class="user-avatar" referrerpolicy="no-referrer">`
                : `<span class="user-avatar user-avatar-ini">${esc((name || '?').trim().charAt(0).toUpperCase())}</span>`;
            const tag = this.METHOD_TAG[via] ? `<span class="fil-tag ${via}">${this.METHOD_TAG[via]}</span>` : '';
            const total = window.filXp && window.filXp.total != null ? ` xp="${window.filXp.total}"` : '';

            container.innerHTML = `
                <div class="user-profile" id="user-profile-btn">
                    <button type="button" class="user-avatar-wrap" aria-haspopup="dialog" aria-expanded="false" aria-label="${esc(said)}" title="${esc(said)}">${photo}${tag}</button>
                    <div class="user-dropdown" role="dialog" aria-label="Your account">
                        <div class="user-info">
                            <span class="user-name-row"><span class="user-name">${esc(name)}</span><fil-level mine level="${this.filLevel || 0}"${total}></fil-level></span>
                            <span class="user-email">${esc(user.email)}</span>
                        </div>

                        <fil-ways auth="firebase"></fil-ways>
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
                            Delete my data on this site
                        </button>
                        <div class="dropdown-divider"></div>
                        <button id="logout-btn" class="logout-btn">Sign Out</button>
                    </div>
                </div>
            `;

            // The shared ways-in list (aireckon.ing/fil/account.js): who is asking, and how to add Google
            const ways = container.querySelector('fil-ways');
            ways.idToken = () => window.SupabaseClient.getIdToken();
            ways.connectGoogle = () => {
                const u = window.SupabaseClient.getFirebaseUser();
                return u.linkWithPopup(new firebase.auth.GoogleAuthProvider()).then(() => u.reload());
            };
            ways.addEventListener('fil-ways', (e) => {
                const l = (e.detail && e.detail.level) || 0;
                this.filLevel = l;
                const lv = container.querySelector('.user-name-row fil-level');
                if (lv) lv.setAttribute('level', l);
            });

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

            if (subCheckbox && subWarning) {
                subWarning.style.display = subCheckbox.checked ? 'none' : 'block';
            }

            if (subCheckbox) {
                subCheckbox.addEventListener('change', async (e) => {
                    const isChecked = e.target.checked;
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

            // Delete this site's data
            const deleteBtn = document.getElementById('delete-account-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => {
                    this.showDeleteConfirmModal();
                });
            }

            document.getElementById('logout-btn').addEventListener('click', () => {
                window.SupabaseClient.signOut();
            });

            // Toggle the card from the photo
            const profileBtn = document.getElementById('user-profile-btn');
            const avatarBtn = profileBtn.querySelector('.user-avatar-wrap');
            const setOpen = (open) => {
                profileBtn.classList.toggle('active', open);
                avatarBtn.setAttribute('aria-expanded', String(open));
                if (open && ways.refresh) ways.refresh();
            };
            avatarBtn.addEventListener('click', () => setOpen(!profileBtn.classList.contains('active')));
            this.openAccountCard = () => setOpen(true);

            // Close when clicking outside (once per page) or on Escape
            if (!this.outsideBound) {
                this.outsideBound = true;
                document.addEventListener('click', (e) => {
                    const p = document.getElementById('user-profile-btn');
                    const w = p && p.querySelector('fil-ways');
                    if (p && !p.contains(e.target) && !(w && w.busy)) {
                        p.classList.remove('active');
                        const b = p.querySelector('.user-avatar-wrap'); if (b) b.setAttribute('aria-expanded', 'false');
                    }
                });
                document.addEventListener('keydown', (e) => {
                    const p = document.getElementById('user-profile-btn');
                    if (e.key === 'Escape' && p && p.classList.contains('active')) {
                        p.classList.remove('active');
                        const b = p.querySelector('.user-avatar-wrap'); if (b) { b.setAttribute('aria-expanded', 'false'); b.focus(); }
                    }
                });
            }

            // A LinkedIn connected (or refused) from this card comes back here
            if (this.pendingLink) { const r = this.pendingLink; this.pendingLink = null; this.showLinkResult(r); }

        } else {
            container.innerHTML = `
                <button id="login-btn" class="login-btn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
                        <circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20.5c1.2-4 4.2-6 7.5-6s6.3 2 7.5 6"/>
                    </svg>
                    <span>Sign in</span>
                </button>
            `;

            const loginBtn = document.getElementById('login-btn');
            loginBtn.addEventListener('click', () => {
                // Phase 1: Squash down (instant pinch)
                loginBtn.classList.add('pinched');

                // Phase 2: Quick release into squishy bounce-back
                setTimeout(() => {
                    loginBtn.classList.remove('pinched');
                    loginBtn.classList.add('bouncing');

                    // Open the sign-in sheet during bounce
                    setTimeout(() => {
                        window.SupabaseClient.signInWithGoogle();
                    }, 150);

                    // Clean up bouncing class after animation
                    setTimeout(() => {
                        loginBtn.classList.remove('bouncing');
                    }, 600);
                }, 44);
            });
        }
    },

    /* the method tag on the photo: which key opened this account today */
    METHOD_NAME: { google: 'Google', linkedin: 'LinkedIn', email: 'email' },
    METHOD_TAG: {
        google: '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.2C12.4 13.7 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.8c4.3-4 6.9-9.9 6.9-17.2z"/><path fill="#FBBC05" d="M10.6 28.5c-.5-1.4-.8-2.9-.8-4.5s.3-3.1.8-4.5l-7.9-6.2C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.9-6.2z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.8c-2.1 1.4-4.8 2.3-8.5 2.3-6.3 0-11.6-4.2-13.5-10l-7.9 6.2C6.6 42.6 14.6 48 24 48z"/></svg>',
        linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M2.6 8.3h4.3V22H2.6zM4.8 1.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM9.5 8.3h4.1v1.9c.6-1.1 2-2.2 4.1-2.2 4.4 0 5.2 2.9 5.2 6.6V22h-4.3v-6.7c0-1.6 0-3.6-2.2-3.6s-2.6 1.7-2.6 3.5V22H9.5z"/></svg>',
        email: '<svg viewBox="0 0 24 24" fill="none" stroke="#05060a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3.8 7.2 12 13l8.2-5.8"/></svg>'
    },

    /* back from connecting a LinkedIn from the card: open the card and say how it went */
    showLinkResult(r) {
        const p = document.getElementById('user-profile-btn');
        const ways = p && p.querySelector('fil-ways');
        if (!ways || !this.openAccountCard) { this.pendingLink = r; return; }
        this.openAccountCard();
        if (r.success) { ways.say('good', 'LinkedIn connected. Either one now opens this account.'); if (ways.flash) ways.flash('linkedin'); }
        else ways.say('bad', (window.FIL_WAYS_ERR || {})[r.code] || r.error);
    },

    /* the account card's own pieces, in the navbar's glass style */
    injectAccountStyles() {
        if (document.getElementById('fil-account-styles')) return;
        const st = document.createElement('style');
        st.id = 'fil-account-styles';
        st.textContent = `
            .user-avatar-wrap{position:relative;display:block;padding:0;border:0;background:none;border-radius:50%;cursor:pointer}
            .user-avatar-wrap:focus-visible{outline:2px solid #00D4FF;outline-offset:3px}
            .user-avatar-wrap .user-avatar{display:block;object-fit:cover}
            .user-avatar-ini{display:grid;place-items:center;box-sizing:border-box;background:#0b1a4a;color:#fff;font:700 15px/1 var(--font-system)}
            .fil-tag{position:absolute;right:-3px;bottom:-3px;width:16px;height:16px;border-radius:50%;display:grid;place-items:center;background:#fff;box-shadow:0 0 0 2px #0a1640;pointer-events:none}
            .fil-tag svg{width:10px;height:10px;display:block}.fil-tag.linkedin{background:#0A66C2}.fil-tag.linkedin svg{width:9px;height:9px}
            .user-dropdown{width:min(320px,calc(100vw - 32px));max-height:calc(100vh - 110px);overflow-y:auto;overscroll-behavior:contain;cursor:default}
            .user-name-row{display:flex;align-items:center;gap:8px;min-width:0;margin-bottom:4px}
            .user-name-row .user-name{margin-bottom:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
            .user-name-row fil-level{flex:none}
            .user-dropdown fil-ways{position:relative;z-index:1;display:block;margin-bottom:4px;
                --fil-ink:#fff;--fil-muted:rgba(180,210,255,.7);--fil-line:rgba(0,180,255,.15);--fil-accent:#00D4FF;--fil-accent-ink:#04102e;
                --fil-chip:rgba(0,212,255,.12);--fil-bad:#ff9a8a;--fil-font:var(--font-system,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif)}
            .login-btn svg{color:#3c4043}
        `;
        document.head.appendChild(st);
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
