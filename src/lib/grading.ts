// 8-point grading scale (A* to U)
export interface GradeScale {
  grade: string;
  minScore: number;
  maxScore: number;
  points: number;
}

export const GRADE_SCALE: GradeScale[] = [
  { grade: 'A*', minScore: 90, maxScore: 100, points: 8 },
  { grade: 'A', minScore: 80, maxScore: 89, points: 7 },
  { grade: 'B', minScore: 70, maxScore: 79, points: 6 },
  { grade: 'C', minScore: 60, maxScore: 69, points: 5 },
  { grade: 'D', minScore: 50, maxScore: 59, points: 4 },
  { grade: 'E', minScore: 40, maxScore: 49, points: 3 },
  { grade: 'F', minScore: 30, maxScore: 39, points: 2 },
  { grade: 'G', minScore: 20, maxScore: 29, points: 1 },
  { grade: 'U', minScore: 0, maxScore: 19, points: 0 },
];

export interface StudentData {
  name: string;
  english: number;
  biology: number;
  math: number;
  chemistry: number;
  physics: number;
  dAndT: number;
  history: number;
  re: number;
  civic: number;
}

export interface StudentResult extends StudentData {
  id: string;
  science: number;
  compulsoryTotal: number;
  compulsoryAverage: number;
  overallTotal: number;
  overallAverage: number;
  rank: number;
  grades: {
    english: string;
    biology: string;
    math: string;
    chemistry: string;
    physics: string;
    science: string;
    dAndT: string;
    history: string;
    re: string;
    civic: string;
    overall: string;
  };
}

export function getGrade(score: number): string {
  const gradeEntry = GRADE_SCALE.find(
    (g) => score >= g.minScore && score <= g.maxScore
  );
  return gradeEntry?.grade || 'U';
}

export function getGradePoints(score: number): number {
  const gradeEntry = GRADE_SCALE.find(
    (g) => score >= g.minScore && score <= g.maxScore
  );
  return gradeEntry?.points || 0;
}

export function getGradeClass(grade: string): string {
  const baseGrade = grade.replace('*', '').toUpperCase();
  switch (baseGrade) {
    case 'A': return 'grade-A';
    case 'B': return 'grade-B';
    case 'C': return 'grade-C';
    case 'D': return 'grade-D';
    case 'E': return 'grade-E';
    case 'F': return 'grade-F';
    case 'G': return 'grade-G';
    default: return 'grade-U';
  }
}

export function calculateStudentResults(students: StudentData[]): StudentResult[] {
  const results: StudentResult[] = students.map((student, index) => {
    // Calculate Science as average of Physics and Chemistry
    const science = (student.physics + student.chemistry) / 2;
    
    // Compulsory subjects: Math, English, Biology, Science
    const compulsoryTotal = student.math + student.english + student.biology + science;
    const compulsoryAverage = compulsoryTotal / 4;
    
    // Overall total (all subjects)
    const allSubjects = [
      student.english,
      student.biology,
      student.math,
      student.chemistry,
      student.physics,
      student.dAndT,
      student.history,
      student.re,
      student.civic,
    ];
    const overallTotal = allSubjects.reduce((sum, score) => sum + score, 0);
    const overallAverage = overallTotal / allSubjects.length;
    
    return {
      ...student,
      id: `student-${index}-${Date.now()}`,
      science: Math.round(science * 10) / 10,
      compulsoryTotal: Math.round(compulsoryTotal * 10) / 10,
      compulsoryAverage: Math.round(compulsoryAverage * 10) / 10,
      overallTotal: Math.round(overallTotal * 10) / 10,
      overallAverage: Math.round(overallAverage * 10) / 10,
      rank: 0,
      grades: {
        english: getGrade(student.english),
        biology: getGrade(student.biology),
        math: getGrade(student.math),
        chemistry: getGrade(student.chemistry),
        physics: getGrade(student.physics),
        science: getGrade(science),
        dAndT: getGrade(student.dAndT),
        history: getGrade(student.history),
        re: getGrade(student.re),
        civic: getGrade(student.civic),
        overall: getGrade(overallAverage),
      },
    };
  });
  
  // Sort by overall average (lowest to highest) and assign ranks
  results.sort((a, b) => a.overallAverage - b.overallAverage);
  results.forEach((result, index) => {
    result.rank = index + 1;
  });
  
  return results;
}

export function parseTableData(text: string): StudentData[] {
  const lines = text.trim().split('\n');
  const students: StudentData[] = [];
  
  for (const line of lines) {
    // Skip header line
    if (line.toLowerCase().includes('name') && line.toLowerCase().includes('english')) {
      continue;
    }
    
    // Parse pipe-separated or tab-separated values
    const parts = line.split(/[|\t]/).map(p => p.trim()).filter(p => p);
    
    if (parts.length >= 10) {
      const [name, english, biology, math, chemistry, physics, dAndT, history, re, civic] = parts;
      
      students.push({
        name: name || 'Unknown',
        english: parseFloat(english) || 0,
        biology: parseFloat(biology) || 0,
        math: parseFloat(math) || 0,
        chemistry: parseFloat(chemistry) || 0,
        physics: parseFloat(physics) || 0,
        dAndT: parseFloat(dAndT) || 0,
        history: parseFloat(history) || 0,
        re: parseFloat(re) || 0,
        civic: parseFloat(civic) || 0,
      });
    }
  }
  
  return students;
}

export function parseCSV(text: string): StudentData[] {
  const lines = text.trim().split('\n');
  const students: StudentData[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip header line
    if (i === 0 && line.toLowerCase().includes('name')) {
      continue;
    }
    
    const parts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
    
    if (parts.length >= 10) {
      const [name, english, biology, math, chemistry, physics, dAndT, history, re, civic] = parts;
      
      students.push({
        name: name || 'Unknown',
        english: parseFloat(english) || 0,
        biology: parseFloat(biology) || 0,
        math: parseFloat(math) || 0,
        chemistry: parseFloat(chemistry) || 0,
        physics: parseFloat(physics) || 0,
        dAndT: parseFloat(dAndT) || 0,
        history: parseFloat(history) || 0,
        re: parseFloat(re) || 0,
        civic: parseFloat(civic) || 0,
      });
    }
  }
  
  return students;
}
