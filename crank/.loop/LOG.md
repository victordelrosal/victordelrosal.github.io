# LOG: bloom + kintsugi elevation, 2026-07-04

## Round 0 (ORIENT + FRAME)
GROUNDING (all VERIFIED by reading index.html + eye-candy/index.html + fetching addons):
- Hero = three.js Points (punched cylinder), rendered directly via renderer.render at 3 sites
  (568 theme-apply, 603 frame loop, 607 reduced static). alpha:true canvas over CSS wood bg.
- Fallback: whole GL block in try/catch; catch paints radial brass glow. reduced + still
  (?still) branches render one static frame. Light/dark via uLight uniform + blend swap +
  'cranktheme' event.
- eye-candy bloom = bright-pass (threshold smoothstep 0.72..1.15) -> separable 5-tap Gaussian
  -> ACES composite (2.51/2.43 curve) + vignette + dithered grain; POST_PARAMS.gold bloom 0.55.
  eye-candy is fully OPAQUE; its kintsugi (FRAG_GOLD) is a full-screen lapis+molten-gold scene.
- three postprocessing addons (Pass/EffectComposer/RenderPass/ShaderPass/MaskPass/
  UnrealBloomPass + CopyShader/LuminosityHighPassShader) fetched to vendor/three-addons/;
  every import is 'three' (importmap) or relative sibling. No CDN.
BASELINE: current hero glow = cheap AdditiveBlending on the ShaderMaterial, no post. Pre-bloom
  hero screenshots captured this session (scratchpad live-hero.png / light-hero.png) as the
  before. Page live 200, 0 console errors (WebGL-off shows the fallback).

ARCHITECTURE DECISION (logged, not a downgrade): switch renderer to OPAQUE (clear to wood)
so bloom runs on a clean buffer (UnrealBloomPass fights alpha); loses the faint dark-mode orbs
behind the canvas, replaced by bloom + composite vignette. Kintsugi = SVG veins (approved
restrained reading), not a ported full-screen FRAG_GOLD scene.

## Round 1
HYPOTHESIS: structural. Add EffectComposer bloom + custom ACES/vignette/grain output pass;
add SVG kintsugi to #upgrade. Then cold-verify across dark/light/no-WebGL/reduced.
