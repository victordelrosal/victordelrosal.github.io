/**
 * Gamification UI - Renders XP bar, level badges, achievements panel, and notifications
 */

(function() {
    'use strict';

    let isInitialized = false;

    // ==========================================
    // XP INDICATOR (Navbar)
    // ==========================================

    function createXPIndicator() {
        if (!window.Gamification) return null;

        const xp = window.Gamification.getXP();
        const levelProgress = window.Gamification.getLevelProgress(xp);
        const streak = window.Gamification.getStreak();

        const indicator = document.createElement('div');
        indicator.className = 'gamify-indicator';
        indicator.id = 'gamify-indicator';
        indicator.innerHTML = `
            <button class="gamify-btn" id="gamify-btn" title="View your progress">
                <span class="gamify-level-icon">${levelProgress.current.icon}</span>
                <span class="gamify-level-name">${levelProgress.current.name}</span>
                <div class="gamify-xp-bar">
                    <div class="gamify-xp-fill" style="width: ${levelProgress.progress}%"></div>
                </div>
                ${streak.count > 1 ? `<span class="gamify-streak" title="${streak.count} day streak">🔥${streak.count}</span>` : ''}
            </button>
        `;

        // Add click handler to open achievements panel
        indicator.querySelector('#gamify-btn').addEventListener('click', toggleAchievementsPanel);

        return indicator;
    }

    function updateXPIndicator() {
        const indicator = document.getElementById('gamify-indicator');
        if (!indicator || !window.Gamification) return;

        const xp = window.Gamification.getXP();
        const levelProgress = window.Gamification.getLevelProgress(xp);
        const streak = window.Gamification.getStreak();

        indicator.querySelector('.gamify-level-icon').textContent = levelProgress.current.icon;
        indicator.querySelector('.gamify-level-name').textContent = levelProgress.current.name;
        indicator.querySelector('.gamify-xp-fill').style.width = `${levelProgress.progress}%`;

        // Update streak
        const streakEl = indicator.querySelector('.gamify-streak');
        if (streak.count > 1) {
            if (streakEl) {
                streakEl.textContent = `🔥${streak.count}`;
            } else {
                const btn = indicator.querySelector('.gamify-btn');
                const streakSpan = document.createElement('span');
                streakSpan.className = 'gamify-streak';
                streakSpan.title = `${streak.count} day streak`;
                streakSpan.textContent = `🔥${streak.count}`;
                btn.appendChild(streakSpan);
            }
        } else if (streakEl) {
            streakEl.remove();
        }
    }

    // ==========================================
    // ACHIEVEMENTS PANEL
    // ==========================================

    function createAchievementsPanel() {
        if (!window.Gamification) return null;

        const panel = document.createElement('div');
        panel.className = 'gamify-panel';
        panel.id = 'gamify-panel';
        panel.innerHTML = `
            <div class="gamify-panel-backdrop"></div>
            <div class="gamify-panel-content">
                <button class="gamify-panel-close" aria-label="Close">&times;</button>
                <div class="gamify-panel-header">
                    <h2>Your Journey</h2>
                </div>
                <div class="gamify-panel-body">
                    <div class="gamify-stats-section" id="gamify-stats-section"></div>
                    <div class="gamify-achievements-section" id="gamify-achievements-section">
                        <h3>Achievements</h3>
                        <div class="gamify-achievements-grid" id="gamify-achievements-grid"></div>
                    </div>
                </div>
            </div>
        `;

        // Close handlers
        panel.querySelector('.gamify-panel-backdrop').addEventListener('click', closeAchievementsPanel);
        panel.querySelector('.gamify-panel-close').addEventListener('click', closeAchievementsPanel);

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && panel.classList.contains('visible')) {
                closeAchievementsPanel();
            }
        });

        return panel;
    }

    function renderAchievementsPanel() {
        if (!window.Gamification) return;

        const statsSection = document.getElementById('gamify-stats-section');
        const achievementsGrid = document.getElementById('gamify-achievements-grid');
        if (!statsSection || !achievementsGrid) return;

        const xp = window.Gamification.getXP();
        const levelProgress = window.Gamification.getLevelProgress(xp);
        const streak = window.Gamification.getStreak();
        const stats = window.Gamification.getStats();
        const unlockedAchievements = window.Gamification.getUnlockedAchievements();
        const allAchievements = window.Gamification.getAllAchievements();

        // Get all levels for progression display
        const allLevels = window.Gamification.LEVELS;
        const currentLevelIndex = allLevels.findIndex(l => l.name === levelProgress.current.name);

        // Render stats section
        statsSection.innerHTML = `
            <div class="gamify-level-display">
                <div class="gamify-level-badge" style="background: ${levelProgress.current.color}">
                    <span class="gamify-level-badge-icon">${levelProgress.current.icon}</span>
                </div>
                <div class="gamify-level-info">
                    <div class="gamify-level-title">${levelProgress.current.name}</div>
                    <div class="gamify-xp-text">${xp.toLocaleString()} XP</div>
                    <div class="gamify-xp-bar-large">
                        <div class="gamify-xp-fill" style="width: ${levelProgress.progress}%"></div>
                    </div>
                    ${levelProgress.next
                        ? `<div class="gamify-xp-next">${levelProgress.xpToNext.toLocaleString()} XP to ${levelProgress.next.name}</div>`
                        : '<div class="gamify-xp-next">Max level reached!</div>'
                    }
                </div>
            </div>

            <div class="gamify-level-progression">
                <h4>Level Progression</h4>
                <div class="gamify-levels-track">
                    ${allLevels.map((level, index) => {
                        const isCompleted = index < currentLevelIndex;
                        const isCurrent = index === currentLevelIndex;
                        const isLocked = index > currentLevelIndex;
                        const statusClass = isCompleted ? 'completed' : (isCurrent ? 'current' : 'locked');
                        return `
                            <div class="gamify-level-node ${statusClass}" title="${level.name} - ${level.minXP.toLocaleString()} XP">
                                <div class="gamify-level-node-icon" style="${isCompleted || isCurrent ? `background: ${level.color}` : ''}">
                                    ${isLocked ? '🔒' : level.icon}
                                </div>
                                <div class="gamify-level-node-name">${level.name}</div>
                                <div class="gamify-level-node-xp">${level.minXP.toLocaleString()} XP</div>
                            </div>
                            ${index < allLevels.length - 1 ? `<div class="gamify-level-connector ${isCompleted ? 'completed' : ''}"></div>` : ''}
                        `;
                    }).join('')}
                </div>
            </div>
            <div class="gamify-stats-grid">
                <div class="gamify-stat">
                    <span class="gamify-stat-icon">📖</span>
                    <span class="gamify-stat-value">${stats.postsRead?.length || 0}</span>
                    <span class="gamify-stat-label">Waves Read</span>
                </div>
                <div class="gamify-stat">
                    <span class="gamify-stat-icon">👋</span>
                    <span class="gamify-stat-value">${stats.waves || 0}</span>
                    <span class="gamify-stat-label">Waves Given</span>
                </div>
                <div class="gamify-stat">
                    <span class="gamify-stat-icon">💬</span>
                    <span class="gamify-stat-value">${stats.comments || 0}</span>
                    <span class="gamify-stat-label">Comments</span>
                </div>
                <div class="gamify-stat">
                    <span class="gamify-stat-icon">🔥</span>
                    <span class="gamify-stat-value">${streak.count || 0}</span>
                    <span class="gamify-stat-label">Day Streak</span>
                </div>
            </div>
        `;

        // Render achievements
        const achievementIds = Object.keys(allAchievements);
        achievementsGrid.innerHTML = achievementIds.map(id => {
            const achievement = allAchievements[id];
            const isUnlocked = unlockedAchievements.includes(id);
            return `
                <div class="gamify-achievement ${isUnlocked ? 'unlocked' : 'locked'}">
                    <div class="gamify-achievement-icon">${isUnlocked ? achievement.icon : '🔒'}</div>
                    <div class="gamify-achievement-info">
                        <div class="gamify-achievement-name">${achievement.name}</div>
                        <div class="gamify-achievement-desc">${achievement.description}</div>
                        ${!isUnlocked && achievement.requirement
                            ? `<div class="gamify-achievement-progress">Progress: ${getAchievementProgress(id)}/${achievement.requirement}</div>`
                            : ''
                        }
                    </div>
                    ${isUnlocked ? `<div class="gamify-achievement-xp">+${achievement.xpReward} XP</div>` : ''}
                </div>
            `;
        }).join('');
    }

    function getAchievementProgress(achievementId) {
        if (!window.Gamification) return 0;
        const stats = window.Gamification.getStats();
        const streak = window.Gamification.getStreak();

        switch(achievementId) {
            case 'deep_diver':
            case 'ocean_explorer':
            case 'wave_surfer':
                return stats.postsRead?.length || 0;
            case 'wave_maker':
            case 'wave_enthusiast':
                return stats.waves || 0;
            case 'conversationalist':
                return stats.comments || 0;
            case 'sharing_sailor':
                return stats.shares || 0;
            case 'streak_3':
            case 'streak_7':
            case 'streak_14':
            case 'streak_30':
                return streak.count || 0;
            default:
                return 0;
        }
    }

    function toggleAchievementsPanel() {
        const panel = document.getElementById('gamify-panel');
        if (!panel) return;

        if (panel.classList.contains('visible')) {
            closeAchievementsPanel();
        } else {
            renderAchievementsPanel();
            panel.classList.add('visible');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeAchievementsPanel() {
        const panel = document.getElementById('gamify-panel');
        if (!panel) return;
        panel.classList.remove('visible');
        document.body.style.overflow = '';
    }

    // ==========================================
    // TOAST NOTIFICATIONS
    // ==========================================

    function createToastContainer() {
        if (document.getElementById('gamify-toasts')) return;

        const container = document.createElement('div');
        container.id = 'gamify-toasts';
        container.className = 'gamify-toasts';
        document.body.appendChild(container);
    }

    function showToast(type, data) {
        createToastContainer();
        const container = document.getElementById('gamify-toasts');

        const toast = document.createElement('div');
        toast.className = `gamify-toast gamify-toast--${type}`;

        switch(type) {
            case 'xp':
                toast.innerHTML = `
                    <span class="gamify-toast-icon">⭐</span>
                    <span class="gamify-toast-text">+${data.amount} XP</span>
                    <span class="gamify-toast-reason">${data.reason}</span>
                `;
                break;

            case 'level-up':
                toast.innerHTML = `
                    <span class="gamify-toast-icon">${data.newLevel.icon}</span>
                    <span class="gamify-toast-text">Level Up!</span>
                    <span class="gamify-toast-reason">${data.newLevel.name}</span>
                `;
                toast.classList.add('gamify-toast--special');
                break;

            case 'achievement':
                toast.innerHTML = `
                    <span class="gamify-toast-icon">${data.achievement.icon}</span>
                    <span class="gamify-toast-text">Achievement Unlocked!</span>
                    <span class="gamify-toast-reason">${data.achievement.name}</span>
                `;
                toast.classList.add('gamify-toast--special');
                break;

            case 'streak':
                toast.innerHTML = `
                    <span class="gamify-toast-icon">🔥</span>
                    <span class="gamify-toast-text">${data.count} Day Streak!</span>
                    <span class="gamify-toast-reason">Keep it up!</span>
                `;
                break;
        }

        container.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.classList.add('visible');
        });

        // Remove after delay
        const duration = type === 'achievement' || type === 'level-up' ? 4000 : 2500;
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // ==========================================
    // EVENT LISTENERS
    // ==========================================

    function setupEventListeners() {
        // XP gained
        window.addEventListener('gamify:xp-gained', (e) => {
            showToast('xp', e.detail);
            updateXPIndicator();
        });

        // Level up
        window.addEventListener('gamify:level-up', (e) => {
            showToast('level-up', e.detail);
        });

        // Achievement unlocked
        window.addEventListener('gamify:achievement-unlocked', (e) => {
            showToast('achievement', e.detail);
        });

        // Data synced from server - refresh UI
        window.addEventListener('gamify:synced', () => {
            updateXPIndicator();
            // Refresh achievements panel if open
            const panel = document.getElementById('gamify-panel');
            if (panel?.classList.contains('visible')) {
                renderAchievementsPanel();
            }
        });
    }

    // ==========================================
    // INITIALIZATION
    // ==========================================

    function init() {
        if (isInitialized) return;

        // Wait for Gamification module
        if (!window.Gamification) {
            console.warn('[Gamification UI] Gamification module not loaded');
            return;
        }

        // Create and inject XP indicator into navbar
        const authContainer = document.getElementById('auth-container');
        const navbarContent = document.querySelector('.wave-navbar-content');

        // Don't mark as initialized until navbar is ready
        if (!authContainer || !navbarContent) {
            return;
        }

        // Now we can mark as initialized
        isInitialized = true;

        const indicator = createXPIndicator();
        if (indicator) {
            // Insert before auth container
            navbarContent.insertBefore(indicator, authContainer);
        }

        // Create achievements panel (hidden by default)
        const panel = createAchievementsPanel();
        if (panel) {
            document.body.appendChild(panel);
        }

        // Setup event listeners
        setupEventListeners();
    }

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM already loaded, wait a tick for navbar to be ready
        setTimeout(init, 100);
    }

    // Also try to init when navbar loads
    const navbarObserver = new MutationObserver((mutations, obs) => {
        if (document.querySelector('.wave-navbar-content #auth-container') && !isInitialized) {
            init();
            obs.disconnect();
        }
    });

    navbarObserver.observe(document.body, { childList: true, subtree: true });

    // Expose for external use
    window.GamificationUI = {
        init,
        updateXPIndicator,
        toggleAchievementsPanel,
        showToast
    };

})();
