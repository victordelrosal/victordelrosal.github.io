# Fix: XP Animation Race Condition

**Date:** 2025-12-29
**File:** `js/gamification-ui.js`
**Commit:** `fix: resolve race condition in XP animation event listener`

## Problem

Users reported that the "+5 pts" animation was not showing when performing actions like viewing a wave page. The XP was being awarded correctly, but the visual feedback (animated bubble near the user avatar) never appeared.

## Root Cause

A race condition existed between:
1. The `gamify:xp-gained` event being dispatched
2. The event listener being attached

### The Bug

In `gamification-ui.js`, the event listener for `gamify:xp-gained` was only set up inside the `init()` function, which was delayed by `setTimeout(init, 100)`:

```javascript
// OLD CODE - PROBLEMATIC
function init() {
    // ... initialization checks ...
    setupEventListeners();  // Event listener attached here
}

setTimeout(init, 100);  // 100ms delay before listeners attached
```

Meanwhile, in `wave-loader.js`, the page view tracking could complete faster than 100ms:

```javascript
const viewCount = await window.PageViews.trackView(slug);  // RPC call
if (window.Gamification) {
    window.Gamification.trackPageView(slug);  // Dispatches event
}
```

### Timeline of the Bug

```
T=0ms   : gamification-ui.js loads, setTimeout(init, 100) scheduled
T=80ms  : trackView RPC completes, gamify:xp-gained event dispatched
          → No listener attached yet, event is lost!
T=100ms : init() runs, listener finally attached (too late)
```

## Solution

Move the XP and level-up event listeners to execute immediately when the script loads, outside of the delayed `init()` function:

```javascript
// NEW CODE - FIXED
// CRITICAL: Set up listeners IMMEDIATELY on script load
window.addEventListener('gamify:xp-gained', (e) => {
    animateAvatarXP(e.detail.amount, e.detail.reason);
});

window.addEventListener('gamify:level-up', (e) => {
    animateLevelUp(e.detail.newLevel);
});

function init() {
    // Other initialization that requires dependencies...
}
```

### Timeline After Fix

```
T=0ms   : gamification-ui.js loads, event listeners attached IMMEDIATELY
T=80ms  : trackView RPC completes, event dispatched
          → Listener catches it, animation shows ✓
T=100ms : init() runs for other setup
```

## Why This Works

The `animateAvatarXP()` function only needs DOM elements (`.user-avatar` or `.anon-game-btn`) to work. It doesn't require full initialization of the gamification UI. If the elements don't exist yet, the function gracefully returns without error.

By attaching the listener immediately, we ensure no XP events are missed regardless of network timing.

## Files Changed

- `js/gamification-ui.js`: Moved `gamify:xp-gained` and `gamify:level-up` listeners outside of `setupEventListeners()` to execute at script load time.

## Testing

1. Clear browser cache
2. Visit any wave page (e.g., `/echo5/`)
3. Observe the "+5" animation bubble near the user avatar/game button
4. The animation should appear within ~1 second of page load
