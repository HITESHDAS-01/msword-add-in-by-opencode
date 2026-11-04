# 📄 SmartDoc & Question Paper Formatter — MS Word Add-in (`plan.md`)

## 1. Project Overview & Core Objective
Teachers aur staff se aane wali raw, unformatted MS Word (`.docx`) files—jinmein random fonts, spacebar se align kiye gaye marks, टूटी हुई numbering, aur inconsistent MCQ options hote hain—unko **MS Word ke andar hi 1-Click ya AI Prompt se 100% print-ready Question Paper ya Official Document** mein convert karna.

### Key Highlights:
* **Native MS Word Integration:** MS Word ke right-side Task Pane (~350px–420px width) mein chalega (`Office.js` API).
* **3-Mode Unified Workflow:**
  1. **⚡ Presets Mode:** 1-Click formatting using saved exam/document templates.
  2. **🎛️ Form Mode (All Advanced Options):** 6-module granular control over page setup, headers, bilingual fonts, right tab-stop marks, MCQ grids, and footers.
  3. **💬 Prompt Mode + Sample File Upload ("Style Cloner"):** Reference `.docx` / `.pdf` / Image upload karke uska exact formatting style clone karna + natural language instructions (`Full Document` ya `Selected Text Only`).

---

## 2. Tech Stack & Architecture

| Layer | Technology | Role in Project |
| :--- | :--- | :--- |
| **Add-in Host & API** | Microsoft `Office.js` (`Word.run`) | Active Word document ko live read karna, selection modify karna, native tables, tab-stops, headers, aur OOXML inject karna. |
| **Frontend Framework** | **Next.js (App Router) + React + TypeScript** | Fast, modular UI aur API routes handle karne ke liye. |
| **Styling & UI** | **Tailwind CSS + Lucide Icons** | MS Word Task Pane ke liye compact, collapsible, dark/light responsive interface. |
| **AI Brain** | **Google Gemini API (`gemini-2.5-flash`)** | Messy raw text ko strict Question Paper JSON structure mein todna, custom prompt instructions execute karna, aur PDF/Image sample ka visual layout samajhna. |
| **Sample `.docx` Parser** | **`JSZip` + `fast-xml-parser`** | Uploaded sample `.docx` file ko unzip karke `word/document.xml`, `word/styles.xml`, aur `word/settings.xml` se exact fonts, margins, spacing, aur border rules extract karna. |
| **State & Storage** | **`localStorage` / IndexedDB + JSON Export** | Saved Presets, School/Institute Header Profiles, aur Form settings ko locally persist karna. |
| **Local Dev & Sideloading** | **Office Add-in Dev Certs (`HTTPS`) + `manifest.xml`** | Windows PC par MS Word mein bina kisi paid store ke direct sideloading. |

---

## 3. Detailed Breakdown of the 3 Core Modes

### Mode 1: ⚡ Presets Mode (1-Click Speed)
Rozana ke repetitive kaam ke liye jahan settings bar-bar nahi badalni padti:
* **Built-in Default Presets:**
  * *Unit Test / Periodic Test (40 Marks — Compact Single Page)*
  * *Half-Yearly / Term Exam (80 Marks — Standard A4 with Instructions)*
  * *Final / Board Pattern Paper (Bilingual Support + Section A/B/C/D)*
  * *Pure MCQ / OMR Test Sheet (2-Column Page + 2x2 Option Grid)*
  * *Official School Notice / Circular Format*
* **Preset Actions:**
  * `Apply Preset Instantly` (Raw doc par seedha apply karega)
  * `Load into Form & Edit` (Preset ki settings Form tab mein khol dega agar Class/Subject/Date badalna ho)
  * `Export / Import Presets (.json)` (Backup ya doosre PC par share karne ke liye)

---

### Mode 2: 🎛️ Form Mode (All Advanced Options)
Task Pane mein clutter-free rakhne ke liye **6 Collapsible Accordion Sections** honge:

