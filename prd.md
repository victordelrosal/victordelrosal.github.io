# Product Requirements Document
## VictorDelRosal.com — Personal Digital Estate

**Version:** 1.0  
**Role:** Lecturer, Professor, Innovator, Founder  
**Design Archetype:** The Tenured Disruptor (Scholar-Founder)

---

## 1. Purpose

Create a personal website for **Victor del Rosal** that functions as a digital monograph—a hybrid between a distinguished academic's research archive and a modern founder's lab notebook.

This is not a portfolio, not a startup landing page, and not a blog. It is a **personal research archive**, **public intellectual profile**, and **founder lab notebook** combined.

**The Core Metaphor:**
> "A dusty Oxford library book that has been annotated in neon ink while writing code in the margins."

---

## 2. Core Identity

The visitor must immediately recognise three things:

1. Victor is a **lecturer and intellectual** with the academic gravity of MIT, Stanford, Oxford, or Harvard.
2. Victor is a **builder of systems and startups**, not merely a commentator.
3. Victor sits at the **intersection of rigorous thought and experimental innovation**.

The site must reject standard "personal brand" marketing tropes. It is not a marketing funnel; it is a repository of thought. It must feel like a research archive that has been hacked by a builder.

---

## 3. Target Audience

- University students
- Corporate clients and boards
- Researchers, academics, futurists
- Founders, innovators, engineers
- Media, podcast hosts, policymakers
- Future investors or partners

The site must speak intellectually, without pretension, and with design excellence that signals competence.

---

## 4. Design Philosophy: The 80/20 Rule

The design must strictly adhere to an **80/20 split** to achieve the "Scholar-Founder" aesthetic.

### The 80% — Academic Foundation
| Attribute | Direction |
|-----------|-----------|
| Vibe | Rigor, History, Depth, Permanence |
| Reference | Academic journals, heavy typesetting, university press manifestos |
| Constraint | The user must feel they are entering a space of learning and authority, not a sales landing page |

### The 20% — Innovator Overlay
| Attribute | Direction |
|-----------|-----------|
| Vibe | Electricity, Code, Systems Thinking, Future |
| Reference | Terminal windows, architectural blueprints, MVP dashboards |
| Execution | Appears only in interactions, metadata, and accents—the "twist" that prevents the site from feeling archaic |

---

## 5. Design Specifications

### 5.1 Typography System

Typography is the UI. There are no decorative graphics.

**Primary Typeface — Headings & Body (Serif)**
- Options: EB Garamond, Crimson Text, Caslon, Computer Modern
- Feeling: Published, printed, timeless
- Body size: 18–20px
- Line height: 1.6–1.7
- Max width: 650–700px
- H1: 2.5rem, letterspacing -0.02em
- H2: 1.8rem
- H3–H6: Progressively smaller, maintaining serif

**Secondary Typeface — The "Builder" Element (Monospace)**
- Options: JetBrains Mono, IBM Plex Mono, Roboto Mono, Space Mono
- Size: 0.85rem
- Usage: Metadata, dates, tags, captions, footnotes, timestamps, code blocks, navigation, "builder's log" entries
- Why: Signals engineering, code, and raw data

**Typography Rules**
- Self-hosted fonts (no Google Fonts CDN)
- Pixel-perfect rendering across browsers

### 5.2 Color System

```
Background (Paper Tones):
  Primary:    #FDFBF7 (warm cream)
  Alternate:  #F9F9F7 or #F0F0F0 (pale grey)
  Constraint: Strictly avoid pure white (#FFFFFF)
  Feel:       Physical paper stock

Text:
  Primary:    #1A1A1A (soft black / dark charcoal)
  Secondary:  #4A4A4A (scholarly grey)

Academic Accent (Choose ONE):
  Oxford Navy:      #002147
  Stanford Cardinal: #8C1515
  MIT Burgundy:     #750014
  Berkeley Blue:    #003262

Electric Accent (Use <5% of UI):
  Options:
    - Terminal Green:    #00FF41
    - Highlighter Yellow: #FFD700
    - Signal Orange:     #FF6B35
    - Electric Blue:     #0066FF
  Usage: Hover states, hyperlinks, active tabs, "new" indicators, data highlights
```

### 5.3 Layout & Grid

