// Format-agnostic table detection.
// Turns arbitrary text or 2D grids into a clean { headerRow, dataRows, nameIndex, subjectColumns }.

export interface DetectedTable {
  headers: string[];
  rows: string[][];
  nameIndex: number;
  subjectIndices: number[];
  pointsIndex: number;
  pointsFilled: boolean;
}

const NAME_HEADER_ALIASES = ['name', 'student', 'student name', 'learner', 'pupil', 'candidate', 'names', 'full name'];

// Columns that are results/metadata, not subjects.
const POINTS_HEADER_ALIASES = ['points', 'point', 'grade points', 'gradepoints', 'total points', 'aggregate', 'agg', 'pts'];
const META_HEADER_ALIASES = [
  ...POINTS_HEADER_ALIASES,
  'rank', 'position', 'pos', 'position in class', 'total', 'sum', 'average', 'avg', 'mean', 'no', 'no.', '#', 'sn', 's/n', 'index',
];

const normalizeHeader = (h: string) => (h || '').toLowerCase().trim().replace(/\s+/g, ' ');

const isNumericCell = (v: string) => {
  if (!v) return false;
  const n = parseFloat(v);
  return !isNaN(n) && isFinite(n) && /^-?\d+(\.\d+)?$/.test(v.trim());
};

/** Split a plain-text line intelligently. Tries pipe → tab → comma → 2+ spaces. */
export function splitLineSmart(line: string): string[] {
  if (line.includes('|')) {
    return line.split('|').map(s => s.trim());
  }
  if (line.includes('\t')) {
    return line.split('\t').map(s => s.trim());
  }
  // Multi-space split preserves single spaces inside names like "John Kwame Mensah"
  if (/\s{2,}/.test(line)) {
    return line.trim().split(/\s{2,}/).map(s => s.trim());
  }
  if (line.includes(',')) {
    return line.split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
  }
  // Fall back to single whitespace only when the caller decides to
  return line.trim().split(/\s+/).map(s => s.trim());
}

/** Convert raw text to a 2D grid, skipping blank/divider lines. */
export function linesToGrid(text: string): string[][] {
  const lines = text.split(/\r?\n/).map(l => l.replace(/\|+/g, '|'));
  const grid: string[][] = [];
  for (const raw of lines) {
    const line = raw.replace(/^\||\|$/g, '').trim();
    if (!line) continue;
    if (/^[\s\-=|+]+$/.test(line)) continue; // divider row
    grid.push(splitLineSmart(line));
  }
  // If most rows share the same length under single-space split, retry with single-space split for rows that came in shorter
  return grid;
}

/** Trim empty leading/trailing columns and rows. */
function trimGrid(grid: string[][]): string[][] {
  if (grid.length === 0) return grid;
  const width = Math.max(...grid.map(r => r.length));
  const normalized = grid.map(r => {
    const copy = [...r];
    while (copy.length < width) copy.push('');
    return copy;
  });
  // Drop columns that are empty across every row
  const keep: number[] = [];
  for (let c = 0; c < width; c++) {
    if (normalized.some(r => (r[c] ?? '').trim() !== '')) keep.push(c);
  }
  return normalized.map(r => keep.map(c => (r[c] ?? '').trim()));
}

/**
 * Locate the table region within a grid and return headers + data rows.
 * Strategy:
 *  1. Find the first row that looks like a header (mostly non-numeric, ≥2 non-empty cells)
 *     AND is followed by at least one row with ≥2 numeric cells.
 *  2. Data rows = all subsequent rows that have ≥1 numeric cell and a non-empty first non-numeric cell.
 */
