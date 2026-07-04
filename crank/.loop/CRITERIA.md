# CRITERIA: bloom + kintsugi elevation (frozen at FRAME)

E = environment-checkable, J = judge-checkable (screenshot/eyes).

BLOOM
1.  (E) The hero renders through a three EffectComposer chain (RenderPass + UnrealBloomPass +
    a custom ACES/vignette/grain output pass); the old direct `renderer.render(scene,cam)` is
    replaced by `composer.render()` at all animation/theme/reduced call sites.
2.  (E) The bloom addons are vendored under crank/vendor/three-addons/ and load with ZERO
    external-host requests (grep of the page + addon chain shows no cdn/http import).
3.  (J) In DARK mode the bright pins visibly bloom: soft hot-metal halos around the lit/struck
    pins, clearly softer and more luminous than the pre-bloom baseline screenshot.
4.  (E) No-WebGL fallback intact: if WebGL/composer init throws, the try/catch still paints the
    brass-glow fallback and the page shows all content with no uncaught error.
5.  (E) prefers-reduced-motion renders ONE composed (bloomed) frame, no rAF animation loop.
6.  (J) Light/dark toggle still re-skins the cylinder AND the bloom respects theme: light mode
    is not blown out (bloom dialed down / normal blend), parchment stays legible.
7.  (E) Performance guarded: DPR capped (<=1.75), bloom at reduced resolution, render paused
    when tab hidden; no unbounded full-res bloom.

KINTSUGI
8.  (E) The #upgrade section contains a kintsugi element: a lapis field with gold vein(s)
    rendered as SVG (gold gradient stroke), placed on/behind the honesty-catch plaque.
9.  (J) The gold vein reads as a repaired CRACK, not random scribble: a branching fracture line
    filled with molten gold, on lapis, echoing the plaque text about the flaw made proof.
10. (E) The vein animates on scroll-into-view (stroke draws, gold floods); under
    prefers-reduced-motion it renders statically filled (no animation), all text legible.
11. (J) Kintsugi is legible and on-brand in BOTH themes (lapis plaque works on parchment and
    on wood), and does NOT introduce a second full-screen scene competing with the hero.

GLOBAL
12. (E) 0 console errors on load in dark AND light; the music-box concept is intact (hero is
    still the punched cylinder, scroll still turns it); page returns 200 live after deploy.