- **Content Width:** 650–700px centered (journal article constraint)
- **Margins:** Aggressive use of whitespace; minimum 10% viewport on desktop
- **Grid:** Classical 12-column with golden ratio proportions
- **Responsiveness:** Graceful degradation. On mobile, retain the "document" feel—do not collapse into a generic app layout.

---

## 6. Information Architecture

### Navigation
Text-only, no icons. Visible on desktop, no hamburger menus.

| Label | Purpose |
|-------|---------|
| Index | Home |
| Profile | Bio/About — treated as an academic CV |
| Output | Unified catalogue: Research + Publications + Ventures + Systems |
| Syllabus | Teaching, Lectures, Speaking, Office Hours |
| Waves | Essays, Notes, Lab Logs |
| Contact | Minimal, footer-emphasised |

### Site Structure
```
/
├── index.html
├── profile/
├── output/
│   ├── research/
│   ├── publications/
│   ├── ventures/
│   └── systems/
├── syllabus/
│   ├── courses/
│   └── talks/
├── waves/
└── contact/
```

---

## 7. Page Specifications

### 7.1 Index (Home)

**Hero Section**
- Layout: Centered, minimal
- Name: Large serif, 2.5–3rem, academic-feeling
- Tagline: 1.2rem, regular weight, subtle color

```
Victor del Rosal
Thinking, teaching, and building at the intersection of AI and society.
```

**Below the Fold**
- Short summary paragraph (max 4 lines)
- Three key entry points: Academic work, Systems/ventures, Notes/essays
- Recent waves feed

**Constraint:** No "Helping X do Y" formulas. Use statement-of-fact definitions.

### 7.2 Profile

- Clear academic-style bio
- Publication-style references
- CV-style structure (but elegant)
- Photography: Black & white, high grain, environmental—Victor lecturing, writing on a whiteboard, or in transit. No "crossed-arms" headshots.
- Include: Current positions, research interests, selected ventures

### 7.3 Output

**Critical Logic:** This is where the Scholar-Founder identity is solidified.

- **Unified List:** Do not separate "Business" from "Academia"
- **Visual Weight:** A published paper on AI Ethics and a founded startup must be presented with the exact same typographical hierarchy
- **Mental Model:** "Ventures are just applied research"

**Categories (equal, not hierarchical):**
- Research and papers
- Systems (Achord, COMPASS)
- Ventures and startups
- Books
- Talks
- Projects

**Entry Format:**
- Title (serif)
- Year and type (monospace metadata)
- Abstract/Description (100 words max)
- Tags (monospace)
- Links styled as `[View Project]` or `[Repository]`
- Tooltip preview on hover

### 7.4 Syllabus

- Teaching philosophy
- Course listings with semester/year
- Lecture topics and outlines
- Talk archive with venues
- Workshop materials
- Office hours widget (subtle modern touch, optional Calendly integration)

### 7.5 Waves

The blog, styled as a lab notebook.

**Entry Format:**
- Title (serif)
- Date (monospace)
- Short abstract (2–4 lines)
- Category tag: "Notes", "Lab Log", "Essay", "Research Notes", "Builder's Log", "Observations"

**Content Types:**
- Dense academic abstracts
- Lightweight builder notes
- Occasional sketches or LaTeX-style diagrams

**Constraint:** No featured images, only inline sketches/diagrams if needed.

### 7.6 Contact

Minimal. Footer-emphasised. No elaborate contact forms.

---

## 8. Component Specifications

### Hero Component
```
<Hero>
  <Name>Victor del Rosal</Name>
  <Tagline>...</Tagline>
</Hero>

Animation: None or extremely subtle fade-in (<300ms)
```

### Publication/Output Card
```
Structure:
  - Title (serif, linked)
  - Metadata line: Year | Type | Tags (monospace)
  - Abstract (2-4 lines)
  - Action link

Hover: translateY(-2px) lift, tooltip preview
```

### Navigation Bar
```
Position: Fixed or static top
Items: Index | Profile | Output | Syllabus | Waves | Contact
Style:
  - No hamburger menu on desktop
  - No icons
  - Small caps or regular serif
  - Subtle underline on hover (accent color)
```

### Footnotes & Citations
- Footnotes: Click to expand in-place
- Citations: Hover for preview tooltip
- Code blocks: Copy button appears on hover

---

## 9. Interaction Design

