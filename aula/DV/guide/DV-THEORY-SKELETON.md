# 9DATAV Data Visualisation: Theory Skeleton

## Module Reference

| Detail | Value |
|--------|-------|
| Module Code | 9DATAV |
| Level | 9 (NFQ) / 7 (EQF) |
| Credits | 5 ECTS |
| Assessment | CA 60% + Terminal Exam 40% |
| Core Texts | Kirk (2019); Knaflic (2015); Ware (2012); Ward et al. (2010); Steele & Iliinsky (2011) |
| Supplementary | Tufte (2001); Few (2009); Barker (2013) |

---

## Learning Outcomes at a Glance

| LO | Full Description | Shorthand | Assessed By |
|----|-----------------|-----------|-------------|
| LO1 | Analyse the theory and concepts relating to visualisation and data representation | Visualisation Theory & Concepts | Exam + CA |
| LO2 | Critique advanced theories and concepts related to human perception, cognition, and the processing of visual information in the context of business analytics | Perception & Cognition | Exam |
| LO3 | Design and implement data visualisations that effectively communicate insights from complex datasets to diverse audiences in a business analytics context | Design & Implementation | CA |
| LO4 | Evaluate and select appropriate tools and technologies for creating data visualisations, and effectively communicate data insights through visual storytelling | Tools, Technologies & Storytelling | CA |
| LO5 | Critically evaluate and apply data visualisation design principles and interaction strategies | Design Principles & Interaction | Exam + CA |
| LO6 | Develop a comprehensive data visualisation design proposal | Design Proposal | CA |

**Terminal Exam tests: LO1, LO2, LO5**
**CA tests: LO1, LO3, LO4, LO5, LO6**

---

## How to Use This Document

This theory skeleton is structured around six major pillars that map directly to the module's indicative content. Each pillar is broken down 2-3 levels deep. For every leaf node, you will find:

- The core concept or framework to understand
- Its relevance to one or more Learning Outcomes
- Pointers to recommended reading

When revising for the terminal exam (40% of module grade, 2-hour paper, long and short-form questions), use this skeleton to check coverage. The exam tests LO1 (visualisation theory and concepts), LO2 (human perception, cognition, and visual processing), and LO5 (design principles and interaction strategies). Depth of knowledge, critical evaluation, and evidence of reading beyond the core texts are all expected at Level 9.

For the CA (60% of module grade), the skeleton supports LO1, LO3, LO4, LO5, and LO6: practical design and implementation, tool selection and evaluation, visual storytelling, and the comprehensive design proposal.

---

# PILLAR 1: Foundations of Data Visualisation Theory

**Primary LO: LO1** | **Exam + CA**

This pillar addresses the foundational "what" and "why" of data visualisation: its definition, historical roots, core purposes, and the process frameworks that guide effective visualisation design.

---

## 1.1 What Is Data Visualisation?

### 1.1.1 Definitions and Scope

- **Definition**: Data visualisation is the graphical representation of data and information, using visual elements such as charts, graphs, maps, and diagrams to make patterns, trends, outliers, and relationships accessible to human perception.
- **Kirk's definition**: "The visual representation and presentation of data to facilitate understanding" (Kirk, 2019). Note the dual emphasis on representation (encoding data visually) and presentation (communicating to an audience).
- **Broader scope**: Visualisation spans from simple bar charts in business reports to complex interactive dashboards, scientific visualisation, information art, and real-time analytical displays.
- **Relevance to LOs**: LO1 (core theory of visualisation and data representation).
- **Reading**: Kirk (2019), Ch. 1; Ward et al. (2010), Ch. 1; Steele & Iliinsky (2011), Ch. 1.

### 1.1.2 History and Evolution

- **Early milestones**: William Playfair's invention of the bar chart, line chart, and pie chart (late 1700s); Florence Nightingale's polar area diagram (1858); Charles Joseph Minard's map of Napoleon's Russian campaign (1869), often cited as the best statistical graphic ever produced.
- **The golden age**: John Tukey's Exploratory Data Analysis (1977); Jacques Bertin's Semiology of Graphics (1967); Edward Tufte's The Visual Display of Quantitative Information (1983/2001).
- **The digital revolution**: From hand-drawn graphics to computer-generated visualisation; the rise of interactive tools (Tableau, Power BI, D3.js); the democratisation of visualisation capability.
- **Current landscape**: Real-time dashboards, AI-assisted chart recommendations, mobile-first design, and the growing importance of data literacy as a professional competency.
- **Exam tip**: Be prepared to reference specific historical examples to illustrate how visualisation principles have long been used to communicate complex data and drive decisions.
- **Relevance to LOs**: LO1 (historical context for visualisation theory).
- **Reading**: Tufte (2001), Ch. 1-2; Kirk (2019), Ch. 1; Ward et al. (2010), Ch. 1.

### 1.1.3 The Role of Visualisation in Business Analytics

- **Why visualise?**: The human visual system can process visual information far more rapidly than tables of numbers. Visualisation leverages our innate perceptual capabilities to detect patterns, outliers, and trends.
- **Visualisation in the analytics pipeline**: Visualisation serves at every stage of the analytics workflow: exploration (understanding the data), analysis (identifying patterns), and communication (presenting findings to stakeholders).
- **Business value**: Faster decision-making; improved stakeholder engagement; reduced misinterpretation of complex data; enhanced ability to identify opportunities and risks.
- **The risk of poor visualisation**: Misleading charts, cluttered dashboards, and inappropriate encodings can actively harm decision-making by distorting or obscuring the truth in the data.
- **Relevance to LOs**: LO1, LO4 (the business analytics context for visualisation).
- **Reading**: Kirk (2019), Ch. 1; Knaflic (2015), Ch. 1; Few (2009), Ch. 1.

---

## 1.2 Exploratory vs. Explanatory Visualisation

### 1.2.1 Exploratory Visualisation

- **Definition**: Visualisations created for the analyst's own use during the data analysis process. The purpose is to discover patterns, anomalies, and relationships in the data.
- **Characteristics**: Rapid, iterative, often rough; many charts are created and discarded; the audience is the analyst themselves.
- **Knaflic's distinction**: "Exploratory analysis is what you do to understand the data. Explanatory analysis is what you do to communicate your findings" (Knaflic, 2015).
- **Techniques**: Scatter plot matrices, histograms, box plots, small multiples; anything that helps the analyst "see" the data from multiple angles.
- **Relevance to LOs**: LO1 (understanding the dual purposes of visualisation).
- **Reading**: Knaflic (2015), Ch. 1; Kirk (2019), Ch. 2; Tufte (2001), Ch. 2.

### 1.2.2 Explanatory Visualisation

- **Definition**: Visualisations crafted to communicate a specific message, insight, or story to a defined audience. The purpose is persuasion, education, or decision support.
- **Characteristics**: Polished, focused, with a clear narrative thread; the audience is someone other than the analyst (executives, clients, the public).
- **Design implications**: Every design choice (chart type, colour, annotation, title) should serve the communicative goal. Remove anything that does not contribute to the message.
- **The danger of showing exploratory work as explanatory**: Presenting raw analytical output without editorial curation overwhelms the audience and buries the insight.
- **Relevance to LOs**: LO1, LO4 (visual storytelling and audience communication).
- **Reading**: Knaflic (2015), Ch. 1-2; Kirk (2019), Ch. 2.

### 1.2.3 Kirk's Visualisation Design Process

- **Four stages**: (1) Formulating the brief, (2) Working with data, (3) Establishing editorial thinking, (4) Developing design solutions.
- **Formulating the brief**: Define the purpose (informing, enabling exploration, or persuading), the audience, and the context of consumption.
- **Working with data**: Acquiring, examining, and transforming data for visualisation; understanding what the data can and cannot reveal.
- **Editorial thinking**: Deciding what story to tell; choosing which data to foreground and which to relegate or omit; framing the narrative.
- **Design solutions**: Selecting visual representations, establishing interactivity, managing layout, and refining aesthetics.
- **Relevance to LOs**: LO1, LO5 (design process as a systematic discipline).
- **Reading**: Kirk (2019), Ch. 2-4.

---

## 1.3 Data Types and Their Visual Representations

### 1.3.1 Categorical, Ordinal, and Quantitative Data

- **Categorical (nominal)**: Data that falls into distinct groups with no inherent order (e.g., country, product category, department). Visual encoding: colour hue, spatial grouping, shape.
- **Ordinal**: Categorical data with a meaningful order but unequal intervals (e.g., satisfaction rating: low, medium, high; education level). Visual encoding: position along an ordered axis, sequential colour.
- **Quantitative (interval/ratio)**: Numerical data with meaningful magnitudes (e.g., revenue, temperature, count). Visual encoding: length, position, area, angle.
- **The encoding principle**: The visual encoding must match the data type. Using length (a quantitative channel) for categorical data, or hue (a categorical channel) for quantitative data, creates confusion.
- **Scales of measurement summary**:

| Scale | Properties | Examples | Appropriate Visual Encodings |
|-------|-----------|----------|------------------------------|
| **Nominal** | Identity only; no order | Gender, country, product category | Colour hue, shape, spatial grouping |
| **Ordinal** | Identity + order; unequal intervals | Satisfaction rating, education level | Position on ordered axis, colour saturation, size |
| **Interval** | Identity + order + equal intervals; no true zero | Temperature (Celsius), calendar year | Position, length, area |
| **Ratio** | Identity + order + equal intervals + true zero | Revenue, weight, distance | Position, length, area, angle |

- **Relevance to LOs**: LO1 (data types and representation).
- **Reading**: Kirk (2019), Ch. 3, 6; Ware (2012), Ch. 5; Ward et al. (2010), Ch. 2-3.

### 1.3.2 Temporal, Spatial, and Relational Data

