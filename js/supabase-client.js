/**
 * Supabase Client with Authentication
 * Handles Google Sign-In with token exchange for branded OAuth experience
 */

// Prevent double-loading
if (!window.SupabaseClient) {
  (function () {
    // Supabase Configuration (injected at runtime, not hard-coded)
    const supabaseConfig = window.__SUPABASE_CONFIG || {};
    const SUPABASE_URL = supabaseConfig.url || supabaseConfig.supabaseUrl;
    const SUPABASE_ANON_KEY = supabaseConfig.anonKey || supabaseConfig.supabaseAnonKey;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('Supabase configuration is missing. Define window.__SUPABASE_CONFIG = { url, anonKey } before loading supabase-client.js.');
      return;
    }

    // Google OAuth Client ID (for branded sign-in on victordelrosal.com)
    const GOOGLE_CLIENT_ID = '67204010920-ifejjqhm4128lk0gfnlkv3p9cdq7o1tv.apps.googleusercontent.com';

    // Initialize Supabase client (requires supabase-js to be loaded first)
    let supabase = null;
    let currentUser = null;
    let commentUserProfile = null;
    let authStateListeners = [];
    let googleScriptLoaded = false;
    let googleScriptLoading = false;
    let authInitPromise = null;  // Deduplication: track ongoing/completed init

    /**
     * Initialize the Supabase client
     * Call this after the supabase-js script has loaded
     */
    function initSupabase() {
      // Don't recreate if client already exists - prevents auth state issues
      if (supabase) return true;

      // Check for both the namespaced version and direct createClient
      const createClientFn = window.supabase?.createClient || window.createClient;

      if (createClientFn) {
        supabase = createClientFn(SUPABASE_URL, SUPABASE_ANON_KEY);
        return true;
      }
      console.error('Supabase JS library not loaded.');
      return false;
    }

    /**
     * Initialize authentication state
     * Sets up listener for auth changes and loads current session
     * Deduplicated: returns existing promise if already running/completed
     */
    async function initAuth() {
      // Deduplication: if already running or completed, return existing promise
      if (authInitPromise) {
        return authInitPromise;
      }

      // Create the promise and store it immediately to prevent race conditions
      authInitPromise = (async () => {
        if (!supabase) {
          if (!initSupabase()) return;
        }

        const AUTH_TIMEOUT = 5000; // 5 second timeout for auth operations

        try {
          // Get current session with timeout
          const sessionPromise = supabase.auth.getSession();
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Auth session timeout')), AUTH_TIMEOUT)
          );

          let session = null;
          try {
            const result = await Promise.race([sessionPromise, timeoutPromise]);
            session = result?.data?.session;
          } catch (e) {
            console.warn('[auth] Session retrieval timed out, continuing without session');
          }

          if (session) {
            currentUser = session.user;
            // Load profile with timeout
            try {
              await Promise.race([
                loadUserProfile(),
                new Promise((_, reject) =>
                  setTimeout(() => reject(new Error('Profile load timeout')), AUTH_TIMEOUT)
                )
              ]);
            } catch (e) {
              console.warn('[auth] Profile load timed out, continuing without profile');
            }
          }

          // Listen for auth changes (only register once due to deduplication)
          supabase.auth.onAuthStateChange(async (event, session) => {
            currentUser = session?.user || null;

            if (currentUser) {
              // Don't block on profile load in listener
              loadUserProfile().catch(e => console.warn('[auth] Profile load failed:', e));
            } else {
              commentUserProfile = null;
            }

            // Notify all listeners
            authStateListeners.forEach(callback => callback(currentUser, commentUserProfile));
          });
        } catch (error) {
          console.error('Failed to initialize auth:', error);
        }
      })();

      return authInitPromise;
    }

    /**
     * Add a listener for auth state changes
     * @param {Function} callback - Called with (user, profile) on auth changes
     */
    function onAuthStateChange(callback) {
      authStateListeners.push(callback);
      // Immediately call with current state
      callback(currentUser, commentUserProfile);
    }

    /**
     * Load Google Identity Services script
     */
    function loadGoogleScript() {
      return new Promise((resolve, reject) => {
        if (googleScriptLoaded) {
          resolve();
          return;
        }

        if (googleScriptLoading) {
          // Wait for existing load
          const checkLoaded = setInterval(() => {
            if (googleScriptLoaded) {
              clearInterval(checkLoaded);
              resolve();
            }
          }, 100);
          return;
        }

        googleScriptLoading = true;
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          googleScriptLoaded = true;
          googleScriptLoading = false;
          resolve();
        };
        script.onerror = () => {
          googleScriptLoading = false;
          reject(new Error('Failed to load Google Identity Services'));
        };
        document.head.appendChild(script);
      });
    }

    /**
     * Handle Google credential response and exchange with Supabase
     */
    async function handleGoogleCredential(response) {
      if (!supabase) {
        console.error('Supabase not initialized');
        return;
      }

      try {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: response.credential,
        });

        if (error) {
          console.error('Token exchange error:', error);
          throw error;
        }

        return data;
      } catch (error) {
        console.error('Failed to exchange token:', error);
        throw error;
      }
    }

    /**
     * Sign in with Google
     * Uses Google Identity Services for branded sign-in experience
     * Shows "Continue to victordelrosal.com" instead of ugly Supabase URL
     */
    async function signInWithGoogle() {
      if (!supabase) {
        if (!initSupabase()) {
          console.error('Supabase not initialized');
          return;
        }
      }

      try {
        // Load Google Identity Services if not already loaded
        await loadGoogleScript();

        // Use Google's OAuth2 popup flow
        const client = google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'openid email profile',
          callback: () => {}, // Will be overridden
        });

        // For ID token flow, use the ID client instead
        return new Promise((resolve, reject) => {
          google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            use_fedcm_for_prompt: true,
            callback: async (response) => {
              try {
                await handleGoogleCredential(response);
                resolve();
              } catch (error) {
                reject(error);
              }
            },
          });

          // Trigger the One Tap or popup
          google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
              // One Tap not available or skipped, fall back to button click flow
              // Create a temporary container for Google button
              const container = document.createElement('div');
              container.style.position = 'fixed';
              container.style.top = '50%';
              container.style.left = '50%';
              container.style.transform = 'translate(-50%, -50%)';
              container.style.zIndex = '10000';
              container.style.background = 'white';
              container.style.padding = '20px';
              container.style.borderRadius = '8px';
              container.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
              container.id = 'google-signin-container';

              // Check if container already exists to avoid duplicates
              if (document.getElementById('google-signin-container')) {
                  return;
              }

              // Add close button
              const closeBtn = document.createElement('button');
              closeBtn.innerHTML = '&times;';
              closeBtn.style.cssText = 'position:absolute;top:5px;right:10px;border:none;background:none;font-size:24px;cursor:pointer;color:#666;';
              closeBtn.onclick = () => {
                container.remove();
                reject(new Error('Sign in cancelled'));
              };
              container.appendChild(closeBtn);

              // Add instruction text
              const text = document.createElement('p');
              text.textContent = 'Sign in with Google';
              text.style.cssText = 'margin:0 0 15px 0;font-weight:500;text-align:center;';
              container.appendChild(text);

              // Render Google button
              const buttonDiv = document.createElement('div');
              container.appendChild(buttonDiv);
              document.body.appendChild(container);

              google.accounts.id.renderButton(buttonDiv, {
                theme: 'outline',
                size: 'large',
                width: 250,
              });
            }
          });
        });
      } catch (error) {
        console.error('Failed to sign in:', error);
        throw error;
      }
    }

    /**
     * Sign out the current user
     */
    async function signOut() {
      if (!supabase) return;

      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      } catch (error) {
        console.error('Failed to sign out:', error);
        throw error;
      }
    }

    /**
     * Load or create the user's comment profile
     * Called automatically after sign-in
     */
    async function loadUserProfile() {
      if (!supabase || !currentUser) return null;

      try {
        const { data, error } = await supabase.rpc('get_or_create_comment_user');

        if (error) {
          console.error('Failed to load user profile:', error);
          return null;
        }

        commentUserProfile = data;

        // Check if new user (created within last minute) and welcome not shown
        if (data && data.created_at) {
          const createdTime = new Date(data.created_at).getTime();
          const now = Date.now();
          const isRecent = (now - createdTime) < 60000; // 1 minute
          const hasSeenWelcome = localStorage.getItem(`welcome_shown_${data.id}`);

          if (isRecent && !hasSeenWelcome) {
            // Mark as shown immediately to prevent double showing
            localStorage.setItem(`welcome_shown_${data.id}`, 'true');

            // Dispatch event for UI to handle
            window.dispatchEvent(new CustomEvent('supabase:new-user', {
              detail: { user: data }
            }));
          }
        }

        return data;
      } catch (error) {
        console.error('Failed to load user profile:', error);
        return null;
      }
    }

    /**
     * Get the current authenticated user
     * @returns {Object|null} The current user or null
     */
    function getCurrentUser() {
      return currentUser;
    }

    /**
     * Get the current user's comment profile
     * @returns {Object|null} The user's comment profile or null
     */
    function getUserProfile() {
      return commentUserProfile;
    }

    /**
     * Check if the current user is an admin
     * @returns {boolean} True if user is admin
     */
    function isAdmin() {
      return commentUserProfile?.is_admin === true;
    }

    /**
     * Update email subscription status
     * @param {boolean} isSubscribed 
     */
    async function updateSubscription(isSubscribed) {
      if (!supabase || !currentUser) return;

      try {
        const { error } = await supabase
          .from('comment_users')
          .update({ is_subscribed: isSubscribed })
          .eq('auth_id', currentUser.id);

        if (error) throw error;

        // Update local cache
        if (commentUserProfile) {
          commentUserProfile.is_subscribed = isSubscribed;
        }
        return true;
      } catch (error) {
        console.error('Failed to update subscription:', error);
        throw error;
      }
    }

    /**
     * Update user timezone
     * @param {string} timezone 
     */
    async function updateTimezone(timezone) {
      if (!supabase || !currentUser) return;

      try {
        const { error } = await supabase
          .from('comment_users')
          .update({ timezone: timezone })
          .eq('auth_id', currentUser.id);

        if (error) throw error;

        // Update local cache
        if (commentUserProfile) {
          commentUserProfile.timezone = timezone;
        }
        return true;
      } catch (error) {
        console.error('Failed to update timezone:', error);
        throw error;
      }
    }

    /**
     * Delete the user's account (profile and auth)
     */
    async function deleteAccount() {
      console.log('[SupabaseClient] deleteAccount called');

      if (!supabase || !currentUser) {
        console.error('[SupabaseClient] No supabase client or user');
        throw new Error('Not authenticated');
      }

      try {
        // Get current session for auth header
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.error('[SupabaseClient] No active session');
          throw new Error('No active session');
        }

        console.log('[SupabaseClient] Calling Edge Function at:', `${SUPABASE_URL}/functions/v1/delete-account`);

        // Call Edge Function to fully delete account
        const response = await fetch(`${SUPABASE_URL}/functions/v1/delete-account`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('[SupabaseClient] Edge Function response status:', response.status);

        const result = await response.json();
        console.log('[SupabaseClient] Edge Function result:', result);

        if (!response.ok) {
          throw new Error(result.error || 'Failed to delete account');
        }

        // Clear local state
        currentUser = null;
        userProfile = null;

        // Notify listeners
        authStateListeners.forEach(listener => listener(null));

        console.log('[SupabaseClient] Account deleted successfully');
        return true;
      } catch (error) {
        console.error('[SupabaseClient] Failed to delete account:', error);
        throw error;
      }
    }

    /**
     * Get the raw Supabase client for direct queries
     * @returns {Object} The Supabase client instance
     */
    function getClient() {
      if (!supabase) initSupabase();
      return supabase;
    }

    // Export to global scope
    window.SupabaseClient = {
      initSupabase,
      initAuth,
      onAuthStateChange,
      signInWithGoogle,
      signOut,
      getCurrentUser,
      getUserProfile,
      isAdmin,
      updateSubscription,
      updateTimezone,
      deleteAccount,
      getClient,
      // Expose constants for other modules
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      GOOGLE_CLIENT_ID
    };

  })();
}
