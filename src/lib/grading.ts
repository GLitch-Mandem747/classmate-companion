// 9-point grading scale (1 to 9)
export interface GradeScale {
  grade: string;
  minScore: number;
  maxScore: number;
}

export const GRADE_SCALE: GradeScale[] = [
  { grade: '1', minScore: 85, maxScore: 100 },
  { grade: '2', minScore: 75, maxScore: 84 },
  { grade: '3', minScore: 70, maxScore: 74 },
  { grade: '4', minScore: 65, maxScore: 69 },
  { grade: '5', minScore: 60, maxScore: 64 },
  { grade: '6', minScore: 55, maxScore: 59 },
  { grade: '7', minScore: 50, maxScore: 54 },
  { grade: '9', minScore: 0, maxScore: 49 },
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

export interface SubjectScore {
  subject: string;
  score: number;
  grade: string;
}

export interface StudentResult extends StudentData {
  id: string;
  science: number;
  compulsoryTotal: number;
  compulsoryAverage: number;
  overallTotal: number;
  overallGradePoints: number; // Sum of grade numbers (lower is better)
  bestSixPoints: number; // Sum of best 6 subject grades
  rank: number;
  subjects: SubjectScore[]; // Array of all subjects with scores and grades
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
  };
}

export function getGrade(score: number): string {
  const gradeEntry = GRADE_SCALE.find(
    (g) => score >= g.minScore && score <= g.maxScore
  );
  return gradeEntry?.grade || 'U';
}

export function getGradePoints(score: number): number {
  const grade = getGrade(score);
  // For this scale, lower grade number = better, so invert for points
  return grade === '9' ? 0 : (10 - parseInt(grade));
}

export function getGradeClass(grade: string): string {
  switch (grade) {
    case '1': return 'grade-1';
    case '2': return 'grade-2';
    case '3': return 'grade-3';
    case '4': return 'grade-4';
    case '5': return 'grade-5';
    case '6': return 'grade-6';
    case '7': return 'grade-7';
    default: return 'grade-9';
  }
}

export function calculateStudentResults(students: StudentData[]): StudentResult[] {
  const results: StudentResult[] = students.map((student, index) => {
    // Calculate Science as average of Physics and Chemistry
    const science = (student.physics + student.chemistry) / 2;
    
    // Compulsory subject: English
    const englishGrade = parseInt(getGrade(student.english)) || 9;
    
    // Get grades for all other subjects
    const optionalGrades = [
      { name: 'math', grade: parseInt(getGrade(student.math)) || 9, score: student.math },
      { name: 'biology', grade: parseInt(getGrade(student.biology)) || 9, score: student.biology },
      { name: 'science', grade: parseInt(getGrade(science)) || 9, score: science },
      { name: 'dAndT', grade: parseInt(getGrade(student.dAndT)) || 9, score: student.dAndT },
      { name: 'history', grade: parseInt(getGrade(student.history)) || 9, score: student.history },
      { name: 're', grade: parseInt(getGrade(student.re)) || 9, score: student.re },
      { name: 'civic', grade: parseInt(getGrade(student.civic)) || 9, score: student.civic },
    ];
    
    // Sort by grade ascending (lower grade number = better) and take top 5
    optionalGrades.sort((a, b) => a.grade - b.grade);
    const topFiveOptional = optionalGrades.slice(0, 5);
    const topFiveGradeSum = topFiveOptional.reduce((sum, subj) => sum + subj.grade, 0);
    
    // Overall grade points = English + top 5 optional grades
    // Lower is better (e.g., 6 points = all 1s is excellent)
    const overallGradePoints = englishGrade + topFiveGradeSum;
    
    // Overall total for raw scores (English + top 5 optional by score)
    const optionalScores = [...optionalGrades].sort((a, b) => b.score - a.score);
    const topFiveByScore = optionalScores.slice(0, 5);
    const topFiveScoreTotal = topFiveByScore.reduce((sum, subj) => sum + subj.score, 0);
    const overallTotal = student.english + topFiveScoreTotal;
    
    const compulsoryTotal = student.english;
    const compulsoryAverage = overallTotal / 6; // Average of English + best 5 subjects
    
    // Build subjects array for report generation
    const subjects: SubjectScore[] = [
      { subject: 'English', score: student.english, grade: getGrade(student.english) },
      { subject: 'Mathematics', score: student.math, grade: getGrade(student.math) },
      { subject: 'Biology', score: student.biology, grade: getGrade(student.biology) },
      { subject: 'Science', score: Math.round(science * 10) / 10, grade: getGrade(science) },
      { subject: 'Civic Education', score: student.civic, grade: getGrade(student.civic) },
      { subject: 'Religious Education', score: student.re, grade: getGrade(student.re) },
      { subject: 'History', score: student.history, grade: getGrade(student.history) },
      { subject: 'Design & Technology', score: student.dAndT, grade: getGrade(student.dAndT) },
    ];

    return {
      ...student,
      id: `student-${index}-${Date.now()}`,
      science: Math.round(science * 10) / 10,
      compulsoryTotal: Math.round(compulsoryTotal * 10) / 10,
      compulsoryAverage: Math.round(compulsoryAverage * 10) / 10,
      overallTotal: Math.round(overallTotal * 10) / 10,
      overallGradePoints,
      bestSixPoints: overallGradePoints, // Same as overallGradePoints (best 6)
      rank: 0,
      subjects,
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
      },
    };
  });
  
  // Sort by overall grade points (lowest to highest - lower is better) and assign ranks
  results.sort((a, b) => a.overallGradePoints - b.overallGradePoints);
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
