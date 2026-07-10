## Plan: Format-agnostic table parsing for paste and file imports

### Problems to fix

1. **Paste misalignment** — when pasted rows use spaces (not tabs/pipes) as separators, long student names (e.g. "John Kwame Mensah") push scores into the wrong columns because the parser splits on single whitespace.
2. **Rigid file parsing** — the current Excel/DOCX parsers assume the very first row is the header row and the whole sheet is the table. If the document has a title, school header, blank rows, notes, or extra metadata above/below the table, columns misalign or the import fails.

The goal: no matter what the document looks like, the app should **locate the table**, read only that, and ignore everything else as long as the column headers are at the top of the table.

### What will change

**1. New shared utility: `src/lib/tableDetection.ts**`

A single robust table-detection layer used by both Junior and Senior imports.

- `detectTableFromGrid(rows: string[][])` — given a 2D array of cells, scans for the most likely table region by:
  - finding the row with the highest count of short, header-like text cells (the header row)
  - requiring the rows below it to have a matching number of numeric cells (scores)
  - trimming blank leading/trailing rows and columns
  - returning `{ headerRow, dataRows, nameColumnIndex, subjectColumns }`
- Name column detection: prefer a header matching Name/Student/Learner/Pupil/Candidate; otherwise pick the column whose data cells are mostly non-numeric text (names) while the rest are numeric.
- Subject columns: any non-name column whose data cells are ≥70% numeric within 0–100.
- Handles merged/blank cells by treating empty strings as gaps, not separators.

**2. Paste parsing — fix whitespace-separated data**

Rewrite `parseJuniorTableData` and the senior equivalent to:

- Detect the separator per line: pipe `|` → tab `\t` → comma `,` → **multi-space `\s{2,}**` (two or more spaces = column break, so single spaces inside names are preserved) → last-resort single space only when every row has the exact same token count.
- Normalise every line into `string[]`, then hand off to `detectTableFromGrid`.
- Skip separator/divider lines (`---`, `===`) and blank lines.
- If pipe/tab detection succeeds, keep current fast path; the multi-space fallback only kicks in for plain-text paste.

This directly fixes "John Kwame Mensah 78 65 …" being split into 6 tokens instead of 4.

**3. File parsing — read only the table, ignore everything else**

- **Excel/CSV (`src/components/JuniorDataImport.tsx`, `src/components/DataImport.tsx`)**: read the sheet as a raw 2D grid via `XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })`, then pass to `detectTableFromGrid`. This makes title rows, blank rows, and trailing notes get skipped automatically.
- **DOCX**: switch from `mammoth.extractRawText` to `mammoth.convertToHtml`, then parse `<table>` elements from the HTML into a grid. If no `<table>` exists, fall back to the raw text path (multi-space detection above).
- **TXT / plain paste**: same multi-space + grid detection path.

**4. Preserve Senior-specific rules**

Senior grading requires Chemistry + Physics side-by-side for the Science average, plus the first five fixed subjects. The new detector returns generic `{ name, subjects: Record<string, number> }`, and the existing senior mapping layer (already in `src/lib/grading.ts`) continues to identify Chemistry/Physics by header name — unchanged.

### Technical details

- New file: `src/lib/tableDetection.ts` exporting `detectTableFromGrid`, `splitLineSmart`, `linesToGrid`.
- Edits:
  - `src/lib/juniorGrading.ts` — `parseJuniorTableData`, `parseJuniorCSV` route through the new detector.
  - `src/lib/grading.ts` — senior paste parser routed through the new detector, keeping the Chemistry/Physics logic.
  - `src/components/JuniorDataImport.tsx` — Excel + DOCX paths use the detector; add `mammoth.convertToHtml` for DOCX table extraction.
  - `src/components/DataImport.tsx` — same Excel + DOCX changes for senior.
- No changes to grading math, export, UI layout, or backend.

### Validation

- Paste rows with long multi-word names separated only by spaces → columns stay aligned.
- Import Excel with a title row and blank rows above the table → table detected, names + scores correct.
- Import DOCX with paragraphs of text before a scores table → only the table is read.
- Senior import with Chemistry and Physics anywhere in the last columns → Science average still computed.
- Existing pipe/tab/CSV pastes continue to work identically.