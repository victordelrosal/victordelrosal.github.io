# National College of Ireland

## Mock Examination, April 2026

---

| | |
|---|---|
| **Module:** | 9DATAV Data Visualisation |
| **Programme(s):** | MSc in Business Analytics for Decision Makers (MSCBADM) |
| **Examiner:** | Victor del Rosal |
| **Duration:** | 2 Hours |
| **Total Marks:** | 100 |

---

## Instructions

This paper has two sections. **Section A** is compulsory (30 marks): answer all four questions. Questions A1 and A4 offer a choice between two paths; answer one path only for each. **Section B** (70 marks): answer two of five questions (35 marks each). Where a question offers an Applied Path inviting reflection on the DataVis Challenge or other CA work, students who did not complete the challenge (or who prefer not to reference it) may answer the Theory Path instead. This applies to A1, A4, and B1.

Credit will be given for reference to named visualisation principles, relevant theories of perception, and specific examples drawn from business analytics contexts or your DataVis Challenge work. Be specific: name the principle, theory, or design choice. Generic answers will receive limited credit.

**Note:** This mock examination mirrors the format and structure of the terminal examination. It is calibrated to be slightly more demanding in its scenarios so that students who handle it well can sit the May terminal with confidence. Use it to practise time allocation and the depth of response expected at Level 9.

Suggested time allocation: Section A approximately 30 minutes (7 to 8 minutes per question); Section B approximately 45 minutes per question.

---

## SECTION A: Short-Form Questions (30 marks)

**Answer ALL FOUR questions.**

---

### Question A1 (8 marks) (LO1)

**Answer EITHER (i) OR (ii).**

**(i) Theory Path.** A senior analyst opens an unfamiliar 18-month customer transaction dataset and rapidly produces a dozen scatter plots, histograms, and small multiples to look for unusual patterns. Two weeks later, the same analyst publishes one polished chart for the executive board.

(a) Name the two modes of visualisation the analyst is moving between, and define each precisely. (4 marks)

(b) Identify two design choices that should change between the first activity and the second, and explain why each change is justified by the shift in audience and purpose. (4 marks)

**(ii) Applied Path.** Reflect on your DataVis Challenge work.

