# BRIEF: elevate victordelrosal.com/crank with bloom + kintsugi
Run 2026-07-04. Director: Claudus on Opus 4.8. Interactive Crank.

WHAT:         Two elevations to the live crank landing page (crank/index.html):
              (1) a real multi-pass bloom pipeline on the hero cylinder (ported from
              eye-candy's bright/blur/ACES aesthetic via three EffectComposer), so the
              brass pins bloom like hot metal; (2) a restrained kintsugi treatment on the
              self-upgrade section (#upgrade): the honesty-catch plaque sits on lapis with
              gold veins that draw/flood on scroll (crack-becomes-gold = the crank
              philosophy made visual).
WHY:          Victor asked "does anything in eye-candy elevate this" and approved both. The
              bloom lifts the signature moment everyone sees first; the kintsugi makes the
              page's most important idea (the flaw preserved as proof) look like what it means.
WHO:          Visitors to a top-tier open-source repo landing page; Victor's shareable proof.
CRITERIA:     see CRITERIA.md (12; mostly environment-checkable; loop-shaped).
PRD:          no. Surgical elevation of an existing, understood file.
FLEET:        solo build (one shared file, parallel edits = merge hell), then a fresh cold
              verifier that DRIVES the live/local page in dark+light+no-WebGL+reduced-motion.
LOOP BUDGET:  3 rounds.
EXIT:         Both elevations live on victordelrosal.com/crank, 0 console errors, every
              fallback intact, verifier passes, pushed.
DOWNGRADES:   Kintsugi may be SVG/CSS rather than a ported WebGL scene (a second full-screen
              shader would fight the music-box concept and the no-WebGL rule); this is the
              restrained reading Victor approved, taking the metaphor+palette not the literal
              FRAG_GOLD. Not a downgrade of intent; logged as the approved architecture.

Grounded (Round 0): 3 renderer.render call sites (lines 568/603/607) route through composer;
canvas is alpha:true over CSS wood bg (bloom wants opaque -> switch renderer to opaque wood
clear); addons vendored + imports verified; fallback/reduced/still paths confirmed.