### Permitted Micro-Interactions
All animations CSS-only, under 300ms, easing: cubic-bezier for subtlety.

| Element | Interaction |
|---------|-------------|
| Links | Sharp, animated underline sweep (accent color) |
| Publication cards | translateY(-2px) lift on hover |
| Tooltips | Fade-in for research terms, citation previews |
| Page transitions | Subtle opacity shift |
| Code blocks | Copy button appears on hover |

### The "Alive" Factor
The site looks static (like paper) but acts dynamic (like software). Performance must feel as fast as a static site (SSG).

---

## 10. Anti-Patterns — What to Avoid

| Forbidden | Reason |
|-----------|--------|
| Hamburger menus on desktop | Menu should be visible, text-based, stark |
| Smooth scroll parallax | We want crisp, precise movement |
| Drop shadows | Everything should feel flat, like ink on paper |
| Icons (FontAwesome, etc.) | Use text labels or raw SVG lines only |
| Pure white backgrounds | Use paper tones |
| Loading spinners | Performance should eliminate the need |
| Progress bars | Static-site speed expected |
| Particle effects | Gimmicky, conflicts with academic gravitas |
| Corporate photography | No posed headshots |
| "Helping X do Y" copy | No marketing-speak |

---

## 11. Technical Requirements

### Stack
```
Recommended:
  - Next.js (SSG/SSR) or Astro
  - React for interactive components only
  - Tailwind CSS (utility) + Custom CSS (typographic tuning)
  - Framer Motion or GSAP (subtle interactions)

Alternative (Pure Static):
  - 11ty or Hugo
  - Vanilla CSS
  - Minimal JS for interactions
```

### Performance
- Page Speed Score: >95
- First Contentful Paint: <1s
- No JavaScript required for core content
- Progressive enhancement only

### Accessibility
- WCAG 2.1 AA compliant
- Semantic HTML throughout
- Keyboard navigation complete
- Screen reader optimised

### Infrastructure
- Self-hosted fonts
- Privacy-first analytics (Plausible or Fathom)
- Dark mode: Optional, not required
- Codebase structured for future API endpoints

---

## 12. Content & Imagery Guidelines

### Photography
- Style: Black & white, high grain, environmental
- Subject: Victor lecturing, writing, in transit
- Constraint: No corporate "crossed-arms" headshots

### Diagrams & Illustrations
- LaTeX-style vector lines
- Hand-drawn schematics / whiteboard aesthetic
- No decorative graphics

### Tone
The site should evoke:
- Seriousness without stiffness
- Creativity without chaos
- Intelligence without arrogance
- Innovation without hype

Avoid anything that feels:
- Commercial
- Influencer-like
- Corporate
- Gimmicky
- Futuristic sci-fi

---

## 13. Success Criteria

A user lands on the page and cannot immediately tell if Victor is a tenured professor at MIT or a Y-Combinator founder. They simply know he is an authority.

**Within two seconds, the visitor must feel that Victor is:**

1. An academic of substance
2. An innovator building serious systems
3. A thinker worth reading
4. A founder worth backing

**The page succeeds when it feels like:**
> "An MIT professor who also founded an AI lab"
> "Academic rigor with builder's urgency"
> "A professor who actually builds what they theorize"

---

## 14. Deliverables

| Phase | Deliverable |
|-------|-------------|
| 1 | Static HTML/CSS prototype: Homepage + one content page |
| 2 | Full design system: Typography scale, color system, component library |
| 3 | Page templates for all sections |
| 4 | Micro-interaction specifications |
| 5 | Mobile + desktop responsive layouts |
| 6 | Final React/Next.js implementation |
| 7 | CMS integration (optional) |

---

## 15. Developer Onboarding Checklist

- [ ] Review typography pairs: EB Garamond + JetBrains Mono recommended
- [ ] Establish color tokens matching spec
- [ ] Set up 650–700px content column constraint
- [ ] Implement navigation (no hamburger, no icons)
- [ ] Build Output page with unified publication list
- [ ] Configure hover states with accent color
- [ ] Test performance targets (>95 PageSpeed, <1s FCP)
- [ ] Validate WCAG 2.1 AA compliance
- [ ] Self-host fonts, configure privacy-first analytics

---

*This PRD defines a website that positions Victor del Rosal as a serious academic who happens to build transformative technology—never the reverse.*
