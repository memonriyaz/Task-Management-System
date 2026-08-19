# Part 2 — Product Understanding

## AbleSpace — Caseload → Take Data Workflow
**Full Stack Developer (Fresher) Assessment**

I signed up for AbleSpace's free trial ([app.ablespace.io](https://app.ablespace.io)) as an Admin and did a full hands-on walkthrough of **Caseload → Take Data** using the two pre-loaded demo students, exploring every tab, view mode, modal, and data type available.

---

## 1. Entry Point: Caseload → Take Data

The **Caseload** dashboard lists active students with columns for *Full Name*, *Last Name*, *IEP Due*, *Eval Due*, *Collaborators*, *Service Time*, and *School*. Each student row ends with a dedicated **"Take Data"** button.

- **Launching a Session**: Clicking **"Take Data"** opens a new Session (URL: `/session/<id>`).
- **Automatic Session Defaults**: Auto-generates a **30-minute time window** starting immediately (e.g., `07:32 PM - 08:02 PM`) and loads **every active IEP goal** assigned to that student.

---

## 2. The Session Screen & Its Layout

The Session interface is structured around a top utility toolbar and two primary operational panes:

- **Left Pane (Goals List)**: Displays all active student goals (e.g., `Goals (7/7)`).
- **Right Pane (Capture & Analytics Area)**: Displays the active data-collection widget or analytical views for the currently selected goal, featuring trial navigation (e.g., `Trial 1`) and tap-to-count controls.
- **Top Toolbar**:
  - Clickable **"Accommodations"** chip (opens modal).
  - **"Services Not Tracked"** chip (opens attendance & service minutes modal).
  - **"Customize View"** dropdown (switches between List, Board, and Group layouts).
  - Student Switcher (`+ Add Student` for group therapy sessions).
- **Right Pane Sub-Tabs**: `Capture` | `Graph` | `Stats` | `Info`.
- **Bottom Section**: Split between a plain **Notes** input and a rich **Lesson Plan** editor.

---

## 3. Logging Accommodations and Service Time

Both Accommodations and Service Time are logged independently of goal data through modal dialogs accessible directly via the top-bar chips:

1. **Accommodations Modal**:
   - Allows selecting per-student Accommodations with specific option dropdowns (e.g., *Given*, *Refused*).
2. **Services Modal (Attendance & Time Tracking)**:
   - Tracks student attendance status (*Attended*, *Absent*, *Tardy*).
   - Records delivered **Service Time** (in minutes) against mandated targets.
   - Displays running **Total** time and provides an **Autofill** shortcut for rapid logging.

---

## 4. Graph, Stats, and Info — Reviewing Goal History Mid-Session

The right pane provides mid-session historical analysis across three specialized tabs:

- **Graph Tab**:
  - Plots frequency and accuracy data over time.
  - Includes an **"All Time"** date range picker, **Graph Options** configuration, and a data **Filter** icon.
- **Stats Tab**:
  - Displays a detailed **Session/Trial table** with columns for *Date*, *Edited By*, *Frequency/Score*, and *Notes*.
  - Provides **Add Data** and **Download** actions.
  - Contains a **"Performance Summary"** block that is locked behind a paywall banner (*"Unlock with free trial"*).
- **Info Tab**:
  - Details the goal's *Measurement Type* (e.g., Frequency), *Data Points count*, *Notes count*, and the full IEP target goal sentence.
  - Displays an unlocked **"Average"** metric figure (e.g., `3.22`).

> ⚠️ **Identified Inconsistency**: Info tab's *"Performance Summary → Average"* is freely visible, whereas the Stats tab's *"Performance Summary"* block for the exact same goal is locked behind *"Unlock with free trial"*—representing two panels with the same name and differing access rules on the same trial account.

---

## 5. Notes and Lesson Plan Editor

The bottom drawer supports two distinct documentation workflows:

- **Notes Tab**: Plain text field for quick session observations.
- **Lesson Plan Tab**: Opens a full-featured rich-text editor supporting:
  - Formatting: **Bold**, *Italic*, <u>Underline</u>, ~~Strikethrough~~.
  - Structure: Bulleted/Numbered lists, Hyperlinks.
  - **"Ask AI" Assist**: AI prompt assistant for structuring and refining lesson plans.

