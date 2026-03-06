import { StudentResult, GRADE_SCALE, getGrade } from './grading';
import { JuniorStudentResult } from './juniorGrading';

// Helper to get the school logo as a base64 data URI for embedded HTML
let cachedLogoDataUri: string | null = null;
async function getLogoDataUri(): Promise<string> {
  if (cachedLogoDataUri) return cachedLogoDataUri;
  try {
    const response = await fetch('/images/school-logo.png');
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        cachedLogoDataUri = reader.result as string;
        resolve(cachedLogoDataUri);
      };
      reader.readAsDataURL(blob);
    });
  } catch {
    return '';
  }
}

function getLogoUrl(): string {
  return '/images/school-logo.png';
}
export interface TestData {
  name: string;
  results: StudentResult[];
}

export function exportToExcel(students: StudentResult[], filename: string = 'student_results'): void {
  // Create CSV content (Excel-compatible) - scores only, no individual grades
  const headers = [
    'Rank',
    'Name',
    'English',
    'Biology',
    'Math',
    'Chemistry',
    'Physics',
    'Science (Avg)',
    'D&T',
    'History',
    'R.E',
    'Civic',
    'Grade Points',
  ];

  const rows = students.map((s) => [
    s.rank,
    s.name,
    s.english,
    s.biology,
    s.math,
    s.chemistry,
    s.physics,
    s.science,
    s.dAndT,
    s.history,
    s.re,
    s.civic,
    s.overallGradePoints,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function exportToWord(students: StudentResult[], schoolName: string = 'School Name'): void {
  // Create HTML content for Word
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
    th, td { border: 1px solid #333; padding: 8px; text-align: center; }
    th { background-color: #1e40af; color: white; }
    .header { text-align: center; margin-bottom: 30px; }
    .rank { font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${schoolName}</h1>
    <h2>Student Results Report</h2>
    <p>Generated on: ${new Date().toLocaleDateString()}</p>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Rank</th>
        <th>Name</th>
        <th>English</th>
        <th>Biology</th>
        <th>Math</th>
        <th>Chemistry</th>
        <th>Physics</th>
        <th>Science</th>
        <th>D&T</th>
        <th>History</th>
        <th>R.E</th>
        <th>Civic</th>
        <th>Grade Pts</th>
      </tr>
    </thead>
    <tbody>
      ${students
        .map(
          (s) => `
        <tr>
          <td class="rank">${s.rank}</td>
          <td>${s.name}</td>
          <td>${s.english}</td>
          <td>${s.biology}</td>
          <td>${s.math}</td>
          <td>${s.chemistry}</td>
          <td>${s.physics}</td>
          <td>${s.science}</td>
          <td>${s.dAndT}</td>
          <td>${s.history}</td>
          <td>${s.re}</td>
          <td>${s.civic}</td>
          <td>${s.overallGradePoints}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>
  
  <h3>Grading Scale Reference</h3>
  <table style="width: auto;">
    <thead>
      <tr>
        <th>Grade</th>
        <th>Score Range</th>
      </tr>
    </thead>
    <tbody>
      ${GRADE_SCALE.map(
        (g) => `
        <tr>
          <td>${g.grade}</td>
          <td>${g.minScore} - ${g.maxScore}</td>
        </tr>
      `
      ).join('')}
    </tbody>
  </table>
</body>
</html>
  `;

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
  remark?: string;
}

function getSubjectScore(result: StudentResult | null, subject: keyof StudentResult): number {
  if (!result) return 0;
  const value = result[subject];
  return typeof value === 'number' ? value : 0;
}

function calculateFinalGradePoints(test1: StudentResult | null, test2: StudentResult | null, test3: StudentResult | null): number {
  // Use test3 (End of Term) for final grade calculation
  const finalTest = test3 || test2 || test1;
  if (!finalTest) return 0;
  return finalTest.overallGradePoints;
}

function calculateFinalRank(students: StudentTestScores[], totalStudents: number): Map<string, number> {
  const rankMap = new Map<string, number>();
  
  // Sort by grade points (lower is better) using test3 results
  const sorted = [...students].sort((a, b) => {
    const aPoints = calculateFinalGradePoints(a.test1, a.test2, a.test3);
    const bPoints = calculateFinalGradePoints(b.test1, b.test2, b.test3);
    return aPoints - bPoints;
  });
  
  sorted.forEach((student, index) => {
    rankMap.set(student.name, index + 1);
  });
  
  return rankMap;
}

export function generateReportCardHTML(
  student: StudentTestScores,
  schoolName: string,
  term: string,
  className: string,
  teacherName: string,
  rank: number,
  totalStudents: number,
  remark?: string,
  logoUri?: string
): string {
  const test1 = student.test1;
  const test2 = student.test2;
  const test3 = student.test3;
  
  // Use the final test (test3) for grade points calculation
  const finalTest = test3 || test2 || test1;
  const gradePoints = finalTest ? finalTest.overallGradePoints : 0;

  const getScore = (test: StudentResult | null, subject: keyof StudentResult): string => {
    if (!test) return '';
    const value = test[subject];
    return typeof value === 'number' ? String(value) : '';
  };

  return `
    <div style="page-break-after: always; width: 210mm; min-height: 297mm; padding: 3rem; font-family: 'Times New Roman', Times, serif; background: white; color: #000; margin: 0 auto; box-sizing: border-box;">
      <!-- Header with Logo -->
      <div style="display: flex; align-items: flex-start; margin-bottom: 0.5rem;">
        <div style="flex-shrink: 0; margin-right: 1rem;">
          <img src="${logoUri}" alt="School Logo" style="width: 90px; height: 90px; object-fit: contain;" />
        </div>
        <div style="flex: 1; text-align: center;">
          <h1 style="font-weight: bold; margin: 0 0 2px 0; font-size: 16pt; letter-spacing: 0.5px; color: #003366;">
            ST. DOMINIC'S BOYS SECONDARY SCHOOL
          </h1>
          <h2 style="font-weight: bold; margin: 0 0 2px 0; font-size: 10pt; letter-spacing: 0.3px; color: #000;">
            FRANCISCAN MISSIONARY BROTHERS OF SERVICE (FMBS)
          </h2>
          <h3 style="font-weight: bold; margin: 0 0 4px 0; font-size: 10pt; letter-spacing: 0.3px; color: #000;">
            FR. DOMINIC LIM'S MEMORIAL SCHOOL
          </h3>
          <p style="margin: 0 0 2px 0; font-size: 9pt; color: #000;">P. O. BOX 110214,</p>
          <p style="margin: 0 0 4px 0; font-size: 9pt; color: #000;">KABISAPI – MUSHINDAMO, ZAMBIA.</p>
          <p style="font-size: 8pt; line-height: 1.2; color: #000; margin: 0;">
            CONTACT: Secretary – 0950 087253, Accountant – 0765 649965, Email: stdominicsboys21@gmail.com
          </p>
        </div>
      </div>

      <!-- Horizontal Line -->
      <div style="border-top: 2px solid black; margin-bottom: 0.75rem;"></div>

      <!-- Report Title -->
      <h2 style="font-weight: bold; text-align: center; margin-bottom: 1rem; font-size: 14pt; letter-spacing: 1px; color: #000;">
        SCHOOL REPORT
      </h2>

      <!-- Student Info Grid -->
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0; margin-bottom: 0.75rem; font-size: 9pt; color: #000;">
        <div style="padding-right: 0.5rem;">
          <span style="font-weight: bold; display: block; margin-bottom: 2px;">STUDENT NAME</span>
          <p style="margin: 0;">${student.name.toUpperCase()}</p>
        </div>
        <div style="padding: 0 0.5rem;">
          <span style="font-weight: bold; display: block; margin-bottom: 2px;">CLASS</span>
          <p style="margin: 0;">${className}</p>
        </div>
        <div style="padding-left: 0.5rem;">
          <span style="font-weight: bold; display: block; margin-bottom: 2px;">ENTRY RESULTS</span>
          <p style="margin: 0;"></p>
        </div>
      </div>

      <!-- Term -->
      <div style="text-align: center; font-weight: bold; margin-bottom: 0.75rem; font-size: 10pt; letter-spacing: 0.5px; color: #000;">
        ${term.toUpperCase()}
      </div>

      <!-- Subjects Table -->
      <table style="width: 100%; margin-bottom: 0.75rem; font-size: 9pt; border-collapse: collapse; color: #000;">
        <thead>
          <tr>
            <th style="border: 2px solid black; padding: 6px; text-align: left; font-weight: bold; background: white; width: 50%;">
              SUBJECTS
            </th>
            <th style="border: 2px solid black; padding: 6px; text-align: center; font-weight: bold; background: white; width: 16.66%;">
              TEST ONE
            </th>
            <th style="border: 2px solid black; padding: 6px; text-align: center; font-weight: bold; background: white; width: 16.66%;">
              TEST TWO
            </th>
            <th style="border: 2px solid black; padding: 6px; text-align: center; font-weight: bold; background: white; width: 16.66%;">
              END OF TERM
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid black; padding: 6px; font-weight: bold;">ENGLISH</td>
            <td style="border: 1px solid black; padding: 6px; text-align: center;">${getScore(test1, 'english')}</td>
            <td style="border: 1px solid black; padding: 6px; text-align: center;">${getScore(test2, 'english')}</td>
            <td style="border: 1px solid black; padding: 6px; text-align: center;">${getScore(test3, 'english')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid black; padding: 6px; font-weight: bold;">MATHEMATICS</td>
            <td style="border: 1px solid black; padding: 6px; text-align: center;">${getScore(test1, 'math')}</td>
            <td style="border: 1px solid black; padding: 6px; text-align: center;">${getScore(test2, 'math')}</td>
            <td style="border: 1px solid black; padding: 6px; text-align: center;">${getScore(test3, 'math')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid black; padding: 6px; font-weight: bold;">BIOLOGY</td>
            <td style="border: 1px solid black; padding: 6px; text-align: center;">${getScore(test1, 'biology')}</td>
            <td style="border: 1px solid black; padding: 6px; text-align: center;">${getScore(test2, 'biology')}</td>
            <td style="border: 1px solid black; padding: 6px; text-align: center;">${getScore(test3, 'biology')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid black; padding: 6px; font-weight: bold;">SCIENCE</td>
            <td style="border: 1px solid black; padding: 6px; text-align: center;">${getScore(test1, 'science')}</td>
            <td style="border: 1px solid black; padding: 6px; text-align: center;">${getScore(test2, 'science')}</td>
            <td style="border: 1px solid black; padding: 6px; text-align: center;">${getScore(test3, 'science')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid black; padding: 6px; font-weight: bold;">CIVIC EDUCATION</td>
            <td style="border: 1px solid black; padding: 6px; text-align: center;">${getScore(test1, 'civic')}</td>
            <td style="border: 1px solid black; padding: 6px; text-align: center;">${getScore(test2, 'civic')}</td>
            <td style="border: 1px solid black; padding: 6px; text-align: center;">${getScore(test3, 'civic')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid black; padding: 6px; font-weight: bold;">RELIGIOUS EDUCATION</td>
            <td style="border: 1px solid black; padding: 6px; text-align: center;">${getScore(test1, 're')}</td>
            <td style="border: 1px solid black; padding: 6px; text-align: center;">${getScore(test2, 're')}</td>
            <td style="border: 1px solid black; padding: 6px; text-align: center;">${getScore(test3, 're')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid black; padding: 6px; font-weight: bold;">HISTORY</td>
            <td style="border: 1px solid black; padding: 6px; text-align: center;">${getScore(test1, 'history')}</td>
            <td style="border: 1px solid black; padding: 6px; text-align: center;">${getScore(test2, 'history')}</td>
            <td style="border: 1px solid black; padding: 6px; text-align: center;">${getScore(test3, 'history')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid black; padding: 6px; font-weight: bold;">DESIGN & TECHNOLOGY</td>
            <td style="border: 1px solid black; padding: 6px; text-align: center;">${getScore(test1, 'dAndT')}</td>
            <td style="border: 1px solid black; padding: 6px; text-align: center;">${getScore(test2, 'dAndT')}</td>
            <td style="border: 1px solid black; padding: 6px; text-align: center;">${getScore(test3, 'dAndT')}</td>
          </tr>
        </tbody>
      </table>

      <!-- Performance Summary -->
      <div style="margin-bottom: 0.75rem; font-size: 9pt; line-height: 1.6; color: #000;">
        <p style="font-weight: bold; margin: 0 0 4px 0;">
          POINTS IN BEST SIX INCLUDING ENGLISH, MATHEMATICS AND BIOLOGY/SCIENCE: ${gradePoints}
        </p>
        <p style="font-weight: bold; margin: 0;">
          POSITION IN CLASS: ${rank} / ${totalStudents}
        </p>
      </div>

      <!-- Teacher's Remarks -->
      <div style="margin-bottom: 1rem; font-size: 9pt; color: #000;">
        <p style="font-weight: bold; margin: 0 0 4px 0;">CLASS TEACHER'S REMARKS ${teacherName.toUpperCase()}</p>
        <p style="margin: 0; line-height: 1.5; text-align: justify;">
          ${remark || student.remark || '_______________________________________________________________________________'}
        </p>
      </div>

      <!-- Grading Scale -->
      <div style="margin-bottom: 1.5rem;">
        <p style="font-weight: bold; margin-bottom: 0.5rem; font-size: 9pt; color: #000;">
          Grades are awarded on an 8 point grade scale as follows
        </p>
        <table style="width: 100%; font-size: 8pt; border-collapse: collapse; color: #000;">
          <tbody>
            <tr>
              <td style="border: 1px solid black; padding: 4px; font-weight: bold; width: 10%;">Grade</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">1</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">2</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">3</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">4</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">5</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">6</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">7</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">9</td>
            </tr>
            <tr>
              <td style="border: 1px solid black; padding: 4px; font-weight: bold;">Score</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">85-100</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">75-84</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">70-74</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">65-69</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">60-64</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">55-59</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">50-54</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">0-49</td>
            </tr>
            <tr>
              <td style="border: 1px solid black; padding: 4px; font-weight: bold;">Description</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">Distinction</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">Distinction</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">Merit</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">Merit</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">Credit</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">Credit</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">Pass</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">Fail</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Footer -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-top: 2rem;">
        <div style="font-size: 9pt; color: #000;">
          <p style="font-weight: bold; margin: 0 0 3rem 0;">PRINCIPAL</p>
          <div style="border-top: 1px solid black; padding-top: 4px; width: 180px;">
            <span style="font-size: 8pt;">Signature</span>
          </div>
        </div>
        <div style="font-size: 9pt; color: #000;">
          <p style="font-weight: bold; margin: 0 0 0.5rem 0;">SCHOOL STAMP</p>
          <div style="border: 2px solid black; width: 120px; height: 120px;"></div>
        </div>
      </div>
    </div>
  `;
}

export async function exportReportCards(
  tests: [TestData | null, TestData | null, TestData | null],
  schoolName: string,
  term: string,
  className: string,
  teacherName: string,
  remarksMap?: Map<string, string>
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
  const rankMap = calculateFinalRank(students, totalStudents);
  
  const content = students
    .map((s) => {
      const remark = remarksMap?.get(s.name);
      return generateReportCardHTML(s, schoolName, term, className, teacherName, rankMap.get(s.name) || 0, totalStudents, remark, logoUri);
    })
    .join('');
  
  const fullHTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Report Cards - ${schoolName}</title><style>@media print { body { margin: 0; padding: 0; } }</style></head><body>${content}</body></html>`;
  
  const blob = new Blob([fullHTML], { type: 'application/msword' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `report_cards_${term.replace(/\s+/g, '_')}.doc`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// Preview functions - generate HTML for a single student
export function previewSeniorReportCard(
  tests: [TestData | null, TestData | null, TestData | null],
  studentName: string,
  schoolName: string,
  term: string,
  className: string,
  teacherName: string,
  remarksMap?: Map<string, string>
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
  const totalStudents = students.length;
  const rankMap = calculateFinalRank(students, totalStudents);
  const student = studentMap.get(studentName);
  if (!student) return '<p>Student not found</p>';
  const remark = remarksMap?.get(studentName);
  return generateReportCardHTML(student, schoolName, term, className, teacherName, rankMap.get(studentName) || 0, totalStudents, remark);
}

export function previewJuniorReportCard(
  tests: [{ name: string; results: JuniorStudentResult[] } | null, { name: string; results: JuniorStudentResult[] } | null, { name: string; results: JuniorStudentResult[] } | null],
  studentName: string,
  schoolName: string,
  term: string,
  className: string,
  teacherName: string,
  remarksMap?: Map<string, string>
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
  const totalStudents = students.length;
  const rankMap = calculateJuniorFinalRank(students);
  const student = studentMap.get(studentName);
  if (!student) return '<p>Student not found</p>';
  const remark = remarksMap?.get(studentName);
  return generateJuniorReportCardHTML(student, schoolName, term, className, teacherName, rankMap.get(studentName) || 0, totalStudents, remark);
}

// Junior Export Functions

export function exportJuniorToExcel(students: JuniorStudentResult[], filename: string = 'junior_results'): void {
  if (students.length === 0) return;

  // Get all optional subject names from first student (they all have the same ordered list)
  const optionalSubjectNames = students[0]?.optionalSubjectNames || [];

  // Headers: scores only, no individual grades
  const headers = [
    'Rank',
    'Name',
    'English',
    'Math',
    ...optionalSubjectNames.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
    'Grade Points',
  ];

  const rows = students.map((s) => [
    s.rank,
    s.name,
    s.english,
    s.math,
    ...optionalSubjectNames.map(subj => s.optionalSubjects[subj] ?? ''),
    s.overallGradePoints,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function exportJuniorToWord(students: JuniorStudentResult[], schoolName: string = 'School Name'): void {
  if (students.length === 0) return;

  const optionalSubjectNames = students[0]?.optionalSubjectNames || [];

  // Export with scores only, no individual grades
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
    th, td { border: 1px solid #333; padding: 8px; text-align: center; }
    th { background-color: #16a34a; color: white; }
    .header { text-align: center; margin-bottom: 30px; }
    .rank { font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${schoolName}</h1>
    <h2>Junior Student Results Report</h2>
    <p>Generated on: ${new Date().toLocaleDateString()}</p>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Rank</th>
        <th>Name</th>
        <th>Eng</th>
        <th>Math</th>
        ${optionalSubjectNames.map(s => `<th>${s.charAt(0).toUpperCase() + s.slice(1)}</th>`).join('')}
        <th>Grade Pts</th>
      </tr>
    </thead>
    <tbody>
      ${students
        .map(
          (s) => `
        <tr>
          <td class="rank">${s.rank}</td>
          <td>${s.name}</td>
          <td>${s.english}</td>
          <td>${s.math}</td>
          ${optionalSubjectNames.map(subj => {
            const score = s.optionalSubjects[subj] ?? '';
            return `<td>${score}</td>`;
          }).join('')}
          <td>${s.overallGradePoints}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>
  
  <h3>Grading Scale Reference</h3>
  <table style="width: auto;">
    <thead>
      <tr>
        <th>Grade</th>
        <th>Score Range</th>
      </tr>
    </thead>
    <tbody>
      ${GRADE_SCALE.map(
        (g) => `
        <tr>
          <td>${g.grade}</td>
          <td>${g.minScore} - ${g.maxScore}</td>
        </tr>
      `
      ).join('')}
    </tbody>
  </table>
</body>
</html>
  `;

  const blob = new Blob([htmlContent], { type: 'application/msword' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'junior_student_results.doc';
  link.click();
  URL.revokeObjectURL(link.href);
}

// Junior Report Card Generation

interface JuniorTestData {
  name: string;
  results: JuniorStudentResult[];
}

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
  sorted.forEach((student, index) => {
    rankMap.set(student.name, index + 1);
  });
  return rankMap;
}

function generateJuniorReportCardHTML(
  student: JuniorStudentTestScores,
  schoolName: string,
  term: string,
  className: string,
  teacherName: string,
  rank: number,
  totalStudents: number,
  remark?: string
): string {
  const test1 = student.test1;
  const test2 = student.test2;
  const test3 = student.test3;
  const finalTest = test3 || test2 || test1;
  const gradePoints = finalTest ? finalTest.overallGradePoints : 0;
  const optionalSubjectNames = finalTest?.optionalSubjectNames || test2?.optionalSubjectNames || test1?.optionalSubjectNames || [];

  const getScore = (test: JuniorStudentResult | null, subject: string): string => {
    if (!test) return '';
    if (subject === 'english') return String(test.english);
    if (subject === 'math') return String(test.math);
    const val = test.optionalSubjects[subject] ?? test.optionalSubjects[subject.toLowerCase()];
    return val !== undefined ? String(val) : '';
  };

  const subjectRows = [
    { label: 'ENGLISH', key: 'english' },
    { label: 'MATHEMATICS', key: 'math' },
    ...optionalSubjectNames.map(name => ({
      label: name.toUpperCase(),
      key: name,
    })),
  ];

  const subjectRowsHTML = subjectRows.map(row =>
    '<tr>' +
    '<td style="border: 1px solid black; padding: 6px; font-weight: bold;">' + row.label + '</td>' +
    '<td style="border: 1px solid black; padding: 6px; text-align: center;">' + getScore(test1, row.key) + '</td>' +
    '<td style="border: 1px solid black; padding: 6px; text-align: center;">' + getScore(test2, row.key) + '</td>' +
    '<td style="border: 1px solid black; padding: 6px; text-align: center;">' + getScore(test3, row.key) + '</td>' +
    '</tr>'
  ).join('');

  return `
    <div style="page-break-after: always; width: 210mm; min-height: 297mm; padding: 3rem; font-family: Arial, sans-serif; background: white; color: #000; margin: 0 auto; box-sizing: border-box;">
      <div style="text-align: center; margin-bottom: 1rem;">
        <h1 style="font-weight: bold; margin-bottom: 2px; font-size: 16pt; letter-spacing: 0.5px; color: #000;">
          ${schoolName}
        </h1>
        <h2 style="font-weight: bold; margin-bottom: 2px; font-size: 11pt; letter-spacing: 0.3px; color: #000;">
          FRANCISCAN MISSIONARY BROTHERS OF SERVICE (FMBS)
        </h2>
        <h3 style="font-weight: bold; margin-bottom: 4px; font-size: 11pt; letter-spacing: 0.3px; color: #000;">
          FR. DOMINIC LIM'S MEMORIAL SCHOOL
        </h3>
        <p style="margin-bottom: 2px; font-size: 9pt; color: #000;">P. O. BOX 110214,</p>
        <p style="margin-bottom: 4px; font-size: 9pt; color: #000;">KABISAPI – MUSHINDAMO, ZAMBIA.</p>
        <p style="font-size: 8pt; line-height: 1.2; color: #000;">
          CONTACT: Secretary – 0950 087253, Accountant – 0765 649965, Email: stdominicsboys21@gmail.com
        </p>
      </div>
      <div style="border-top: 2px solid black; margin-bottom: 0.75rem;"></div>
      <h2 style="font-weight: bold; text-align: center; margin-bottom: 1rem; font-size: 14pt; letter-spacing: 1px; color: #000;">SCHOOL REPORT</h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0; margin-bottom: 0.75rem; font-size: 9pt; color: #000;">
        <div style="padding-right: 0.5rem;">
          <span style="font-weight: bold; display: block; margin-bottom: 2px;">STUDENT NAME</span>
          <p style="margin: 0;">${student.name.toUpperCase()}</p>
        </div>
        <div style="padding: 0 0.5rem;">
          <span style="font-weight: bold; display: block; margin-bottom: 2px;">CLASS</span>
          <p style="margin: 0;">${className}</p>
        </div>
        <div style="padding-left: 0.5rem;">
          <span style="font-weight: bold; display: block; margin-bottom: 2px;">ENTRY RESULTS</span>
          <p style="margin: 0;"></p>
        </div>
      </div>
      <div style="text-align: center; font-weight: bold; margin-bottom: 0.75rem; font-size: 10pt; letter-spacing: 0.5px; color: #000;">${term.toUpperCase()}</div>
      <table style="width: 100%; margin-bottom: 0.75rem; font-size: 9pt; border-collapse: collapse; color: #000;">
        <thead>
          <tr>
            <th style="border: 2px solid black; padding: 6px; text-align: left; font-weight: bold; background: white; width: 50%;">SUBJECTS</th>
            <th style="border: 2px solid black; padding: 6px; text-align: center; font-weight: bold; background: white; width: 16.66%;">TEST ONE</th>
            <th style="border: 2px solid black; padding: 6px; text-align: center; font-weight: bold; background: white; width: 16.66%;">TEST TWO</th>
            <th style="border: 2px solid black; padding: 6px; text-align: center; font-weight: bold; background: white; width: 16.66%;">END OF TERM</th>
          </tr>
        </thead>
        <tbody>${subjectRowsHTML}</tbody>
      </table>
      <div style="margin-bottom: 0.75rem; font-size: 9pt; line-height: 1.6; color: #000;">
        <p style="font-weight: bold; margin: 0 0 4px 0;">POINTS IN BEST SIX INCLUDING ENGLISH AND MATHEMATICS: ${gradePoints}</p>
        <p style="font-weight: bold; margin: 0;">POSITION IN CLASS: ${rank} / ${totalStudents}</p>
      </div>
      <div style="margin-bottom: 1rem; font-size: 9pt; color: #000;">
        <p style="font-weight: bold; margin: 0 0 4px 0;">CLASS TEACHER'S REMARKS ${teacherName.toUpperCase()}</p>
        <p style="margin: 0; line-height: 1.5; text-align: justify;">${remark || '_______________________________________________________________________________'}</p>
      </div>
      <div style="margin-bottom: 1.5rem;">
        <p style="font-weight: bold; margin-bottom: 0.5rem; font-size: 9pt; color: #000;">Grades are awarded on a 9 point grade scale as follows</p>
        <table style="width: 100%; font-size: 8pt; border-collapse: collapse; color: #000;">
          <tbody>
            <tr>
              <td style="border: 1px solid black; padding: 4px; font-weight: bold; width: 10%;">Grade</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">1</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">2</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">3</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">4</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">5</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">6</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">7</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">8</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">9</td>
            </tr>
            <tr>
              <td style="border: 1px solid black; padding: 4px; font-weight: bold;">Score</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">85-100</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">75-84</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">70-74</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">65-69</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">60-64</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">55-59</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">50-54</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">40-49</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">0-39</td>
            </tr>
            <tr>
              <td style="border: 1px solid black; padding: 4px; font-weight: bold;">Description</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">Distinction</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">Distinction</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">Merit</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">Merit</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">Credit</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">Credit</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">Pass</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">Pass</td>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">Fail</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-top: 2rem;">
        <div style="font-size: 9pt; color: #000;">
          <p style="font-weight: bold; margin: 0 0 3rem 0;">PRINCIPAL</p>
          <div style="border-top: 1px solid black; padding-top: 4px; width: 180px;"><span style="font-size: 8pt;">Signature</span></div>
        </div>
        <div style="font-size: 9pt; color: #000;">
          <p style="font-weight: bold; margin: 0 0 0.5rem 0;">SCHOOL STAMP</p>
          <div style="border: 2px solid black; width: 120px; height: 120px;"></div>
        </div>
      </div>
    </div>
  `;
}

export function exportJuniorReportCards(
  tests: [{ name: string; results: JuniorStudentResult[] } | null, { name: string; results: JuniorStudentResult[] } | null, { name: string; results: JuniorStudentResult[] } | null],
  schoolName: string,
  term: string,
  className: string,
  teacherName: string,
  remarksMap?: Map<string, string>
): void {
  const studentMap = new Map<string, JuniorStudentTestScores>();
  
  tests.forEach((test, testIndex) => {
    if (!test) return;
    test.results.forEach((result) => {
      const existing = studentMap.get(result.name) || {
        name: result.name,
        test1: null,
        test2: null,
        test3: null,
      };
      if (testIndex === 0) existing.test1 = result;
      if (testIndex === 1) existing.test2 = result;
      if (testIndex === 2) existing.test3 = result;
      studentMap.set(result.name, existing);
    });
  });
  
  const students = Array.from(studentMap.values());
  const totalStudents = students.length;
  const rankMap = calculateJuniorFinalRank(students);
  
  const content = students
    .map((s) => {
      const remark = remarksMap?.get(s.name);
      return generateJuniorReportCardHTML(s, schoolName, term, className, teacherName, rankMap.get(s.name) || 0, totalStudents, remark);
    })
    .join('');
  
  const fullHTML = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Report Cards - ' + schoolName + '</title><style>@media print { body { margin: 0; padding: 0; } }</style></head><body>' + content + '</body></html>';
  
  const blob = new Blob([fullHTML], { type: 'application/msword' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'junior_report_cards_' + term.replace(/\s+/g, '_') + '.doc';
  link.click();
  URL.revokeObjectURL(link.href);
}
