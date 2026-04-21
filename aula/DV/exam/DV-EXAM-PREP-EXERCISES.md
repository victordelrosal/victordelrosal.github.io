# 9DATAV: Teaching to the Terminal Exam
## Exercise Bank for Weeks 7-9 + Mock Exam Session

**Module:** 9DATAV Data Visualisation
**Purpose:** Structured exercises that prepare students for the terminal exam format while building named-theory fluency
**Design:** Lars Mortensen, March 17, 2026

---

## The Teaching Problem

Students have built dashboards and critiqued charts. They can DO visualisation. The exam tests whether they can NAME what they're doing and WHY, grounded in theory. The gap is: implicit knowledge needs to become explicit, citable, and arguable in written form.

**What the exam rewards:**
1. Named theories and principles (Tufte, Gestalt, Ware, Cleveland and McGill, Knaflic, Few, Shneiderman)
2. Application to specific business scenarios (not generic answers)
3. Critical evaluation (not description)
4. Proposed improvements grounded in theory (not just "make it better")

---

## Exercise Map: Which Exercise Prepares for Which Question

| Exercise | Format | Prepares for | Theory Covered |
|---|---|---|---|
| 1. The Theory Sprint | Individual, 10 min | A1-A4 (all Section A) | All named theories |
| 2. The Defence Drill | Pairs, 15 min | B1a, B4a (critical evaluation) | Tufte, Ware, perception |
| 3. The Redesign Argument | Groups of 3, 25 min | B1b, B2b (propose improvements) | Design principles, interactivity |
| 4. The Audience Split | Groups of 3, 20 min | B3 (three audiences) | Few, Shneiderman, Knaflic |
| 5. The QA Framework | Pairs, 15 min | B4b (QA framework) | All principles as checklist |
| 6. The 60-Second Theory | Individual, ongoing | All questions | Fluency with naming |

---

---

## Exercise 1: The Theory Sprint

**Format:** Individual, written, 10 minutes
**When:** Start of any remaining session (Week 7, 8, or 9)
**Purpose:** Build speed and confidence with Section A-style questions

### Instructions (read to class)

You have 10 minutes. Answer TWO of the following four questions. Write in full sentences. Name specific theories or principles where relevant.

### Question Bank (rotate across weeks)

**Set A (Week 7):**
1. What is the difference between a sequential and a diverging colour scale? Give one business scenario for each.
2. Define Tufte's "data-ink ratio." Give one example of a chart element that violates it.
3. Explain the Gestalt principle of proximity. How does it affect how a user reads a dashboard?
4. What is the difference between exploratory and explanatory visualisation? Why does this distinction matter for design?

**Set B (Week 8):**
1. What does Tufte mean by "graphical integrity"? Give one example of a chart that violates it and explain the impact.
2. Define two pre-attentive visual attributes. Why do they matter for dashboard design?
3. Explain the Gestalt principle of similarity. Give a dashboard example.
4. What is a categorical colour scale? When should it NOT be used?

**Set C (Week 9 / Mock):**
1. Cleveland and McGill ranked graphical perception channels. Name the two most accurate channels and explain why position is more accurate than area.
2. What is Shneiderman's Visual Information Seeking Mantra? How would you apply it to a logistics dashboard?
3. Explain Tufte's "lie factor." A chart makes a 5% change look like a 50% change. What is the approximate lie factor?
4. What is progressive disclosure in dashboard design? Give an example of how it reduces cognitive load.

### Debrief (5 min after writing)

Ask 2-3 students to read their answers. Correct and sharpen terminology. The goal: by Week 9, every student should be able to define these concepts from memory.

---

## Exercise 2: The Defence Drill

**Format:** Pairs, 15 minutes
**When:** Week 7 or 8
**Purpose:** Practise the critical evaluation skill tested in B1a and B4a

### Instructions

**Step 1 (2 min):** Read the scenario below.

**Step 2 (5 min):** Person A writes a 3-sentence defence of the chart ("It's fine because..."). Person B writes a 3-sentence critique ("It fails because...").

**Step 3 (5 min):** Swap and read. Person B now attacks the defence. Person A now attacks the critique. Each must use at least one named theory or principle.

**Step 4 (3 min):** Together, write one sentence that captures the core issue. This is the "thesis statement" you would use to open a Section B answer.

### Scenario Bank

**Scenario 1: The Fundraising Dashboard**
A charity publishes a bar chart showing donations by month. The Y-axis starts at 90,000 instead of 0. The chart title reads "Donations Surge in Q4." A board member says: "The numbers are correct. The title reflects the trend."