---

## 6. Board View & Diverse Data Collection Types

The **"Customize View"** menu switches the entire session between **List**, **Board**, and **Group** layouts, with options to toggle *Instructions* and *Data Collection Buttons*, plus a *"Set as Default View"* preference.

In **Board View**, all goals are displayed simultaneously, each rendered with a specialized data-capture widget matching its specific measurement type:

| Goal Area | UI Widget & Measurement Type | Interaction Mechanics |
| :--- | :--- | :--- |
| **Social Studies** | **Tally / Frequency Counter** | Single tap `+` counter with immediate `Undo` action. |
| **Writing** | **Letter-by-Letter Checklist** | Checklist items (`D`, `E`, `M`, `O`) to check off correctly written letters. |
| **Math (Goal 3)** | **Sub-Card Split (Objectives 3.1 / 3.2)** | Splits into discrete sub-cards with independent Prompted/Accuracy counters and prompt level dropdown (`P`). |
| **Reading** | **Wh-Questions Accordion** | Expandable sub-questions (*Answer Who*, *Answer What*, *Answer When*, *Answer Where*). |
| **Toileting** | **4-Point Independence Scale** | 4 rating levels (*Independent*, *1–2 Prompts*, *>2 Prompts*, *Intrusive Prompts*). |
| **Behavior** | **6-Point Frequency Scale** | Rating scale (*N/A*, *Never*, *Hardly ever*, *Sometimes*, *Often*, *Always*). |
| **Math (Goal 7)** | **Prompted / Accuracy Counter** | Clock-reading accuracy counter displayed as a running `0/0` ratio. |

> ⚠️ **Design Observation**: None of this widget diversity is visible from the left Goals List—every goal card looks identical (title + truncated sentence + small icon) until opened, preventing clinicians from gauging data-entry effort beforehand.

---

## 7. Group View & Multi-Student Sessions

- **Group View Layout**: Employs the Board view structure scoped under a **"1 Student"** selector dropdown.
- **Multi-Student Workflow**: Allows educators running group therapy sessions to switch contexts or record multi-student data without terminating the session window.

---

## 8. Trial-Level and Service-Level Management Menus

- **Trial Management (`…` Menu)**: Located next to Trial navigation; exposes **"Reset Trial"** and a destructive **"Delete Trial"** (no confirmation modal displayed prior to click).
- **Service Management (`…` Menu)**: Located on the *"Services Not Tracked"* chip; offers **"Remove Service Time & Attendance"** and **"View Activity Log"**.

---

## 9. Outside the Session: Student Profile Page

Clicking a student's name from Caseload opens their comprehensive profile:

- **Profile Navigation Tabs**: *Profile*, *Goals*, *Worksheets*, *Notes*, *Service Time*, *Accommodations*, *Attachments*, *Daily Logs*, *Progress*.
- **Basic Details Card**: IEP Due date, Eval Due date, Site, Grade, Date of Birth, Teacher, Room, Case Manager.
- **Action Dual CTAs**: Houses both a primary **"Take Data"** button and a secondary **"View Data"** button.
- **Student `…` Management Menu**: *Edit Student*, *Student Interests*, *Guardian Details*, *Archive* (Pro), *Transfer* (Pro), *Assign Collaborator*, *Delete*, *View Archived Students*, *View Activity Log*.

---

## 10. Caseload Filters

The Caseload **Filters** modal features a two-column architecture:
- **Left Column**: List of filterable fields (*Full Name*, *Last Name*, *IEP Due*, *Eval Due*, *Collaborators*, *Service Time*, *School*, *Site*).
- **Right Column**: Dynamic checklist of values based on the left selection (e.g., selecting *Full Name* displays a checklist of student names).

---

## 11. Workflow Summary (In My Own Words)

