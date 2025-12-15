import { StudentResult, GRADE_SCALE } from './grading';

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
    'Overall Average',
    'Overall Grade',
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
    s.overallAverage,
    s.grades.overall,
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
        <th>Average</th>
        <th>Grade</th>
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
          <td>${s.overallAverage}</td>
          <td>${s.grades.overall}</td>
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
        <th>Points</th>
      </tr>
    </thead>
    <tbody>
      ${GRADE_SCALE.map(
        (g) => `
        <tr>
          <td>${g.grade}</td>
          <td>${g.minScore} - ${g.maxScore}</td>
          <td>${g.points}</td>
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

export function generateReportCardHTML(student: StudentResult, schoolName: string, term: string): string {
  return `
    <div style="page-break-after: always; padding: 40px; font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; background: white; color: black;">
      <div style="text-align: center; border-bottom: 2px solid #1e40af; padding-bottom: 20px; margin-bottom: 20px;">
        <h1 style="margin: 0; color: #1e40af;">${schoolName}</h1>
        <h2 style="margin: 10px 0; font-weight: normal;">Student Report Card</h2>
        <p style="margin: 5px 0;">${term}</p>
      </div>
      
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
        <div>
          <p><strong>Student Name:</strong> ${student.name}</p>
          <p><strong>Class Rank:</strong> ${student.rank} of ${student.rank}</p>
        </div>
        <div>
          <p><strong>Overall Grade:</strong> ${student.grades.overall}</p>
          <p><strong>Average Score:</strong> ${student.overallAverage}%</p>
        </div>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background: #1e40af; color: white;">
            <th style="border: 1px solid #333; padding: 10px; text-align: left;">Subject</th>
            <th style="border: 1px solid #333; padding: 10px; text-align: center;">Score</th>
            <th style="border: 1px solid #333; padding: 10px; text-align: center;">Grade</th>
            <th style="border: 1px solid #333; padding: 10px; text-align: left;">Remarks</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #333; padding: 8px;"><strong>English *</strong></td>
            <td style="border: 1px solid #333; padding: 8px; text-align: center;">${student.english}</td>
            <td style="border: 1px solid #333; padding: 8px; text-align: center;">${student.grades.english}</td>
            <td style="border: 1px solid #333; padding: 8px;">${getRemarks(student.english)}</td>
          </tr>
          <tr style="background: #f3f4f6;">
            <td style="border: 1px solid #333; padding: 8px;"><strong>Mathematics *</strong></td>
            <td style="border: 1px solid #333; padding: 8px; text-align: center;">${student.math}</td>
            <td style="border: 1px solid #333; padding: 8px; text-align: center;">${student.grades.math}</td>
            <td style="border: 1px solid #333; padding: 8px;">${getRemarks(student.math)}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #333; padding: 8px;"><strong>Biology *</strong></td>
            <td style="border: 1px solid #333; padding: 8px; text-align: center;">${student.biology}</td>
            <td style="border: 1px solid #333; padding: 8px; text-align: center;">${student.grades.biology}</td>
            <td style="border: 1px solid #333; padding: 8px;">${getRemarks(student.biology)}</td>
          </tr>
          <tr style="background: #f3f4f6;">
            <td style="border: 1px solid #333; padding: 8px;"><strong>Science (Combined) *</strong></td>
            <td style="border: 1px solid #333; padding: 8px; text-align: center;">${student.science}</td>
            <td style="border: 1px solid #333; padding: 8px; text-align: center;">${student.grades.science}</td>
            <td style="border: 1px solid #333; padding: 8px;">${getRemarks(student.science)}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #333; padding: 8px;">Chemistry</td>
            <td style="border: 1px solid #333; padding: 8px; text-align: center;">${student.chemistry}</td>
            <td style="border: 1px solid #333; padding: 8px; text-align: center;">${student.grades.chemistry}</td>
            <td style="border: 1px solid #333; padding: 8px;">${getRemarks(student.chemistry)}</td>
          </tr>
          <tr style="background: #f3f4f6;">
            <td style="border: 1px solid #333; padding: 8px;">Physics</td>
            <td style="border: 1px solid #333; padding: 8px; text-align: center;">${student.physics}</td>
            <td style="border: 1px solid #333; padding: 8px; text-align: center;">${student.grades.physics}</td>
            <td style="border: 1px solid #333; padding: 8px;">${getRemarks(student.physics)}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #333; padding: 8px;">Design & Technology</td>
            <td style="border: 1px solid #333; padding: 8px; text-align: center;">${student.dAndT}</td>
            <td style="border: 1px solid #333; padding: 8px; text-align: center;">${student.grades.dAndT}</td>
            <td style="border: 1px solid #333; padding: 8px;">${getRemarks(student.dAndT)}</td>
          </tr>
          <tr style="background: #f3f4f6;">
            <td style="border: 1px solid #333; padding: 8px;">History</td>
            <td style="border: 1px solid #333; padding: 8px; text-align: center;">${student.history}</td>
            <td style="border: 1px solid #333; padding: 8px; text-align: center;">${student.grades.history}</td>
            <td style="border: 1px solid #333; padding: 8px;">${getRemarks(student.history)}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #333; padding: 8px;">Religious Education</td>
            <td style="border: 1px solid #333; padding: 8px; text-align: center;">${student.re}</td>
            <td style="border: 1px solid #333; padding: 8px; text-align: center;">${student.grades.re}</td>
            <td style="border: 1px solid #333; padding: 8px;">${getRemarks(student.re)}</td>
          </tr>
          <tr style="background: #f3f4f6;">
            <td style="border: 1px solid #333; padding: 8px;">Civic Education</td>
            <td style="border: 1px solid #333; padding: 8px; text-align: center;">${student.civic}</td>
            <td style="border: 1px solid #333; padding: 8px; text-align: center;">${student.grades.civic}</td>
            <td style="border: 1px solid #333; padding: 8px;">${getRemarks(student.civic)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr style="background: #1e40af; color: white;">
            <td style="border: 1px solid #333; padding: 10px;"><strong>COMPULSORY SUBJECTS AVERAGE</strong></td>
            <td style="border: 1px solid #333; padding: 10px; text-align: center;" colspan="3"><strong>${student.compulsoryAverage}%</strong></td>
          </tr>
          <tr style="background: #1e3a5f; color: white;">
            <td style="border: 1px solid #333; padding: 10px;"><strong>OVERALL AVERAGE</strong></td>
            <td style="border: 1px solid #333; padding: 10px; text-align: center;" colspan="3"><strong>${student.overallAverage}% (${student.grades.overall})</strong></td>
          </tr>
        </tfoot>
      </table>
      
      <p style="font-size: 12px; color: #666;">* Compulsory subjects</p>
      
      <div style="margin-top: 40px; display: flex; justify-content: space-between;">
        <div>
          <p style="border-top: 1px solid #333; padding-top: 5px; width: 200px;">Class Teacher's Signature</p>
        </div>
        <div>
          <p style="border-top: 1px solid #333; padding-top: 5px; width: 200px;">Principal's Signature</p>
        </div>
        <div>
          <p style="border-top: 1px solid #333; padding-top: 5px; width: 150px;">Date</p>
        </div>
      </div>
    </div>
  `;
}

function getRemarks(score: number): string {
  if (score >= 90) return 'Outstanding';
  if (score >= 80) return 'Excellent';
  if (score >= 70) return 'Very Good';
  if (score >= 60) return 'Good';
  if (score >= 50) return 'Satisfactory';
  if (score >= 40) return 'Needs Improvement';
  if (score >= 30) return 'Poor';
  return 'Very Poor';
}

export function exportReportCards(
  students: StudentResult[],
  schoolName: string,
  term: string
): void {
  const content = students.map((s) => generateReportCardHTML(s, schoolName, term)).join('');
  
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
