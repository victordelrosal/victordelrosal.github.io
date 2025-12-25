/**
 * Gamification System - Ocean-themed XP, Levels, Streaks & Achievements
 * Incentivizes engagement through game mechanics
 */

(function() {
    'use strict';

    // ==========================================
    // CONFIGURATION
    // ==========================================

    const XP_CONFIG = {
        pageView: 5,
        wave: 10,
        comment: 20,
        share: 15,
        dailyVisit: 25,
        streakBonus: 10,  // Per day in streak
        firstComment: 50, // Bonus for first ever comment
        firstWave: 25     // Bonus for first ever wave
    };

    // Ocean-themed levels - Rainbow spectrum + precious metals
    // Designed for ~50-75 XP/day engagement rate
    const LEVELS = [
        { name: 'Droplet', minXP: 0, icon: '💧', color: '#87CEEB', borderClass: 'level-droplet' },
        { name: 'Ripple', minXP: 50, icon: '🌊', color: '#00CED1', borderClass: 'level-ripple' },
        { name: 'Wave', minXP: 200, icon: '🌊', color: '#00E676', borderClass: 'level-wave' },
        { name: 'Current', minXP: 500, icon: '🌀', color: '#FFEB3B', borderClass: 'level-current' },
        { name: 'Surge', minXP: 950, icon: '⚡', color: '#FF9800', borderClass: 'level-surge' },
        { name: 'Tide', minXP: 1600, icon: '🔥', color: '#F44336', borderClass: 'level-tide' },
        { name: 'Tsunami', minXP: 2500, icon: '🌀', color: '#E040FB', borderClass: 'level-tsunami' },
        { name: 'Silver', minXP: 3700, icon: '🥈', color: '#C0C0C0', borderClass: 'level-silver' },
        { name: 'Gold', minXP: 5200, icon: '🥇', color: '#FFD700', borderClass: 'level-gold' },
        { name: 'Diamond', minXP: 7500, icon: '💎', color: '#B9F2FF', borderClass: 'level-diamond' }
    ];

    // Achievement definitions
    const ACHIEVEMENTS = {
        // Reading achievements
        first_read: {
            id: 'first_read',
            name: 'First Dive',
            description: 'Read your first wave',
            icon: '📖',
            xpReward: 10
        },
        deep_diver: {
            id: 'deep_diver',
            name: 'Deep Diver',
            description: 'Read 10 waves',
            icon: '🤿',
            requirement: 10,
            xpReward: 50
        },
        ocean_explorer: {
            id: 'ocean_explorer',
            name: 'Ocean Explorer',
            description: 'Read 25 waves',
            icon: '🧭',
            requirement: 25,
            xpReward: 100
        },
        wave_surfer: {
            id: 'wave_surfer',
            name: 'Wave Surfer',
            description: 'Read 50 waves',
            icon: '🏄',
            requirement: 50,
            xpReward: 200
        },

        // Wave/reaction achievements
        first_wave: {
            id: 'first_wave',
            name: 'First Wave',
            description: 'Wave at your first post',
            icon: '👋',
            xpReward: 25
        },
        wave_maker: {
            id: 'wave_maker',
            name: 'Wave Maker',
            description: 'Wave at 10 posts',
            icon: '🌊',
            requirement: 10,
            xpReward: 75
        },
        wave_enthusiast: {
            id: 'wave_enthusiast',
            name: 'Wave Enthusiast',
            description: 'Wave at 25 posts',
            icon: '🌊',
            requirement: 25,
            xpReward: 150
        },

        // Comment achievements
        first_comment: {
            id: 'first_comment',
            name: 'Voice of the Sea',
            description: 'Leave your first comment',
            icon: '💬',
            xpReward: 50
        },
        conversationalist: {
            id: 'conversationalist',
            name: 'Conversationalist',
            description: 'Leave 10 comments',
            icon: '🗣️',
            requirement: 10,
            xpReward: 100
        },

        // Share achievements
        first_share: {
            id: 'first_share',
            name: 'Message in a Bottle',
            description: 'Share your first wave',
            icon: '📬',
            xpReward: 25
        },
        sharing_sailor: {
            id: 'sharing_sailor',
            name: 'Sharing Sailor',
            description: 'Share 10 waves',
            icon: '⛵',
            requirement: 10,
            xpReward: 100
        },

        // Streak achievements
        streak_3: {
            id: 'streak_3',
            name: 'Consistent Current',
            description: '3-day visit streak',
            icon: '🔥',
            requirement: 3,
            xpReward: 30
        },
        streak_7: {
            id: 'streak_7',
            name: 'Weekly Wave',
            description: '7-day visit streak',
            icon: '🔥',
            requirement: 7,
            xpReward: 75
        },
        streak_14: {
            id: 'streak_14',
            name: 'Fortnight Tide',
            description: '14-day visit streak',
            icon: '🔥',
            requirement: 14,
            xpReward: 150
        },
        streak_30: {
            id: 'streak_30',
            name: 'Monthly Moon',
            description: '30-day visit streak',
            icon: '🌙',
            requirement: 30,
            xpReward: 500
        },

        // Time-based achievements
        night_owl: {
            id: 'night_owl',
            name: 'Night Owl',
            description: 'Engage after midnight',
            icon: '🦉',
            xpReward: 25
        },
        early_bird: {
            id: 'early_bird',
            name: 'Early Bird',
            description: 'Engage before 7 AM',
            icon: '🐦',
            xpReward: 25
        },

        // Special achievements
        subscriber: {
            id: 'subscriber',
            name: 'Connected',
            description: 'Subscribe to updates',
            icon: '📧',
            xpReward: 50
        }
    };

    // Storage keys
    const STORAGE_KEYS = {
        xp: 'gamify_xp',
        stats: 'gamify_stats',
        achievements: 'gamify_achievements',
        streak: 'gamify_streak',
        lastVisit: 'gamify_last_visit',
        anonId: 'gamify_anon_id',
        anonName: 'gamify_anon_name'
    };

    // Ocean-themed name components for anonymous users
    const OCEAN_NAME_PREFIXES = [
        'Wave', 'Tide', 'Reef', 'Coral', 'Shell', 'Pearl', 'Drift', 'Harbor',
        'Cove', 'Bay', 'Deep', 'Azure', 'Aqua', 'Marina', 'Lagoon', 'Kelp'
    ];
    const OCEAN_NAME_SUFFIXES = [
        'Surfer', 'Diver', 'Sailor', 'Explorer', 'Voyager', 'Wanderer',
        'Seeker', 'Swimmer', 'Cruiser', 'Fisher', 'Watcher', 'Rider'
    ];

    // ==========================================
    // DATA MANAGEMENT
    // ==========================================

    let syncEnabled = false;
    let currentUserId = null;
    let syncDebounceTimer = null;
    let isAnonymousUser = false;
    let anonymousId = null;
    let anonymousName = null;

    // ==========================================
    // ANONYMOUS USER MANAGEMENT
    // ==========================================

    function generateOceanName() {
        const prefix = OCEAN_NAME_PREFIXES[Math.floor(Math.random() * OCEAN_NAME_PREFIXES.length)];
        const suffix = OCEAN_NAME_SUFFIXES[Math.floor(Math.random() * OCEAN_NAME_SUFFIXES.length)];
        // Add short unique suffix from UUID
        const uniqueId = crypto.randomUUID().split('-')[0].substring(0, 4);
        return `${prefix}${suffix}_${uniqueId}`;
    }

    function getOrCreateAnonId() {
        let anonId = localStorage.getItem(STORAGE_KEYS.anonId);
        let anonName = localStorage.getItem(STORAGE_KEYS.anonName);

        if (!anonId) {
            anonId = crypto.randomUUID();
            anonName = generateOceanName();
            localStorage.setItem(STORAGE_KEYS.anonId, anonId);
            localStorage.setItem(STORAGE_KEYS.anonName, anonName);
        }

        return { anonId, anonName };
    }

    function getAnonDisplayName() {
        return localStorage.getItem(STORAGE_KEYS.anonName) || 'Guest';
    }

    function isAnonymous() {
        return isAnonymousUser && !currentUserId;
    }

    async function initAnonymousUser() {
        const { anonId, anonName } = getOrCreateAnonId();
        anonymousId = anonId;
        anonymousName = anonName;
        isAnonymousUser = true;

        // Register with Supabase (creates if new, returns existing if found)
        if (window.SupabaseClient) {
            try {
                const supabase = window.SupabaseClient.getClient?.();
                if (supabase) {
                    const { data, error } = await supabase.rpc('get_or_create_anonymous_user', {
                        p_anon_id: anonId,
                        p_display_name: anonName
                    });

                    if (error) {
                        console.error('[Gamification] Error initializing anonymous user:', error);
                    } else if (data) {
                        // Merge server data with local data
                        const serverXP = data.xp || 0;
                        const localXP = getStoredData(STORAGE_KEYS.xp, 0);
                        if (serverXP > localXP) {
                            localStorage.setItem(STORAGE_KEYS.xp, JSON.stringify(serverXP));
                        }
                        if (data.stats) {
                            const localStats = getStoredData(STORAGE_KEYS.stats, { reads: 0, waves: 0, comments: 0, shares: 0, postsRead: [] });
                            const merged = {
                                reads: Math.max(localStats.reads || 0, data.stats.reads || 0),
                                waves: Math.max(localStats.waves || 0, data.stats.waves || 0),
                                comments: Math.max(localStats.comments || 0, data.stats.comments || 0),
                                shares: Math.max(localStats.shares || 0, data.stats.shares || 0),
                                postsRead: [...new Set([...(localStats.postsRead || []), ...(data.stats.postsRead || [])])]
                            };
                            localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify(merged));
                        }
                    }
                }
            } catch (e) {
                console.error('[Gamification] Error initializing anonymous user:', e);
            }
        }
    }

    async function syncAnonymousToSupabase() {
        if (!isAnonymousUser || !anonymousId || !window.SupabaseClient) return;

        try {
            const supabase = window.SupabaseClient.getClient?.();
            if (!supabase) return;

            const xp = getStoredData(STORAGE_KEYS.xp, 0);
            const stats = getStoredData(STORAGE_KEYS.stats, { reads: 0, waves: 0, comments: 0, shares: 0, postsRead: [] });
            const displayName = localStorage.getItem(STORAGE_KEYS.anonName) || anonymousName || 'Guest';

            // Use upsert function to sync current state
            const { error } = await supabase.rpc('sync_anonymous_user', {
                p_anon_id: anonymousId,
                p_display_name: displayName,
                p_xp: xp,
                p_stats: stats
            });

            if (error) {
                console.error('[Gamification] Anonymous sync error:', error);
            }
        } catch (e) {
            console.error('[Gamification] Anonymous sync error:', e);
        }
    }

    async function mergeAnonymousToRegistered(userId) {
        if (!anonymousId || !window.SupabaseClient) return false;

        try {
            const supabase = window.SupabaseClient.getClient?.();
            if (!supabase) return false;

            // First sync current state
            await syncAnonymousToSupabase();

            // Then merge to registered account
            const { data, error } = await supabase.rpc('merge_anonymous_to_registered', {
                p_anon_id: anonymousId,
                p_user_id: userId
            });

            if (error) {
                console.error('[Gamification] Merge error:', error);
                return false;
            }

            // Clear anonymous data from localStorage
            localStorage.removeItem(STORAGE_KEYS.anonId);
            localStorage.removeItem(STORAGE_KEYS.anonName);
            isAnonymousUser = false;
            anonymousId = null;
            anonymousName = null;

            return true;
        } catch (e) {
            console.error('[Gamification] Merge error:', e);
            return false;
        }
    }

    function getStoredData(key, defaultValue) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error('[Gamification] Error reading storage:', e);
            return defaultValue;
        }
    }

    function setStoredData(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            // Debounced sync to Supabase
            if (syncEnabled && currentUserId) {
                debouncedSync();
            } else if (isAnonymousUser && anonymousId) {
                // Sync anonymous user data
                debouncedAnonSync();
            }
        } catch (e) {
            console.error('[Gamification] Error writing storage:', e);
        }
    }

    let anonSyncDebounceTimer = null;
    function debouncedAnonSync() {
        if (anonSyncDebounceTimer) clearTimeout(anonSyncDebounceTimer);
        anonSyncDebounceTimer = setTimeout(() => {
            syncAnonymousToSupabase();
        }, 2000); // Wait 2 seconds before syncing anonymous data
    }

    // ==========================================
    // SUPABASE SYNC
    // ==========================================

    function debouncedSync() {
        if (syncDebounceTimer) clearTimeout(syncDebounceTimer);
        syncDebounceTimer = setTimeout(() => {
            syncToSupabase();
        }, 1000); // Wait 1 second before syncing to batch updates
    }

    async function syncToSupabase() {
        if (!syncEnabled || !currentUserId || !window.SupabaseClient) return;

        try {
            const supabase = window.SupabaseClient.getClient();
            if (!supabase) return;

            const data = {
                user_id: currentUserId,
                xp: getStoredData(STORAGE_KEYS.xp, 0),
                stats: getStoredData(STORAGE_KEYS.stats, { reads: 0, waves: 0, comments: 0, shares: 0, postsRead: [] }),
                achievements: getStoredData(STORAGE_KEYS.achievements, []),
                streak_count: getStoredData(STORAGE_KEYS.streak, { count: 0 }).count || 0,
                streak_last_date: getStoredData(STORAGE_KEYS.streak, {}).lastDate || null
            };

            const { error } = await supabase
                .from('user_gamification')
                .upsert(data, { onConflict: 'user_id' });

            if (error) {
                console.error('[Gamification] Sync error:', error);
            }
        } catch (e) {
            console.error('[Gamification] Sync error:', e);
        }
    }

    async function loadFromSupabase() {
        if (!currentUserId || !window.SupabaseClient) return null;

        try {
            const supabase = window.SupabaseClient.getClient();
            if (!supabase) return null;

            const { data, error } = await supabase
                .from('user_gamification')
                .select('*')
                .eq('user_id', currentUserId)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
                console.error('[Gamification] Load error:', error);
                return null;
            }

            return data;
        } catch (e) {
            console.error('[Gamification] Load error:', e);
            return null;
        }
    }

    function mergeData(local, server) {
        // Take the higher values - user should never lose progress
        if (!server) return local;

        return {
            xp: Math.max(local.xp || 0, server.xp || 0),
            stats: {
                reads: Math.max(local.stats?.reads || 0, server.stats?.reads || 0),
                waves: Math.max(local.stats?.waves || 0, server.stats?.waves || 0),
                comments: Math.max(local.stats?.comments || 0, server.stats?.comments || 0),
                shares: Math.max(local.stats?.shares || 0, server.stats?.shares || 0),
                postsRead: [...new Set([...(local.stats?.postsRead || []), ...(server.stats?.postsRead || [])])]
            },
            achievements: [...new Set([...(local.achievements || []), ...(server.achievements || [])])],
            streak: {
                count: Math.max(local.streak?.count || 0, server.streak_count || 0),
                lastDate: local.streak?.lastDate || server.streak_last_date
            }
        };
    }

    async function initSync(userId) {
        if (!userId) {
            syncEnabled = false;
            currentUserId = null;
            return;
        }

        currentUserId = userId;

        // Load server data
        const serverData = await loadFromSupabase();

        // Get local data
        const localData = {
            xp: getStoredData(STORAGE_KEYS.xp, 0),
            stats: getStoredData(STORAGE_KEYS.stats, { reads: 0, waves: 0, comments: 0, shares: 0, postsRead: [] }),
            achievements: getStoredData(STORAGE_KEYS.achievements, []),
            streak: getStoredData(STORAGE_KEYS.streak, { count: 0, lastDate: null })
        };

        // Merge data (take higher values)
        const merged = mergeData(localData, serverData);

        // Update local storage with merged data
        localStorage.setItem(STORAGE_KEYS.xp, JSON.stringify(merged.xp));
        localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify(merged.stats));
        localStorage.setItem(STORAGE_KEYS.achievements, JSON.stringify(merged.achievements));
        localStorage.setItem(STORAGE_KEYS.streak, JSON.stringify(merged.streak));

        // Enable sync and save merged data to server
        syncEnabled = true;
        await syncToSupabase();

        // Dispatch event so UI can update
        window.dispatchEvent(new CustomEvent('gamify:synced', { detail: merged }));
    }

    // Listen for auth state changes
    if (window.SupabaseClient) {
        window.SupabaseClient.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                // User just signed in - merge anonymous data if exists
                if (isAnonymousUser && anonymousId) {
                    console.log('[Gamification] Merging anonymous data to registered user...');
                    await mergeAnonymousToRegistered(session.user.id);
                }
                await initSync(session.user.id);
            } else {
                syncEnabled = false;
                currentUserId = null;
                // Initialize as anonymous user when not logged in
                initAnonymousUser();
            }
        });
    }

    // Also check on load if already logged in
    setTimeout(async () => {
        if (window.SupabaseClient) {
            const user = window.SupabaseClient.getCurrentUser();
            if (user) {
                await initSync(user.id);
            } else {
                // Not logged in - initialize as anonymous
                await initAnonymousUser();
            }
        } else {
            // No Supabase client - still track anonymously locally
            getOrCreateAnonId();
            isAnonymousUser = true;
        }
    }, 500);

    function getStats() {
        return getStoredData(STORAGE_KEYS.stats, {
            reads: 0,
            waves: 0,
            comments: 0,
            shares: 0,
            postsRead: []  // Track unique post slugs
        });
    }

    function updateStats(field, slug = null) {
        const stats = getStats();
        stats[field] = (stats[field] || 0) + 1;

        // Track unique posts read
        if (field === 'reads' && slug && !stats.postsRead.includes(slug)) {
            stats.postsRead.push(slug);
        }

        setStoredData(STORAGE_KEYS.stats, stats);
        return stats;
    }

    function getXP() {
        return getStoredData(STORAGE_KEYS.xp, 0);
    }

    function addXP(amount, reason) {
        const currentXP = getXP();
        const newXP = currentXP + amount;
        setStoredData(STORAGE_KEYS.xp, newXP);

        // Dispatch event for UI updates
        window.dispatchEvent(new CustomEvent('gamify:xp-gained', {
            detail: { amount, total: newXP, reason }
        }));

        // Check for level up
        const oldLevel = getLevelForXP(currentXP);
        const newLevel = getLevelForXP(newXP);
        if (newLevel.name !== oldLevel.name) {
            window.dispatchEvent(new CustomEvent('gamify:level-up', {
                detail: { oldLevel, newLevel, totalXP: newXP }
            }));
        }

        return newXP;
    }

    function getUnlockedAchievements() {
        return getStoredData(STORAGE_KEYS.achievements, []);
    }

    function unlockAchievement(achievementId) {
        const unlocked = getUnlockedAchievements();
        if (unlocked.includes(achievementId)) return false;

        const achievement = ACHIEVEMENTS[achievementId];
        if (!achievement) return false;

        unlocked.push(achievementId);
        setStoredData(STORAGE_KEYS.achievements, unlocked);

        // Award XP for achievement
        if (achievement.xpReward) {
            addXP(achievement.xpReward, `Achievement: ${achievement.name}`);
        }

        // Dispatch event for UI notification
        window.dispatchEvent(new CustomEvent('gamify:achievement-unlocked', {
            detail: { achievement }
        }));

        return true;
    }

    function hasAchievement(achievementId) {
        return getUnlockedAchievements().includes(achievementId);
    }

    // ==========================================
    // LEVEL SYSTEM
    // ==========================================

    function getLevelForXP(xp) {
        let currentLevel = LEVELS[0];
        for (const level of LEVELS) {
            if (xp >= level.minXP) {
                currentLevel = level;
            } else {
                break;
            }
        }
        return currentLevel;
    }

    function getLevelProgress(xp) {
        const currentLevel = getLevelForXP(xp);
        const currentIndex = LEVELS.indexOf(currentLevel);
        const nextLevel = LEVELS[currentIndex + 1];

        if (!nextLevel) {
            return { current: currentLevel, next: null, progress: 100, xpToNext: 0 };
        }

        const xpInLevel = xp - currentLevel.minXP;
        const xpForLevel = nextLevel.minXP - currentLevel.minXP;
        const progress = Math.min((xpInLevel / xpForLevel) * 100, 100);

        return {
            current: currentLevel,
            next: nextLevel,
            progress,
            xpToNext: nextLevel.minXP - xp
        };
    }

    // ==========================================
    // STREAK SYSTEM
    // ==========================================

    function getStreak() {
        return getStoredData(STORAGE_KEYS.streak, { count: 0, lastDate: null });
    }

    function updateStreak() {
        const streak = getStreak();
        const today = new Date().toDateString();
        const lastVisit = streak.lastDate;

        if (lastVisit === today) {
            // Already visited today
            return streak;
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        if (lastVisit === yesterdayStr) {
            // Continuing streak
            streak.count++;
            streak.lastDate = today;

            // Award streak bonus
            addXP(XP_CONFIG.dailyVisit + (XP_CONFIG.streakBonus * Math.min(streak.count, 10)),
                  `Daily visit (${streak.count} day streak)`);

            // Check streak achievements
            checkStreakAchievements(streak.count);
        } else if (!lastVisit || new Date(lastVisit) < yesterday) {
            // Streak broken or first visit
            const wasStreak = streak.count > 0;
            streak.count = 1;
            streak.lastDate = today;
            addXP(XP_CONFIG.dailyVisit, 'Daily visit');

            if (wasStreak) {
                window.dispatchEvent(new CustomEvent('gamify:streak-broken', {
                    detail: { previousStreak: getStoredData(STORAGE_KEYS.streak, {}).count || 0 }
                }));
            }
        }

        setStoredData(STORAGE_KEYS.streak, streak);
        return streak;
    }

    function checkStreakAchievements(streakCount) {
        if (streakCount >= 3 && !hasAchievement('streak_3')) unlockAchievement('streak_3');
        if (streakCount >= 7 && !hasAchievement('streak_7')) unlockAchievement('streak_7');
        if (streakCount >= 14 && !hasAchievement('streak_14')) unlockAchievement('streak_14');
        if (streakCount >= 30 && !hasAchievement('streak_30')) unlockAchievement('streak_30');
    }

    // ==========================================
    // ACTION TRACKING
    // ==========================================

    function trackPageView(slug) {
        const stats = getStats();
        const isFirstRead = stats.reads === 0;
        const isNewPost = !stats.postsRead.includes(slug);

        // Always award XP for viewing a wave
        updateStats('reads', slug);
        addXP(XP_CONFIG.pageView, 'Viewing a wave');

        // Check reading achievements (based on unique posts read)
        if (isFirstRead) unlockAchievement('first_read');

        if (isNewPost) {
            const newStats = getStats();
            if (newStats.postsRead.length >= 10 && !hasAchievement('deep_diver')) {
                unlockAchievement('deep_diver');
            }
            if (newStats.postsRead.length >= 25 && !hasAchievement('ocean_explorer')) {
                unlockAchievement('ocean_explorer');
            }
            if (newStats.postsRead.length >= 50 && !hasAchievement('wave_surfer')) {
                unlockAchievement('wave_surfer');
            }
        }

        // Check time-based achievements
        checkTimeAchievements();
    }

    function trackWave(slug) {
        const stats = getStats();
        const isFirstWave = stats.waves === 0;

        updateStats('waves');
        addXP(XP_CONFIG.wave + (isFirstWave ? XP_CONFIG.firstWave : 0),
              isFirstWave ? 'First wave ever!' : 'Waving at a wave');

        // Check wave achievements
        if (isFirstWave) unlockAchievement('first_wave');

        const newStats = getStats();
        if (newStats.waves >= 10 && !hasAchievement('wave_maker')) {
            unlockAchievement('wave_maker');
        }
        if (newStats.waves >= 25 && !hasAchievement('wave_enthusiast')) {
            unlockAchievement('wave_enthusiast');
        }

        checkTimeAchievements();
    }

    function trackComment() {
        const stats = getStats();
        const isFirstComment = stats.comments === 0;

        updateStats('comments');
        addXP(XP_CONFIG.comment + (isFirstComment ? XP_CONFIG.firstComment : 0),
              isFirstComment ? 'First comment ever!' : 'Leaving a comment');

        // Check comment achievements
        if (isFirstComment) unlockAchievement('first_comment');

        const newStats = getStats();
        if (newStats.comments >= 10 && !hasAchievement('conversationalist')) {
            unlockAchievement('conversationalist');
        }

        checkTimeAchievements();
    }

    function trackShare(platform) {
        const stats = getStats();
        const isFirstShare = stats.shares === 0;

        updateStats('shares');
        addXP(XP_CONFIG.share, `Sharing on ${platform}`);

        // Check share achievements
        if (isFirstShare) unlockAchievement('first_share');

        const newStats = getStats();
        if (newStats.shares >= 10 && !hasAchievement('sharing_sailor')) {
            unlockAchievement('sharing_sailor');
        }
    }

    function trackSubscription() {
        if (!hasAchievement('subscriber')) {
            unlockAchievement('subscriber');
        }
    }

    function checkTimeAchievements() {
        const hour = new Date().getHours();

        // Night owl: midnight to 4 AM
        if (hour >= 0 && hour < 4 && !hasAchievement('night_owl')) {
            unlockAchievement('night_owl');
        }

        // Early bird: 5 AM to 7 AM
        if (hour >= 5 && hour < 7 && !hasAchievement('early_bird')) {
            unlockAchievement('early_bird');
        }
    }

    // ==========================================
    // AVATAR BORDER - Level-based colors
    // ==========================================

    function updateAvatarBorder() {
        const avatar = document.querySelector('.user-avatar');
        if (!avatar) return;

        const xp = getXP();
        const levelProgress = getLevelProgress(xp);
        const currentLevel = levelProgress.current;

        // Remove all level classes
        LEVELS.forEach(level => {
            if (level.borderClass) {
                avatar.classList.remove(level.borderClass);
            }
        });

        // Add current level class
        if (currentLevel && currentLevel.borderClass) {
            avatar.classList.add(currentLevel.borderClass);
        }
    }

    // ==========================================
    // LEADERBOARD
    // ==========================================

    const LEADERBOARD_KEY = 'gamify_show_on_leaderboard';

    function getShowOnLeaderboard() {
        const stored = localStorage.getItem(LEADERBOARD_KEY);
        // Default to true (opt-out model)
        return stored !== 'false';
    }

    async function setShowOnLeaderboard(value) {
        localStorage.setItem(LEADERBOARD_KEY, value ? 'true' : 'false');

        // Sync to Supabase if available
        if (window.SupabaseClient) {
            const supabase = window.SupabaseClient.getClient?.();
            if (!supabase) return;

            const user = window.SupabaseClient.getCurrentUser?.();
            if (user) {
                // Registered user - upsert user_gamification (creates row if doesn't exist)
                try {
                    await supabase
                        .from('user_gamification')
                        .upsert({
                            user_id: user.id,
                            show_on_leaderboard: value
                        }, { onConflict: 'user_id' });
                } catch (err) {
                    console.error('Failed to sync leaderboard setting:', err);
                    throw err;
                }
            } else if (isAnonymousUser && anonymousId) {
                // Anonymous user - update anonymous_users
                try {
                    await supabase.rpc('set_anonymous_leaderboard_visibility', {
                        p_anon_id: anonymousId,
                        p_show: value
                    });
                } catch (err) {
                    console.error('Failed to sync anonymous leaderboard setting:', err);
                    throw err;
                }
            }
        }
    }

    async function fetchLeaderboard(limit = 50) {
        if (!window.SupabaseClient) return [];

        try {
            const supabase = window.SupabaseClient.getClient?.();
            if (!supabase) return [];

            const { data, error } = await supabase
                .from('leaderboard_view')
                .select('*')
                .limit(limit);

            if (error) throw error;

            // Add rank to each entry
            return (data || []).map((entry, index) => ({
                ...entry,
                rank: index + 1
            }));
        } catch (err) {
            console.error('Failed to fetch leaderboard:', err);
            return [];
        }
    }

    // ==========================================
    // PUBLIC API
    // ==========================================

    window.Gamification = {
        // Core data
        getXP,
        getStats,
        getStreak,
        getLevelProgress,
        getLevelForXP,

        // Achievements
        getUnlockedAchievements,
        getAllAchievements: () => ACHIEVEMENTS,
        hasAchievement,

        // Actions
        trackPageView,
        trackWave,
        trackComment,
        trackShare,
        trackSubscription,
        updateStreak,
        updateAvatarBorder,

        // Leaderboard
        getShowOnLeaderboard,
        setShowOnLeaderboard,
        fetchLeaderboard,

        // Anonymous users
        isAnonymous,
        getAnonDisplayName,
        getOrCreateAnonId,

        // Config access
        LEVELS,
        ACHIEVEMENTS,
        XP_CONFIG
    };

    // Initialize on page load
    document.addEventListener('DOMContentLoaded', () => {
        updateStreak();
        // Delay avatar border update to ensure avatar is rendered
        setTimeout(updateAvatarBorder, 500);
    });

    // Update avatar border after sync
    window.addEventListener('gamify:synced', updateAvatarBorder);

    // Update avatar border after level up
    window.addEventListener('gamify:level-up', updateAvatarBorder);

})();