1. **Initiation**: From the Caseload tab, click **"Take Data"** on a student (or navigate via their student profile page).
2. **Session Launch**: AbleSpace automatically instantiates a Session with a 30-minute default time block and populates all active IEP goals in the left list.
3. **Layout Selection**: The clinician chooses their preferred layout: **List** (one goal at a time), **Board** (all goals & widgets visible simultaneously), or **Group** (multi-student switching).
4. **Data Recording**: The clinician records performance using the widget tailored to that goal's measurement type (tally counter, letter checklist, prompt accuracy, Wh-question accordion, or rating scale) with Undo/Reset capabilities.
5. **Independent Service Logging**: Log Accommodations provided and Service Time / Attendance independently via top-toolbar modal chips.
6. **In-Session Analytics**: Review longitudinal progress via **Graph** (trend line), **Stats** (trial logs), or **Info** (metadata & goal target sentences).
7. **Session Notes**: Record qualitative clinical observations in **Notes** or draft structured curriculum using the AI-assisted **Lesson Plan** editor.

---

## 12. UX / Functionality Observations & Suggested Improvements

### 12.1 Goals and Capture Panels Use Fixed Widths (Cannot Be Resized)
- **Observation**: Both the left Goals panel and right Capture panel use rigid static widths, causing long IEP goal descriptions and multi-part response options to truncate or require excessive horizontal scrolling.
- **Recommendation**: Introduce a **draggable splitter/divider** allowing users to freely adjust pane widths, alongside a one-click collapse/expand toggle for the Goals sidebar on smaller laptop screens.

### 12.2 Goal Cards Do Not Utilize Available Screen Width
- **Observation**: In Board view, individual goal sections stretch across full rows while the interactive input widgets occupy only a narrow slice, resulting in vast unused horizontal space.
- **Recommendation**: Implement a responsive **multi-column Grid / Compact layout** so multiple goal widgets can sit side-by-side, drastically reducing vertical scrolling during fast-paced therapy.

### 12.3 Locked Pro Features Are Shown Without Inline Explanation
- **Observation**: Pro features (e.g., *Archive*, *Transfer*, *Stats Performance Summary*) display lock icons without pricing tooltips, plan names, or upgrade prompts on hover.
- **Recommendation**: Add informative hover tooltips (e.g., *"Available on Pro Plan — Click to view upgrade options"*) to provide clear commercial transparency.

### 12.4 Filters Modal's Left Column Reads Like Column Visibility but Acts as a Value Filter
- **Observation**: The left column of the filter modal (*Full Name*, *Last Name*, *IEP Due*, etc.) strongly resembles a column-visibility picker, but clicking an item opens a value-selection list on the right.
- **Recommendation**: Clearly separate **"Customize Columns"** (table column visibility) and **"Filter Records"** (criteria filters) into distinct, explicitly labeled controls.

### 12.5 Goal Cards Give No Hint of Data-Entry Effort Before Opening
- **Observation**: In the left Goals list, a 1-second single-tap tally goal and a complex 4-part Wh-question accordion look identical (same title size, truncated text, generic icon).
- **Recommendation**: Add a subtle visual **Data Type Badge** (e.g., `Tally`, `Checklist`, `Prompt Scale`, `Accordion`) on each goal card so clinicians can budget their session time at a glance.

### 12.6 Two "Performance Summary" Panels with Conflicting Access Rules
- **Observation**: The Info tab displays an unlocked *"Average"* under a heading named *"Performance Summary"*, while the Stats tab locks its *"Performance Summary"* block behind *"Unlock with free trial"*.
- **Recommendation**: Standardize terminology across tabs to eliminate confusion over whether analytics access is a bug or an intended plan boundary.

### 12.7 "Take Data" vs. "View Data" Buttons Are Easily Conflated
- **Observation**: On the student profile header, *"Take Data"* and *"View Data"* sit adjacent to one another with nearly identical visual weight (filled vs slightly tinted variant).
- **Recommendation**: Make *"Take Data"* the dominant primary CTA (with an active session icon) and style *"View Data"* as a subtle secondary outline/text button to prevent mis-clicks during live therapy.

---

## 13. Scope & Methodology

This walkthrough covered every tab, modal, view mode, and data-entry interaction available on a fresh Admin trial account using the pre-seeded demo students (*Demo Student1*, *Demo Student2*). Pro-tier locked actions requiring paid upgrades (e.g., real multi-student group synchronization, billing export) were evaluated based on their visible UI entry points.
