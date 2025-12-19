import { StudentResult, GRADE_SCALE, getGrade } from './grading';

export interface TestData {
  name: string;
  results: StudentResult[];
}

export function exportToExcel(students: StudentResult[], filename: string = 'student_results'): void {
  // Create CSV content (Excel-compatible)
  const headers = [
    'Rank',
    'Name',
    'English',
    'English Grade',
    'Biology',
    'Biology Grade',
    'Math',
    'Math Grade',
    'Chemistry',
    'Chemistry Grade',
    'Physics',
    'Physics Grade',
    'Science (Avg)',
    'Science Grade',
    'D&T',
    'D&T Grade',
    'History',
    'History Grade',
    'R.E',
    'R.E Grade',
    'Civic',
    'Civic Grade',
    'Compulsory Total',
    'Compulsory Average',
    'Overall Total',
    'Grade Points',
  ];

  const rows = students.map((s) => [
    s.rank,
    s.name,
    s.english,
    s.grades.english,
    s.biology,
    s.grades.biology,
    s.math,
    s.grades.math,
    s.chemistry,
    s.grades.chemistry,
    s.physics,
    s.grades.physics,
    s.science,
    s.grades.science,
    s.dAndT,
    s.grades.dAndT,
    s.history,
    s.grades.history,
    s.re,
    s.grades.re,
    s.civic,
    s.grades.civic,
    s.compulsoryTotal,
    s.compulsoryAverage,
    s.overallTotal,
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
          <td>${s.english} (${s.grades.english})</td>
          <td>${s.biology} (${s.grades.biology})</td>
          <td>${s.math} (${s.grades.math})</td>
          <td>${s.chemistry} (${s.grades.chemistry})</td>
          <td>${s.physics} (${s.grades.physics})</td>
          <td>${s.science} (${s.grades.science})</td>
          <td>${s.dAndT} (${s.grades.dAndT})</td>
          <td>${s.history} (${s.grades.history})</td>
          <td>${s.re} (${s.grades.re})</td>
          <td>${s.civic} (${s.grades.civic})</td>
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
  totalStudents: number
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
    <div style="page-break-after: always; padding: 20px 40px; font-family: 'Times New Roman', Times, serif; max-width: 800px; margin: 0 auto; background: white; color: black;">
      <!-- School Header -->
      <div style="text-align: center; margin-bottom: 10px;">
        <h1 style="margin: 0; font-size: 16px; font-weight: bold; text-decoration: underline;">${schoolName.toUpperCase()}</h1>
        <p style="margin: 3px 0; font-size: 12px; font-weight: bold;">FRANCISCAN MISSIONARY BROTHERS OF SERVICE (FMBS)</p>
        <p style="margin: 3px 0; font-size: 12px; font-weight: bold; text-decoration: underline;">FR. DOMINIC LIM'S MEMORIAL SCHOOL</p>
        <p style="margin: 3px 0; font-size: 10px;">P. O. BOX 110214, KABISAPI – MUSHINDAMO, ZAMBIA.</p>
        <p style="margin: 3px 0; font-size: 9px;">CONTACT: Secretary – 0950 087253, Accountant – 0765 649965, Email: stdominicsboys21@gmail.com</p>
      </div>
      
      <!-- School Report Header -->
      <h2 style="text-align: center; margin: 15px 0 10px 0; font-size: 14px; font-weight: bold; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 6px 0;">SCHOOL REPORT</h2>
      
      <!-- Student Info -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 11px;">
        <tr>
          <td style="border: 1px solid #000; padding: 6px; font-weight: bold; background: #f5f5f5;">STUDENT NAME</td>
          <td style="border: 1px solid #000; padding: 6px; font-weight: bold; background: #f5f5f5;">CLASS</td>
          <td style="border: 1px solid #000; padding: 6px; font-weight: bold; background: #f5f5f5;">ENTRY RESULTS</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 6px;">${student.name.toUpperCase()}</td>
          <td style="border: 1px solid #000; padding: 6px;">${className}</td>
          <td style="border: 1px solid #000; padding: 6px;"></td>
        </tr>
      </table>
      
      <!-- Term Header -->
      <h3 style="text-align: center; margin: 15px 0 10px 0; font-size: 13px; font-weight: bold; text-decoration: underline;">${term.toUpperCase()}</h3>
      
      <!-- Subjects Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 11px;">
        <thead>
          <tr style="background: #f5f5f5;">
            <th style="border: 1px solid #000; padding: 6px; text-align: left; font-weight: bold;">SUBJECTS</th>
            <th style="border: 1px solid #000; padding: 6px; text-align: center; width: 80px; font-weight: bold;">TEST ONE</th>
            <th style="border: 1px solid #000; padding: 6px; text-align: center; width: 80px; font-weight: bold;">TEST TWO</th>
            <th style="border: 1px solid #000; padding: 6px; text-align: center; width: 100px; font-weight: bold;">END OF TERM</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #000; padding: 6px;">ENGLISH</td>
            <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getScore(test1, 'english')}</td>
            <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getScore(test2, 'english')}</td>
            <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getScore(test3, 'english')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 6px;">MATHEMATICS</td>
            <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getScore(test1, 'math')}</td>
            <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getScore(test2, 'math')}</td>
            <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getScore(test3, 'math')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 6px;">BIOLOGY</td>
            <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getScore(test1, 'biology')}</td>
            <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getScore(test2, 'biology')}</td>
            <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getScore(test3, 'biology')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 6px;">SCIENCE</td>
            <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getScore(test1, 'science')}</td>
            <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getScore(test2, 'science')}</td>
            <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getScore(test3, 'science')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 6px;">CIVIC EDUCATION</td>
            <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getScore(test1, 'civic')}</td>
            <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getScore(test2, 'civic')}</td>
            <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getScore(test3, 'civic')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 6px;">RELIGIOUS EDUCATION</td>
            <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getScore(test1, 're')}</td>
            <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getScore(test2, 're')}</td>
            <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getScore(test3, 're')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 6px;">HISTORY</td>
            <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getScore(test1, 'history')}</td>
            <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getScore(test2, 'history')}</td>
            <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getScore(test3, 'history')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 6px;">DESIGN & TECHNOLOGY</td>
            <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getScore(test1, 'dAndT')}</td>
            <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getScore(test2, 'dAndT')}</td>
            <td style="border: 1px solid #000; padding: 6px; text-align: center;">${getScore(test3, 'dAndT')}</td>
          </tr>
        </tbody>
      </table>
      
      <!-- Grade Points and Position -->
      <p style="margin: 8px 0; font-size: 11px;"><strong>POINTS IN BEST SIX INCLUDING ENGLISH AND MATHEMATICS:</strong> ${gradePoints}</p>
      <p style="margin: 8px 0; font-size: 11px;"><strong>POSITION IN CLASS:</strong> ${rank} / ${totalStudents}</p>
      
      <!-- Teacher's Remarks -->
      <div style="margin: 15px 0; border: 1px solid #000; padding: 10px;">
        <h4 style="margin: 0 0 8px 0; font-size: 11px; font-weight: bold; text-decoration: underline;">CLASS TEACHER'S REMARKS</h4>
        <p style="margin: 5px 0; font-size: 11px; font-weight: bold;">${teacherName.toUpperCase()}</p>
        <div style="min-height: 50px; border-bottom: 1px dotted #666; margin-top: 8px;"></div>
      </div>
      
      <!-- Grading Scale -->
      <div style="margin: 15px 0;">
        <p style="font-size: 10px; margin-bottom: 5px; font-weight: bold; text-decoration: underline;">Grades are awarded on an 8 point grade scale as follows</p>
        <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
          <tr>
            <td style="border: 1px solid #000; padding: 3px; text-align: center; font-weight: bold; background: #f5f5f5;">Grade</td>
            <td style="border: 1px solid #000; padding: 3px; text-align: center;">1</td>
            <td style="border: 1px solid #000; padding: 3px; text-align: center;">2</td>
            <td style="border: 1px solid #000; padding: 3px; text-align: center;">3</td>
            <td style="border: 1px solid #000; padding: 3px; text-align: center;">4</td>
            <td style="border: 1px solid #000; padding: 3px; text-align: center;">5</td>
            <td style="border: 1px solid #000; padding: 3px; text-align: center;">6</td>
            <td style="border: 1px solid #000; padding: 3px; text-align: center;">7</td>
            <td style="border: 1px solid #000; padding: 3px; text-align: center;">8</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 3px; text-align: center; font-weight: bold; background: #f5f5f5;">Score</td>
            <td style="border: 1px solid #000; padding: 3px; text-align: center;">85-100</td>
            <td style="border: 1px solid #000; padding: 3px; text-align: center;">75-84</td>
            <td style="border: 1px solid #000; padding: 3px; text-align: center;">70-74</td>
            <td style="border: 1px solid #000; padding: 3px; text-align: center;">65-69</td>
            <td style="border: 1px solid #000; padding: 3px; text-align: center;">60-64</td>
            <td style="border: 1px solid #000; padding: 3px; text-align: center;">55-59</td>
            <td style="border: 1px solid #000; padding: 3px; text-align: center;">50-54</td>
            <td style="border: 1px solid #000; padding: 3px; text-align: center;">0-49</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 3px; text-align: center; font-weight: bold; background: #f5f5f5;">Description</td>
            <td style="border: 1px solid #000; padding: 3px; text-align: center;">Distinction</td>
            <td style="border: 1px solid #000; padding: 3px; text-align: center;">Distinction</td>
            <td style="border: 1px solid #000; padding: 3px; text-align: center;">Merit</td>
            <td style="border: 1px solid #000; padding: 3px; text-align: center;">Merit</td>
            <td style="border: 1px solid #000; padding: 3px; text-align: center;">Credit</td>
            <td style="border: 1px solid #000; padding: 3px; text-align: center;">Credit</td>
            <td style="border: 1px solid #000; padding: 3px; text-align: center;">Pass</td>
            <td style="border: 1px solid #000; padding: 3px; text-align: center;">Fail</td>
          </tr>
        </table>
      </div>
      
      <!-- Signatures -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 30px;">
        <div style="text-align: center;">
          <div style="border-top: 1px solid #000; width: 120px; padding-top: 5px;">
            <p style="margin: 0; font-size: 10px; font-weight: bold;">PRINCIPAL</p>
          </div>
        </div>
        <div style="text-align: center;">
          <div style="border: 2px solid #000; padding: 15px 30px;">
            <p style="margin: 0; font-size: 10px; font-weight: bold;">SCHOOL STAMP</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function exportReportCards(
  tests: [TestData | null, TestData | null, TestData | null],
  schoolName: string,
  term: string,
  className: string,
  teacherName: string
): void {
  // Combine all students from all tests
  const studentMap = new Map<string, StudentTestScores>();
  
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
  const rankMap = calculateFinalRank(students, totalStudents);
  
  const content = students
    .map((s) => generateReportCardHTML(
      s,
      schoolName,
      term,
      className,
      teacherName,
      rankMap.get(s.name) || 0,
      totalStudents
    ))
    .join('');
  
  const fullHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Report Cards - ${schoolName}</title>
  <style>
    @media print {
      body { margin: 0; padding: 0; }
    }
  </style>
</head>
<body>
  ${content}
</body>
</html>
  `;
  
  const blob = new Blob([fullHTML], { type: 'application/msword' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `report_cards_${term.replace(/\s+/g, '_')}.doc`;
  link.click();
  URL.revokeObjectURL(link.href);
}
