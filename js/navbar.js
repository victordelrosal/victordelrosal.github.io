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