#### Section A: 📄 Page & Layout Setup
* **Page Size:** `A4 (210 × 297 mm)`, `Legal (216 × 356 mm)`, `Letter`, `A3 Folded Booklet`
* **Orientation:** `Portrait` | `Landscape`
* **Columns:** `Single Column` | `Double Column (Newspaper Style with Center Divider Line)`
* **Margins:** Presets (`Narrow 0.5"`, `Moderate 0.75"`, `Normal 1.0"`) + Custom (`Top`, `Bottom`, `Left`, `Right` in inches/cm)
* **Page Border:** `None` | `Single Box` | `Double Line` | `Custom Width (pt)`

#### Section B: 🏫 Header, Metadata & Instructions Block
* **Institute Profile:** Institute/School Name, Sub-header/Address, Optional Logo Alignment (`Left`, `Center`, `Top-Both`)
* **Exam Metadata Fields:**
  * Exam Title (e.g., *HALF-YEARLY EXAMINATION, 2026–27*)
  * Class / Standard / Semester
  * Subject Name & Subject Code
  * Paper Set (`None`, `Set-A`, `Set-B`, `Set-C`, `Set-D`)
  * Time Allowed (e.g., *3 Hours*) & Maximum Marks (e.g., *80*)
  * Pass Marks & Exam Date (Optional toggles)
* **Candidate Info Strip:** Auto Roll No. Box Grid (`[ ][ ][ ][ ][ ]`), Student Name / Section line
* **Header Layout Style:** `Full Boxed Table` | `Clean Double-Line Bottom Border` | `Minimal Compact`
* **General Instructions Block:** Toggleable bulleted list before Section-A (with editable default points + Bilingual instruction support)

#### Section C: 🔤 Typography & Bilingual Font Control
* **Primary Font (English/Latin):** `Times New Roman`, `Cambria`, `Calibri`, `Arial`, `Garamond`, `Book Antiqua`
* **Secondary/Regional Font (Assamese / Hindi / Bengali):** Dedicated font family & size scale (e.g., `Nirmala UI`, `Kalpurush`, `Vrinda`, `Geetanjali`, `Mangal`) taaki bilingual papers mein regional script chhota na dikhe.
* **Granular Font Size Controls:**
  * Institute Title (`14pt – 20pt`, Bold/Uppercase)
  * Exam & Subject Sub-header (`11pt – 14pt`, Bold)
  * Section Headings (`11pt – 13pt`, Bold)
  * Main Question Text (`10pt – 12pt`, Regular)
  * Sub-Questions & MCQ Options (`10pt – 11.5pt`)
* **Paragraph & Line Spacing:**
  * Line Spacing (`1.0`, `1.15`, `1.25`, `1.5`)
  * Space Before / After Question (`2pt – 8pt`)
  * Space Between Sub-questions (`1pt – 4pt`)

#### Section D: 🔢 Sections, Numbering & Smart Marks Engine
* **Section Header Style:** `Centered Bold + Underline` | `Shaded Grey Full-Width Bar` | `Boxed Header`
* **Section Instructions:** Auto-place section-specific rules (e.g., *Answer any 5 questions*) in *Italics* right below the section title or aligned right (`1 × 10 = 10`).
* **Question Numbering Style:** `1. 2. 3.` | `Q1. Q2. Q3.` | `Q.1) Q.2)` | `Continuous across sections` vs `Restart per section`
* **Sub-Question Numbering:** `(i), (ii), (iii)` | `(a), (b), (c)` with configurable Left Hanging Indent (`0.25"` / `0.4"`).
* **Smart Marks Alignment (Right Tab-Stop Lock):**
  * Spacebar/dots hata kar exact Right Margin par **Right-Aligned Tab Stop** set karega.
  * **Marks Format:** `[1]`, `(1)`, `1 Mark`, `[1+2=3]`, or `[½ × 4 = 2]`
  * **Tab Leader:** `None (Clean Space)` | `Dotted Leader (........ [2])`
* **Internal Choice ("OR" / "অথবা"):**
  * Auto-detect `OR` / `অথবা` / `अथवा` between questions and format as **Centered Bold** with balanced top/bottom spacing.

