
Goal:
- Remove the school logo from the report’s signature/stamp area and leave that footer section blank.
- Fix the Junior “Paste Data” flow so pasted data imports reliably.

What I found:
- In `src/lib/export.ts`, the senior and junior report templates still render the school logo in the bottom-right “SCHOOL STAMP” area.
- In `src/lib/juniorGrading.ts`, the junior paste parsers are stricter than the senior ones:
  - they only work if a header is exactly `Name` or `Student`
  - they do not fall back to the first column when that label is missing
- In `src/components/JuniorDataImport.tsx`, paste import currently gives no success/failure toast, so when parsing fails it looks like nothing happened.

Implementation plan:
1. Update both report templates in `src/lib/export.ts`
   - Remove the `<img>` from the senior footer stamp area.
   - Remove the `<img>` from the junior footer stamp area.
   - Keep the footer layout/labels/lines, but leave the signature and stamp spaces visually blank.

2. Make junior paste parsing as tolerant as the senior parser
   - Update `parseJuniorTableData` in `src/lib/juniorGrading.ts` to:
     - preserve raw indices
     - fall back to the first column as the student-name column when `Name`/`Student` is not explicitly present
   - Update `parseJuniorCSV` the same way.
   - Keep dynamic subject handling unchanged.

3. Improve junior paste UX in `src/components/JuniorDataImport.tsx`
   - Add clear success and error toast messages for pasted data.
   - Show an error when no valid rows are parsed instead of silently doing nothing.
   - Mirror the same feedback behavior already used in the senior import component.

4. Quick consistency pass
   - Check that file upload and pasted data in Junior now behave consistently.
   - Confirm the report preview/export still renders correctly after removing the footer logo images.

Technical notes:
- Most likely root cause of the Junior paste bug: the pasted table’s first column may contain student names but not be labeled exactly `Name`, causing the parser to return no students.
- This fix will make Junior import behavior match the more forgiving Senior import logic.
- No backend changes are needed.

Validation after implementation:
- Paste a pipe-separated Junior table with `Name` header.
- Paste a tab-separated Junior table copied directly from Excel.
- Paste data where the first column is names but the header is not exactly `Name`.
- Preview/export one senior and one junior report card to confirm the footer signature/stamp area is blank.
