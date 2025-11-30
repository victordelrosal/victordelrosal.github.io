/**
 * Supabase Client with Authentication
 * Handles Google OAuth sign-in/out and user profile management
 */

// Prevent double-loading
if (!window.SupabaseClient) {
  (function() {
    // Supabase Configuration
    const SUPABASE_URL = 'https://azzzrjnqgkqwpqnroost.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6enpyam5xZ2txd3BxbnJvb3N0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NDU5MzEsImV4cCI6MjA3NzEyMTkzMX0.sVQTpX_ilu_366c9HhCUmKL1YOhRZo5N4YKVoIMoTyE';

    // Initialize Supabase client (requires supabase-js to be loaded first)
    let supabase = null;
    let currentUser = null;
    let commentUserProfile = null;
    let authStateListeners = [];

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
     */
    async function initAuth() {
      if (!supabase) {
        if (!initSupabase()) return;
      }

      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          currentUser = session.user;
          await loadUserProfile();
        }

        // Listen for auth changes
        supabase.auth.onAuthStateChange(async (event, session) => {
          currentUser = session?.user || null;

          if (currentUser) {
            await loadUserProfile();
          } else {
            commentUserProfile = null;
          }

          // Notify all listeners
          authStateListeners.forEach(callback => callback(currentUser, commentUserProfile));
        });
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      }
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
     * Sign in with Google OAuth
     * Redirects to Google sign-in page
     */
    async function signInWithGoogle() {
      if (!supabase) {
        console.error('Supabase not initialized');
        return;
      }

      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.href
          }
        });

        if (error) {
          console.error('Sign in error:', error);
          throw error;
        }
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
      getClient,
      // Expose constants for other modules
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    };

  })();
}