#### Section E: ☑️ MCQs, Tables & Special Question Types
* **MCQ Option Layout Engine:**
  * `Smart Auto-Fit (Recommended)`: Agar charo options chhote hain (< 15 chars) toh **1 Line (4 Columns)**; agar medium hain (< 35 chars) toh **2×2 Invisible Grid**; agar lambe sentences hain toh **4 Vertical Lines**.
  * `Force 1-Line (4 Columns)`
  * `Force 2×2 Invisible Table Grid`
  * `Force 4 Vertical Lines`
* **Option Labels:** `(a) (b) (c) (d)` | `(A) (B) (C) (D)` | `(i) (ii) (iii) (iv)` | `(ক) (খ) (গ) (ঘ)`
* **Special Question Blocks:**
  * **Match the Following:** Raw text lists ko clean 2-Column (`Column A` | `Column B`) bordered ya borderless table mein badalna.
  * **Assertion & Reason:** Auto-indent `Assertion (A):` aur `Reason (R):` in bold labels.
  * **Case Study / Comprehension Passage:** Passage box ya shaded quote block mein format karna.
  * **Math Equations & Sub/Superscripts:** Word ke native OMML equations aur `$H_2O$`, `$x^2$` formatting ko सुरक्षित (preserve) rakhna.

#### Section F: 🔖 Footer, Watermark & Finishing Rules
* **Page Numbering:** `Page X of Y` | `- 1 - (Bottom Center)` | `Bottom Right` | `None`
* **P.T.O. Automation:** Har page ke bottom-right mein bold `P.T.O.` (except the last page).
* **End of Paper Marker:** Last question ke baad centered `*** END OF QUESTION PAPER ***` ya `--- X ---`.
* **Confidential / School Watermark:** Optional diagonal text watermark (`CONFIDENTIAL` ya School Short Name).

---

### Mode 3: 💬 Prompt Mode + Sample File Upload ("Style Cloner")
Jab user ko kisi existing paper ka exact design chahiye ya koi custom document/selection edit karna ho:

1. **📎 Sample / Reference File Uploader (`.docx`, `.pdf`, `.png/.jpg`):**
   * **`.docx` Upload Flow (100% Exact XML Extraction):**
     * `JSZip` se sample `.docx` browser memory mein khulega.
     * `word/document.xml` aur `word/styles.xml` se exact Page Size, Margins (`w:pgMar`), Font Family (`w:rFonts`), Font Sizes (`w:sz`), Line Spacing (`w:spacing`), Header Table structure, aur Marks Bracket pattern extract hoga.
   * **`.pdf` / Image Upload Flow (Gemini Vision Blueprint):**
     * Sample paper ki photo ya PDF Gemini API ko jayegi aur woh visual layout scan karke equivalent `FormattingConfig` JSON generate karega.
   * **Two Action Buttons on Sample Upload:**
     * `✨ Apply Sample Style to Current Doc`: Active raw document ko turant sample jaisa format kar dega.
     * `📥 Extract Rules to Form / Save as Preset`: Sample se nikle hue saare rules Form Mode mein bhar dega taaki tum dekh sako aur Preset bana sako!

2. **🎯 Target Scope Selector:**
   * `Full Document`: Poore active Word document ko parse aur format karega.
   * `Selected Text Only`: MS Word mein mouse se jo questions, paragraph, ya table select kiya hai, sirf usi hisse ko format karega (baaki document untouched rahega).

3. **💬 Natural Language Command Box + Quick Action Chips:**
   * User koi bhi instruction likh sakta hai:
     * *"Selected questions ke options ko 2x2 table grid mein daal do aur marks [2] right align karo."*
     * *"Is raw letter ko official school notice format mein set karo with date on right and signature block at bottom."*
   * **1-Click Quick Chips (For Selected Text or Full Doc):**
     * `🧹 Clean Extra Spaces & Enters`
     * `📐 Align All Marks to Right Margin`
     * `🔢 Fix Question Numbering Sequence`
     * `📊 Convert Selection to 2x2 MCQ Grid`
     * `📋 Convert to Match-the-Following Table`

---

## 4. End-to-End Document Processing Pipeline

