

## Plan: Exact report card format in Word export + SoftwareArmy footer on all screens

### What needs to change

**1. Report card Word export — match uploaded reference exactly**

The current `.doc` export uses HTML-in-Word which doesn't give precise control over page sizing. Each report card must fit exactly one page. Changes to `src/lib/export.ts`:

- Add `@page { size: A4; margin: 15mm 18mm; }` CSS rule in the exported HTML wrapper
- Add `page-break-after: always` on each report div (already present) and `page-break-inside: avoid`
- Ensure the remark text is wrapped in a bordered box (matching the uploaded image where remarks have a border)
- The "CLASS TEACHER'S REMARKS" and teacher name row, plus the remark text below, should be inside one bordered container
- The "PRINCIPAL" and "SCHOOL STAMP" footer section should use a simple table layout instead of flexbox (Word doesn't support flexbox well) — two cells, left-aligned "PRINCIPAL" with signature line, right-aligned "SCHOOL STAMP" with empty space
- Replace all `display: flex` with `<table>` equivalents since `.doc` format (HTML rendered by Word) has poor flexbox support
- The header area (logo + school name) needs to be a table row instead of flex
- Apply these same fixes to both `generateReportCardHTML` and `generateJuniorReportCardHTML`

**2. Add "SoftwareArmy" footer to all app screens**

- `src/components/GradingSystemSelection.tsx` — add `SOFTWAREARMY` text at the bottom
- `src/components/SeniorDashboard.tsx` — add footer
- `src/pages/JuniorIndex.tsx` — add footer

All footers: fixed/absolute bottom, bold, small text, tracking-widest, matching the splash screen style.

### Technical details

**Word compatibility fixes** (the core issue):
- Microsoft Word opening `.doc` files ignores CSS flexbox entirely. The current layout uses `display: flex` everywhere, which breaks in Word.
- Every flex container will be converted to a `<table>` with appropriate cells.
- The page wrapper will use `mso-page-break-before: always` Word-specific CSS alongside standard `page-break-after`.
- Font will remain Times New Roman throughout; sizes match the reference (18pt title, 9pt subheadings, 10pt body, 14pt "SCHOOL REPORT").

**Files to edit:**
1. `src/lib/export.ts` — rewrite both `generateReportCardHTML` and `generateJuniorReportCardHTML` to use table-based layout for Word compatibility; add page-size CSS
2. `src/components/GradingSystemSelection.tsx` — add SoftwareArmy footer
3. `src/components/SeniorDashboard.tsx` — add SoftwareArmy footer
4. `src/pages/JuniorIndex.tsx` — add SoftwareArmy footer