**Scenario 2: The AI Sales Report**
A sales manager asks ChatGPT to generate a quarterly report. The AI produces a pie chart with 12 slices showing market share by product. Three slices are nearly identical shades of blue. The manager says: "It looks professional. The data is right."

**Scenario 3: The CEO's Favourite Dashboard**
A CEO's executive dashboard uses a 3D pie chart for revenue by region, a traffic-light table for KPIs (red/amber/green), and a line chart with no axis labels. The CEO says: "I've used this format for years. It works for me."

---

## Exercise 3: The Redesign Argument

**Format:** Groups of 3, 25 minutes
**When:** Week 7 or 8
**Purpose:** Practise proposing improvements grounded in named principles (B1b, B2b)

### Instructions

Your group receives a flawed dashboard scenario. You have 25 minutes.

**Step 1 (5 min):** List every design problem you can find. Next to each, write the name of the principle it violates.

**Step 2 (10 min):** Propose a redesign. You must include:
- One specific layout change (justified by a named principle)
- Two interactive features (each justified by user need)
- One colour change (justified by colour theory or accessibility)

**Step 3 (5 min):** Write a 4-sentence redesign summary as if opening a Section B(b) answer.

**Step 4 (5 min):** One group presents. Class critiques: "Did they name the principles? Did they justify each change?"

### Scenario

**MediTrack Hospital Dashboard.** A hospital A&E department displays a wall-mounted dashboard with: 8 small bar charts (one per ward) using different colour schemes; a real-time patient count in 8pt font; wait time averages shown as a line chart with no annotations; and a scrolling table of 200 patient records. Nurses report they "never look at it."

---

## Exercise 4: The Audience Split

**Format:** Groups of 3, 20 minutes
**When:** Week 8
**Purpose:** Practise designing for multiple audiences (B3)

### Instructions

Your group is a data visualisation consultancy. A client has one dataset but three audiences.

**Step 1 (5 min):** For each audience, answer: What is their one key question? How often do they look at this? How much time do they have?

**Step 2 (10 min):** For each audience, propose:
- Chart types (be specific: "grouped bar chart," not "a chart")
- Level of interactivity (none / filters only / full drill-down)
- One design choice that differs from the other audiences

**Step 3 (5 min):** The client says: "Can we just build one?" Write 3 sentences explaining why this is problematic, using at least one named principle.

### Scenario

**FreshRoute Grocery Chain.** 40 stores, 3 years of sales data. Audiences: (1) The CFO, who wants a monthly strategic overview in a board pack. (2) Regional managers, who compare 8-10 stores weekly. (3) Store managers, who check stock and daily sales every morning on a tablet.

---

## Exercise 5: The QA Framework

**Format:** Pairs, 15 minutes
**When:** Week 8 or 9
**Purpose:** Practise building an evaluation framework grounded in named principles (B4b)

### Instructions

A financial services company asks you to create a checklist that every analyst must complete before showing a chart to a client.

**Step 1 (8 min):** Create a checklist with exactly 4 items. Each item must:
- Have a clear, actionable name (e.g., "Graphical Integrity Check")
- Reference a specific principle or theory (e.g., "Tufte's lie factor")
- Include one concrete test (e.g., "Does the lie factor exceed 1.05?")

**Step 2 (5 min):** Swap checklists with another pair. Score each item: does it name a principle? Is the test concrete? Could an analyst actually use this?

**Step 3 (2 min):** Each pair shares their strongest checklist item with the class.

---

## Exercise 6: The 60-Second Theory

**Format:** Individual, 60 seconds, no notes
**When:** Quick-fire round at the start or end of any session
**Purpose:** Build recall fluency for named theories

### How It Works

Call on a student. Give them a term. They have 60 seconds to: define it, give one example, and explain why it matters for data visualisation.

### Term Bank

| Term | Expected Answer Includes |
|---|---|
| Data-ink ratio | Tufte; proportion of ink devoted to data; maximise by removing chartjunk |
| Lie factor | Tufte; visual effect size vs data effect size; should be close to 1.0 |
| Graphical integrity | Tufte; visual representation proportional to numbers; truncated axes violate it |
| Pre-attentive attributes | Ware/Healey; colour, size, orientation processed before conscious attention |
| Gestalt: proximity | Elements close together perceived as grouped; affects dashboard layout |
| Gestalt: similarity | Elements sharing visual properties perceived as related; colour coding |
| Sequential colour scale | Single hue gradient; ordered data; e.g., population density |
| Diverging colour scale | Two hues from neutral midpoint; deviation data; e.g., profit/loss |
| Progressive disclosure | Show summary first, detail on demand; reduces cognitive load |
| Shneiderman's mantra | Overview first, zoom and filter, details on demand |
| Cleveland and McGill | Hierarchy of graphical perception; position most accurate, then length, angle, area |
| Exploratory vs explanatory | Discovery (analyst) vs communication (audience); different design needs |
| Cognitive load | Miller; working memory limits; too many dashboard panels overwhelm users |
| Knaflic's Big Idea | One sentence: what, so what, now what; drives explanatory visualisation |