```text
[Active Raw Word Doc] 
       │
       ▼
1. Office.js Reader (`context.document.body` or `context.document.getSelection()`)
   • Extracts raw paragraphs, inline styles, tables, & preserves Equation/Image placeholders
       │
       ▼
2. Configuration Merger
   • Combines Active Preset OR Form Settings OR Extracted Sample File Style + Custom Prompt
       │
       ▼
3. Gemini 2.5 Flash Structured Parser (`responseSchema`)
   • Cleans messy numbering, separates marks from question text, identifies Sections, 
     MCQs, Sub-questions, "OR" blocks, Match-the-Following, and Bilingual text
       │
       ▼
4. Native Office.js Document Builder (`Word.run`)
   • Applies Page Setup (Margins, Size, Columns)
   • Builds Top Header Metadata Table & Instructions Block
   • Renders Sections & Questions with Exact Right Tab-Stops for Marks
   • Builds Invisible 2x2 Tables for MCQs & Bordered Tables for Match-the-Following
   • Injects Footers, Page Numbers, P.T.O., and End Marker
```

---

## 5. Core Data Schemas (TypeScript Interfaces)

### A. Master Formatting Configuration (`FormattingConfig`)
Yeh single JSON object Presets, Form Mode, aur Sample File Extractor teeno ko connect karega:

```typescript
export interface FormattingConfig {
  presetName?: string;
  pageSetup: {
    paperSize: 'A4' | 'Legal' | 'Letter';
    orientation: 'Portrait' | 'Landscape';
    columns: 1 | 2;
    margins: { top: number; bottom: number; left: number; right: number }; // in points/inches
    pageBorder: 'none' | 'single' | 'double';
  };
  header: {
    enabled: boolean;
    style: 'boxed' | 'double-line' | 'minimal';
    instituteName: string;
    instituteSubtitle: string;
    examTitle: string;
    className: string;
    subject: string;
    subjectCode: string;
    paperSet: string;
    timeAllowed: string;
    maxMarks: string;
    showRollNoBoxes: boolean;
    rollNoBoxCount: number;
    generalInstructions: string[];
  };
  typography: {
    primaryFont: string;      // e.g., "Times New Roman"
    secondaryFont: string;    // e.g., "Kalpurush" or "Nirmala UI" for Assamese/Hindi
    titleSize: number;        // e.g., 16
    subHeaderSize: number;    // e.g., 12
    sectionTitleSize: number; // e.g., 12
    questionSize: number;     // e.g., 11.5
    optionSize: number;       // e.g., 11
    lineSpacing: number;      // e.g., 1.15
    questionGapAfter: number; // e.g., 4 (pt)
  };
  questionsAndMarks: {
    sectionStyle: 'centered-underline' | 'shaded-bar' | 'boxed';
    questionNumberPrefix: '1.' | 'Q1.' | '1)';
    subQuestionStyle: '(i)' | '(a)';
    marksFormat: '[X]' | '(X)' | 'X Marks';
    marksLeader: 'none' | 'dots';
    centerChoiceOr: boolean;
  };
  mcqAndTables: {
    mcqLayout: 'auto' | '1-line' | '2x2-grid' | '4-lines';
    optionLabelStyle: '(a)' | '(A)' | '(i)' | '(ক)';
    preserveEquationsAndImages: boolean;
  };
  footer: {
    pageNumberStyle: 'page-x-of-y' | 'center-dash' | 'none';
    showPTO: boolean;
    endMarkerText: string; // e.g., "*** END OF QUESTION PAPER ***"
    watermarkText: string;
  };
}
```

### B. Parsed Question Paper Structure (`ParsedDocument`)
Gemini API raw text ko is strict format mein return karega taaki `Office.js` bina galti ke Word file bana sake:

```typescript
export interface ParsedQuestion {
  id: string;
  qNo: string;
  type: 'standard' | 'mcq' | 'match' | 'assertion-reason' | 'case-study';
  text: string;
  marks?: string;
  options?: string[]; // For MCQs
  subQuestions?: { label: string; text: string; marks?: string }[];
  matchColumns?: { colAHeader: string; colBHeader: string; rows: [string, string][] };
  hasInternalChoiceAfter?: boolean; // Renders centered "OR / অথবা" before next question or alternative
  choiceAlternative?: { text: string; marks?: string; options?: string[] };
}

export interface ParsedSection {
  title: string;
  instructions?: string;
  sectionMarksSummary?: string; // e.g., "1 x 10 = 10"
  questions: ParsedQuestion[];
}
```