export function detectTableFromGrid(rawGrid: string[][]): DetectedTable | null {
  const grid = trimGrid(rawGrid);
  if (grid.length < 2) return null;

  let headerIdx = -1;
  for (let i = 0; i < grid.length - 1; i++) {
    const row = grid[i];
    const nonEmpty = row.filter(c => c !== '');
    if (nonEmpty.length < 2) continue;
    const numericInHeader = nonEmpty.filter(isNumericCell).length;
    // Header is mostly non-numeric
    if (numericInHeader / nonEmpty.length > 0.4) continue;

    // Next row(s) should have numeric cells
    const next = grid[i + 1];
    const nextNumeric = next.filter(isNumericCell).length;
    if (nextNumeric >= 2) {
      headerIdx = i;
      break;
    }
  }

  if (headerIdx === -1) return null;

  const headers = grid[headerIdx];
  const dataRows: string[][] = [];
  for (let i = headerIdx + 1; i < grid.length; i++) {
    const row = grid[i];
    // Stop if we hit a row that looks like a new header (mostly text, no numbers) after data started
    const numericCount = row.filter(isNumericCell).length;
    const nonEmpty = row.filter(c => c !== '').length;
    if (nonEmpty === 0) continue;
    if (numericCount === 0 && dataRows.length > 0) break;
    if (numericCount === 0) continue;
    dataRows.push(row);
  }

  if (dataRows.length === 0) return null;

  // Determine name column: prefer header match; otherwise the column with mostly text cells across data rows.
  let nameIndex = headers.findIndex(h => NAME_HEADER_ALIASES.includes(h.toLowerCase().trim()));
  if (nameIndex === -1) {
    let bestCol = -1;
    let bestScore = -1;
    for (let c = 0; c < headers.length; c++) {
      let textCount = 0;
      let filled = 0;
      for (const row of dataRows) {
        const v = row[c] || '';
        if (v === '') continue;
        filled++;
        if (!isNumericCell(v)) textCount++;
      }
      const score = filled === 0 ? 0 : textCount / filled;
      if (score > bestScore && score > 0.5) {
        bestScore = score;
        bestCol = c;
      }
    }
    nameIndex = bestCol === -1 ? 0 : bestCol;
  }

  // Points / metadata column detection
  const pointsIndex = headers.findIndex(h => POINTS_HEADER_ALIASES.includes(normalizeHeader(h)));
  let pointsFilled = false;
  if (pointsIndex !== -1) {
    const filledCount = dataRows.filter(r => isNumericCell((r[pointsIndex] || '').trim())).length;
    pointsFilled = filledCount > 0 && filledCount / dataRows.length >= 0.5;
  }

  // Subject columns: any non-name, non-metadata column where ≥50% of data cells are numeric.
  const subjectIndices: number[] = [];
  for (let c = 0; c < headers.length; c++) {
    if (c === nameIndex) continue;
    if (!headers[c]) continue;
    if (META_HEADER_ALIASES.includes(normalizeHeader(headers[c]))) continue;
    let filled = 0;
    let numeric = 0;
    for (const row of dataRows) {
      const v = row[c] || '';
      if (v === '') continue;
      filled++;
      if (isNumericCell(v)) numeric++;
    }
    if (filled > 0 && numeric / filled >= 0.5) subjectIndices.push(c);
  }

  if (subjectIndices.length === 0) return null;

  return { headers, rows: dataRows, nameIndex, subjectIndices, pointsIndex, pointsFilled };
}

/** Detect a table from a plain-text paste. */
export function detectTableFromText(text: string): DetectedTable | null {
  const grid = linesToGrid(text);
  return detectTableFromGrid(grid);
}

/** True when the source table already has a filled-in points/aggregate column. */
export function gridHasFilledPoints(grid: string[][]): boolean {
  return detectTableFromGrid(grid)?.pointsFilled ?? false;
}

export function textHasFilledPoints(text: string): boolean {
  return detectTableFromText(text)?.pointsFilled ?? false;
}

export function csvHasFilledPoints(text: string): boolean {
  const grid = text
    .split(/\r?\n/)
    .filter(l => l.trim())
    .map(l => l.split(',').map(v => v.trim().replace(/^["']|["']$/g, '')));
  return gridHasFilledPoints(grid);
}

/** Convert a DetectedTable to a generic { name, subjects, subjectNames } list. */
export function detectedTableToStudents(
  table: DetectedTable
): { name: string; subjects: Record<string, number>; subjectNames: string[] }[] {
  const subjectNames = table.subjectIndices.map(i => table.headers[i].trim()).filter(Boolean);
  const students: { name: string; subjects: Record<string, number>; subjectNames: string[] }[] = [];
  for (const row of table.rows) {
    const name = (row[table.nameIndex] || '').trim();
    if (!name || isNumericCell(name)) continue;
    const subjects: Record<string, number> = {};
    table.subjectIndices.forEach((colIdx, i) => {
      const raw = row[colIdx] || '';
      const v = parseFloat(raw);
      subjects[subjectNames[i]] = isNaN(v) ? 0 : v;
    });
    students.push({ name, subjects, subjectNames });
  }
  return students;
}

/** Extract grids from any <table> elements in an HTML string. */
export function htmlTablesToGrids(html: string): string[][][] {
  if (typeof document === 'undefined') return [];
  const container = document.createElement('div');
  container.innerHTML = html;
  const tables = Array.from(container.querySelectorAll('table'));
  const grids: string[][][] = [];
  for (const tbl of tables) {
    const rows = Array.from(tbl.querySelectorAll('tr'));
    const grid: string[][] = [];
    for (const tr of rows) {
      const cells = Array.from(tr.querySelectorAll('th,td')).map(c => (c.textContent || '').trim());
      if (cells.length) grid.push(cells);
    }
    if (grid.length) grids.push(grid);
  }
  return grids;
}