---

---

# Proposed Exercise Wording for Online MS Teams Sessions

## Format Considerations for Online Delivery

- Students work in Teams breakout rooms (groups) or individually with camera on
- Use Teams chat for submissions (paste text, screenshot of notes)
- Time-box strictly: online attention spans are shorter
- Every exercise produces a written output that could be pasted into the chat

---

## Individual Exercises (Online)

### Individual Exercise A: "Name That Principle" (8 minutes)

**Post in Teams chat:**

> **INDIVIDUAL EXERCISE: Name That Principle (8 minutes)**
>
> Below are three dashboard problems. For EACH, do two things:
> 1. Name the specific visualisation principle or theory being violated
> 2. Explain in one sentence why this matters for the viewer
>
> **Problem 1:** A choropleth map uses a rainbow colour palette (red, orange, yellow, green, blue, violet) to show unemployment rates across Irish counties.
>
> **Problem 2:** A Power BI dashboard shows 12 KPI cards, 4 bar charts, 3 line charts, and 2 pie charts on a single screen. The user says: "I don't know where to look first."
>
> **Problem 3:** A quarterly investor presentation includes a line chart where the Y-axis starts at 97% instead of 0%, making a 2% improvement look like the line goes from bottom to top.
>
> Type your answers directly into the Teams chat. You have 8 minutes.

**Debrief (5 min):** Scan responses live. Highlight best answers. Correct terminology where needed. Model a "full marks" answer for one problem.

---

### Individual Exercise B: "Write the Opening Paragraph" (10 minutes)

**Post in Teams chat:**

> **INDIVIDUAL EXERCISE: Write the Opening Paragraph (10 minutes)**
>
> Imagine you are sitting the terminal exam. You have chosen to answer Question B1 (HealthWatch Ireland). You need to critically evaluate a public health dashboard that uses a rainbow colour palette, a truncated Y-axis, and no annotations.
>
> Write ONLY the opening paragraph of your answer (4-5 sentences). Your paragraph should:
> - State the core problem clearly
> - Name at least two specific theories or principles
> - Set up the structure of your full answer
>
> Do NOT write the full answer. Just the opening paragraph.
>
> Paste your paragraph into the Teams chat when done. You have 10 minutes.

**Debrief (5 min):** Read 2-3 aloud. Compare: who named theories? Who was specific? Who set up a clear structure? This teaches exam technique directly.

---

### Individual Exercise C: "The Quick Checklist" (7 minutes)

**Post in Teams chat:**

> **INDIVIDUAL EXERCISE: The Quick Checklist (7 minutes)**
>
> A junior analyst has created a chart for an external client presentation. Before it goes out, you must review it.
>
> Write a 4-item quality checklist. Each item must:
> - Have a one-line description of what to check
> - Name the principle or theory behind it
>
> Example: "1. Axis integrity: Does the Y-axis start at zero or include a visual break? (Tufte, graphical integrity)"
>
> Write items 2, 3, and 4 yourself. Paste into Teams chat. 7 minutes.

---

## Group Exercises (Online, Breakout Rooms)

### Group Exercise A: "The Tribunal Returns" (20 minutes)

**Instructions (read before sending to breakout rooms):**

> **GROUP EXERCISE: The Tribunal Returns (20 minutes)**
>
> In your breakout room (3-4 people), you will receive a flawed dashboard scenario.
>
> **Round 1 (8 min): The Prosecution**
> As a group, identify every design flaw you can find. For each flaw, write:
> - What the problem is (one sentence)
> - Which principle or theory it violates (name it)
> - Why it matters for the intended audience (one sentence)
>
> **Round 2 (7 min): The Redesign**
> Propose three specific improvements. Each must reference a named principle.
>
> **Round 3 (5 min): The Verdict**
> Write a single paragraph (5-6 sentences) summarising your evaluation and recommendations. This paragraph should read like a strong Section B exam answer.
>
> **Appoint a spokesperson.** You will present your verdict (2 minutes) when we reconvene.
>
> **Your scenario:**
> *SmartFarm Analytics* built a dashboard for Irish dairy farmers showing: milk yield per cow (pie chart with 40 slices, one per cow), feed cost trends (line chart with no axis labels), weather overlay (rainbow heatmap), and a profit/loss summary (bar chart with 3D effects and a truncated Y-axis starting at 85%). The dashboard is displayed on a tablet in the milking parlour. Farmers say they "check it once and then ignore it."