---

## 6. Project Folder Structure

```text
word-question-formatter/
├── manifest.xml                        # MS Word Add-in Sideload Manifest
├── package.json
├── next.config.mjs
├── tailwind.config.ts
└── src/
    ├── app/
    │   ├── layout.tsx                  # Loads Office.js script + Tailwind
    │   ├── page.tsx                    # Main Task Pane Entry (3-Tab Controller)
    │   └── api/
    │       ├── parse-doc/route.ts      # Gemini API: Raw Text -> Structured Question Paper JSON
    │       ├── extract-sample/route.ts # Gemini Vision API: PDF/Image Sample -> FormattingConfig
    │       └── prompt-edit/route.ts    # Gemini API: Custom Prompt / Selected Text Editor
    ├── components/
    │   ├── NavbarTabs.tsx              # Presets | Form | Prompt Tab Switcher
    │   ├── ScopeBar.tsx                # Full Document vs Selected Text Indicator
    │   ├── presets/
    │   │   └── PresetsTab.tsx          # Default & Custom Saved Preset Cards
    │   ├── form/
    │   │   ├── FormTab.tsx             # 6 Collapsible Accordion Sections
    │   │   └── SavePresetModal.tsx     # Save current form state as a reusable preset
    │   └── prompt/
    │       ├── PromptTab.tsx           # Chat Box + Quick Action Chips
    │       └── SampleDropzone.tsx      # .docx / .pdf / Image Style Cloner Upload UI
    ├── lib/
    │   ├── defaultPresets.ts           # Pre-configured Exam Templates
    │   ├── docxStyleExtractor.ts       # JSZip + XML parser for .docx sample files
    │   ├── wordEngine.ts               # Core Office.js Word.run document builder & formatter
    │   └── selectionEngine.ts          # Office.js Selected Text reader & replacer
    └── types/
        └── schema.ts                   # FormattingConfig & ParsedDocument TypeScript types
```

---

## 7. Step-by-Step Implementation Roadmap

### 🚀 Phase 1: Interactive 3-Tab Add-in UI & Preset/Form Architecture
* Complete Task Pane UI (`Presets`, `Advanced Form` with all 6 collapsible modules, and `Prompt Mode` with Sample File Dropzone).
* Live Document Preview / Interactive Simulator taaki MS Word ke andar aur browser dono jagah har setting test ho sake.
* Preset Manager (`Save`, `Load`, `Delete`, `Export JSON`).

### 🔍 Phase 2: Sample File Style Cloner (`JSZip` XML + Vision Extractor)
* `.docx` Sample Upload parser jo किसी bhi uploaded Word file se exact fonts, sizes, margins, aur header rules extract karke Form Mode ko auto-fill kare.
* `.pdf` / Image sample layout extractor via Gemini API.

### ⚙️ Phase 3: Native `Office.js` Word Formatting Engine (`wordEngine.ts`)
* Header Table generator (Boxed / Double-line / Roll No. Grid).
* **Right Tab-Stop Marks Engine** (no spacebars, 100% locked right alignment).
* **Smart MCQ Table Builder** (1-line, 2×2 invisible table grid, 4-lines).
* Bilingual typography support (English + Assamese/Hindi font pairing) & P.T.O. footer automation.

### 🧠 Phase 4: Gemini AI Raw Document Parser & Selection Prompt Editor
* Messy teacher document reader -> Gemini Structured JSON -> Formatted Word Document replacement.
* `Selected Text Only` mode: Mouse se select kiye gaye specific questions ya tables ko AI prompt ya Quick Chips se live badalna.
* Equation (`OMML`) aur Image preservation layer taaki formatting ke waqt diagrams ya math formulas gayab na hon.

### 🖥️ Phase 5: Windows MS Word Sideloading (`manifest.xml` Setup)
* Local HTTPS server aur `manifest.xml` configuration taaki tumhare Windows PC ke MS Word mein **Home Ribbon -> "Smart QP Formatter"** button aa jaye.