- **Temporal data**: Data indexed by time (dates, timestamps, durations). Typically encoded on the horizontal axis with line charts, area charts, or timeline visualisations. Requires attention to granularity and cyclical patterns.
- **Spatial data**: Data with geographic coordinates or locations. Encoded using maps (choropleth, point, flow), cartograms, or spatial heat maps.
- **Relational data**: Data describing connections between entities (networks, hierarchies, flows). Encoded using node-link diagrams, adjacency matrices, treemaps, or Sankey diagrams.
- **Multi-dimensional data**: Datasets with many variables per observation. Techniques include parallel coordinates, small multiples, and dimensionality reduction (PCA plots, t-SNE).
- **Relevance to LOs**: LO1, LO3 (matching data characteristics to visual forms).
- **Reading**: Kirk (2019), Ch. 6-7; Ward et al. (2010), Ch. 5-8.

---

# PILLAR 2: Human Perception and Cognition

**Primary LO: LO2** | **Exam**

This pillar examines the science of how humans see and process visual information. Understanding perception and cognition is essential for designing visualisations that work with (rather than against) the human visual system. LO2 explicitly asks for critique of advanced perception and cognition theories.

---

## 2.1 Pre-attentive Visual Attributes

### 2.1.1 What Are Pre-attentive Attributes?

- **Definition**: Visual properties that are detected by the low-level visual system rapidly and automatically, before conscious attention is directed. Detection occurs in under 250 milliseconds, regardless of the number of other elements in the display.
- **Why they matter for visualisation**: Pre-attentive attributes allow a viewer to instantly spot a "pop-out" element in a display. Effective visualisations leverage these attributes to draw attention to the most important data.
- **The "pop-out" effect**: A single red dot among many grey dots is detected instantly. A single square among many circles is detected instantly. But a red square among red circles and grey squares requires serial (slow) search, because the target differs on a *combination* of attributes rather than a single attribute.
- **Relevance to LOs**: LO2 (perception and cognition of visual information).
- **Reading**: Ware (2012), Ch. 5; Kirk (2019), Ch. 9; Few (2009), Ch. 3.

### 2.1.2 Key Pre-attentive Attributes