---

### Group Exercise B: "Three Audiences, One Dataset" (15 minutes)

**Instructions (read before sending to breakout rooms):**

> **GROUP EXERCISE: Three Audiences, One Dataset (15 minutes)**
>
> Your group is a visualisation consultancy. Your client, *UrbanPulse Transport*, runs public buses in Dublin. They have 2 years of data: routes, passenger counts, delays, driver schedules, and weather conditions.
>
> Three people need dashboards:
> 1. **The CEO** (monthly board meeting, 2 minutes to scan, wants strategic trends)
> 2. **Operations Manager** (daily, compares route performance, needs to spot problems fast)
> 3. **A City Councillor** (quarterly, wants to see if public investment is delivering results)
>
> **For each audience (5 min per audience):**
> - What is their one key question?
> - Recommend 2 chart types (be specific: "bullet chart" not "a chart")
> - What level of interactivity? (None / Filters / Full drill-down)
> - One design choice that DIFFERS from the other two audiences
>
> **Bonus (if time):** The CEO asks: "Just build one dashboard." Write 2 sentences explaining why this is problematic.
>
> **Paste your output into the Teams chat when done.**

---

### Group Exercise C: "AI on Trial" (15 minutes)

**Instructions (read before sending to breakout rooms):**

> **GROUP EXERCISE: AI on Trial (15 minutes)**
>
> A marketing analyst at *Vantage Insurance* used an AI tool to generate six charts for a board presentation. The AI produced:
> - A 3D pie chart with 8 slices
> - A bar chart with a truncated Y-axis
> - A line chart with no title or axis labels
> - A choropleth map using a rainbow palette
> - A scatter plot with overlapping unlabelled points
> - A dashboard with all six charts on one slide, no visual hierarchy
>
> The analyst says: "The data is correct. The AI generated these. They look professional."
>
> **Your task:**
> 1. Pick the THREE most problematic charts from the list (3 min)
> 2. For each, explain the specific design failure AND name the principle violated (6 min)
> 3. Write a 3-sentence response to the analyst's defence: "The data is correct" (3 min)
> 4. Propose ONE quality check the company should add to its workflow before any AI-generated chart goes external (3 min)
>
> **Appoint a spokesperson. You will present your response (2 minutes) when we reconvene.**

---

## Suggested Session Plans

### Week 7 Session (March 17): "Name the Theory"

| Time | Activity | Output |
|---|---|---|
| 0:00 | Theory Anchor: Pre-attentive attributes, Gestalt, F-pattern (20 min) | Named concepts on slides |
| 0:20 | Exercise 1 Set A: Theory Sprint (10 min + 5 min debrief) | Written answers |
| 0:35 | Exercise 2: Defence Drill, Scenario 1 (15 min + 5 min debrief) | Thesis statements |
| 0:55 | Break (5 min) | |
| 1:00 | Exercise 3: Redesign Argument, MediTrack (25 min + 5 min present) | Redesign summaries |
| 1:30 | Dashboard work time / coursework support (remaining time) | |

### Week 8 Session (March 24): "Audience and Ethics"

| Time | Activity | Output |
|---|---|---|
| 0:00 | Theory Anchor: Cleveland and McGill, Tufte, Bertin (20 min) | Named concepts on slides |
| 0:20 | Exercise 1 Set B: Theory Sprint (10 min + 5 min debrief) | Written answers |
| 0:35 | Exercise 4: Audience Split, FreshRoute (20 min + 5 min present) | Audience recommendations |
| 1:00 | Break (5 min) | |
| 1:05 | Exercise 5: QA Framework (15 min + 5 min debrief) | Checklists |
| 1:25 | Dashboard work time / coursework support (remaining time) | |

### Week 9 Session (March 31): "Dress Rehearsal"

| Time | Activity | Output |
|---|---|---|
| 0:00 | Exercise 1 Set C: Theory Sprint (10 min + 5 min debrief) | Written answers |
| 0:15 | Exercise 6: 60-Second Theory, full round (15 min) | Verbal fluency |
| 0:30 | Mock exam: 1 Section A question + 1 Section B question (45 min, timed) | Practice answers |
| 1:15 | Break (5 min) | |
| 1:20 | Debrief mock answers against marking guidance (15 min) | Self-assessment |
| 1:35 | Coursework sprint / final questions (remaining time) | |

---

*These exercises make the implicit explicit. Every one produces a written output that mirrors what the exam demands: name the theory, apply it to a scenario, argue for a specific improvement. By Week 9, students should be able to do this from memory.*
