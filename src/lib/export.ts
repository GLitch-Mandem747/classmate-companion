import { StudentResult, GRADE_SCALE, getGrade, SUBJECT_LABELS, getAllSubjectEntries } from './grading';
import { JuniorStudentResult } from './juniorGrading';

let cachedLogoDataUri: string | null = null;
async function getLogoDataUri(): Promise<string> {
  if (cachedLogoDataUri) return cachedLogoDataUri;
  try {
    const response = await fetch('/images/school-logo.png');
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => { cachedLogoDataUri = reader.result as string; resolve(cachedLogoDataUri); };
      reader.readAsDataURL(blob);
    });
  } catch { return ''; }
}

function getLogoUrl(): string { return '/images/school-logo.png'; }

const REPORT_PAGE_CSS = `
  @page { size: A4 portrait; margin: 10mm 12mm; }
  html, body { margin: 0; padding: 0; font-family: 'Times New Roman', Times, serif; background: #fff; color: #000; }
  .report-card {
    width: 100%;
    box-sizing: border-box;
    page-break-inside: avoid;
    break-inside: avoid;
    page-break-after: always;
    break-after: page;
    overflow: hidden;
  }
  .report-card:last-child { page-break-after: auto; break-after: auto; }
  table { border-collapse: collapse; }
  @media print {
    html, body { width: 210mm; }
    .report-card { page-break-inside: avoid; break-inside: avoid; }
  }
`;

/**
 * Open a printable window with the report cards and trigger the print dialog,
 * where the user chooses "Save as PDF". Guarantees one report card per page.
 */
