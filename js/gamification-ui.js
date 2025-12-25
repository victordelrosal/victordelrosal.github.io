/**
 * Gamification UI - Avatar animations, achievements panel, and notifications
 */

(function() {
    'use strict';

    let isInitialized = false;

    // ==========================================
    // AVATAR XP ANIMATION
    // ==========================================

    function animateAvatarXP(amount, reason) {
        const avatar = document.querySelector('.user-avatar');
        if (!avatar) return;

        // Add happy dance animation
        avatar.classList.add('xp-dance');

        // Create the XP notification bubble
        const notification = document.createElement('div');
        notification.className = 'xp-notification';

        // Position near avatar
        const avatarRect = avatar.getBoundingClientRect();
        notification.style.position = 'fixed';
        notification.style.left = `${avatarRect.left + avatarRect.width / 2}px`;
        notification.style.top = `${avatarRect.top + avatarRect.height / 2}px`;

        notification.innerHTML = `<span class="xp-earned">+${amount}</span>`;

        document.body.appendChild(notification);

        // Create the reason message card (to the left of avatar)
        if (reason) {
            const messageCard = document.createElement('div');
            messageCard.className = 'xp-message-card';
            messageCard.style.position = 'fixed';
            messageCard.style.right = `${window.innerWidth - avatarRect.left + 12}px`;
            messageCard.style.top = `${avatarRect.top + avatarRect.height / 2}px`;

            // Get icon based on reason
            const icon = getReasonIcon(reason);
            messageCard.innerHTML = `
                <span class="xp-message-icon">${icon}</span>
                <div class="xp-message-text">
                    <span class="xp-message-title">+${amount} pts</span>
                    <span class="xp-message-reason">${reason}</span>
                </div>
            `;

            document.body.appendChild(messageCard);

            requestAnimationFrame(() => {
                messageCard.classList.add('visible');
            });

            // Remove message card after animation
            setTimeout(() => {
                messageCard.classList.add('fading');
                setTimeout(() => messageCard.remove(), 400);
            }, 2500);
        }

        // Trigger animation after append
        requestAnimationFrame(() => {
            notification.classList.add('visible');
        });

        // Remove dance after animation
        setTimeout(() => {
            avatar.classList.remove('xp-dance');
        }, 1000);

        // Remove notification after animation
        setTimeout(() => {
            notification.classList.add('fading');
            setTimeout(() => notification.remove(), 400);
        }, 2200);
    }

    // Premium SVG icons for XP reasons
    const XP_ICONS = {
        wave: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="waveGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#00E5FF;stop-opacity:1"/>
                    <stop offset="50%" style="stop-color:#0091EA;stop-opacity:1"/>
                    <stop offset="100%" style="stop-color:#0D47A1;stop-opacity:1"/>
                </linearGradient>
                <linearGradient id="waveGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#00B8D4;stop-opacity:0.8"/>
                    <stop offset="100%" style="stop-color:#E0F7FA;stop-opacity:0.9"/>
                </linearGradient>
            </defs>
            <path d="M8 28c4-8 10-12 16-8s10 2 16-6" stroke="url(#waveGrad2)" stroke-width="4" stroke-linecap="round" fill="none"/>
            <path d="M6 36c6-10 14-14 20-8s12 4 16-4" stroke="url(#waveGrad1)" stroke-width="5" stroke-linecap="round" fill="none"/>
            <circle cx="12" cy="32" r="2" fill="#E0F7FA" opacity="0.8"/>
            <circle cx="28" cy="28" r="1.5" fill="#E0F7FA" opacity="0.6"/>
        </svg>`,
        share: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="shareGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#FF6D00;stop-opacity:1"/>
                    <stop offset="50%" style="stop-color:#FF9100;stop-opacity:1"/>
                    <stop offset="100%" style="stop-color:#FFAB00;stop-opacity:1"/>
                </linearGradient>
            </defs>
            <path d="M24 6L24 30" stroke="url(#shareGrad)" stroke-width="4" stroke-linecap="round"/>
            <path d="M16 14L24 6L32 14" stroke="url(#shareGrad)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            <path d="M10 24v14a4 4 0 004 4h20a4 4 0 004-4V24" stroke="url(#shareGrad)" stroke-width="4" stroke-linecap="round" fill="none"/>
        </svg>`,
        comment: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="commentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#7C4DFF;stop-opacity:1"/>
                    <stop offset="100%" style="stop-color:#536DFE;stop-opacity:1"/>
                </linearGradient>
            </defs>
            <path d="M8 12a4 4 0 014-4h24a4 4 0 014 4v18a4 4 0 01-4 4H18l-8 8v-8a4 4 0 01-2-3.5V12z" fill="url(#commentGrad)"/>
            <circle cx="16" cy="21" r="2" fill="#E8EAF6"/>
            <circle cx="24" cy="21" r="2" fill="#E8EAF6"/>
            <circle cx="32" cy="21" r="2" fill="#E8EAF6"/>
        </svg>`,
        reaction: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="handGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#FFB74D;stop-opacity:1"/>
                    <stop offset="100%" style="stop-color:#FFCC80;stop-opacity:1"/>
                </linearGradient>
            </defs>
            <path d="M30 14c0-2 1.5-4 4-4s4 2 4 4v12c0 8-6 14-14 14h-2c-6 0-12-4-12-12v-4c0-2 2-4 4-4s4 2 4 4v-8c0-2 2-4 4-4s4 2 4 4v-2c0-2 2-4 4-4s4 2 4 4" stroke="url(#handGrad)" stroke-width="3" stroke-linecap="round" fill="none"/>
            <path d="M8 18l-2 2M6 12l-2-1M12 8l-1-3" stroke="#FFCC80" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
        </svg>`,
        subscribe: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="mailGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#26C6DA;stop-opacity:1"/>
                    <stop offset="100%" style="stop-color:#00ACC1;stop-opacity:1"/>
                </linearGradient>
            </defs>
            <rect x="6" y="12" width="36" height="26" rx="4" fill="url(#mailGrad)"/>
            <path d="M6 16l18 12 18-12" stroke="#E0F7FA" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            <circle cx="38" cy="14" r="6" fill="#FF5252"/>
            <path d="M36 14h4M38 12v4" stroke="white" stroke-width="2" stroke-linecap="round"/>
        </svg>`,
        streak: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="fireGrad1" x1="50%" y1="100%" x2="50%" y2="0%">
                    <stop offset="0%" style="stop-color:#FF6D00;stop-opacity:1"/>
                    <stop offset="50%" style="stop-color:#FF9100;stop-opacity:1"/>
                    <stop offset="100%" style="stop-color:#FFAB00;stop-opacity:1"/>
                </linearGradient>
                <linearGradient id="fireGrad2" x1="50%" y1="100%" x2="50%" y2="0%">
                    <stop offset="0%" style="stop-color:#FF3D00;stop-opacity:1"/>
                    <stop offset="100%" style="stop-color:#FF6D00;stop-opacity:1"/>
                </linearGradient>
            </defs>
            <path d="M24 4c0 8-8 12-8 20 0 8 6 14 14 14s14-6 14-14c0-10-12-12-12-20-4 4-8 8-8 0z" fill="url(#fireGrad1)"/>
            <path d="M24 18c0 4-4 6-4 10 0 4 3 7 7 7s7-3 7-7c0-5-6-6-6-10-2 2-4 4-4 0z" fill="url(#fireGrad2)"/>
            <ellipse cx="24" cy="35" rx="3" ry="4" fill="#FFECB3"/>
        </svg>`,
        star: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#FFD740;stop-opacity:1"/>
                    <stop offset="50%" style="stop-color:#FFC400;stop-opacity:1"/>
                    <stop offset="100%" style="stop-color:#FFAB00;stop-opacity:1"/>
                </linearGradient>
            </defs>
            <path d="M24 4l5.5 12.5L43 18l-10 9 3 13-12-7-12 7 3-13-10-9 13.5-1.5z" fill="url(#starGrad)"/>
            <path d="M24 10l3 7 7.5 1-5.5 5 1.5 7.5L24 27l-6.5 3.5L19 23l-5.5-5 7.5-1z" fill="#FFF8E1" opacity="0.5"/>
        </svg>`,
        sparkle: `<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="sparkleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#E1BEE7;stop-opacity:1"/>
                    <stop offset="50%" style="stop-color:#CE93D8;stop-opacity:1"/>
                    <stop offset="100%" style="stop-color:#AB47BC;stop-opacity:1"/>
                </linearGradient>
            </defs>
            <path d="M24 2l3 10 10 3-10 3-3 10-3-10-10-3 10-3z" fill="url(#sparkleGrad)"/>
            <path d="M38 22l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="#E1BEE7"/>
            <path d="M12 28l1.5 5 5 1.5-5 1.5-1.5 5-1.5-5-5-1.5 5-1.5z" fill="#CE93D8"/>
        </svg>`
    };

    function getReasonIcon(reason) {
        const lowerReason = reason.toLowerCase();
        if (lowerReason.includes('wave') || lowerReason.includes('read') || lowerReason.includes('view')) return XP_ICONS.wave;
        if (lowerReason.includes('share')) return XP_ICONS.share;
        if (lowerReason.includes('comment')) return XP_ICONS.comment;
        if (lowerReason.includes('reaction') || lowerReason.includes('gave')) return XP_ICONS.reaction;
        if (lowerReason.includes('subscribe')) return XP_ICONS.subscribe;
        if (lowerReason.includes('streak')) return XP_ICONS.streak;
        if (lowerReason.includes('first')) return XP_ICONS.star;
        return XP_ICONS.sparkle;
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
    // LEADERBOARD PANEL
    // ==========================================

    function createLeaderboardPanel() {
        const panel = document.createElement('div');
        panel.className = 'gamify-panel leaderboard-panel';
        panel.id = 'leaderboard-panel';
        panel.innerHTML = `
            <div class="gamify-panel-backdrop"></div>
            <div class="gamify-panel-content">
                <button class="gamify-panel-close">&times;</button>
                <div class="gamify-panel-header">
                    <h2>🏆 Leaderboard</h2>
                </div>
                <div class="gamify-panel-body">
                    <div class="leaderboard-list" id="leaderboard-list">
                        <div class="leaderboard-loading">Loading...</div>
                    </div>
                </div>
            </div>
        `;

        // Close handlers
        panel.querySelector('.gamify-panel-backdrop').addEventListener('click', closeLeaderboardPanel);
        panel.querySelector('.gamify-panel-close').addEventListener('click', closeLeaderboardPanel);

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && panel.classList.contains('visible')) {
                closeLeaderboardPanel();
            }
        });

        return panel;
    }

    async function renderLeaderboardPanel() {
        const listEl = document.getElementById('leaderboard-list');
        if (!listEl) return;

        listEl.innerHTML = '<div class="leaderboard-loading">Loading...</div>';

        try {
            const leaderboard = await window.Gamification.fetchLeaderboard();
            const currentUser = window.SupabaseClient?.getCurrentUser?.();

            if (!leaderboard || leaderboard.length === 0) {
                listEl.innerHTML = `
                    <div class="leaderboard-empty">
                        <p>No one on the leaderboard yet!</p>
                        <p class="leaderboard-empty-hint">Enable "Show me on leaderboard" in settings to be the first.</p>
                    </div>
                `;
                return;
            }

            const allLevels = window.Gamification.LEVELS;

            listEl.innerHTML = leaderboard.map(entry => {
                const level = allLevels.find(l => entry.xp >= l.minXP && (!allLevels[allLevels.indexOf(l) + 1] || entry.xp < allLevels[allLevels.indexOf(l) + 1].minXP)) || allLevels[0];
                const isCurrentUser = currentUser && entry.user_id === currentUser.id;
                const rankClass = entry.rank === 1 ? 'gold' : entry.rank === 2 ? 'silver' : entry.rank === 3 ? 'bronze' : '';

                return `
                    <div class="leaderboard-entry ${isCurrentUser ? 'current-user' : ''} ${rankClass}">
                        <div class="leaderboard-rank">${entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}</div>
                        <img class="leaderboard-avatar" src="${entry.avatar_url || '/img/default-avatar.png'}" alt="${entry.full_name || 'User'}">
                        <div class="leaderboard-info">
                            <span class="leaderboard-name">${entry.full_name || 'Anonymous'}</span>
                            <span class="leaderboard-level" style="color: ${level.color}">${level.icon} ${level.name}</span>
                        </div>
                        <div class="leaderboard-xp">${entry.xp.toLocaleString()} XP</div>
                    </div>
                `;
            }).join('');
        } catch (err) {
            console.error('Failed to render leaderboard:', err);
            listEl.innerHTML = '<div class="leaderboard-error">Failed to load leaderboard</div>';
        }
    }

    function toggleLeaderboardPanel() {
        let panel = document.getElementById('leaderboard-panel');
        if (!panel) {
            panel = createLeaderboardPanel();
            document.body.appendChild(panel);
        }

        if (panel.classList.contains('visible')) {
            closeLeaderboardPanel();
        } else {
            renderLeaderboardPanel();
            panel.classList.add('visible');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeLeaderboardPanel() {
        const panel = document.getElementById('leaderboard-panel');
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
        // XP gained - animate avatar and show reason
        window.addEventListener('gamify:xp-gained', (e) => {
            animateAvatarXP(e.detail.amount, e.detail.reason);
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
        toggleLeaderboardPanel,
        showToast
    };

})();
