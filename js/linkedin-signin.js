/* fiveinnolabs LinkedIn sign-in (2 Oct 2026, Victor: "LinkedIn login in addition to Google Auth ...
   must work across AI Badge and Reckoning and eventually across all fiveinnolabs estates").

   LinkedIn has no Firebase provider, so aireckon.ing runs the LinkedIn sign-in for every estate
   (rsvp/functions/api/auth/[[path]].js) and matches the person, by verified email, to their one
   Firebase user in ai-badge-2026, or creates it. This page goes there, comes back with
   #li=<one-time code>, trades the code for a Firebase custom token and signs in. Same person,
   same account, whether they came by Google or by LinkedIn.

   Any estate on the same Firebase project can use this file as it is: load it after the Firebase
   SDK, before the page's router reads location.hash, and add the estate's origin to FEDERATED
   on the broker. Exposes:
     signInWithLinkedIn()      leaves for LinkedIn (remembers the current #route)
     linkedInSignInResult      a promise: null (nothing to do) or { success, user | error, code, mode }
   mode 'link' means the person was already signed in and connected a LinkedIn to that account
   (from the account card, aireckon.ing/fil/account.js); the page shows the result there. */
(function () {
  var BROKER = 'https://aireckon.ing/api/auth/linkedin';
  var ROUTE_KEY = 'fil-li-route';
  var MSG = {
    taken: 'That LinkedIn already has an account of its own. Sign in with it instead, or write to victor@fiveinnolabs.com and we will help.',
    cancelled: 'LinkedIn sign-in was cancelled.',
    unverified: 'LinkedIn has not confirmed your email address yet, so we cannot match it to your account. Confirm it on LinkedIn, or continue with Google.',
    error: 'LinkedIn sign-in did not go through. Please try again, or continue with Google.',
    held: 'An account with this email was started but never confirmed, so LinkedIn cannot open it. Continue with Google, or write to victor@fiveinnolabs.com.',
    link: 'LinkedIn was not connected: sign in to this account first, then connect it from the account card.',
    unsolicited: 'That LinkedIn sign-in was not started in this browser, so it was ignored. Use Continue with LinkedIn here.'
  };
  var VERIFIER_KEY = 'fil-li-v';
  /* identity audit F01 (2 Oct 2026): a hand-over only signs in the tab that started it. This tab keeps a random
     verifier; the broker only sees its SHA-256 and asks for the verifier back when the code is redeemed. */
  function b64u(bytes) { var s = ''; for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }

  window.signInWithLinkedIn = function () {
    var v = b64u(crypto.getRandomValues(new Uint8Array(32)));
    try { sessionStorage.setItem(ROUTE_KEY, location.hash || ''); sessionStorage.setItem(VERIFIER_KEY, v); } catch (e) {}
    crypto.subtle.digest('SHA-256', new TextEncoder().encode(v)).then(function (d) {
      location.href = BROKER + '/start?return=' + encodeURIComponent(location.origin + location.pathname + location.search) +
        '&cc=' + b64u(new Uint8Array(d));
    });
    return new Promise(function () {});   // the page is leaving
  };

  /* Synchronously, before any router sees it: take the code out of the address and put back the
     route the person left from. */
  var h = new URLSearchParams((location.hash || '').replace(/^#/, ''));
  var code = h.get('li'), err = h.get('li-error'), linked = h.get('li-linked'), lcode = h.get('li-link');
  if (!code && !err && !linked && !lcode) { window.linkedInSignInResult = Promise.resolve(null); return; }
  var route = '', linking = false;
  try {
    route = sessionStorage.getItem(ROUTE_KEY) || ''; sessionStorage.removeItem(ROUTE_KEY);
    linking = sessionStorage.getItem('fil-li-link') === '1'; sessionStorage.removeItem('fil-li-link');
  } catch (e) {}
  try { history.replaceState(null, '', location.pathname + location.search + route); } catch (e) {}

  window.linkedInSignInResult = (async function () {
    if (linked) return { success: true, mode: 'link' };
    /* a connected LinkedIn only counts once this browser proves it is in the account that asked (2 Oct 2026) */
    if (lcode) {
      try {
        if (typeof initFirebase === 'function') initFirebase();
        var me = await new Promise(function (ok) { var off = firebase.auth().onAuthStateChanged(function (u) { off(); ok(u); }); });
        if (!me) return { success: false, error: MSG.link, code: 'link', mode: 'link' };
        var cr = await fetch(BROKER + '/link/confirm', {
          method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + await me.getIdToken() },
          body: JSON.stringify({ code: lcode })
        });
        var cj = await cr.json().catch(function () { return {}; });
        if (cr.ok && cj.linked) return { success: true, mode: 'link' };
        var why = cj.error === 'taken' ? 'taken' : cr.status === 403 ? 'link' : 'error';
        return { success: false, error: MSG[why], code: why, mode: 'link' };
      } catch (e) { return { success: false, error: MSG.error, code: 'error', mode: 'link' }; }
    }
    if (err) return { success: false, error: MSG[err] || MSG.error, code: err, mode: linking ? 'link' : 'signin' };
    var verifier = null;
    try { verifier = sessionStorage.getItem(VERIFIER_KEY); sessionStorage.removeItem(VERIFIER_KEY); } catch (e) {}
    if (!verifier) return { success: false, error: MSG.unsolicited, code: 'unsolicited' };   // not started in this tab
    try {
      var r = await fetch(BROKER + '/redeem', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code: code, verifier: verifier })
      });
      var j = await r.json().catch(function () { return {}; });
      if (!r.ok || !j.token) return { success: false, error: MSG.error };
      if (typeof initFirebase === 'function') initFirebase();
      var cred = await firebase.auth().signInWithCustomToken(j.token);
      try { if (typeof updateLastActive === 'function') await updateLastActive(cred.user.uid); } catch (e) {}
      try { if (typeof logLogin === 'function') logLogin(cred.user.uid); } catch (e) {}
      return { success: true, user: cred.user };
    } catch (e) {
      return { success: false, error: MSG.error };
    }
  })();
})();