function printReportCards(content: string, title: string): void {
  const fullHTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>${REPORT_PAGE_CSS}</style></head><body>${content}</body></html>`;
  const win = window.open('', '_blank');
  if (!win) {
    // Popup blocked - fall back to an iframe print.
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument!;
    doc.open();
    doc.write(fullHTML);
    doc.close();
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => iframe.remove(), 60000);
    }, 600);
    return;
  }
  win.document.open();
  win.document.write(fullHTML);
  win.document.close();
  const doPrint = () => {
    win.focus();
    win.print();
  };
  if (win.document.readyState === 'complete') setTimeout(doPrint, 400);
  else win.addEventListener('load', () => setTimeout(doPrint, 400));
}

export interface TestData {
  name: string;
  results: StudentResult[];
}

function getSeniorScore(result: StudentResult | null, key: string): string {
  if (!result) return '';
  if (key === 'science') return String(result.science);
  const val = result.subjects[key];
  return val !== undefined ? String(val) : '';
}

function getSeniorSubjectList(result: StudentResult): { key: string; label: string }[] {
  const subjects: { key: string; label: string }[] = result.subjectNames.map(name => ({
    key: name,
    label: name.toUpperCase(),
  }));
  if (result.hasScience) {
    subjects.push({ key: 'science', label: 'SCIENCE' });
  }
  return subjects;
}

export function exportToExcel(students: StudentResult[], filename: string = 'student_results'): void {
  const subjectNames = students[0]?.subjectNames || [];
  const hasScience = students[0]?.hasScience || false;
  const headers = ['Rank', 'Name', ...subjectNames, ...(hasScience ? ['Science (Avg)'] : []), 'Grade Points'];
  const rows = students.map((s) => [
    s.rank, s.name, ...subjectNames.map(n => s.subjects[n] || 0), ...(hasScience ? [s.science] : []), s.overallGradePoints,
  ]);
  const csvContent = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function exportToWord(students: StudentResult[], schoolName: string = 'School Name'): void {
  const subjectNames = students[0]?.subjectNames || [];
  const hasScience = students[0]?.hasScience || false;
  const htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif}table{border-collapse:collapse;width:100%;margin-bottom:20px}th,td{border:1px solid #333;padding:8px;text-align:center}th{background-color:#1e40af;color:white}.header{text-align:center;margin-bottom:30px}.rank{font-weight:bold}</style></head><body>
  <div class="header"><h1>${schoolName}</h1><h2>Student Results Report</h2><p>Generated on: ${new Date().toLocaleDateString()}</p></div>
  <table><thead><tr><th>Rank</th><th>Name</th>${subjectNames.map(n => `<th>${n}</th>`).join('')}${hasScience ? '<th>Sci</th>' : ''}<th>Grade Pts</th></tr></thead>
  <tbody>${students.map(s => `<tr><td class="rank">${s.rank}</td><td>${s.name}</td>${subjectNames.map(n => `<td>${s.subjects[n] || 0}</td>`).join('')}${hasScience ? `<td>${s.science}</td>` : ''}<td>${s.overallGradePoints}</td></tr>`).join('')}</tbody></table>
  </body></html>`;
  const blob = new Blob([htmlContent], { type: 'application/msword' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'student_results.doc';
  link.click();
  URL.revokeObjectURL(link.href);
}

interface StudentTestScores {
  name: string;
  test1: StudentResult | null;
  test2: StudentResult | null;
  test3: StudentResult | null;
}

function calculateFinalRank(students: StudentTestScores[]): Map<string, number> {
  const rankMap = new Map<string, number>();
  const sorted = [...students].sort((a, b) => {
    const aFinal = a.test3 || a.test2 || a.test1;
    const bFinal = b.test3 || b.test2 || b.test1;
    return (aFinal?.overallGradePoints || 99) - (bFinal?.overallGradePoints || 99);
  });
  sorted.forEach((student, index) => { rankMap.set(student.name, index + 1); });
  return rankMap;
}

function generateReportCardHTML(
  student: StudentTestScores, schoolName: string, term: string, className: string,
  teacherName: string, rank: number, totalStudents: number, remark?: string,
  logoUri?: string, mandatorySubjects: string[] = []
): string {
  const finalTest = student.test3 || student.test2 || student.test1;
  const gradePoints = finalTest ? finalTest.overallGradePoints : 0;
  const subjectList = finalTest ? getSeniorSubjectList(finalTest) : [];

  let pointsLabel: string;
  if (mandatorySubjects.length > 0) {
    const mandatoryNames = mandatorySubjects.map(k => (SUBJECT_LABELS[k] || k).toUpperCase()).join(', ');
    pointsLabel = `POINTS IN BEST SIX INCLUDING ${mandatoryNames}`;
  } else {
    pointsLabel = 'POINTS IN BEST SIX';
  }

  const subjectRowsHTML = subjectList.map(s =>
    `<tr>
      <td style="border: 1px solid #000; padding: 5px 8px; font-weight: bold;">${s.label}</td>
      <td style="border: 1px solid #000; padding: 5px 8px; text-align: center;">${getSeniorScore(student.test1, s.key)}</td>
      <td style="border: 1px solid #000; padding: 5px 8px; text-align: center;">${getSeniorScore(student.test2, s.key)}</td>
      <td style="border: 1px solid #000; padding: 5px 8px; text-align: center;">${getSeniorScore(student.test3, s.key)}</td>
    </tr>`
  ).join('');

  return `
    <div class="report-card" style="page-break-after: always; page-break-inside: avoid; width: 100%; max-width: 200mm; padding: 4mm; margin: 0 auto; font-family: 'Times New Roman', Times, serif; background: white; color: #000; box-sizing: border-box; font-size: 9.5pt; line-height: 1.15;">
      <table style="width: 100%; border: none; border-collapse: collapse; margin-bottom: 4px;">
        <tr>
          <td style="width: 95px; vertical-align: top; border: none; padding: 0;">
            <img src="${logoUri}" alt="School Logo" style="width: 95px; height: 95px;" />
          </td>
          <td style="vertical-align: top; text-align: center; padding-top: 4px; border: none;">
            <h1 style="font-weight: bold; margin: 0 0 3px 0; font-size: 16pt; color: #003399;">ST. DOMINIC'S BOYS SECONDARY SCHOOL</h1>
            <p style="margin: 0 0 1px 0; font-size: 9pt; font-weight: bold;">FRANCISCAN MISSIONARY BROTHERS OF SERVICE (FMBS)</p>
            <p style="margin: 0 0 1px 0; font-size: 9pt; font-weight: bold;">FR. DOMINIC LIM'S MEMORIAL SCHOOL</p>
            <p style="margin: 0 0 1px 0; font-size: 9pt;">P. O. BOX 110214,</p>
            <p style="margin: 0 0 1px 0; font-size: 9pt;">KABISAPI – MUSHINDAMO, ZAMBIA.</p>
          </td>
        </tr>
      </table>
      <p style="text-align: center; font-size: 7.5pt; margin: 0 0 8px 0;">CONTACT: Secretary – 0950 087253, Accountant – 0765 649965, Email: <span style="color: #003399; text-decoration: underline;">stdominicsboys21@gmail.com</span></p>
      <div style="border-top: 2px solid #000; margin-bottom: 8px;"></div>
      <h2 style="font-weight: bold; text-align: center; margin: 0 0 10px 0; font-size: 13pt; text-decoration: underline; letter-spacing: 1px;">SCHOOL REPORT</h2>
      <table style="width: 100%; border: none; border-collapse: collapse; font-size: 9.5pt; margin-bottom: 8px;">
        <tr><td style="width: 33%; padding: 2px 0; border: none;"><span style="font-weight: bold;">STUDENT NAME</span></td><td style="width: 34%; padding: 2px 0; border: none;"><span style="font-weight: bold;">CLASS</span></td><td style="width: 33%; padding: 2px 0; border: none; text-align: right;"><span style="font-weight: bold;">ENTRY RESULTS</span></td></tr>
        <tr><td style="padding: 2px 0; border: none;">${student.name.toUpperCase()}</td><td style="padding: 2px 0; border: none;">${className}</td><td style="padding: 2px 0; border: none; text-align: right;"></td></tr>
      </table>
      <table style="width: 100%; border-collapse: collapse; font-size: 10pt; margin-bottom: 0;">
        <tr><td style="border: 1.5px solid #000; padding: 5px; text-align: center; font-weight: bold;" colspan="4">${term.toUpperCase()}</td></tr>
      </table>
      <table style="width: 100%; border-collapse: collapse; font-size: 10pt;">
        <thead><tr>
          <th style="border: 1.5px solid #000; padding: 5px 8px; text-align: left; font-weight: bold; width: 40%;">SUBJECTS</th>
          <th style="border: 1.5px solid #000; padding: 5px 8px; text-align: center; font-weight: bold; width: 20%;">TEST ONE</th>
          <th style="border: 1.5px solid #000; padding: 5px 8px; text-align: center; font-weight: bold; width: 20%;">TEST TWO</th>
          <th style="border: 1.5px solid #000; padding: 5px 8px; text-align: center; font-weight: bold; width: 20%;">END OF TERM</th>
        </tr></thead>
        <tbody>${subjectRowsHTML}</tbody>
      </table>
      <table style="width: 100%; border-collapse: collapse; font-size: 10pt; margin-top: 10px; margin-bottom: 10px;">
        <tr>
          <td style="border: 1.5px solid #000; padding: 6px 8px; font-weight: bold; width: 60%;">${pointsLabel}: ${gradePoints}</td>
          <td style="border: 1.5px solid #000; padding: 6px 8px; font-weight: bold; width: 40%; text-align: right;">POSITION IN CLASS: ${rank} / ${totalStudents}</td>
        </tr>
      </table>
      <table style="width: 100%; border-collapse: collapse; font-size: 10pt; margin-bottom: 6px; border: 1.5px solid #000;">
        <tr>
          <td style="border-bottom: 1px solid #000; padding: 6px 8px; font-weight: bold; width: 60%;">CLASS TEACHER'S REMARKS</td>
          <td style="border-bottom: 1px solid #000; padding: 6px 8px; font-weight: bold; width: 40%; text-align: right;">${teacherName.toUpperCase()}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 8px; font-size: 10pt; line-height: 1.6; text-align: justify;">${remark || '_______________________________________________________________________________'}</td>
        </tr>
      </table>
      <div style="margin-bottom: 16px;">
        <p style="text-align: center; font-weight: bold; margin: 0 0 6px 0; font-size: 9pt;">Grades are awarded on an 8 point grade scale as follows</p>
        <table style="width: 90%; margin: 0 auto; font-size: 9pt; border-collapse: collapse;">
          <tbody>
            <tr><td style="border: 1px solid #000; padding: 4px 6px; font-weight: bold;">Grade</td><td style="border: 1px solid #000; padding: 4px 6px; text-align: center; font-weight: bold;">1</td><td style="border: 1px solid #000; padding: 4px 6px; text-align: center; font-weight: bold;">2</td><td style="border: 1px solid #000; padding: 4px 6px; text-align: center; font-weight: bold;">3</td><td style="border: 1px solid #000; padding: 4px 6px; text-align: center; font-weight: bold;">4</td><td style="border: 1px solid #000; padding: 4px 6px; text-align: center; font-weight: bold;">5</td><td style="border: 1px solid #000; padding: 4px 6px; text-align: center; font-weight: bold;">6</td><td style="border: 1px solid #000; padding: 4px 6px; text-align: center; font-weight: bold;">7</td><td style="border: 1px solid #000; padding: 4px 6px; text-align: center; font-weight: bold;">8</td></tr>
            <tr><td style="border: 1px solid #000; padding: 4px 6px; font-weight: bold;">Score</td><td style="border: 1px solid #000; padding: 4px 6px; text-align: center;">85-100</td><td style="border: 1px solid #000; padding: 4px 6px; text-align: center;">75-84</td><td style="border: 1px solid #000; padding: 4px 6px; text-align: center;">70-74</td><td style="border: 1px solid #000; padding: 4px 6px; text-align: center;">65-69</td><td style="border: 1px solid #000; padding: 4px 6px; text-align: center;">60-64</td><td style="border: 1px solid #000; padding: 4px 6px; text-align: center;">55-59</td><td style="border: 1px solid #000; padding: 4px 6px; text-align: center;">50-54</td><td style="border: 1px solid #000; padding: 4px 6px; text-align: center;">0-49</td></tr>
            <tr><td style="border: 1px solid #000; padding: 4px 6px; font-weight: bold;">Description</td><td style="border: 1px solid #000; padding: 4px 6px; text-align: center;">Distinction</td><td style="border: 1px solid #000; padding: 4px 6px; text-align: center;">Distinction</td><td style="border: 1px solid #000; padding: 4px 6px; text-align: center;">Distinction</td><td style="border: 1px solid #000; padding: 4px 6px; text-align: center;">Merit</td><td style="border: 1px solid #000; padding: 4px 6px; text-align: center;">Merit</td><td style="border: 1px solid #000; padding: 4px 6px; text-align: center;">Credit</td><td style="border: 1px solid #000; padding: 4px 6px; text-align: center;">Pass</td><td style="border: 1px solid #000; padding: 4px 6px; text-align: center;">Fail</td></tr>
          </tbody>
        </table>
      </div>
      <table style="width: 100%; border: none; border-collapse: collapse; margin-top: 14px; font-size: 9.5pt;">
        <tr>
          <td style="vertical-align: top; border: none; padding: 0;">
            <p style="font-weight: bold; margin: 0 0 4px 0;">PRINCIPAL</p>
            <div style="border-top: 1px solid #000; width: 150px; padding-top: 2px; font-size: 8pt;">Signature</div>
          </td>
          <td style="vertical-align: top; text-align: right; border: none; padding: 0;">
            <p style="font-weight: bold; margin: 0 0 8px 0;">SCHOOL STAMP</p>
            <div style="width: 90px; height: 70px;"></div>
          </td>
        </tr>
      </table>
    </div>`;
}

export async function exportReportCards(
  tests: [TestData | null, TestData | null, TestData | null],
  schoolName: string, term: string, className: string, teacherName: string,
  remarksMap?: Map<string, string>, mandatorySubjects: string[] = []
): Promise<void> {
  const logoUri = await getLogoDataUri();
  const studentMap = new Map<string, StudentTestScores>();
  tests.forEach((test, testIndex) => {
    if (!test) return;
    test.results.forEach((result) => {
      const existing = studentMap.get(result.name) || { name: result.name, test1: null, test2: null, test3: null };
      if (testIndex === 0) existing.test1 = result;
      if (testIndex === 1) existing.test2 = result;
      if (testIndex === 2) existing.test3 = result;
      studentMap.set(result.name, existing);
    });
  });
  const students = Array.from(studentMap.values());
  const totalStudents = students.length;
  const rankMap = calculateFinalRank(students);
  const content = students.map((s) => {
    const remark = remarksMap?.get(s.name);
    return generateReportCardHTML(s, schoolName, term, className, teacherName, rankMap.get(s.name) || 0, totalStudents, remark, logoUri, mandatorySubjects);
  }).join('');
  const fullHTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Report Cards</title><style>@page{size:A4;margin:15mm 18mm;}body{margin:0;padding:0;font-family:'Times New Roman',Times,serif;}@media print{body{margin:0;padding:0}}</style></head><body>${content}</body></html>`;
  const blob = new Blob([fullHTML], { type: 'application/msword' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `report_cards_${term.replace(/\s+/g, '_')}.doc`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function previewSeniorReportCard(
  tests: [TestData | null, TestData | null, TestData | null],
  studentName: string, schoolName: string, term: string, className: string,
  teacherName: string, remarksMap?: Map<string, string>, mandatorySubjects: string[] = []
): string {
  const studentMap = new Map<string, StudentTestScores>();
  tests.forEach((test, testIndex) => {
    if (!test) return;
    test.results.forEach((result) => {
      const existing = studentMap.get(result.name) || { name: result.name, test1: null, test2: null, test3: null };
      if (testIndex === 0) existing.test1 = result;
      if (testIndex === 1) existing.test2 = result;
      if (testIndex === 2) existing.test3 = result;
      studentMap.set(result.name, existing);
    });
  });
  const students = Array.from(studentMap.values());
  const rankMap = calculateFinalRank(students);
  const student = studentMap.get(studentName);
  if (!student) return '<p>Student not found</p>';
  const remark = remarksMap?.get(studentName);
  return generateReportCardHTML(student, schoolName, term, className, teacherName, rankMap.get(studentName) || 0, students.length, remark, getLogoUrl(), mandatorySubjects);
}

// ---- Junior exports ----

interface JuniorStudentTestScores {
  name: string;
  test1: JuniorStudentResult | null;
  test2: JuniorStudentResult | null;
  test3: JuniorStudentResult | null;
}

function calculateJuniorFinalRank(students: JuniorStudentTestScores[]): Map<string, number> {
  const rankMap = new Map<string, number>();
  const sorted = [...students].sort((a, b) => {
    const finalA = a.test3 || a.test2 || a.test1;
    const finalB = b.test3 || b.test2 || b.test1;
    return (finalA?.overallGradePoints || 99) - (finalB?.overallGradePoints || 99);
  });
  sorted.forEach((student, index) => { rankMap.set(student.name, index + 1); });
  return rankMap;
}

function getJuniorScore(result: JuniorStudentResult | null, key: string): string {
  if (!result) return '';
  const val = result.subjects[key];
  return val !== undefined ? String(val) : '';
}

export function exportJuniorToExcel(students: JuniorStudentResult[], filename: string = 'junior_results'): void {
  if (students.length === 0) return;
  const subjectNames = students[0]?.subjectNames || [];
  const headers = ['Rank', 'Name', ...subjectNames, 'Grade Points'];
  const rows = students.map((s) => [s.rank, s.name, ...subjectNames.map(n => s.subjects[n] ?? ''), s.overallGradePoints]);
  const csvContent = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function exportJuniorToWord(students: JuniorStudentResult[], schoolName: string = 'School Name'): void {
  if (students.length === 0) return;
  const subjectNames = students[0]?.subjectNames || [];
  const htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Arial}table{border-collapse:collapse;width:100%;margin-bottom:20px}th,td{border:1px solid #333;padding:8px;text-align:center}th{background-color:#16a34a;color:white}</style></head><body>
  <div style="text-align:center;margin-bottom:30px"><h1>${schoolName}</h1><h2>Junior Results</h2></div>
  <table><thead><tr><th>Rank</th><th>Name</th>${subjectNames.map(s => `<th>${s}</th>`).join('')}<th>Grade Pts</th></tr></thead>
  <tbody>${students.map(s => `<tr><td>${s.rank}</td><td>${s.name}</td>${subjectNames.map(n => `<td>${s.subjects[n] ?? ''}</td>`).join('')}<td>${s.overallGradePoints}</td></tr>`).join('')}</tbody></table>
  </body></html>`;
  const blob = new Blob([htmlContent], { type: 'application/msword' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'junior_student_results.doc';
  link.click();
  URL.revokeObjectURL(link.href);
}

function generateJuniorReportCardHTML(
  student: JuniorStudentTestScores, schoolName: string, term: string, className: string,
  teacherName: string, rank: number, totalStudents: number, remark?: string,
  logoUri?: string, mandatorySubjects: string[] = []
): string {
  const finalTest = student.test3 || student.test2 || student.test1;
  const gradePoints = finalTest ? finalTest.overallGradePoints : 0;
  const subjectNames = finalTest?.subjectNames || student.test2?.subjectNames || student.test1?.subjectNames || [];

  let pointsLabel: string;
  if (mandatorySubjects.length > 0) {
    pointsLabel = `POINTS IN BEST SIX INCLUDING ${mandatorySubjects.map(s => s.toUpperCase()).join(', ')}`;
  } else {
    pointsLabel = 'POINTS IN BEST SIX';
  }

  const subjectRowsHTML = subjectNames.map(name =>
    `<tr><td style="border: 1px solid black; padding: 6px; font-weight: bold;">${name.toUpperCase()}</td>
    <td style="border: 1px solid black; padding: 6px; text-align: center;">${getJuniorScore(student.test1, name)}</td>
    <td style="border: 1px solid black; padding: 6px; text-align: center;">${getJuniorScore(student.test2, name)}</td>
    <td style="border: 1px solid black; padding: 6px; text-align: center;">${getJuniorScore(student.test3, name)}</td></tr>`
  ).join('');

  return `
    <div class="report-card" style="page-break-after: always; page-break-inside: avoid; width: 100%; max-width: 200mm; padding: 4mm; margin: 0 auto; font-family: 'Times New Roman', Times, serif; background: white; color: #000; box-sizing: border-box; font-size: 9.5pt; line-height: 1.15;">
      <table style="width: 100%; border: none; border-collapse: collapse; margin-bottom: 4px;">
        <tr>
          <td style="width: 95px; vertical-align: top; border: none; padding: 0;">
            <img src="${logoUri || ''}" alt="School Logo" style="width: 95px; height: 95px;" />
          </td>
          <td style="vertical-align: top; text-align: center; padding-top: 4px; border: none;">
            <h1 style="font-weight: bold; margin: 0 0 3px 0; font-size: 16pt; color: #003399;">ST. DOMINIC'S BOYS SECONDARY SCHOOL</h1>
            <p style="margin: 0 0 1px 0; font-size: 9pt; font-weight: bold;">FRANCISCAN MISSIONARY BROTHERS OF SERVICE (FMBS)</p>
            <p style="margin: 0 0 1px 0; font-size: 9pt; font-weight: bold;">FR. DOMINIC LIM'S MEMORIAL SCHOOL</p>
            <p style="margin: 0 0 1px 0; font-size: 9pt;">P. O. BOX 110214,</p>
            <p style="margin: 0 0 1px 0; font-size: 9pt;">KABISAPI – MUSHINDAMO, ZAMBIA.</p>
          </td>
        </tr>
      </table>
      <p style="text-align: center; font-size: 7.5pt; margin: 0 0 8px 0;">CONTACT: Secretary – 0950 087253, Accountant – 0765 649965, Email: <span style="color: #003399; text-decoration: underline;">stdominicsboys21@gmail.com</span></p>
      <div style="border-top: 2px solid #000; margin-bottom: 8px;"></div>
      <h2 style="font-weight: bold; text-align: center; margin: 0 0 10px 0; font-size: 13pt; text-decoration: underline; letter-spacing: 1px;">SCHOOL REPORT</h2>
      <table style="width: 100%; border: none; border-collapse: collapse; font-size: 9.5pt; margin-bottom: 8px;">
        <tr><td style="width: 33%; padding: 2px 0; border: none;"><span style="font-weight: bold;">STUDENT NAME</span></td><td style="width: 34%; padding: 2px 0; border: none;"><span style="font-weight: bold;">CLASS</span></td><td style="width: 33%; padding: 2px 0; border: none; text-align: right;"><span style="font-weight: bold;">ENTRY RESULTS</span></td></tr>
        <tr><td style="padding: 2px 0; border: none;">${student.name.toUpperCase()}</td><td style="padding: 2px 0; border: none;">${className}</td><td style="padding: 2px 0; border: none; text-align: right;"></td></tr>
      </table>
      <table style="width: 100%; border-collapse: collapse; font-size: 10pt; margin-bottom: 0;">
        <tr><td style="border: 1.5px solid #000; padding: 5px; text-align: center; font-weight: bold;" colspan="4">${term.toUpperCase()}</td></tr>
      </table>
      <table style="width: 100%; border-collapse: collapse; font-size: 10pt;">
        <thead><tr>
          <th style="border: 1.5px solid #000; padding: 5px 8px; text-align: left; font-weight: bold; width: 40%;">SUBJECTS</th>
          <th style="border: 1.5px solid #000; padding: 5px 8px; text-align: center; font-weight: bold; width: 20%;">TEST ONE</th>
          <th style="border: 1.5px solid #000; padding: 5px 8px; text-align: center; font-weight: bold; width: 20%;">TEST TWO</th>
          <th style="border: 1.5px solid #000; padding: 5px 8px; text-align: center; font-weight: bold; width: 20%;">END OF TERM</th>
        </tr></thead>
        <tbody>${subjectRowsHTML}</tbody>
      </table>
      <table style="width: 100%; border-collapse: collapse; font-size: 10pt; margin-top: 10px; margin-bottom: 10px;">
        <tr>
          <td style="border: 1.5px solid #000; padding: 6px 8px; font-weight: bold; width: 60%;">${pointsLabel}: ${gradePoints}</td>
          <td style="border: 1.5px solid #000; padding: 6px 8px; font-weight: bold; width: 40%; text-align: right;">POSITION IN CLASS: ${rank} / ${totalStudents}</td>
        </tr>
      </table>
      <table style="width: 100%; border-collapse: collapse; font-size: 10pt; margin-bottom: 6px; border: 1.5px solid #000;">
        <tr>
          <td style="border-bottom: 1px solid #000; padding: 6px 8px; font-weight: bold; width: 60%;">CLASS TEACHER'S REMARKS</td>
          <td style="border-bottom: 1px solid #000; padding: 6px 8px; font-weight: bold; width: 40%; text-align: right;">${teacherName.toUpperCase()}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 8px; font-size: 10pt; line-height: 1.6; text-align: justify;">${remark || '_______________________________________________________________________________'}</td>
        </tr>
      </table>
      <div style="margin-bottom: 16px;">
        <p style="text-align: center; font-weight: bold; margin: 0 0 6px 0; font-size: 9pt;">Grades are awarded on an 8 point grade scale as follows</p>
        <table style="width: 90%; margin: 0 auto; font-size: 9pt; border-collapse: collapse;">
          <tbody>
            <tr><td style="border: 1px solid #000; padding: 4px 6px; font-weight: bold;">Grade</td><td style="border: 1px solid #000; padding: 4px 6px; text-align: center; font-weight: bold;">1</td><td style="border: 1px solid #000; padding: 4px 6px; text-align: center; font-weight: bold;">2</td><td style="border: 1px solid #000; padding: 4px 6px; text-align: center; font-weight: bold;">3</td><td style="border: 1px solid #000; padding: 4px 6px; text-align: center; font-weight: bold;">4</td><td style="border: 1px solid #000; padding: 4px 6px; text-align: center; font-weight: bold;">5</td><td style="border: 1px solid #000; padding: 4px 6px; text-align: center; font-weight: bold;">6</td><td style="border: 1px solid #000; padding: 4px 6px; text-align: center; font-weight: bold;">7</td><td style="border: 1px solid #000; padding: 4px 6px; text-align: center; font-weight: bold;">8</td></tr>
            <tr><td style="border: 1px solid #000; padding: 4px 6px; font-weight: bold;">Score</td><td style="border: 1px solid #000; padding: 4px 6px; text-align: center;">85-100</td><td style="border: 1px solid #000; padding: 4px 6px; text-align: center;">75-84</td><td style="border: 1px solid #000; padding: 4px 6px; text-align: center;">70-74</td><td style="border: 1px solid #000; padding: 4px 6px; text-align: center;">65-69</td><td style="border: 1px solid #000; padding: 4px 6px; text-align: center;">60-64</td><td style="border: 1px solid #000; padding: 4px 6px; text-align: center;">55-59</td><td style="border: 1px solid #000; padding: 4px 6px; text-align: center;">50-54</td><td style="border: 1px solid #000; padding: 4px 6px; text-align: center;">0-49</td></tr>
            <tr><td style="border: 1px solid #000; padding: 4px 6px; font-weight: bold;">Description</td><td style="border: 1px solid #000; padding: 4px 6px; text-align: center;">Distinction</td><td style="border: 1px solid #000; padding: 4px 6px; text-align: center;">Distinction</td><td style="border: 1px solid #000; padding: 4px 6px; text-align: center;">Distinction</td><td style="border: 1px solid #000; padding: 4px 6px; text-align: center;">Merit</td><td style="border: 1px solid #000; padding: 4px 6px; text-align: center;">Merit</td><td style="border: 1px solid #000; padding: 4px 6px; text-align: center;">Credit</td><td style="border: 1px solid #000; padding: 4px 6px; text-align: center;">Pass</td><td style="border: 1px solid #000; padding: 4px 6px; text-align: center;">Fail</td></tr>
          </tbody>
        </table>
      </div>
      <table style="width: 100%; border: none; border-collapse: collapse; margin-top: 14px; font-size: 9.5pt;">
        <tr>
          <td style="vertical-align: top; border: none; padding: 0;">
            <p style="font-weight: bold; margin: 0 0 4px 0;">PRINCIPAL</p>
            <div style="border-top: 1px solid #000; width: 150px; padding-top: 2px; font-size: 8pt;">Signature</div>
          </td>
          <td style="vertical-align: top; text-align: right; border: none; padding: 0;">
            <p style="font-weight: bold; margin: 0 0 8px 0;">SCHOOL STAMP</p>
            <div style="width: 90px; height: 70px;"></div>
          </td>
        </tr>
      </table>
    </div>`;
}

export function previewJuniorReportCard(
  tests: [{ name: string; results: JuniorStudentResult[] } | null, { name: string; results: JuniorStudentResult[] } | null, { name: string; results: JuniorStudentResult[] } | null],
  studentName: string, schoolName: string, term: string, className: string,
  teacherName: string, remarksMap?: Map<string, string>, mandatorySubjects: string[] = []
): string {
  const studentMap = new Map<string, JuniorStudentTestScores>();
  tests.forEach((test, testIndex) => {
    if (!test) return;
    test.results.forEach((result) => {
      const existing = studentMap.get(result.name) || { name: result.name, test1: null, test2: null, test3: null };
      if (testIndex === 0) existing.test1 = result;
      if (testIndex === 1) existing.test2 = result;
      if (testIndex === 2) existing.test3 = result;
      studentMap.set(result.name, existing);
    });
  });
  const students = Array.from(studentMap.values());
  const rankMap = calculateJuniorFinalRank(students);
  const student = studentMap.get(studentName);
  if (!student) return '<p>Student not found</p>';
  const remark = remarksMap?.get(studentName);
  return generateJuniorReportCardHTML(student, schoolName, term, className, teacherName, rankMap.get(studentName) || 0, students.length, remark, getLogoUrl(), mandatorySubjects);
}

export async function exportJuniorReportCards(
  tests: [{ name: string; results: JuniorStudentResult[] } | null, { name: string; results: JuniorStudentResult[] } | null, { name: string; results: JuniorStudentResult[] } | null],
  schoolName: string, term: string, className: string, teacherName: string,
  remarksMap?: Map<string, string>, mandatorySubjects: string[] = []
): Promise<void> {
  const logoUri = await getLogoDataUri();
  const studentMap = new Map<string, JuniorStudentTestScores>();
  tests.forEach((test, testIndex) => {
    if (!test) return;
    test.results.forEach((result) => {
      const existing = studentMap.get(result.name) || { name: result.name, test1: null, test2: null, test3: null };
      if (testIndex === 0) existing.test1 = result;
      if (testIndex === 1) existing.test2 = result;
      if (testIndex === 2) existing.test3 = result;
      studentMap.set(result.name, existing);
    });
  });
  const students = Array.from(studentMap.values());
  const rankMap = calculateJuniorFinalRank(students);
  const content = students.map((s) => {
    const remark = remarksMap?.get(s.name);
    return generateJuniorReportCardHTML(s, schoolName, term, className, teacherName, rankMap.get(s.name) || 0, students.length, remark, logoUri, mandatorySubjects);
  }).join('');
  const fullHTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Report Cards</title><style>@page{size:A4;margin:15mm 18mm;}body{margin:0;padding:0;font-family:'Times New Roman',Times,serif;}@media print{body{margin:0;padding:0}}</style></head><body>${content}</body></html>`;
  const blob = new Blob([fullHTML], { type: 'application/msword' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `junior_report_cards_${term.replace(/\s+/g, '_')}.doc`;
  link.click();
  URL.revokeObjectURL(link.href);
}