(a) Identify one chart or view in your submission that was primarily exploratory (built for your team's understanding) and one that was primarily explanatory (built for the audience). Explain the design differences between them. (4 marks)

(b) With hindsight, name one explanatory chart in your submission that still carried exploratory residue (too much data, too many encodings, no clear message) and explain how you would simplify it. (4 marks)

---

### Question A2 (7 marks) (LO2)

A dashboard places a single red data point among 200 grey points. A user notices the red point in under a second, without searching.

(a) Name the perceptual mechanism that explains this and identify the visual attribute being exploited. Cite the relevant author. (3 marks)

(b) Name two further visual attributes that operate in this same way, and for each, give one business-analytics scenario where it would be the appropriate choice for drawing attention to a critical data point. (4 marks)

---

### Question A3 (8 marks) (LO1, LO5)

**Practical Interpretation.** A monthly sales report contains a 3D pie chart of revenue share across six product categories. The chart sits on a textured photographic background, uses a different bright hue for each slice, includes a drop shadow on each segment, and shows percentage labels both inside each slice and again in a legend to the right.

(a) Using Tufte's data-ink ratio, identify three specific elements that should be removed or simplified, and briefly justify each removal. (4 marks)

(b) Pie charts are widely criticised in the data visualisation literature for tasks of comparison. Drawing on Cleveland and McGill (1984), explain why a pie chart is a poor choice for comparing six product categories, and recommend a more accurate chart type with justification. (4 marks)

---

### Question A4 (7 marks) (LO2, LO5)

**Answer EITHER (i) OR (ii).**

**(i) Theory Path.** A public agency uses a rainbow palette (red-orange-yellow-green-blue-indigo-violet) for a choropleth map showing carbon emissions intensity across 50 manufacturing plants on a continuous scale.

(a) Identify two distinct perceptual problems with this palette choice for continuous data, and name the relevant authority for each. (4 marks)

(b) Recommend a more appropriate palette family with justification, and identify one accessibility consideration the redesign should also address. (3 marks)

**(ii) AI Praxis Path.** During the module, students used AI tools to generate, critique, or refine visualisations.

(a) Describe one situation (from your DataVis Challenge or class exercises) where an AI tool produced a chart or recommendation that was technically correct but visually or perceptually flawed. What was the flaw? (4 marks)

(b) What does this episode tell you about the limits of AI-assisted visualisation, and what minimum human review steps would you build into a team workflow that uses such tools? (3 marks)

---

## SECTION B: Long-Form Questions (70 marks)

**Answer TWO questions. Each is worth 35 marks.**

---

### Question B1 (35 marks) (LO1, LO5)

**Reflecting on the DataVis Challenge: What Your Design Did Not Show**

During the DataVis Challenge you scoped a question, sourced or selected a dataset, designed a visual artefact (newspaper, dashboard, prototype, or composite), and presented it to peers and panel.

**Answer EITHER (i) Applied Path OR (ii) Theory Path.**

**(i) Applied Path.**

(a) Describe the central insight your design was built to communicate. Was it something the audience likely already suspected, or did the visualisation surface something genuinely non-obvious? Be honest. (10 marks)

(b) Identify one design decision in your submission that you would now reverse, and explain why. Reference at least one named principle or perceptual theory in your justification. (15 marks)

(c) Reflect on the gap between what your dataset could support and what your design actually claimed. Did your visualisation imply a level of certainty, completeness, or causal explanation that the underlying data could not bear? Connect this to the broader ethical challenge of visualisation as persuasion. (10 marks)

**(ii) Theory Path.**

(a) "Every visualisation is an editorial act." Drawing on Kirk (2019) and Knaflic (2015), critically discuss this claim. (10 marks)

(b) A consultancy publishes a chart that omits two quarters of negative growth from a ten-quarter dataset, titled "Revenue Growth: A Consistent Upward Trend." Evaluate this as a violation of graphical integrity, citing relevant theory, and explain why selective omission is harder for an audience to detect than overt distortion of axis or scale. (15 marks)

(c) Discuss the ethical responsibilities of the visualisation designer when communicating to non-technical audiences who will not (and cannot reasonably be expected to) audit the underlying data. (10 marks)

---

### Question B2 (35 marks) (LO2, LO5)

**Scenario: Iverna Health Trust.** Iverna is a publicly funded regional health service in the west of Ireland. Its analytics team has built a single Power BI screen for the clinical operations centre. The screen contains 16 panels: live A&E waiting times by triage category, ambulance arrivals, theatre utilisation, ward occupancy, staffing rosters, weather alerts, infection control flags, equipment maintenance status, transfer requests, discharge readiness, GP referral inflow, complaint counts, lab turnaround, radiology backlog, pharmacy stock, and a rolling news ticker. The most clinically critical panel (sepsis early warning) is in the bottom-right corner in a pale teal that matches three other non-urgent panels.

In the last quarter, two sepsis alerts were missed for over 40 minutes during busy periods. The clinical lead has asked for a redesign.

(a) Using named theories of perception and cognition, evaluate why this dashboard is failing clinical staff. Address at least three distinct mechanisms (for example: cognitive load and working memory, pre-attentive processing, visual hierarchy, figure-ground, or Few's principle of appropriate emphasis). (15 marks)

(b) Propose a redesigned dashboard. Address: layout and visual hierarchy with a justified primary zone; the use of pre-attentive channels for the sepsis alert; how progressive disclosure (Shneiderman) would manage the secondary panels; how you would involve clinical staff in the design process; and how the redesign would be validated before deployment. (20 marks)

---

### Question B3 (35 marks) (LO1, LO2, LO5)

**Scenario: Atlas FoodCo.** Atlas FoodCo is an Irish ready-meals manufacturer selling through national supermarket chains. Sales have grown 15% year on year, but margin has fallen. The CFO has commissioned a Power BI reporting suite from an external agency to "find out where the margin is going." The agency has data from the ERP (production cost, batch yields), the logistics partner (delivery routes, fuel, spoilage), and the retailers (weekly sales by SKU, promotional activity, returns). Three audiences have been identified: the CEO (strategic monthly view), the operations director (weekly bottleneck triage), and category managers (daily SKU-level trading decisions).

The agency proposes "one master dashboard for everyone, with filters."

(a) Critically evaluate the "one dashboard for everyone" proposal. Identify the specific cognitive and design problems it creates for each of the three audiences, and contrast with a layered or audience-segmented architecture. Reference named principles. (15 marks)

(b) For each of the three audiences, recommend chart types, the appropriate level of interactivity, and the dominant visualisation principle that should govern the design. Justify your recommendations. (20 marks)

---

### Question B4 (35 marks) (LO1, LO2, LO5)

**Scenario: Meridian Wealth.** Meridian is a Dublin asset manager. A junior analyst uses an AI-powered analytics tool to generate charts for an investor presentation. One chart shows quarterly fund returns on a Y-axis starting at 4.6%, making a 0.4-percentage-point spread between funds appear as a near-vertical staircase. A second chart uses a diverging red-to-green palette for absolute returns, where the colour midpoint coincidentally falls at the median fund and visually divides "winners" from "losers" without any analytical justification. When challenged, the analyst replies: "The numbers are correct. The labels are visible. The AI generated the chart based on the data."

(a) Critically evaluate the analyst's defence. Address: the distinction between data accuracy and graphical integrity (Tufte); why pre-attentive perception of shape and colour overrides the careful reading of axis labels (Ware; Cleveland and McGill); the inappropriate use of a diverging palette for non-diverging data; the ethical duties owed to investors; and the responsibility a human reviewer carries when an AI tool generates the artefact. (20 marks)

(b) Propose a quality assurance framework for visualisations destined for external audiences. Include at least four evaluation criteria, each grounded in a named design principle or theory, and explain how each criterion would be applied in practice. (15 marks)

---

### Question B5 (35 marks) (LO1, LO2, LO5)

**Scenario: HarbourCity Open Data.** HarbourCity Council is launching a public-facing real-time dashboard for traffic congestion across a metropolitan area. Three audiences have been identified: commuters checking conditions before leaving home, journalists covering infrastructure performance, and city planners evaluating long-term transport investment. A community group has separately raised concerns that the dashboard's headline metric ("congestion index") is computed in a way that systematically underrepresents bus-corridor delays in lower-income districts, because the underlying sensor network is sparser there. The council's communications team wants the launch to be "clean and simple, with no clutter."

(a) Critically evaluate the design challenge of serving three distinct audiences with one public-facing system. Recommend an audience-appropriate architecture, drawing on named principles (for example, Shneiderman's mantra, progressive disclosure, audience-first design). (15 marks)

(b) Evaluate the community group's concern as a problem of visualisation ethics, not just data quality. Address: the relationship between what the underlying data can support and what the visualisation is allowed to imply; how the "clean and simple" instruction can itself become an ethical failure when it suppresses caveats and uncertainty; and what specific design and disclosure features the dashboard should include to address both the technical limitation and the public trust dimension. (20 marks)

---

**END OF EXAMINATION PAPER**

---
---
---

# [MARKER ONLY] Marking Guidance

**This section is confidential and must NOT be distributed to students.**

---

## Overall Philosophy for Markers

This mock examination mirrors the format and expectations of the May terminal. It is calibrated to be slightly more demanding in its scenarios (more stakeholders, more ambiguity, an explicit AI praxis path) while keeping the same marking standards and grade boundaries.

**Key principles:**

1. **Reward understanding over recall.** A student who explains a concept accurately in their own words, with a good example, scores as highly as one who cites a textbook definition.
2. **Credit experiential evidence.** Students who refer specifically to the DataVis Challenge (naming their dataset, design decisions, what worked, what did not) are demonstrating applied understanding and should be rewarded.
3. **Named principles push into higher bands.** References to Kirk (2019), Knaflic (2015), Ware (2012), Tufte (2001), Few (2009), Cleveland and McGill (1984), Shneiderman (1996) should lift strong answers into the 70%+ band. Absence of citations should not cap a strong answer below 60%.
4. **Reward honesty and reflection.** Students who discuss limitations or things they would do differently demonstrate Level 9 critical thinking.
5. **Penalise vagueness, not informality.** "The colours are confusing" receives less credit than "the rainbow palette is perceptually non-uniform (Ware, 2012), creating false boundaries between adjacent hues that do not correspond to data boundaries."

---

## Target Grade Distribution Guidance

This mock is intentionally slightly more demanding than the terminal:

- Attended all sessions + engaged DataVis Challenge + moderate study: capable of **55-65%** on this mock; likely **60-69%** (2.1) on the terminal
- Additionally wider reading + strong critical reflection: **65-75%** on this mock; **70%+** (first class) on the terminal
- Minimal engagement with applied and theoretical: capable of passing (**40-49%**) with basic understanding
- Approximate balance: ~35% from class experience and DataVis Challenge, ~40% from theory study, ~25% from wider reading and critical depth

---

## Section A: Marking Notes

### Question A1 (8 marks)

**Both paths are equivalent and graded to the same standard.**

**A1(i) Theory Path**

Part (a), 4 marks: Exploratory ("discovery-oriented, analyst-facing, rapid and iterative, audience is the analyst") and explanatory ("communication-oriented, audience-facing, polished, single message"). Full marks for precise definitions plus naming Kirk (2019) or Knaflic (2015). 3 marks: correct distinction without source. 2 marks: one mode well, one weak. 0-1: confused.

Part (b), 4 marks: Two distinct shifts justified. Strong: simplification (remove non-data ink, Tufte), single focused message (Knaflic), annotation that states the insight, shift from many small multiples to a single chart, audience-appropriate chart type. 3 marks: two shifts, one weak. 2 marks: one shift well-justified. 0-1: only restates exploratory/explanatory difference.

**A1(ii) Applied Path**

Part (a), 4 marks: Specific reference to two charts in the student's actual submission with named differences (annotation, simplification, focus, palette). Full marks for genuine engagement and accurate use of exploratory/explanatory framing. 3 marks: charts named but differences generic. 2 marks: vague.

Part (b), 4 marks: Honest, specific identification of an "explanatory" chart that was actually still exploratory. Full marks for naming the residue (too many encodings, no annotation, missing message) and a credible simplification grounded in a principle. 3 marks: honest but thin. 2 marks: defensive or generic.

---

### Question A2 (7 marks)

Part (a), 3 marks: Pre-attentive processing (Ware, 2012). Attribute is colour hue. Full marks for naming all three (mechanism, attribute, source). 2 marks: two correct. 1 mark: one correct.

Part (b), 4 marks: Two further pre-attentive attributes: size, motion, orientation, position, enclosure, intensity. Each paired with a credible business scenario. Full marks for two well-justified examples. 3 marks: two attributes, scenarios thin. 2 marks: one strong, one weak. 0-1: attributes are not pre-attentive (e.g. labels, shape combinations).

---

### Question A3 (8 marks)

**Part (a): Data-ink ratio (4 marks)**

3-4 marks: Identifies three of: 3D effect, photographic background, drop shadows, redundant percentage labels (inside slices and in legend), excessive bright hues. Each justified ("3D distorts angle perception", "background competes with figure-ground", "shadow adds ink with no data", "label duplication is redundant ink"). Reference to Tufte (2001) strengthens. 2 marks: two elements with thin justification. 1 mark: one element. 0: cannot apply.

**Part (b): Cleveland and McGill (4 marks)**

3-4 marks: Pie charts force comparison by angle and area, both ranked far below position along a common scale (Cleveland and McGill, 1984). Six categories make adjacent-slice comparisons especially difficult. Recommends bar chart (or dot plot) sorted by value, with justification that it uses the most accurate perceptual channel. 2 marks: cites the hierarchy correctly but recommendation generic. 1 mark: notes that pies are bad without theoretical grounding.

---

### Question A4 (7 marks)

**Both paths are equivalent and graded to the same standard.**

**A4(i) Theory Path**

Part (a), 4 marks: Two perceptual problems, named correctly: (1) **Perceptual non-uniformity** (Ware, 2012; Borland and Taylor, 2007) creates false visual boundaries (e.g. green-yellow edge); (2) **No intuitive ordering** (rainbow has no natural perceptual rank, viewers cannot tell whether red is "more" or "less" than blue without looking up the legend). Other valid: (3) accessibility issues for colour vision deficiency. 3 marks: two issues, one without source. 2 marks: one issue well, one weak. 0-1: confused.

Part (b), 3 marks: Recommends sequential single-hue (e.g. ColorBrewer YlOrRd or Viridis) with justification (perceptual uniformity, intuitive ordering, accessibility). Names one accessibility consideration (avoid red-green discrimination requirement; provide redundant encoding; check contrast). Full marks for all three. 2 marks: palette named, justification thin. 1 mark: vague.

**A4(ii) AI Praxis Path**

Part (a), 4 marks: Specific, concrete situation. Full marks for clear articulation of the flaw using named principles ("Copilot proposed a 3D pie for our regional split: technically correct totals, but pie + 3D violates Cleveland and McGill's hierarchy and Tufte's data-ink ratio"). 3 marks: situation named, flaw described in plain language without principle. 2 marks: vague.

Part (b), 3 marks: Names limit (AI optimises for output completeness, not communicative integrity; lacks audience model; lacks ethical context). Proposes minimum human review (graphical integrity check, perceptual channel check, audience-fit check, "so what" check). Full marks for both elements with practical specificity. 2 marks: one element. 1 mark: generic "always check AI output".

---

## Section B: Marking Guidance

---

### Question B1: DataVis Challenge Reflection (LO1, LO5)

**This question is more demanding than the terminal's reflective questions because it asks students to interrogate the limits of their own design, not just describe it.**

**Both paths are equivalent and graded to the same standard.**

**B1(i) Applied Path**

Part (a), 10 marks:

| Band | Descriptor |
|---|---|
| 70%+ (7-10) | Names the insight specifically. Honestly evaluates novelty and value (was it surprising or confirmatory?). The honesty itself is critical thinking. Distinguishes "finding" from "insight". |
| 60-69% (6) | Identifies an insight with reasonable specificity. Some evaluation of its value. |
| 50-59% (5) | Describes a finding without evaluating its value. |
| 40-49% (4) | Generic description of what was shown. |
| 0-39% (0-3) | Cannot identify a meaningful insight. |

Part (b), 15 marks:

| Band | Descriptor |
|---|---|
| 70%+ (11-15) | Names a specific design decision the student would reverse. Justification grounded in a named principle (e.g. "I used a stacked area chart for time series across five categories; Cleveland and McGill rank colour-area comparison far below position, so the audience could not compare trajectories accurately. I would now use a small-multiple line chart"). Honest, reflective, specific. |
| 60-69% (9-10) | Decision named, justification reasonable, one principle cited. |
| 50-59% (7-8) | Decision named, justification thin or generic ("would change the colours"). |
| 40-49% (6) | Defensive or vague. |
| 0-39% (0-5) | Cannot identify a reversal. |

Part (c), 10 marks:

| Band | Descriptor |
|---|---|
| 70%+ (7-10) | Engages with the gap between data and claim. May discuss: implied causality where the data only supports correlation; sample limitations the design did not surface; uncertainty hidden by clean lines or sharp colour boundaries; the persuasive effect of polished design even when the underlying analysis is preliminary. Connects to ethics of visualisation. |
| 60-69% (6) | Good reflection, one ethical connection. |
| 50-59% (5) | Surface-level reflection. |
| 40-49% (4) | Minimal reflection. |
| 0-39% (0-3) | No meaningful reflection. |

**B1(ii) Theory Path**

Same band structure. Look for: (a) genuine engagement with "every visualisation is editorial" (the choice of what to include, the framing, the chart type, the palette are all editorial; "the chart shows the data" is naive); (b) graphical integrity violation by omission rather than distortion, with discussion of why omission is harder to detect (no visible truncated axis, no obvious lie factor; the deception is invisible at the chart surface); (c) named ethical duties: honesty in framing, disclosure of source and methodology, asymmetry of expertise.

---

### Question B2: Iverna Health Trust (LO2, LO5)

**This scenario is more complex than the terminal's GreenLine because it carries clinical safety stakes (missed sepsis alerts), introduces a specific design fault (critical panel placed in a low-attention zone with low-saturation colour), and asks for a validated redesign.**

**Part (a): Evaluation (15 marks)**

| Band | Descriptor |
|---|---|
| 70%+ (11-15) | Three or more mechanisms with depth. Cognitive load: 16 panels exceed working memory (Miller; Ware). Pre-attentive processing failure: pale teal of the sepsis panel does not pop against three matching panels (Ware, 2012). Visual hierarchy violation: critical metric in bottom-right (Western F/Z reading patterns, Few). Figure-ground: dense layout with no quiet zones. Decorative or undifferentiated colour wastes a high-value channel. May connect to clinical safety literature. |
| 60-69% (9-10) | Three mechanisms, good depth on at least two. |
| 50-59% (7-8) | Two or three mechanisms, generic ("too many panels", "wrong place") without theoretical grounding. |
| 40-49% (6) | Some problems identified at surface level. |
| 0-39% (0-5) | Fails to engage with perception or cognition theory. |

**Part (b): Redesign (20 marks)**

| Band | Descriptor |
|---|---|
| 70%+ (14-20) | Primary zone in top-left for sepsis with high-saturation pre-attentive cue (size, hue distinct from all others, ideally combined with motion or border for active alerts). Secondary panels demoted via progressive disclosure, with named tabs or expand-on-demand. Tertiary or context panels (weather, news) demoted further or moved to a separate view. Clinical staff involved through workshops, paper prototyping, walk-throughs of real shifts. Validation through controlled simulation, eye-tracking, or shift-shadowing before go-live. References to Shneiderman, Few, user-centred design strengthen. |
| 60-69% (12-13) | All five elements with good depth on three. |
| 50-59% (10-11) | All five but generic. Progressive disclosure mentioned without development. |
| 40-49% (8-9) | At least three elements, vague. |
| 0-39% (0-7) | Absent or incoherent. |

---

### Question B3: Atlas FoodCo (LO1, LO2, LO5)

**This scenario tests audience-specific design (like the terminal's RetailPulse) but adds a specific bad recommendation ("one dashboard for everyone with filters") that the student must dismantle, not merely critique.**

**Part (a): Evaluation of one-dashboard proposal (15 marks)**

| Band | Descriptor |
|---|---|
| 70%+ (11-15) | Specific cognitive and design problems for each audience. CEO: drowns in operational detail; the strategic signal is buried under daily noise. Operations director: filtered views of a strategic dashboard miss bottleneck-relevant chart types and refresh cadence. Category managers: filters cannot substitute for SKU-level conditional formatting and dense tabular drill-down. Cognitive load (Miller; Ware), audience-first design (Kirk; Knaflic), Few's emphasis principle. Layered architecture (shared semantic model, audience-specific presentation layer) recommended with justification. |
| 60-69% (9-10) | All three audiences addressed, principles named, one weaker. |
| 50-59% (7-8) | Two audiences, generic ("they need different things"). |
| 40-49% (6) | One audience or no theoretical grounding. |
| 0-39% (0-5) | Cannot dismantle the proposal. |

**Part (b): Audience-specific recommendations (20 marks)**

| Band | Descriptor |
|---|---|
| 70%+ (14-20) | CEO: summary KPIs, sparklines, minimal interactivity, clean layout (Tufte minimalism, Knaflic single-message). Operations director: comparative views, small multiples, drill-down, weekly cadence (Few exception highlighting; Shneiderman zoom-and-filter). Category managers: dense grid with conditional formatting, high interactivity, daily refresh, SKU-level filters (Shneiderman details-on-demand; Cleveland and McGill position channel for SKU comparison). Each recommendation justified with a named principle. |
| 60-69% (12-13) | All three with named chart types and one principle each. |
| 50-59% (10-11) | All three but undifferentiated or unjustified. |
| 40-49% (8-9) | Two audiences. |
| 0-39% (0-7) | Generic. |

---

### Question B4: Meridian Wealth (LO1, LO2, LO5)

**This is the most demanding question on the paper. It bundles graphical integrity, pre-attentive perception, the wrong palette family, ethics, and AI accountability into a single integrated critique.**

**Part (a): Evaluation of analyst's defence (20 marks)**

| Band | Descriptor |
|---|---|
| 70%+ (14-20) | All five strands with depth. Data accuracy vs graphical integrity (Tufte, lie factor: a 0.4-point spread shown as a near-vertical staircase has a lie factor far above 1.0). Pre-attentive shape perception (Ware): viewers absorb the slope before reading axis labels; "the labels are visible" is a fig leaf. Cleveland and McGill: position along a common scale should not be distorted. Diverging palette misuse: red-green divides "winners from losers" with no analytical midpoint; a sequential or categorical palette is required. Ethics: investors are protected stakeholders; misleading visuals carry regulatory exposure (e.g. ESMA, MiFID II). AI accountability: the tool optimises for output, not for integrity; the analyst's "the AI did it" is an abdication of professional responsibility. |
| 60-69% (12-13) | Four of five strands with depth. |
| 50-59% (10-11) | Three strands; "truncated axes mislead" without full perceptual mechanism. |
| 40-49% (8-9) | Two strands at surface level. |
| 0-39% (0-7) | Cannot critique. |

**Part (b): QA framework (15 marks)**

| Band | Descriptor |
|---|---|
| 70%+ (11-15) | Four+ criteria, each grounded. Examples: (1) **Graphical integrity** (Tufte, lie factor close to 1.0; axis baseline justified or clearly broken); (2) **Perceptual channel fit** (Cleveland and McGill, position for precise comparison; appropriate palette family for data type); (3) **Cognitive clarity** (Few; Knaflic, clear hierarchy, single dominant message, annotated insight); (4) **Ethical and accessibility check** (Kirk, source attribution, methodology disclosure, accessibility for colour vision deficiency, no selective omission); (5) **Audience and context check** ("so what" test for the specific decision-maker). Each criterion explained with a practical application step. |
| 60-69% (9-10) | Four criteria, most grounded. |
| 50-59% (7-8) | Three criteria, partial grounding. |
| 40-49% (6) | Two criteria, weak grounding. |
| 0-39% (0-5) | Fewer than two; incoherent. |

---

### Question B5: HarbourCity Open Data (LO1, LO2, LO5)

**This scenario tests audience-design plus visualisation ethics (data sparsity that systematically disadvantages a community) plus the ethical risk of "clean and simple" instructions that suppress legitimate uncertainty.**

**Part (a): Three-audience design challenge (15 marks)**

| Band | Descriptor |
|---|---|
| 70%+ (11-15) | Layered architecture with audience-appropriate entry points. Commuters: fast-loading mobile map with route-level congestion and ETA. Journalists: summary statistics, trend comparisons, exportable data. City planners: historical analysis, intersection-level drill-down, overlays for demographic and investment data. Shared data model, presentation layer adapts. Shneiderman's mantra applied; audience-first design (Kirk); progressive disclosure. |
| 60-69% (9-10) | Three audiences differentiated, principles named. |
| 50-59% (7-8) | Three audiences, recommendations overlap. |
| 40-49% (6) | Two audiences or no architecture. |
| 0-39% (0-5) | Single design imposed on all. |

**Part (b): Ethics of sparse-sensor underrepresentation (20 marks)**

| Band | Descriptor |
|---|---|
| 70%+ (14-20) | Frames the issue as visualisation ethics, not just data quality. The sensor sparsity is a data limitation; the visualisation **claim** ("congestion index for HarbourCity") is what overstates what the data can support. Discusses: equity implications of systematically underrepresenting a community's experience; the persuasive power of a polished public dashboard; "clean and simple" as an instruction can suppress essential caveats and become an ethical failure of its own. Specific design and disclosure features: confidence indicators or coverage maps shown alongside the index; explicit disclosure of sensor density and known limitations; community input channel; commitment to addressing the gap; methodology page accessible from every view. References to ethical visualisation (Kirk; Knaflic; D'Ignazio and Klein, *Data Feminism*) push to top band. |
| 60-69% (12-13) | Engages with both technical and trust dimensions. Several specific features. |
| 50-59% (10-11) | Identifies the data quality issue but treats it primarily as a technical fix. |
| 40-49% (8-9) | Surface-level. |
| 0-39% (0-7) | Fails to engage with the ethical dimension. |

---

## General Marking Principles

1. **Reward DataVis Challenge engagement.** Specific references (dataset, design choices, audience response, what worked, what would change) are evidence of applied understanding equivalent to theoretical citations.
2. **Named principles are valued and expected for top marks.** Applied understanding can reach 60%; 70%+ should demonstrate engagement with at least one of: named theory, recognised framework, or evidence of reading beyond core texts.
3. **Reward structure and reasoning** over volume. Concise and well-structured beats long and rambling.
4. **Reward honesty and critical reflection.** Acknowledging limitations is Level 9 thinking.
5. **Penalise vagueness, not informality.** Precise conversational register is fine.
6. **Scenario engagement matters.** Generic answers in B2/B3/B4/B5 are capped at 50-59%.
7. **70% threshold:** At least two of: (a) accurate use of named theories, (b) connection to applied DataVis Challenge experience, (c) wider reading, (d) genuine critical evaluation.

---

## LO Coverage Matrix

| Question | LO1 | LO2 | LO5 |
|---|---|---|---|
| A1 | Primary | | |
| A2 | | Primary | |
| A3 | Primary | | Secondary |
| A4 | | Primary | Secondary |
| B1 | Primary | | Primary |
| B2 | | Primary | Primary |
| B3 | Primary | Secondary | Primary |
| B4 | Primary | Primary | Primary |
| B5 | Primary | Primary | Primary |

All three examined LOs are assessable through compulsory Section A. Any combination of two Section B answers covers all three LOs multiple times.

---

*End of Marking Guidance*