- **Colour hue**: Different colours are pre-attentively distinguishable. Highly effective for categorical distinctions but limited (typically 6-8 distinguishable hues in a single view).
- **Colour intensity/saturation**: Variations in lightness or saturation encode quantitative magnitude. Used in sequential colour scales (light to dark).
- **Size**: Differences in the area or length of marks. Effective for quantitative encoding, though humans are less accurate at judging area than length (Stevens' power law).
- **Orientation**: Differences in angle or tilt. Useful for encoding directional data but limited in the number of distinguishable levels.
- **Shape**: Different geometric forms (circle, square, triangle). Effective for categorical distinction but only when a small number of shapes are used.
- **Position**: The spatial location of a mark on a plane. The most accurate pre-attentive attribute for encoding quantitative data (Cleveland and McGill's finding).
- **Motion**: Moving elements attract attention strongly. Used in animated visualisations and transitions, but can be distracting if overused.
- **Relevance to LOs**: LO2 (applying perceptual science to visual design).
- **Reading**: Ware (2012), Ch. 5-6; Few (2009), Ch. 3; Kirk (2019), Ch. 9.

### 2.1.3 Applying Pre-attentive Processing in Design

- **Strategic use of pop-out**: Use pre-attentive attributes to highlight the most important data points, deviations from norms, or elements that require attention.
- **Avoiding unintentional pop-out**: Decorative elements, unnecessary colour variation, or inconsistent formatting can cause visual elements to "pop out" for the wrong reasons, drawing attention away from the data.
- **Combining attributes**: Using multiple pre-attentive channels simultaneously (e.g., both colour and size) can reinforce an encoding, but using too many channels creates visual noise.
- **Exam tip**: Be prepared to identify which pre-attentive attributes are used in a given visualisation and evaluate whether they are used effectively or misleadingly.
- **Relevance to LOs**: LO2, LO5 (critique and application of perceptual principles).
- **Reading**: Ware (2012), Ch. 5; Knaflic (2015), Ch. 4.

---

## 2.2 Gestalt Principles of Visual Perception

### 2.2.1 Overview of Gestalt Theory

- **Definition**: Gestalt psychology studies how humans perceive visual elements as organised patterns and wholes rather than as disconnected parts. "The whole is other than the sum of its parts" (Wertheimer).
- **Relevance to visualisation**: Gestalt principles explain how viewers group, separate, and organise visual elements in a chart or dashboard. Designers can use these principles deliberately to guide perception; those who ignore them may inadvertently create confusion.
- **Relevance to LOs**: LO2 (theories of visual perception).
- **Reading**: Ware (2012), Ch. 6; Kirk (2019), Ch. 9; Few (2009), Ch. 4.

### 2.2.2 The Core Gestalt Principles

| Principle | Description | Visualisation Application |
|-----------|------------|--------------------------|
| **Proximity** | Elements placed close together are perceived as belonging to the same group | Spacing between chart elements signals grouping; grouped bar charts; dashboard panel layout |
| **Similarity** | Elements that share visual properties (colour, shape, size) are perceived as related | Consistent colour coding for the same data series across multiple charts |
| **Enclosure** | Elements enclosed within a boundary are perceived as a group | Boxes or shaded regions grouping related dashboard components |
| **Closure** | The brain completes incomplete shapes | Grid lines can be implied rather than drawn; axes do not need to fully enclose the chart area |
| **Continuity** | The eye follows smooth, continuous paths | Line charts exploit continuity; aligning chart axes creates visual flow |
| **Connection** | Elements connected by a line are perceived as strongly related | Line charts connecting data points; network diagrams; flow diagrams |

- **Hierarchy of strength**: Enclosure and connection are typically the strongest grouping cues, followed by proximity and similarity. Designers should layer these principles deliberately.
- **Exam tip**: The Gestalt principles are a near-certain exam topic for LO2. Be able to define each, give a visualisation-specific example, and explain how misapplication can mislead viewers.
- **Relevance to LOs**: LO2, LO5 (applying perceptual theory to design decisions).
- **Reading**: Ware (2012), Ch. 6; Few (2009), Ch. 4; Knaflic (2015), Ch. 3.

### 2.2.3 Gestalt Principles in Dashboard Design

- **Grouping related metrics**: Use proximity and enclosure to cluster KPIs that relate to the same business function or question.
- **Separating unrelated elements**: White space (negative space) is a design tool, not wasted space. It creates visual separation between distinct groups.
- **Alignment**: Consistent alignment of chart elements creates visual continuity and reduces cognitive effort.
- **Common pitfalls**: Inconsistent spacing, arbitrary colour assignments, and lack of visual grouping force the viewer to work harder to extract meaning.
- **Relevance to LOs**: LO2, LO5 (practical application of Gestalt in design).
- **Reading**: Few (2009), Ch. 4-5; Knaflic (2015), Ch. 3.

---

## 2.3 Cognitive Load Theory and Working Memory

### 2.3.1 Cognitive Load Theory

- **Definition**: Cognitive load refers to the total amount of mental effort required to process information. In visualisation, the goal is to minimise extraneous cognitive load (caused by poor design) so that the viewer's cognitive resources are available for intrinsic load (understanding the content).
- **Three types of cognitive load**:
  - **Intrinsic load**: The inherent complexity of the information itself. A multivariate dataset is intrinsically more complex than a single variable.
  - **Extraneous load**: The unnecessary mental effort caused by poor design: cluttered layouts, confusing labels, inconsistent encodings, gratuitous decoration.
  - **Germane load**: The productive cognitive effort devoted to schema construction and deep understanding.
- **The designer's goal**: Reduce extraneous load so that cognitive resources can be devoted to germane processing of the actual data.
- **Relevance to LOs**: LO2 (cognition and processing of visual information).
- **Reading**: Ware (2012), Ch. 1-2, 7; Knaflic (2015), Ch. 3; Kirk (2019), Ch. 9.

### 2.3.2 Working Memory Limitations

- **Miller's Law**: Working memory can hold approximately 7 (plus or minus 2) chunks of information at once. More recent research suggests the practical limit for visual information is closer to 3-4 items.
- **Implications for visualisation**: Dashboards with 20 KPIs, charts with 15 coloured categories, and tables with dozens of columns overwhelm working memory. The viewer cannot hold all the information simultaneously and must resort to serial scanning.
- **Chunking**: Organising information into meaningful groups (chunks) extends effective working memory. A well-structured dashboard chunks related metrics into coherent panels.
- **Progressive disclosure**: Presenting summary information first and allowing the viewer to drill into detail on demand. This respects working memory limits by showing only what is needed at each level of inquiry.
- **Relevance to LOs**: LO2, LO5 (designing for human cognitive limits).
- **Reading**: Ware (2012), Ch. 7; Few (2009), Ch. 3; Knaflic (2015), Ch. 3.

### 2.3.3 Change Blindness and Inattentional Blindness

- **Change blindness**: Failure to notice significant changes in a visual scene when attention is not directed to the change. In visualisation, if a dashboard updates a key metric without visual signalling (animation, colour flash), the user may not notice.
- **Inattentional blindness**: Failure to notice an unexpected stimulus when attention is focused elsewhere. Critical alerts or annotations can be missed if they do not break through the viewer's current attentional focus.
- **Design implication**: Use animation, colour change, or spatial repositioning to signal important changes. Do not assume that placing information on screen guarantees it will be seen.
- **Relevance to LOs**: LO2 (cognitive limitations affecting visual processing).
- **Reading**: Ware (2012), Ch. 7.

---

## 2.4 Cleveland and McGill's Hierarchy of Graphical Perception

### 2.4.1 The Ranking of Visual Encodings

- **Definition**: Cleveland and McGill (1984) experimentally ranked visual encoding channels by the accuracy with which humans can decode quantitative values from them.
- **The hierarchy (most accurate to least accurate)**:

| Rank | Visual Encoding | Accuracy |
|------|----------------|----------|
| 1 (most accurate) | Position on a common scale | Highest |
| 2 | Position on non-aligned scales | High |
| 3 | Length | High |
| 4 | Angle / Slope | Moderate |
| 5 | Area | Low |
| 6 | Volume | Low |
| 7 (least accurate) | Colour saturation / Colour hue | Lowest for quantitative |

- **Design implication**: Whenever possible, encode the most important quantitative comparisons using position and length. Reserve less accurate channels (area, colour saturation) for secondary or approximate information.
- **Exam tip**: The Cleveland and McGill hierarchy is one of the most frequently tested frameworks in data visualisation. Be prepared to cite it, explain the ranking, and use it to justify chart type recommendations.
- **Relevance to LOs**: LO2 (hierarchy of graphical perception); LO5 (selecting appropriate encodings).
- **Reading**: Ware (2012), Ch. 5; Kirk (2019), Ch. 9; Ward et al. (2010), Ch. 3.

### 2.4.2 Implications for Chart Selection

- **Why bar charts outperform pie charts**: Bar charts encode data using position and length (ranks 1 and 3), while pie charts encode data using angle and area (ranks 4 and 5). Humans are significantly more accurate at comparing bar lengths than pie slices.
- **The problem with 3D charts**: 3D effects add visual complexity without informational benefit. Perspective distortion makes values harder to judge accurately, and occlusion (front elements hiding back elements) can conceal data.
- **Area encoding challenges**: Humans tend to underestimate the area of larger shapes (Stevens' power law, with an exponent of approximately 0.7 for area), making bubble charts and proportional symbol maps prone to misinterpretation. Use area encodings cautiously and consider providing numerical labels.
- **Relevance to LOs**: LO2, LO5 (evaluating encoding effectiveness).
- **Reading**: Ware (2012), Ch. 5; Few (2009), Ch. 3; Kirk (2019), Ch. 9.

---

## 2.5 Colour Perception

### 2.5.1 Sequential, Diverging, and Categorical Colour Scales

- **Sequential scales**: A single hue varying from light to dark (e.g., light blue to dark blue). Used for ordered, quantitative data where values range from low to high.
- **Diverging scales**: Two hues diverging from a neutral midpoint (e.g., blue-white-red). Used when data has a meaningful centre point (zero, average, target) and values above and below it carry different significance.
- **Categorical (qualitative) scales**: Distinct hues with similar saturation and brightness (e.g., the Set1 palette). Used for nominal categories where no inherent order exists.
- **The matching principle**: The colour scale must match the data type. A sequential scale for categorical data (or a categorical palette for quantitative data) creates confusion.
- **Perceptual uniformity**: In a well-designed colour scale, equal numerical differences in data correspond to equal perceived differences in colour. The CIELAB colour space and palettes like Viridis are designed with this property.
- **Relevance to LOs**: LO2 (colour perception); LO5 (design principles).
- **Reading**: Ware (2012), Ch. 4; Kirk (2019), Ch. 9; Few (2009), Ch. 4.

### 2.5.2 Accessibility and Colour-Blind Considerations

- **Prevalence**: Approximately 8% of males and 0.5% of females of Northern European descent have some form of colour vision deficiency. The most common form is red-green deficiency (deuteranopia/protanopia).
- **Design implications**: Avoid encoding critical distinctions solely through colour, particularly red-green distinctions. Use redundant encodings (colour plus shape, colour plus pattern, colour plus label).
- **Simulation tools**: Tools such as Coblis, Sim Daltonism, Colour Oracle, and built-in accessibility checkers in Tableau and Power BI allow designers to preview how a visualisation appears to colour-blind viewers.
- **Safe palettes**: Colour Brewer palettes (colorbrewer2.org) include colour-blind safe options. Viridis, Cividis, and other perceptually uniform palettes are designed for accessibility.
- **WCAG compliance**: Web Content Accessibility Guidelines require minimum contrast ratios (4.5:1 for normal text, 3:1 for large text).
- **Relevance to LOs**: LO2, LO5 (inclusive design as both a perceptual and ethical consideration).
- **Reading**: Ware (2012), Ch. 4; Kirk (2019), Ch. 9; Few (2009), Ch. 4.

### 2.5.3 Cultural and Contextual Colour Associations

- **Semantic colour**: Red often signals danger, loss, or negative values in Western contexts; in Chinese culture, red signifies prosperity and good fortune. Green implies growth or safety in some contexts but may be neutral in others.
- **Design guidance**: Be aware of cultural associations but do not rely on them exclusively. Always provide contextual cues (labels, legends, annotations) alongside colour.
- **Minimalism in colour use**: Use colour intentionally and sparingly. A visualisation where everything is brightly coloured is a visualisation where nothing stands out. Reserve vivid colour for the most important data; use neutral tones (grey, light backgrounds) for context and structure.
- **Relevance to LOs**: LO2, LO5 (colour as a design decision with perceptual and cultural dimensions).
- **Reading**: Ware (2012), Ch. 4; Kirk (2019), Ch. 9.

---

# PILLAR 3: Design Principles and Visual Integrity

**Primary LOs: LO1, LO5** | **Exam + CA**

This pillar covers the design rules and ethical standards that distinguish effective, honest visualisation from misleading or poorly crafted output. Mastery here requires not just knowing the principles but being able to justify design choices by reference to perception, cognition, and communication goals.

---

## 3.1 Tufte's Principles of Graphical Excellence

### 3.1.1 The Data-Ink Ratio

- **Definition**: The proportion of a graphic's "ink" (pixels, marks, lines) that is devoted to displaying data rather than to decoration, redundancy, or non-data elements. Data-ink ratio = data-ink / total ink used.
- **The principle**: "Above all else, show the data" (Tufte, 2001). Maximise the data-ink ratio within reason by removing non-data-ink that does not contribute to the viewer's understanding.
- **Practical application**: Remove unnecessary gridlines, backgrounds, borders, 3D effects, and decorative images. Simplify axis formatting. Consider whether legends can be replaced by direct labelling.
- **Nuance**: Tufte's principle is a guideline, not an absolute rule. Some non-data elements (titles, annotations, axis labels, legends) are essential for comprehension. The goal is to remove what does not earn its place, not to strip the chart to bare marks.
- **Relevance to LOs**: LO1, LO5 (design principles).
- **Reading**: Tufte (2001), Ch. 4-6; Kirk (2019), Ch. 8; Few (2009), Ch. 3.

### 3.1.2 Chartjunk

- **Definition**: Visual elements in a chart that do not convey data or improve understanding. Coined by Tufte, chartjunk includes unnecessary gridlines, excessive ornamentation, gratuitous 3D effects, textured fills, and clip art ("ducks").
- **The argument against**: Chartjunk increases the viewer's cognitive load, distracts from the data, and can introduce visual distortion.
- **The counter-argument (Bateman et al., 2010)**: Research suggests that "embellished" charts may be more memorable than minimalist ones, though they are not necessarily more accurately interpreted. This is a genuine debate in the field.
- **Professional guidance**: In business analytics contexts, clarity and accuracy take priority over memorability. Reserve ornamentation for contexts where engagement and recall are more important than precision (e.g., public-facing infographics).
- **Exam tip**: Be prepared to discuss both sides of the chartjunk debate, taking a position and justifying it with reference to the literature.
- **Relevance to LOs**: LO1, LO5 (evaluating and applying design principles).
- **Reading**: Tufte (2001), Ch. 5-6; Kirk (2019), Ch. 8; Few (2009), Ch. 3.

### 3.1.3 Graphical Integrity and the Lie Factor

- **Definition**: Graphical integrity means that the visual representation of data is honest and proportional. The Lie Factor = (size of effect shown in graphic) / (size of effect in data). A Lie Factor of 1.0 means the graphic is perfectly proportional; values below 0.95 or above 1.05 indicate meaningful distortion.
- **Tufte's integrity principles**:
  - Representation of numbers should be directly proportional to the numerical quantities represented.
  - Use clear, detailed, and thorough labelling.
  - Show data variation, not design variation.
  - In time series, standardise monetary units for inflation.
  - The number of information-carrying dimensions should not exceed the number of dimensions in the data.
  - Graphics must not quote data out of context.
- **Common violations**:
  - **Truncated axes**: Starting a bar chart axis at a value other than zero exaggerates differences.
  - **Inconsistent scales**: Using different scales for two series on the same chart without clear indication.
  - **Area/volume distortion**: Scaling a two-dimensional or three-dimensional object by a linear measure (e.g., doubling the height and width of a symbol to represent a doubling of value, which actually quadruples the area).
  - **Aspect ratio manipulation**: Stretching or compressing the aspect ratio of a line chart to exaggerate or flatten a trend.
- **The ethical dimension**: Misleading visualisations erode trust. In a business analytics context, producing a misleading chart is a failure of professional integrity, whether or not the intent was to deceive.
- **Relevance to LOs**: LO1, LO5 (integrity and ethics of visual representation).
- **Reading**: Tufte (2001), Ch. 2; Kirk (2019), Ch. 3, 8; Few (2009), Ch. 3.

---

## 3.2 Few's Dashboard Design Principles

### 3.2.1 Principles of Effective Dashboard Design

- **Definition**: A dashboard is a visual display of the most important information needed to achieve one or more objectives, consolidated and arranged on a single screen so the information can be monitored at a glance (Few, 2009).
- **Core principles**:
  - **Fit on one screen**: Scrolling defeats the purpose of at-a-glance monitoring.
  - **Use appropriate display media**: Choose the simplest chart that communicates the data; avoid gauges and meters where a simple number or sparkline suffices.
  - **Highlight what matters**: Use colour, position, and size strategically to draw attention to exceptions, outliers, and values requiring action.
  - **Organise logically**: Group related information; follow natural reading patterns (left-to-right, top-to-bottom in Western contexts).
  - **Provide context**: Show targets, benchmarks, historical comparisons, and trend indicators alongside current values. A number in isolation is meaningless.
- **The 5-second test**: A well-designed dashboard should communicate its primary message within 5 seconds of viewing. If a viewer cannot identify the primary message in that time, the design needs simplification.
- **Relevance to LOs**: LO5 (evaluating and applying design principles to dashboards).
- **Reading**: Few (2009), Ch. 2-6; Kirk (2019), Ch. 10; Knaflic (2015), Ch. 5.

---

## 3.3 Typography, Layout, and Visual Hierarchy

### 3.3.1 Visual Hierarchy in Design

- **Definition**: The arrangement of visual elements to guide the viewer's attention through the content in a deliberate order, from most important to least important.
- **Establishing hierarchy**: Size (larger = more important), position (top-left = primary in Western reading patterns), colour contrast (high contrast = more prominent), weight (bold = more important than regular weight).
- **Reading patterns**: In Western cultures, viewers scan content in an F-pattern (across the top, then down the left side, then selectively across) or a Z-pattern (for simpler layouts). The top-left quadrant is the highest-attention zone.
- **Levels of hierarchy**: A typical visualisation has 3-4 levels: primary (the main chart or key finding), secondary (supporting charts or context), tertiary (labels, legends, annotations), and background (gridlines, borders, structural elements).
- **Relevance to LOs**: LO5 (design principles for effective communication).
- **Reading**: Kirk (2019), Ch. 8-9; Knaflic (2015), Ch. 5; Few (2009), Ch. 5.

### 3.3.2 Typography in Data Visualisation

- **Font selection**: Use clean, legible sans-serif fonts for charts and dashboards (e.g., Segoe UI, Helvetica, Roboto). Avoid decorative fonts that reduce readability.
- **Size hierarchy**: Title > subtitle > axis labels > data labels > footnotes. Consistent sizing signals the relative importance of text elements.
- **Readability**: Ensure sufficient contrast between text and background; avoid rotating text to extreme angles; keep labels concise.
- **Relevance to LOs**: LO5 (design implementation details).
- **Reading**: Kirk (2019), Ch. 8; Few (2009), Ch. 5; Knaflic (2015), Ch. 5.

### 3.3.3 Annotation and Labelling Best Practices

- **Direct labelling**: Where possible, label data points directly on the chart rather than relying on a separate legend. This reduces the eye movement required to decode the visualisation.
- **Annotations as narrative**: Annotations (callouts, text boxes, reference lines) guide the viewer's interpretation and provide the "so what" of the data. They bridge the gap between raw data and insight.
- **The annotation hierarchy**: Titles and subtitles set context; axis labels define the dimensions; data labels provide specific values; annotations explain significance.
- **Common mistakes**: Over-labelling (every data point labelled, creating clutter); under-labelling (no title, no axis labels, requiring the viewer to guess); inconsistent formatting of labels.
- **Relevance to LOs**: LO5 (applying design principles).
- **Reading**: Knaflic (2015), Ch. 4-6; Kirk (2019), Ch. 8; Few (2009), Ch. 5.

---

## 3.4 The Ethics of Data Visualisation

### 3.4.1 Ethical Responsibilities of the Visualisation Designer

- **Truthful representation**: The visualisation designer has a professional obligation to represent data honestly. Even technically accurate charts can be ethically problematic if they use visual techniques that lead viewers to incorrect conclusions.
- **Intentional vs. unintentional misleading**: A truncated axis may be an honest design choice (to show detail in a narrow range) or a deliberate manipulation (to exaggerate a small difference). Context, labelling, and audience expectations determine the ethics.
- **The Cairo principle**: Alberto Cairo argues that visualisations should be truthful, functional, beautiful, insightful, and enlightening. Truthfulness comes first.
- **Relevance to LOs**: LO1, LO5 (ethical dimension of design decisions).
- **Reading**: Kirk (2019), Ch. 3; Tufte (2001), Ch. 2; Steele & Iliinsky (2011), Ch. 6.

### 3.4.2 Common Deceptive Practices

- **Cherry-picking time ranges**: Selecting a start and end date that supports a preferred narrative while hiding a longer trend that contradicts it.
- **Dual-axis charts with misaligned scales**: Creating a false visual correlation between two variables by manipulating the scale of each axis.
- **Omitting data**: Leaving out data points, categories, or time periods that would change the viewer's interpretation.
- **Misleading aggregation**: Showing averages without variance; aggregating diverse subgroups into a single measure that obscures important differences (Simpson's paradox in visual form).
- **3D distortion**: Using perspective effects that make foreground elements appear larger and background elements smaller.
- **Exam tip**: Ethics questions in the terminal exam are highly likely. Be prepared to identify ethical issues in a given visualisation and propose corrections, referencing Tufte's Lie Factor and principles of graphical integrity.
- **Relevance to LOs**: LO1, LO5 (critical evaluation of visual integrity).
- **Reading**: Tufte (2001), Ch. 2; Kirk (2019), Ch. 3; Few (2009), Ch. 3.

### 3.4.3 Building Trust Through Transparent Design

- **Source attribution**: Always cite the data source, collection method, and date.
- **Declare limitations**: Note sample sizes, confidence intervals, known data quality issues, and scope of the analysis.
- **Provide access to underlying data**: Where possible, allow the viewer to examine the data behind the visualisation.
- **Consistency**: Use consistent encoding rules across a report or dashboard so that the viewer can build a reliable mental model.
- **Relevance to LOs**: LO1, LO5 (professional standards for visualisation).
- **Reading**: Kirk (2019), Ch. 3; Steele & Iliinsky (2011), Ch. 6.

---

# PILLAR 4: Chart Types and Visual Encodings

**Primary LOs: LO1, LO3** | **CA (primarily) + Exam**

This pillar provides a systematic survey of chart types, their appropriate applications, and the decision frameworks for selecting the right visual form for a given dataset and communicative purpose.

---

## 4.1 Comparison Charts

### 4.1.1 Bar and Column Charts

- **Definition**: Bar charts (horizontal) and column charts (vertical) use the length of rectangular marks to encode quantitative values across categories.
- **When to use**: Comparing values across a moderate number of categories (up to 12-15); when exact value comparison matters; when category labels are long (horizontal bars accommodate text better).
- **Design guidance**: Always start the value axis at zero (to avoid lie factor issues); order bars meaningfully (alphabetically, by value, or by a natural category order); use consistent colour unless colour encodes a second variable.
- **Variations**: Grouped bars (comparing sub-categories side by side), waterfall charts (showing cumulative additions and subtractions).
- **Relevance to LOs**: LO1, LO3 (chart type knowledge and implementation).
- **Reading**: Kirk (2019), Ch. 6; Few (2009), Ch. 5; Knaflic (2015), Ch. 2.

### 4.1.2 Bullet Charts

- **Definition**: A compact bar chart variant designed by Stephen Few to replace gauges and meters on dashboards. A bullet chart shows a primary measure (a bar), a comparative measure (a reference line, typically a target), and qualitative ranges (background shading indicating poor, satisfactory, good).
- **When to use**: Dashboard KPI displays where a measure needs to be compared against a target within a performance context.
- **Advantages**: Far more space-efficient than circular gauges; easier to compare across multiple metrics; no distortion from circular encoding.
- **Relevance to LOs**: LO1, LO3, LO5 (design-informed chart selection).
- **Reading**: Few (2009), Ch. 5; Kirk (2019), Ch. 6.

---

## 4.2 Trend Charts

### 4.2.1 Line Charts

- **Definition**: Line charts connect data points with line segments to show trends over a continuous variable (typically time). The line exploits the Gestalt principle of continuity, making trends immediately visible.
- **When to use**: Displaying trends, rates of change, and patterns over time; comparing multiple time series on the same chart.
- **Design guidance**: Use a continuous horizontal axis (time); limit to 4-5 lines before the chart becomes cluttered; use direct labelling or interactive highlighting rather than a complex legend; consider whether a logarithmic scale is more appropriate for data spanning several orders of magnitude.
- **Temporal patterns to identify**: Trend (long-term direction), seasonality (repeating patterns at fixed intervals), cyclicality (repeating patterns at variable intervals), noise (random variation).
- **Common mistake**: Using a line chart for categorical data where no meaningful connection exists between adjacent categories.
- **Relevance to LOs**: LO1, LO3 (trend analysis and visual encoding of temporal data).
- **Reading**: Kirk (2019), Ch. 6; Few (2009), Ch. 5; Knaflic (2015), Ch. 2.

### 4.2.2 Area Charts and Sparklines

- **Area charts**: Line charts with the region below the line filled. Effective for showing the magnitude of a trend or the cumulative total, but stacked area charts can be difficult to read because only the bottom series sits on a fixed baseline.
- **Sparklines**: Small, word-sized line charts without axes, labels, or gridlines, designed by Tufte to be embedded in text or tables. They show trend, variation, and shape at a glance without demanding full chart real estate.
- **When to use sparklines**: Dashboard contexts where many metrics need trend context; embedded in tables to add a temporal dimension to tabular data.
- **Relevance to LOs**: LO1, LO3 (compact visual forms for business contexts).
- **Reading**: Tufte (2001), Ch. 7 (sparklines); Kirk (2019), Ch. 6; Few (2009), Ch. 5.

---

## 4.3 Part-to-Whole Charts

### 4.3.1 Pie Charts and Donut Charts

- **Definition**: Circular charts where segments represent proportions of a total, encoded by angle and area.
- **The controversy**: Pie charts are among the most commonly used and most criticised chart types. Cleveland and McGill's research shows that humans are poor at judging angles and areas accurately.
- **When they work**: When showing a simple part-to-whole relationship with 2-3 categories, particularly when one dominant segment is the story. When the audience is non-technical and the precision of the comparison is less important than the general impression.
- **When to avoid**: More than 5-6 categories; when precise comparison between similar-sized slices is required; when comparing across multiple pie charts.
- **Design guidance**: If you use a pie chart, start at 12 o'clock, order slices from largest to smallest, label directly, and avoid 3D effects or "exploded" segments.
- **Relevance to LOs**: LO1, LO3, LO5 (chart selection with critical evaluation).
- **Reading**: Few (2009), Ch. 5; Kirk (2019), Ch. 6; Tufte (2001), Ch. 2.

### 4.3.2 Treemaps and Stacked Bar Charts

- **Treemaps**: Rectangular subdivisions of space where area encodes quantity and nesting encodes hierarchy. Effective for showing part-to-whole relationships within hierarchical data (e.g., market capitalisation by sector and company; disk usage by folder).
- **Stacked bar charts**: Bars divided into segments, each representing a subcategory's contribution to the total. The bottom segment has a consistent baseline (easy to compare); upper segments share no common baseline (harder to compare individually).
- **When to use treemaps**: Hierarchical data with many categories; when the audience needs to see both the overall structure and the relative size of individual elements.
- **Design guidance for stacked bars**: Limit to 4-5 subcategories; place the most important subcategory at the bottom (on the baseline); consider whether a grouped bar chart or small multiples would be clearer.
- **Relevance to LOs**: LO1, LO3 (advanced part-to-whole encodings).
- **Reading**: Kirk (2019), Ch. 6; Ward et al. (2010), Ch. 6; Few (2009), Ch. 5.

---

## 4.4 Distribution Charts

### 4.4.1 Histograms

- **Definition**: A chart showing the frequency distribution of a single quantitative variable, with the variable divided into bins (ranges) and the height of each bar representing the count or frequency within that bin.
- **When to use**: Understanding the shape, spread, centre, and outliers of a distribution; checking for normality, skewness, or multimodality.
- **Design considerations**: Bin width significantly affects the visual impression. Too few bins hide the distribution shape; too many bins create noise. Choose bin widths that reveal the underlying pattern without overfitting.
- **Relevance to LOs**: LO1, LO3 (distribution analysis through visual means).
- **Reading**: Kirk (2019), Ch. 6; Ward et al. (2010), Ch. 5.

### 4.4.2 Box Plots and Violin Plots

- **Box plots**: A five-number summary visualisation showing minimum, first quartile (Q1), median, third quartile (Q3), and maximum, with outliers plotted as individual points. Extremely effective for comparing distributions across groups.
- **Violin plots**: A hybrid of a box plot and a kernel density plot, showing the full shape of the distribution alongside summary statistics. More informative than a box plot (revealing multimodality, for example) but requires a more statistically literate audience.
- **When to use**: Comparing distributions across multiple categories (e.g., salary distributions by department; response times by server).
- **Relevance to LOs**: LO1, LO3 (statistical visualisation for business analytics).
- **Reading**: Kirk (2019), Ch. 6; Ward et al. (2010), Ch. 5; Ware (2012), Ch. 5.

---

## 4.5 Relationship Charts

### 4.5.1 Scatter Plots and Bubble Charts

- **Scatter plots**: Plot individual data points using position on two axes (x and y) to show the relationship between two quantitative variables. The viewer can perceive correlation, clusters, outliers, and patterns.
- **Bubble charts**: Scatter plots with a third variable encoded as the area of each point. Effective for adding a dimension but subject to area estimation inaccuracies (Stevens' power law).
- **When to use**: Exploring the relationship between two (or three) quantitative variables; identifying clusters and outliers; checking for correlation before running statistical tests.
- **Design guidance**: Include a trend line or regression line where appropriate; label outliers; use colour to encode a categorical grouping variable if needed.
- **Relevance to LOs**: LO1, LO3 (relationship analysis through visual encoding).
- **Reading**: Kirk (2019), Ch. 6; Few (2009), Ch. 5; Ward et al. (2010), Ch. 5.

### 4.5.2 Correlation Matrices and Heat Maps

- **Correlation matrices**: A grid displaying the pairwise correlation coefficients between multiple variables, with colour encoding the strength and direction of correlation. Effective for exploratory analysis of multivariate datasets.
- **Heat maps**: A grid of cells where colour intensity encodes a quantitative value. Used for temporal patterns (hour x day of week), geographic data, and many other applications.
- **Design guidance**: Use a diverging colour scale centred on zero for correlation matrices; provide a clear colour legend; order rows and columns meaningfully (e.g., by clustering).
- **Relevance to LOs**: LO1, LO3 (advanced visual encodings for complex data).
- **Reading**: Kirk (2019), Ch. 6; Ware (2012), Ch. 5; Ward et al. (2010), Ch. 5.

---

## 4.6 Geospatial Visualisation

### 4.6.1 Choropleth Maps

- **Definition**: Thematic maps where geographic areas (countries, states, counties) are shaded or patterned in proportion to a data variable.
- **When to use**: Showing geographic distribution of a variable; comparing values across regions.
- **Design challenges**: Larger geographic areas dominate visual attention regardless of their data value; areas with small populations can be visually prominent. Population density and area size create perceptual biases.
- **Design guidance**: Use a sequential or diverging colour scale appropriate to the data; consider normalising by population or area; include a clear legend and title.
- **Relevance to LOs**: LO1, LO3 (geospatial data representation).
- **Reading**: Kirk (2019), Ch. 7; Ward et al. (2010), Ch. 8.

### 4.6.2 Cartograms and Other Geospatial Forms

- **Cartograms**: Maps where the geographic area is distorted in proportion to a data variable (e.g., country size scaled by GDP rather than land area). Addresses the area bias of choropleths but sacrifices geographic accuracy.
- **Point maps**: Individual data points plotted at geographic coordinates; useful for showing density and clusters.
- **Flow maps**: Lines connecting origins and destinations, with thickness encoding volume (trade, migration, traffic). Minard's map of Napoleon's Russian campaign is the classic example.
- **Relevance to LOs**: LO1, LO3 (alternative geospatial encodings).
- **Reading**: Kirk (2019), Ch. 7; Ward et al. (2010), Ch. 8; Tufte (2001), Ch. 2.

---

## 4.7 Tables and Conditional Formatting

### 4.7.1 When Tables Are Better Than Charts

- **Definition**: Tables present data in rows and columns, allowing precise value lookup rather than pattern recognition.
- **When to use tables**: When the audience needs exact values; when the data has too many dimensions for a single chart; when comparing specific values across categories and measures.
- **When to use charts instead**: When the goal is to show trends, patterns, distributions, or relationships; when the audience needs to grasp the overall shape of the data quickly.
- **Relevance to LOs**: LO1 (understanding when visual encoding is and is not appropriate).
- **Reading**: Few (2009), Ch. 6; Kirk (2019), Ch. 6.

### 4.7.2 Enhancing Tables with Visual Cues

- **Conditional formatting**: Using colour backgrounds, data bars, icon sets, or sparklines within table cells to add visual encoding to tabular data without sacrificing the precision of the table format.
- **Heat map tables**: Applying a sequential colour scale to numeric cells, turning a table into a hybrid form that supports both precise lookup and pattern recognition.
- **Best practices**: Keep formatting subtle; use a single consistent colour scale; avoid multiple competing colour schemes in the same table.
- **Relevance to LOs**: LO1, LO3 (hybrid approaches to data display).
- **Reading**: Few (2009), Ch. 6; Knaflic (2015), Ch. 2.

---

## 4.8 Chart Selection Decision Frameworks

### 4.8.1 Choosing the Right Chart Type

- **The question-first approach**: Start with what you want to show (comparison, trend, composition, distribution, relationship, geography), then select the chart type that best serves that purpose.
- **Decision frameworks**:
  - Kirk's chart type taxonomy (organised by the nature of the analytical task)
  - The Visual Vocabulary (Financial Times): a one-page reference categorising charts by analytical purpose
  - Knaflic's "What are you trying to show?" matrix
- **Summary decision table**:

| Analytical Task | Recommended Chart Types | Avoid |
|----------------|------------------------|-------|
| Comparison across categories | Bar, column, bullet, dot plot | Pie (for more than 3 categories) |
| Trend over time | Line, area, sparkline | Bar (unless few time points) |
| Part-to-whole | Stacked bar, treemap, pie (2-3 slices) | Line chart |
| Distribution | Histogram, box plot, violin | Pie chart |
| Relationship | Scatter, bubble, correlation matrix | Line chart for non-temporal data |
| Geographic | Choropleth, cartogram, point map | Bar chart for spatial data |

- **Common errors**: Defaulting to the same chart type regardless of the question; selecting a chart because it looks impressive rather than because it communicates effectively; using a chart type that the audience cannot interpret.
- **Exam tip**: Be prepared to justify a chart type recommendation for a given data scenario by referencing Cleveland and McGill's hierarchy, the data type, and the communicative goal.
- **Relevance to LOs**: LO1, LO3, LO5 (systematic chart selection as a design discipline).
- **Reading**: Kirk (2019), Ch. 6; Knaflic (2015), Ch. 2; Few (2009), Ch. 5.

---

# PILLAR 5: Interaction, Storytelling, and Communication

**Primary LOs: LO4, LO5** | **Exam + CA**

This pillar addresses how visualisations become communicative tools through interactivity, narrative structure, and audience-centred design.

---

## 5.1 Interactive Features

### 5.1.1 Filtering and Selection

- **Definition**: Interactive controls that allow the viewer to restrict the displayed data to a subset of interest (e.g., by time range, category, region, or threshold).
- **Types**: Drop-down selectors, sliders, checkboxes, search boxes, date range pickers, visual slicers.
- **Design principle**: Filters should be clearly visible, intuitive, and immediately responsive. The viewer should always know which filters are active and how they affect the display.
- **Relevance to LOs**: LO4, LO5 (interactive design strategies).
- **Reading**: Kirk (2019), Ch. 10; Ward et al. (2010), Ch. 9.

### 5.1.2 Drill-Down and Linked Views

- **Drill-down**: The ability to click on a summary element to reveal the detailed data behind it (e.g., clicking on a country in a map to see city-level data; clicking on a bar to see the individual transactions).
- **Linked views (brushing and linking)**: Multiple visualisations on the same page that respond to each other. Selecting a data point in one view highlights the corresponding data in all other views. This enables multivariate exploration across multiple coordinated views.
- **Design benefit**: These techniques support analytical exploration without cluttering the initial view. The summary provides the overview; drill-down and linking provide the detail on demand.
- **Relevance to LOs**: LO4, LO5 (advanced interaction strategies).
- **Reading**: Kirk (2019), Ch. 10; Ward et al. (2010), Ch. 9-10; Ware (2012), Ch. 11.

### 5.1.3 Tooltips and Details on Demand

- **Tooltips**: Small overlay panels that appear when the viewer hovers over or clicks on a data element, showing exact values, labels, or additional context.
- **Progressive disclosure**: A layered information architecture where the most important information is visible by default, and additional detail is available on demand. This respects the viewer's cognitive limits by not overwhelming them with all data simultaneously.
- **Design principles for tooltips**: Keep them concise; include the metric name, value, and one or two contextual data points; avoid overloading with information.
- **Relevance to LOs**: LO4, LO5 (information layering and interaction design).
- **Reading**: Kirk (2019), Ch. 10; Few (2009), Ch. 6.

---

## 5.2 Shneiderman's Visual Information-Seeking Mantra

### 5.2.1 Overview First, Zoom and Filter, Then Details on Demand

- **Definition**: Ben Shneiderman's (1996) mantra describes the ideal interaction pattern for information visualisation: begin with an overview of the entire dataset, then allow the user to zoom in and filter to areas of interest, and finally provide detailed information about individual items on demand.
- **Application to dashboards**: The top level of a dashboard shows high-level KPIs and summary charts (overview). Clicking or filtering narrows the view (zoom and filter). Tooltips, drill-through pages, or detail panels provide granular data (details on demand).
- **Why it works**: The mantra aligns with how humans naturally explore complex information: start with the big picture, then focus on what matters. It is also consistent with cognitive load theory (presenting all detail at once overwhelms working memory).
- **Three levels of interaction**:
  1. **Overview interactions**: Reset to default view, toggle between summary and detail mode.
  2. **Zoom and filter interactions**: Slicers, range selectors, category filters, geographic zoom.
  3. **Detail interactions**: Tooltips, click-to-expand, drill-through to underlying data.
- **Exam tip**: Shneiderman's mantra is a foundational concept for LO5. Be prepared to evaluate an interactive visualisation against this framework and suggest improvements.
- **Relevance to LOs**: LO5 (interaction strategies); LO4 (communicating insights through interactive tools).
- **Reading**: Ward et al. (2010), Ch. 12; Kirk (2019), Ch. 10; Ware (2012), Ch. 10.

---

## 5.3 Visual Storytelling and Narrative Arc

### 5.3.1 The Elements of Visual Storytelling

- **Definition**: Visual storytelling is the practice of using data visualisations as part of a structured narrative to communicate insights, build understanding, and drive action.
- **Knaflic's storytelling framework**: (1) Understand the context (who is your audience, what do they need?), (2) Choose an appropriate visual display, (3) Eliminate clutter, (4) Focus attention, (5) Think like a designer, (6) Tell a story.
- **Narrative arc**: Setup (establish the context and the question), rising action (present the data that reveals the answer), climax (the key insight or finding), resolution (the recommendation or call to action).
- **The difference between showing data and telling a story**: A dashboard shows data; a story uses data to answer a question and recommend action. Both have their place, but the exam values your ability to distinguish and evaluate them.
- **Relevance to LOs**: LO4 (visual storytelling); LO5 (design principles in narrative context).
- **Reading**: Knaflic (2015), Ch. 7-10; Kirk (2019), Ch. 11; Steele & Iliinsky (2011), Ch. 3.

### 5.3.2 Audience Analysis and Audience-First Design

- **Know your audience**: What is their level of data literacy? What decisions will they make based on this visualisation? How much time will they spend with it? What do they already believe about this topic?
- **Tailoring the message**: An executive summary requires different visualisation choices than an analyst's exploratory workbook. Executives want the "so what"; analysts want the detail.
- **The curse of knowledge**: The creator of a visualisation has deep familiarity with the data and can see patterns that may not be obvious to a first-time viewer. Design for the audience's knowledge level, not your own.
- **Audience types**:
  - **Technical audience**: Can handle complexity, multiple views, and rich interaction. Provide tools for exploration.
  - **Executive audience**: Needs a clear, focused message. Limit the number of visuals. Lead with the headline finding.
  - **General public**: Requires maximum simplicity. Avoid jargon, use familiar chart types, annotate heavily.
- **Relevance to LOs**: LO4 (communicating to diverse audiences).
- **Reading**: Knaflic (2015), Ch. 1-2; Kirk (2019), Ch. 4.

### 5.3.3 The "So What?" Test for Insights

- **Definition**: Every visualisation presented to a decision-maker should answer the question "So what?". If the visualisation reveals a pattern but does not explain why it matters or what should be done about it, it is incomplete.
- **The chain**: Data point, then pattern, then insight, then recommendation, then action. A visualisation that stops at "pattern" leaves the audience to draw their own conclusions, which may be incorrect.
- **How to apply**: Add annotations that interpret the key finding; include a clear title that states the insight (not just the topic); provide a recommendation in the accompanying narrative.
- **Relevance to LOs**: LO4, LO5 (moving from visual display to actionable communication).
- **Reading**: Knaflic (2015), Ch. 7; Kirk (2019), Ch. 11.

---

## 5.4 Storyboarding and Iterative Design

### 5.4.1 Storyboarding a Visualisation Project

- **Definition**: Creating a rough plan of the visualisation sequence before building anything. Like a film storyboard, it sketches the flow of screens, charts, and narrative points.
- **Benefits**: Ensures the narrative logic is sound before investing effort in production; facilitates feedback and iteration; helps identify missing data or analysis gaps early.
- **Process**: (1) Define the key message, (2) Sketch the sequence of visual "scenes," (3) Identify the data required for each scene, (4) Get feedback from a peer or stakeholder, (5) Revise before building.
- **Relevance to LOs**: LO5, LO6 (design process and design proposals).
- **Reading**: Knaflic (2015), Ch. 7; Kirk (2019), Ch. 4.

### 5.4.2 Iterative Design and Feedback

- **Definition**: The practice of building visualisations in stages, gathering feedback at each stage, and refining based on that feedback.
- **Why iteration matters**: First drafts are rarely optimal. Iterative design reveals usability problems, misinterpretations, and missed opportunities that the designer cannot see alone.
- **Feedback methods**: Show prototypes to target users; conduct think-aloud usability tests; ask "What is this chart telling you?" and compare the answer to the intended message.
- **Relevance to LOs**: LO5, LO6 (professional design practice).
- **Reading**: Kirk (2019), Ch. 4; Knaflic (2015), Ch. 7, 9; Ward et al. (2010), Ch. 13.

---

## 5.5 Dashboard vs. Report vs. Presentation

### 5.5.1 Choosing the Right Communication Format

- **Dashboard**: A live, interactive display for ongoing monitoring. Updated automatically; designed for repeated use; enables exploration. Best for operational and performance monitoring.
- **Report**: A structured, typically static document presenting analysis and findings. May include visualisations, tables, and narrative text. Best for thorough, documented analysis with methodology and conclusions.
- **Presentation**: A guided, sequential narrative designed for a specific audience and occasion. The presenter controls the flow and emphasis. Best for persuasion, decision support, and stakeholder updates.
- **The key distinction**: Dashboards are for monitoring; reports are for documenting; presentations are for persuading. Each requires different design choices, levels of annotation, and interaction patterns.
- **The hybrid approach**: A live dashboard for day-to-day monitoring, supplemented by periodic narrative reports that provide context, interpretation, and recommendations.
- **Relevance to LOs**: LO4, LO5 (selecting the appropriate communication format).
- **Reading**: Kirk (2019), Ch. 11; Knaflic (2015), Ch. 1; Few (2009), Ch. 2.

---

# PILLAR 6: Tools, Implementation, and Professional Practice

**Primary LOs: LO3, LO4, LO6** | **CA (primarily)**

This pillar covers the practical dimensions of data visualisation: tool selection, implementation in Power BI, the design proposal, real-world applications, and emerging topics including AI-generated visualisations.

---

## 6.1 Power BI: Core Capabilities

### 6.1.1 Data Modelling in Power BI

- **Definition**: The process of defining relationships between tables, creating calculated columns and measures, and structuring data for efficient analysis within Power BI.
- **Star schema**: The recommended data model pattern for Power BI. A central fact table (containing measures) surrounded by dimension tables (containing descriptive attributes). Enables fast queries and intuitive report design.
- **Relationships**: One-to-many, many-to-many; cross-filter direction; active vs. inactive relationships.
- **Why it matters for visualisation**: A well-structured data model enables the visualisation tool to aggregate, filter, and slice data correctly. A poorly structured model leads to incorrect calculations and unreliable visuals.
- **Relevance to LOs**: LO3, LO4 (tool competency for implementation).
- **Reading**: Kirk (2019), Ch. 5 (data preparation); Barker (2013); Power BI documentation.

### 6.1.2 DAX (Data Analysis Expressions)

- **Definition**: DAX is the formula language used in Power BI for creating calculated columns, measures, and tables. It enables dynamic calculations that respond to user interactions (filters, slicers, drill-downs).
- **Key concepts**: Row context vs. filter context; the CALCULATE function (modifying filter context); time intelligence functions (SAMEPERIODLASTYEAR, DATESYTD); iterating functions (SUMX, AVERAGEX).
- **Common DAX patterns**: Year-over-year growth, running totals, percentage of parent, dynamic ranking.
- **Why DAX matters**: DAX enables the creation of dynamic, context-sensitive measures that make interactive dashboards powerful. Without DAX, Power BI is limited to simple aggregations.
- **Relevance to LOs**: LO3, LO4 (implementing effective visualisations with appropriate technology).
- **Reading**: Barker (2013); Power BI DAX documentation.

### 6.1.3 Visual Design in Power BI

- **Built-in visuals**: Bar, column, line, pie, scatter, map, table, matrix, card, KPI, gauge, treemap, waterfall, funnel, and more.
- **Custom visuals**: The Power BI marketplace (AppSource) offers hundreds of community and third-party visuals. Evaluate custom visuals for functionality, performance, certification, and support before using them in production.
- **Formatting and theming**: Consistent colour themes, font choices, spacing, and layout aligned with design principles from Pillars 2 and 3.
- **Conditional formatting**: Data bars, colour scales, icons, and rules-based formatting within tables and matrices.
- **Sharing and collaboration**: Workspaces, apps, row-level security (RLS), and scheduled refresh enable organisational deployment and governance.
- **Relevance to LOs**: LO3, LO4 (tool-specific implementation skills).
- **Reading**: Kirk (2019), Ch. 10; Few (2009), Ch. 5-6; Barker (2013); Power BI documentation.

---

## 6.2 Evaluating Visualisation Tools

### 6.2.1 Evaluation Criteria for Tool Selection

- **Key criteria**:
  - **Data connectivity**: Can the tool connect to the required data sources?
  - **Interactivity**: Does it support the interactive features needed (filtering, drill-down, linking)?
  - **Ease of use**: Is it accessible to the intended user base (analysts, business users, executives)?
  - **Scalability**: Can it handle the data volumes and user counts required?
  - **Design flexibility**: Does it allow sufficient control over visual design, or does it impose rigid defaults?
  - **Collaboration and sharing**: Can outputs be shared, embedded, or published effectively?
  - **Cost and licensing**: What is the total cost of ownership, including licensing, training, and maintenance?
  - **Governance and security**: Does the tool support role-based access, data governance, and compliance requirements?
- **The tool landscape**:
  - **Enterprise BI platforms**: Power BI, Tableau, Qlik Sense. Full-featured with data modelling, visualisation, and sharing.
  - **Programming libraries**: D3.js (JavaScript), Matplotlib/Seaborn (Python), ggplot2 (R). Maximum flexibility but require coding skills.
  - **Spreadsheet tools**: Excel, Google Sheets. Ubiquitous and familiar but limited in interactivity and scalability.
  - **Specialised tools**: Flourish (storytelling and animation), Datawrapper (journalism and publishing), Mapbox (geospatial).
- **No tool is universally best**: The choice depends on the use case, the audience, the organisation's existing technology stack, and the skills of the team.
- **Relevance to LOs**: LO4 (evaluating and selecting tools).
- **Reading**: Kirk (2019), Ch. 5; Ward et al. (2010), Ch. 11; Few (2009), Ch. 7; Steele & Iliinsky (2011), Ch. 7.

---

## 6.3 The Design Proposal

### 6.3.1 Structure of a Comprehensive Design Proposal

- **Definition**: A design proposal is a structured document that outlines the rationale, approach, and planned execution of a data visualisation project. It demonstrates mastery of both theory and practice.
- **Key components**:
  - **Problem statement**: What business question or communication need does this visualisation address?
  - **Audience analysis**: Who will use this visualisation, and what are their needs, constraints, and data literacy levels?
  - **Data description**: What data sources are used? What preparation or transformation is required?
  - **Design rationale**: Why were specific chart types, encodings, colours, and layouts chosen? Reference design principles explicitly (Tufte, Few, Cleveland and McGill, Gestalt, etc.).
  - **Prototype or mockup**: A working or sketched version of the proposed visualisation.
  - **Evaluation plan**: How will the effectiveness of the visualisation be assessed? User testing, stakeholder feedback, comparison to design principles?
- **Relevance to LOs**: LO6 (developing a comprehensive design proposal); LO1, LO3, LO4, LO5 (applying all prior knowledge).
- **Reading**: Kirk (2019), Ch. 2-4; Knaflic (2015), Ch. 1-2, 7.

### 6.3.2 Defending Design Decisions

- **Theory-grounded justification**: Every design choice in the proposal should be justified by reference to visualisation theory. "I chose a bar chart because..." should invoke Cleveland and McGill's hierarchy, Tufte's data-ink ratio, or audience considerations, not personal preference.
- **Acknowledging trade-offs**: Good design involves trade-offs (detail vs. simplicity, precision vs. readability, familiarity vs. innovation). A strong proposal acknowledges these trade-offs explicitly.
- **Anticipating critique**: Consider what objections a reviewer might raise and address them proactively.
- **Relevance to LOs**: LO6 (proposal quality); LO5 (critical evaluation of design).
- **Reading**: Kirk (2019), Ch. 3-4; Knaflic (2015), Ch. 2.

---

## 6.4 Real-World Case Studies and Applications

### 6.4.1 Visualisation in Practice

- **Business dashboards**: Operational dashboards for supply chain, sales, finance; executive scorecards; customer analytics displays.
- **Public data communication**: Government open data portals; pandemic data dashboards (e.g., Johns Hopkins COVID-19 dashboard); election results visualisation.
- **Journalism**: Data journalism at the Financial Times, The Guardian, The New York Times; the growing expectation that data stories include interactive visual components. The scrollytelling format reveals data progressively as the user scrolls.
- **Healthcare**: Patient outcome tracking, epidemiological mapping (cf. John Snow), clinical trial results.
- **Lessons from practice**: Real-world visualisations often involve messy data, tight deadlines, competing stakeholder demands, and imperfect tools. The design principles from this module provide a framework for making the best decisions under these constraints.
- **Relevance to LOs**: LO3, LO4 (application in real-world business analytics contexts).
- **Reading**: Steele & Iliinsky (2011), Ch. 1-5; Kirk (2019), Ch. 11-12.

---

## 6.5 AI-Generated Visualisations: Opportunities and Risks

### 6.5.1 Opportunities

- **Automated chart recommendations**: AI systems that analyse a dataset and suggest appropriate chart types based on the data characteristics.
- **Natural language interfaces**: Tools allowing users to generate visualisations by describing what they want in plain language (e.g., "Show me monthly revenue by region for the last two years").
- **Rapid prototyping**: AI can generate initial visualisation drafts that human designers then refine and polish.
- **Accessibility**: AI-generated alt text and descriptions for visually impaired users.
- **Relevance to LOs**: LO4 (evaluating emerging tools and technologies).
- **Reading**: Kirk (2019), Ch. 5; course materials on AI in visualisation.

### 6.5.2 Risks and Limitations

- **Lack of editorial judgement**: AI can generate a chart but cannot determine the story that should be told or the audience's needs. Editorial thinking (Pillar 1, Kirk's design process) remains a fundamentally human skill.
- **Design quality**: AI-generated visualisations may follow defaults rather than best practices. They may include chartjunk, inappropriate encodings, or misleading scales.
- **Over-reliance**: Accepting AI-generated visualisations without critical evaluation undermines the designer's professional responsibility (Pillar 3, ethics).
- **Data privacy**: Sending business data to external AI services raises data governance and privacy concerns.
- **The human role**: AI is a tool that augments the visualisation designer's capability; it does not replace the need for design thinking, perceptual knowledge, ethical judgement, and audience understanding.
- **Relevance to LOs**: LO4, LO5 (critical evaluation of tools and their outputs).
- **Reading**: Kirk (2019), Ch. 5; course materials on responsible AI.

---

## 6.6 Quality Assurance Frameworks for Published Visualisations

### 6.6.1 A Quality Assurance Checklist

- **Data accuracy check**: Verify that the visualisation accurately represents the underlying data. Spot-check values; ensure totals match; confirm that filters and aggregations are correct.
- **Design review**: Assess against Tufte's principles (data-ink ratio, graphical integrity), Cleveland and McGill's hierarchy (are the most important comparisons encoded effectively?), and Gestalt principles (is the layout well-organised?).
- **Accessibility review**: Test colour contrast; check for colour-blind safety; verify that all charts have titles, axis labels, and legends; ensure interactive elements are keyboard-navigable.
- **Audience testing**: Show the visualisation to a representative user and ask: "What is this telling you?" Compare their interpretation to the intended message.
- **Performance check**: Ensure the visualisation loads quickly and responds smoothly to interactions, especially with large datasets.
- **Ethical review**: Check for truncated axes, misleading scales, cherry-picked data, and missing context. Calculate the Lie Factor for key visuals.
- **Relevance to LOs**: LO3, LO4, LO5 (professional standards for published work).
- **Reading**: Kirk (2019), Ch. 4; Few (2009), Ch. 7; Knaflic (2015), Ch. 7, 9; Ward et al. (2010), Ch. 13.

---

# EXAM PREPARATION GUIDE

## Terminal Exam Structure

- **Duration**: 2 hours
- **Weight**: 40% of module grade
- **LOs tested**: LO1 (Visualisation Theory & Concepts), LO2 (Perception & Cognition), LO5 (Design Principles & Interaction)
- **Format**: Combination of long-form and short-form questions
- **Requirement**: Answer a subset of questions (not all)
- **What is rewarded**: Depth of topic knowledge, critical evaluation (not just description), evidence of reading beyond core texts, application of theory to scenarios

## Mapping the Exam to the Pillars

| Exam LO | Primary Pillars | Key Sections to Master |
|---------|----------------|----------------------|
| **LO1**: Visualisation theory and data representation | Pillar 1, Pillar 3, Pillar 4 | 1.1 (Definitions, history, role), 1.2 (Exploratory vs. explanatory, Kirk's process), 1.3 (Data types), 3.1 (Tufte's principles), 3.4 (Ethics), 4.8 (Chart selection frameworks) |
| **LO2**: Perception, cognition, visual processing | Pillar 2 | 2.1 (Pre-attentive attributes), 2.2 (Gestalt principles), 2.3 (Cognitive load and working memory), 2.4 (Cleveland and McGill), 2.5 (Colour perception and accessibility) |
| **LO5**: Design principles and interaction strategies | Pillar 3, Pillar 5 | 3.1 (Tufte), 3.2 (Few), 3.3 (Typography, layout, hierarchy), 3.4 (Ethics), 5.1 (Interactive features), 5.2 (Shneiderman's mantra), 5.3 (Storytelling), 5.5 (Dashboard vs. report vs. presentation) |

## Core Concepts Most Likely to Appear

1. **Pre-attentive attributes and their application**: Be prepared to identify attributes in a given visualisation and evaluate their effectiveness. Reference Ware (2012) specifically.
2. **Gestalt principles**: Know all six, provide examples of each in visualisation contexts, and be able to critique a dashboard layout using Gestalt theory.
3. **Cleveland and McGill's hierarchy**: Rank encoding channels by accuracy; explain why certain chart types are more effective than others for quantitative comparison.
4. **Tufte's principles (data-ink ratio, chartjunk, graphical integrity, Lie Factor)**: Be prepared to apply these to a visualisation scenario and evaluate whether a given chart adheres to or violates them.
5. **Cognitive load and working memory**: Explain how poor design increases extraneous load; propose design improvements that reduce cognitive burden.
6. **Exploratory vs. explanatory visualisation**: Define, distinguish, and explain the design implications of each. Reference Knaflic (2015).
7. **Shneiderman's mantra**: State it, explain it, and evaluate a visualisation or dashboard against it.
8. **Visual storytelling**: Describe the elements of effective visual storytelling; distinguish between a chart and a story; reference Knaflic (2015).
9. **Ethics of data visualisation**: Identify common deceptive practices; explain the designer's ethical responsibilities; reference Tufte and Kirk.
10. **Chart type selection**: Given a dataset and a communicative goal, justify the selection of an appropriate chart type using design principles and perceptual theory.

## Exam Answer Strategy

- **Long-form questions**: Structure your answer with an introduction, 3-4 well-developed points (each with theory, example, and critical evaluation), and a brief conclusion. Reference the recommended texts explicitly by author and year.
- **Short-form questions**: Be precise. Define the concept, give one clear example, and note one critical consideration or limitation.
- **Demonstrate reading**: The exam rubric rewards evidence of engagement with the literature. Reference Kirk (2019), Knaflic (2015), Ware (2012), Tufte (2001), Few (2009), and Ward et al. (2010) by name. Use specific concepts and terminology from the texts.
- **Be critical, not just descriptive**: At Level 9, you are expected to evaluate, critique, and apply, not merely describe. For every concept, be prepared to discuss its strengths, limitations, and the conditions under which it does or does not apply. For example, do not just define chartjunk; discuss the Bateman et al. counter-argument and take a position.
- **Use examples**: Concrete examples (from the course, from public data, from business practice) demonstrate application and deepen your argument.
- **Connect theory to practice**: The strongest answers link perceptual science (Pillar 2) to design principles (Pillar 3) to practical application (Pillars 5-6). For example, explain *why* bar charts outperform pie charts by referencing Cleveland and McGill, then discuss *when* a pie chart might still be acceptable.

---

## LO-to-Theory Mapping Table

| Learning Outcome | Primary Pillars | Assessment Method | Key Theories and Frameworks |
|-----------------|----------------|-------------------|----------------------------|
| **LO1**: Visualisation theory and concepts | Pillars 1, 3, 4 | Exam + CA | Kirk's design process; exploratory vs. explanatory (Knaflic); Tufte's principles; data types and encodings; chart selection frameworks |
| **LO2**: Perception, cognition, visual processing | Pillar 2 | Exam | Pre-attentive attributes (Ware); Gestalt principles; cognitive load theory; Cleveland and McGill's hierarchy; colour perception and accessibility |
| **LO3**: Design and implement visualisations | Pillars 4, 6 | CA | Chart type selection; Power BI implementation; visual encoding best practices; quality assurance |
| **LO4**: Tools, technologies, visual storytelling | Pillars 5, 6 | CA | Tool evaluation criteria; Shneiderman's mantra; Knaflic's storytelling framework; audience analysis; dashboard vs. report vs. presentation |
| **LO5**: Design principles and interaction strategies | Pillars 3, 5 | Exam + CA | Tufte; Few; Gestalt; Cleveland and McGill; Shneiderman; interactive design patterns; ethics of visualisation |
| **LO6**: Comprehensive design proposal | Pillar 6 | CA | Design proposal structure; design rationale grounded in theory; evaluation planning |

---

## Key Frameworks Quick Reference

| Framework | Source | Application |
|-----------|--------|------------|
| Pre-attentive visual attributes | Ware (2012) | Designing visual elements that are processed before conscious attention |
| Gestalt principles (6) | Wertheimer; Ware (2012) | Organising visual elements for intuitive grouping and perception |
| Cleveland and McGill's hierarchy | Cleveland & McGill (1984) | Ranking encoding channels by accuracy of human perception |
| Cognitive load theory | Sweller; applied by Ware (2012) | Minimising extraneous mental effort in visualisation design |
| Miller's 7 +/- 2 | Miller (1956) | Working memory capacity constraints on information display |
| Stevens' power law | Ware (2012) | Understanding perceptual compression of area and volume |
| Weber's law | Ware (2012) | Understanding just-noticeable differences in visual stimuli |
| Data-ink ratio | Tufte (2001) | Maximising the proportion of ink devoted to data |
| Graphical integrity / Lie Factor | Tufte (2001) | Ensuring proportional, honest visual representation |
| Kirk's visualisation design process (4 stages) | Kirk (2019) | Structuring the full visualisation workflow from brief to delivery |
| Exploratory vs. explanatory visualisation | Knaflic (2015) | Distinguishing analysis work from communication work |
| Knaflic's storytelling framework (6 steps) | Knaflic (2015) | Crafting data stories for audience impact |
| Shneiderman's visual information-seeking mantra | Shneiderman (1996) | Overview first, zoom and filter, then details on demand |
| Few's dashboard design principles | Few (2009) | Creating effective at-a-glance monitoring displays |
| The "So What?" test | Knaflic (2015) | Validating that insights are actionable |
| Bertin's visual variables | Bertin (1967) | The foundational vocabulary of visual encoding |
| Visual Vocabulary (FT) | Financial Times | One-page chart selection reference by analytical purpose |

---

## Reading Map

| Topic Area | Kirk (2019) | Knaflic (2015) | Ware (2012) | Ward et al. (2010) | Tufte (2001) | Few (2009) | Steele & Iliinsky (2011) |
|-----------|-------------|----------------|-------------|-------------------|-------------|------------|------------------------|
| Definitions, history, scope | Ch. 1 | Ch. 1 | Ch. 1 | Ch. 1 | Ch. 1-2 | Ch. 1 | Ch. 1 |
| Exploratory vs. explanatory | Ch. 2 | Ch. 1-2 | | | | | |
| Design process and brief | Ch. 2-4 | Ch. 1-2, 7 | | | | | |
| Data types and encodings | Ch. 3, 6 | | Ch. 5 | Ch. 2-3 | | | |
| Pre-attentive attributes | Ch. 9 | Ch. 4 | Ch. 5-6 | | | Ch. 3 | |
| Gestalt principles | Ch. 9 | Ch. 3 | Ch. 6 | | | Ch. 4 | |
| Cognitive load and memory | Ch. 9 | Ch. 3 | Ch. 1-2, 7 | | | Ch. 3 | |
| Cleveland and McGill hierarchy | Ch. 9 | | Ch. 5 | Ch. 3 | | | |
| Colour perception and use | Ch. 9 | Ch. 4 | Ch. 4 | | | Ch. 4 | |
| Data-ink ratio and chartjunk | Ch. 8 | | | | Ch. 4-6 | Ch. 3 | |
| Graphical integrity and ethics | Ch. 3, 8 | | | | Ch. 2 | Ch. 3 | Ch. 6 |
| Typography, layout, hierarchy | Ch. 8-9 | Ch. 4-5 | | | | Ch. 5 | |
| Dashboard design | Ch. 10 | Ch. 5 | | | | Ch. 2-6 | |
| Chart types (comprehensive) | Ch. 6-7 | Ch. 2 | | Ch. 5-8 | | Ch. 5 | |
| Geospatial visualisation | Ch. 7 | | | Ch. 8 | | | |
| Tables and conditional formatting | Ch. 6 | Ch. 2 | | | | Ch. 6 | |
| Interaction and exploration | Ch. 10 | | Ch. 10-11 | Ch. 9, 12 | | Ch. 6 | Ch. 5 |
| Shneiderman's mantra | Ch. 10 | | | Ch. 12 | | | |
| Storytelling and narrative | Ch. 11 | Ch. 7-10 | | | | | Ch. 3 |
| Audience analysis | Ch. 4 | Ch. 1-2 | | | | | |
| Tools and technologies | Ch. 5 | | | Ch. 11 | | Ch. 7 | Ch. 7 |
| Power BI specifics | Ch. 10 | | | | | | |
| Design proposals | Ch. 2-4 | Ch. 1-2, 7 | | | | | |
| AI in visualisation | Ch. 5 | | | | | | |
| Evaluation methods | Ch. 4, 11 | Ch. 9 | Ch. 12 | Ch. 13 | | Ch. 7 | Ch. 4 |
| Real-world case studies | Ch. 11-12 | | | Ch. 10 | | | Ch. 1-5 |

---

*Theory skeleton prepared for Module 9DATAV, Data Visualisation*
*9DATAV Data Visualisation, NCI, February 2026*
*Version 2.0*
