/**
 * Gamification UI - Avatar animations, achievements panel, and notifications
 */

(function() {
    'use strict';

    let isInitialized = false;

    // ==========================================
    // AVATAR XP ANIMATION
    // ==========================================

    function animateAvatarXP(amount) {
        const avatar = document.querySelector('.user-avatar');
        if (!avatar) return;

        // Add shake animation
        avatar.classList.add('xp-shake');

        // Create floating +XP badge
        const badge = document.createElement('div');
        badge.className = 'xp-badge-float';
        badge.textContent = `+${amount} XP`;

        // Position near avatar
        const avatarRect = avatar.getBoundingClientRect();
        badge.style.position = 'fixed';
        badge.style.left = `${avatarRect.left + avatarRect.width / 2}px`;
        badge.style.top = `${avatarRect.top}px`;
        document.body.appendChild(badge);

        // Remove shake after animation
        setTimeout(() => {
            avatar.classList.remove('xp-shake');
        }, 600);

        // Remove badge after float animation
        setTimeout(() => {
            badge.remove();
        }, 1500);
    }

    function animateLevelUp(newLevel) {
        const avatar = document.querySelector('.user-avatar');
        if (!avatar) return;

        // Add level up glow
        avatar.classList.add('level-up-glow');

        // Create level up badge
        const badge = document.createElement('div');
        badge.className = 'level-up-badge-float';
        badge.innerHTML = `${newLevel.icon} Level Up!`;

        const avatarRect = avatar.getBoundingClientRect();
        badge.style.position = 'fixed';
        badge.style.left = `${avatarRect.left + avatarRect.width / 2}px`;
        badge.style.top = `${avatarRect.top}px`;
        document.body.appendChild(badge);

        setTimeout(() => {
            avatar.classList.remove('level-up-glow');
        }, 1500);

        setTimeout(() => {
            badge.remove();
        }, 2500);
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
                <button class="gamify-panel-close">&times;</button>
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
        achievementsGrid.innerHTML = renderAchievements(allAchievements, unlockedAchievements);
    }

    function renderAchievements(allAchievements, unlocked) {
        return Object.entries(allAchievements).map(([id, achievement]) => {
            const isUnlocked = unlocked.includes(id);
            return `
                <div class="gamify-achievement ${isUnlocked ? 'unlocked' : 'locked'}">
                    <div class="gamify-achievement-icon">${isUnlocked ? achievement.icon : '🔒'}</div>
                    <div class="gamify-achievement-details">
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
        if (panel) {
            panel.classList.remove('visible');
            document.body.style.overflow = '';
        }
    }

    // ==========================================
    // TOAST NOTIFICATIONS
    // ==========================================

    function showToast(type, detail) {
        // Achievement toast only
        if (type === 'achievement') {
            const achievement = detail.achievement;
            const toast = document.createElement('div');
            toast.className = 'gamify-toast achievement-toast';
            toast.innerHTML = `
                <div class="gamify-toast-icon">${achievement.icon}</div>
                <div class="gamify-toast-content">
                    <div class="gamify-toast-title">Achievement Unlocked!</div>
                    <div class="gamify-toast-text">${achievement.name}</div>
                </div>
            `;
            document.body.appendChild(toast);

            setTimeout(() => toast.classList.add('visible'), 100);
            setTimeout(() => {
                toast.classList.remove('visible');
                setTimeout(() => toast.remove(), 300);
            }, 4000);
        }
    }

    // ==========================================
    // EVENT LISTENERS
    // ==========================================

    function setupEventListeners() {
        // XP gained - animate avatar
        window.addEventListener('gamify:xp-gained', (e) => {
            animateAvatarXP(e.detail.amount);
        });

        // Level up - special animation
        window.addEventListener('gamify:level-up', (e) => {
            animateLevelUp(e.detail.newLevel);
        });

        // Achievement unlocked
        window.addEventListener('gamify:achievement-unlocked', (e) => {
            showToast('achievement', e.detail);
        });

        // Data synced from server - refresh panel if open
        window.addEventListener('gamify:synced', () => {
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

        // Wait for auth container to be ready
        const authContainer = document.getElementById('auth-container');
        if (!authContainer) {
            return;
        }

        // Now we can mark as initialized
        isInitialized = true;

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
        setTimeout(init, 100);
    }

    // Also try to init when navbar loads
    const navbarObserver = new MutationObserver((mutations, obs) => {
        if (document.querySelector('#auth-container') && !isInitialized) {
            init();
            obs.disconnect();
        }
    });

    navbarObserver.observe(document.body, { childList: true, subtree: true });

    // Expose for external use
    window.GamificationUI = {
        init,
        toggleAchievementsPanel,
        showToast
    };

})();
