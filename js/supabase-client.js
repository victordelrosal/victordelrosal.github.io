/**
 * Sign-in for victordelrosal.com: the one fiveinnolabs account (2 Oct 2026, /federated-access;
 * manual in sBs/fiveinnolabs-identity/README.md).
 *
 * The person is a Firebase user in project ai-badge-2026, the same account as on AI Badge, aireckon.ing,
 * Pentaborgs and the radio. Google signs in through Firebase directly; LinkedIn through the aireckon.ing
 * broker (linkedin-signin.js). Supabase (flux) trusts the Firebase ID token as a third-party issuer, and every
 * signed-in write goes through the fil_* functions (supabase/fil-federated-2026-10-02.sql).
 *
 * window.SupabaseClient keeps the API the pages already call (signInWithGoogle now opens the sign-in sheet
 * with both ways in). getClient() stays the plain public client for reads; getAuthedClient() carries the
 * person's Firebase token for the fil_* calls.
 */

if (!window.SupabaseClient) {
  (function () {
    const supabaseConfig = window.__SUPABASE_CONFIG || {};
    const SUPABASE_URL = supabaseConfig.url || supabaseConfig.supabaseUrl;
    const SUPABASE_ANON_KEY = supabaseConfig.anonKey || supabaseConfig.supabaseAnonKey;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('Supabase configuration is missing. Define window.__SUPABASE_CONFIG = { url, anonKey } before loading supabase-client.js.');
      return;
    }

    /* the account's scripts: the Firebase SDK, then (once the app exists) the LinkedIn return, which reads the
       #li= hash, and the shared ways-in list, level gem and XP. The Firebase web config comes from the broker,
       so the key is not in this repo. fil/account.js carries the md5 of its contents: bump it when that file changes. */
    const FIREBASE_SDK = [
      'https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js',
      'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js'
    ];
    const FIL_SCRIPTS = [
      '/js/linkedin-signin.js?v=f10',
      'https://aireckon.ing/fil/account.js?v=c8782b64'
    ];
    const FIL_CONFIG = 'https://aireckon.ing/api/auth/config';

    let supabase = null;
    let authed = null;
    let fbUser = null;
    let currentUser = null;
    let commentUserProfile = null;
    const authStateListeners = [];
    let authInitPromise = null;
    let sheet = null;

    function addScripts(list) {
      return Promise.all(list.map(src => new Promise(resolve => {
        const s = document.createElement('script');
        s.src = src;
        s.async = false;   // run in list order
        s.onload = resolve;
        s.onerror = () => { console.warn('[auth] could not load', src); resolve(); };
        document.head.appendChild(s);
      })));
    }

    async function loadScripts() {
      const [, conf] = await Promise.all([
        addScripts(FIREBASE_SDK),
        fetch(FIL_CONFIG).then(r => (r.ok ? r.json() : null)).catch(() => null)
      ]);
      if (!window.firebase || !conf || !conf.firebase) return false;
      window.initFirebase = () => { if (!firebase.apps.length) firebase.initializeApp(conf.firebase); };   // linkedin-signin.js calls this
      window.initFirebase();
      await addScripts(FIL_SCRIPTS);
      return true;
    }

    function initSupabase() {
      if (supabase) return true;
      const createClientFn = window.supabase?.createClient || window.createClient;
      if (!createClientFn) {
        console.error('Supabase JS library not loaded.');
        return false;
      }
      supabase = createClientFn(SUPABASE_URL, SUPABASE_ANON_KEY);
      authed = createClientFn(SUPABASE_URL, SUPABASE_ANON_KEY, {
        accessToken: async () => (fbUser ? await fbUser.getIdToken() : null)
      });
      return true;
    }

    /* the shape the pages were written for (Supabase's user object) */
    function shape(u) {
      if (!u) return null;
      const name = u.displayName || (u.email ? u.email.split('@')[0] : 'Reader');
      return {
        id: u.uid,
        email: u.email || '',
        provider: '',
        user_metadata: { full_name: name, name, avatar_url: u.photoURL || '', picture: u.photoURL || '' }
      };
    }

    function notify() {
      authStateListeners.forEach(cb => { try { cb(currentUser, commentUserProfile); } catch (e) { console.error(e); } });
    }

    async function loadUserProfile() {
      if (!fbUser || !initSupabase()) return null;
      const { data, error } = await authed.rpc('fil_me');
      if (error) { console.error('Failed to load user profile:', error); return null; }
      commentUserProfile = data;
      if (data && data.created_at && Date.now() - new Date(data.created_at).getTime() < 60000) {
        let seen = null;
        try { seen = localStorage.getItem(`welcome_shown_${data.id}`); localStorage.setItem(`welcome_shown_${data.id}`, 'true'); } catch (e) {}
        if (!seen) window.dispatchEvent(new CustomEvent('supabase:new-user', { detail: { user: data } }));
      }
      return data;
    }

    function initAuth() {
      if (authInitPromise) return authInitPromise;
      authInitPromise = (async () => {
        if (!(await loadScripts()) || !firebase.auth) { console.warn('[auth] sign-in unavailable: browsing signed out'); return; }
        initSupabase();
        if (window.filXp) {
          filXp.use({ idToken: () => (fbUser ? fbUser.getIdToken() : null), anchor: () => document.querySelector('#user-profile-btn .user-avatar-wrap') });
        }
        firebase.auth().onAuthStateChanged(async (u) => {
          const switched = (fbUser && fbUser.uid) !== (u && u.uid);
          fbUser = u;
          currentUser = shape(u);
          if (switched) commentUserProfile = null;
          if (window.filXp) { if (u) filXp.hello(u.uid); else filXp.reset(); }
          if (u) {
            closeSheet();
            try {
              const t = await u.getIdTokenResult();
              const p = t.signInProvider;
              currentUser.provider = p === 'google.com' ? 'google' : (p === 'custom' && t.claims.li) ? 'linkedin' : (p === 'password' || p === 'emailLink') ? 'email' : '';
            } catch (e) {}
            try {
              await Promise.race([loadUserProfile(), new Promise(r => setTimeout(r, 5000))]);
            } catch (e) { console.warn('[auth] profile load failed', e); }
            if (fbUser !== u) return;   // signed out or switched while loading
          }
          notify();
        });
        /* back from LinkedIn: a failed sign-in reopens the sheet with the reason; a link result goes to the card */
        if (window.linkedInSignInResult) {
          window.linkedInSignInResult.then(r => {
            if (!r) return;
            if (r.mode === 'link') window.dispatchEvent(new CustomEvent('fil:link-result', { detail: r }));
            else if (!r.success) { openSheet(); say(r.error); }
          });
        }
      })();
      return authInitPromise;
    }

    function onAuthStateChange(callback) {
      authStateListeners.push(callback);
      callback(currentUser, commentUserProfile);
    }

    /* ---------- the sign-in sheet: Google and LinkedIn, the same account either way ---------- */
    const G_ICON = '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.2C12.4 13.7 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.8c4.3-4 6.9-9.9 6.9-17.2z"/><path fill="#FBBC05" d="M10.6 28.5c-.5-1.4-.8-2.9-.8-4.5s.3-3.1.8-4.5l-7.9-6.2C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.9-6.2z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.8c-2.1 1.4-4.8 2.3-8.5 2.3-6.3 0-11.6-4.2-13.5-10l-7.9 6.2C6.6 42.6 14.6 48 24 48z"/></svg>';
    const LI_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>';
    const SHEET_CSS = [
      '.fil-scrim{position:fixed;inset:0;z-index:10000;background:rgba(2,6,20,.6);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);animation:fil-fade .18s ease-out}',
      '.fil-sheet{position:fixed;z-index:10001;top:50%;left:50%;transform:translate(-50%,-50%);width:min(380px,calc(100vw - 32px));padding:28px 22px 20px;box-sizing:border-box;',
      '  font-family:var(--font-system,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif);color:#fff;border-radius:24px;',
      '  background:linear-gradient(165deg,rgba(8,15,40,.96) 0%,rgba(12,22,55,.95) 40%,rgba(8,18,48,.96) 100%);',
      '  border:1px solid rgba(0,180,255,.14);border-top-color:rgba(0,212,255,.28);box-shadow:0 24px 80px -16px rgba(0,30,80,.7),inset 0 1px 0 rgba(0,212,255,.15);animation:fil-fade .18s ease-out}',
      '.fil-sheet[hidden],.fil-scrim[hidden]{display:none}',
      '@keyframes fil-fade{from{opacity:0}to{opacity:1}}',
      '@media (prefers-reduced-motion:reduce){.fil-sheet,.fil-scrim{animation:none}}',
      '.fil-sheet h2{margin:0 0 8px;font-size:22px;font-weight:700;letter-spacing:-.02em;color:#fff}',
      '.fil-sheet p{margin:0 0 20px;font-size:14px;line-height:1.5;color:rgba(180,210,255,.75)}',
      '.fil-btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;height:48px;margin:0 0 10px;border-radius:999px;font:600 15px/1 inherit;font-family:inherit;cursor:pointer;transition:background .2s ease}',
      '.fil-btn.g{background:#fff;color:#1f1f1f;border:1px solid #fff}.fil-btn.g:hover{background:#eceef3}',
      '.fil-btn.li{background:#0A66C2;color:#fff;border:1px solid #0A66C2}.fil-btn.li:hover{background:#004182}',
      '.fil-btn:focus-visible,.fil-x:focus-visible{outline:2px solid #00D4FF;outline-offset:2px}',
      '.fil-more{margin-top:2px}.fil-more>summary{cursor:pointer;list-style:none;text-align:center;padding:10px 0;font-size:13px;color:rgba(180,210,255,.75);text-decoration:underline;text-underline-offset:3px}',
      '.fil-more>summary::-webkit-details-marker{display:none}.fil-more>summary:hover{color:#fff}.fil-more[open]>summary{margin-bottom:8px}',
      '.fil-msg{min-height:18px;margin-top:4px;font-size:13px;line-height:1.45;color:#ff9a8a}',
      '.fil-fine{margin-top:10px;font-size:12px;line-height:1.45;color:rgba(180,210,255,.6)}',
      '.fil-x{position:absolute;top:10px;right:12px;width:36px;height:36px;border:0;border-radius:50%;background:none;color:rgba(180,210,255,.7);font:400 24px/1 inherit;cursor:pointer}.fil-x:hover{color:#fff}'
    ].join('\n');
    let scrim = null;

    function say(text) { if (sheet) sheet.querySelector('.fil-msg').textContent = text || ''; }

    function mountSheet() {
      if (sheet) return;
      const st = document.createElement('style'); st.textContent = SHEET_CSS; document.head.appendChild(st);
      scrim = document.createElement('div'); scrim.className = 'fil-scrim'; scrim.hidden = true;
      scrim.addEventListener('click', closeSheet);
      sheet = document.createElement('div'); sheet.className = 'fil-sheet'; sheet.hidden = true;
      sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true'); sheet.setAttribute('aria-labelledby', 'fil-sheet-title');
      sheet.innerHTML = '<button class="fil-x" type="button" aria-label="Close">&times;</button>' +
        '<h2 id="fil-sheet-title">Sign in</h2>' +
        '<p>One fiveinnolabs account, the same one you use on AI Badge and aireckon.ing. Sign in to comment on waves and get the weekly email.</p>' +
        /* LinkedIn first (Victor, 3 Oct 2026); Google waits under "Other ways to sign in" */
        '<button class="fil-btn li" type="button">' + LI_ICON + 'Continue with LinkedIn</button>' +
        '<details class="fil-more"><summary>Other ways to sign in</summary>' +
        '<button class="fil-btn g" type="button">' + G_ICON + 'Continue with Google</button></details>' +
        '<div class="fil-msg" role="status"></div>' +
        '<div class="fil-fine">Same email, same account, whichever you choose.</div>';
      sheet.querySelector('.fil-x').addEventListener('click', closeSheet);
      sheet.querySelector('.fil-btn.g').addEventListener('click', () => {
        say('');
        firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider()).catch(e => {
          if (e && (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request')) return;
          say(e && e.code === 'auth/popup-blocked'
            ? 'Your browser blocked the Google window. Allow pop-ups for this site and try again.'
            : 'Google sign-in did not go through. Please try again.');
        });
      });
      sheet.querySelector('.fil-btn.li').addEventListener('click', () => { signInWithLinkedIn(); });
      document.body.append(scrim, sheet);
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && !sheet.hidden) closeSheet(); });
    }

    function openSheet() {
      mountSheet();
      say('');
      const noLi = typeof signInWithLinkedIn !== 'function';   // LinkedIn unavailable: nothing to hide Google behind
      if (noLi) sheet.querySelector('.fil-more').open = true;
      scrim.hidden = false; sheet.hidden = false;
      sheet.querySelector(noLi ? '.fil-btn.g' : '.fil-btn.li').focus();
    }

    function closeSheet() {
      if (!sheet) return;
      scrim.hidden = true; sheet.hidden = true;
    }

    /* the name every page already calls: now opens the sheet with both ways in */
    async function signInWithGoogle() {
      await initAuth();
      if (!window.firebase || !firebase.auth || !firebase.apps.length) { alert('Sign-in could not load. Please check your connection and try again.'); return; }
      openSheet();
    }

    async function signOut() {
      if (window.firebase && firebase.auth) await firebase.auth().signOut();
    }

    function getCurrentUser() { return currentUser; }
    function getUserProfile() { return commentUserProfile; }
    function isAdmin() { return commentUserProfile?.is_admin === true; }
    function getIdToken() { return fbUser ? fbUser.getIdToken() : Promise.resolve(null); }
    function getFirebaseUser() { return fbUser; }

    async function updateProfile(fields) {
      if (!fbUser || !initSupabase()) throw new Error('Not signed in');
      const { data, error } = await authed.rpc('fil_update_profile', fields);
      if (error) throw error;
      commentUserProfile = data;
      return true;
    }
    const updateSubscription = isSubscribed => updateProfile({ p_subscribed: isSubscribed });
    const updateTimezone = timezone => updateProfile({ p_timezone: timezone });

    /* deletes this site's profile and comments; the fiveinnolabs account itself is shared with other sites and stays */
    async function deleteAccount() {
      if (!fbUser || !initSupabase()) throw new Error('Not authenticated');
      const { error } = await authed.rpc('fil_delete_my_data');
      if (error) throw error;
      commentUserProfile = null;
      await signOut();
      return true;
    }

    function getClient() {
      if (!supabase) initSupabase();
      return supabase;
    }
    function getAuthedClient() {
      if (!authed) initSupabase();
      return authed;
    }

    window.SupabaseClient = {
      initSupabase,
      initAuth,
      onAuthStateChange,
      signInWithGoogle,
      signIn: signInWithGoogle,
      signOut,
      getCurrentUser,
      getUserProfile,
      getFirebaseUser,
      getIdToken,
      isAdmin,
      updateSubscription,
      updateTimezone,
      deleteAccount,
      getClient,
      getAuthedClient,
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    };

    /* start now, so a #li= return is read before anything else touches the address */
    initAuth();
  })();
}
