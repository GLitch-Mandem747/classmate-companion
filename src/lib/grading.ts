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

// All subject keys used in the senior system
export const SENIOR_SUBJECT_KEYS = ['english', 'biology', 'math', 'chemistry', 'physics', 'dAndT', 'history', 're', 'civic'] as const;
export type SeniorSubjectKey = typeof SENIOR_SUBJECT_KEYS[number];

export const SUBJECT_LABELS: Record<string, string> = {
  english: 'English',
  biology: 'Biology',
  math: 'Math',
  chemistry: 'Chemistry',
  physics: 'Physics',
  science: 'Science',
  dAndT: 'D&T',
  history: 'History',
  re: 'R.E',
  civic: 'Civic',
};

// Map header text variations to subject keys
const HEADER_MAP: Record<string, SeniorSubjectKey> = {
  'english': 'english',
  'eng': 'english',
  'biology': 'biology',
  'bio': 'biology',
  'math': 'math',
  'maths': 'math',
  'mathematics': 'math',
  'chemistry': 'chemistry',
  'chem': 'chemistry',
  'physics': 'physics',
  'phys': 'physics',
  'd and t': 'dAndT',
  'd&t': 'dAndT',
  'dandt': 'dAndT',
  'design and technology': 'dAndT',
  'design & technology': 'dAndT',
  'dt': 'dAndT',
  'history': 'history',
  'hist': 'history',
  'r.e': 're',
  're': 're',
  'religious education': 're',
  'civic': 'civic',
  'civic education': 'civic',
};

export function matchHeaderToSubject(header: string): SeniorSubjectKey | null {
  const normalized = header.trim().toLowerCase();
  return HEADER_MAP[normalized] || null;
}

export interface StudentResult extends StudentData {
  id: string;
  science: number;
  compulsoryTotal: number;
  compulsoryAverage: number;
  overallTotal: number;
  overallGradePoints: number;
  bestSixPoints: number;
  rank: number;
  subjects: SubjectScore[];
  bestSixSubjects: string[]; // Keys of subjects included in the best 6
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

export function calculateStudentResults(
  students: StudentData[],
  mandatorySubjects: string[] = []
): StudentResult[] {
  const results: StudentResult[] = students.map((student, index) => {
    const science = (student.physics + student.chemistry) / 2;

    // All subjects with their grade values (lower grade = better)
    const allSubjects = [
      { key: 'english', grade: parseInt(getGrade(student.english)) || 9, score: student.english },
      { key: 'math', grade: parseInt(getGrade(student.math)) || 9, score: student.math },
      { key: 'biology', grade: parseInt(getGrade(student.biology)) || 9, score: student.biology },
      { key: 'science', grade: parseInt(getGrade(science)) || 9, score: science },
      { key: 'dAndT', grade: parseInt(getGrade(student.dAndT)) || 9, score: student.dAndT },
      { key: 'history', grade: parseInt(getGrade(student.history)) || 9, score: student.history },
      { key: 're', grade: parseInt(getGrade(student.re)) || 9, score: student.re },
      { key: 'civic', grade: parseInt(getGrade(student.civic)) || 9, score: student.civic },
    ];

    let mandatoryGradeSum = 0;
    const mandatoryKeys = new Set(mandatorySubjects);
    const bestSixSubjects: string[] = [];

    if (mandatoryKeys.size === 0) {
      // No mandatory → best 6 overall
      const sorted = [...allSubjects].sort((a, b) => a.grade - b.grade);
      const best6 = sorted.slice(0, 6);
      const gradePointsSum = best6.reduce((sum, s) => sum + s.grade, 0);
      best6.forEach(s => bestSixSubjects.push(s.key));

      const overallGradePoints = gradePointsSum;
      const scoresSorted = [...allSubjects].sort((a, b) => b.score - a.score);
      const top6ByScore = scoresSorted.slice(0, 6);
      const overallTotal = top6ByScore.reduce((sum, s) => sum + s.score, 0);
      const compulsoryAverage = overallTotal / 6;

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
        compulsoryTotal: 0,
        compulsoryAverage: Math.round(compulsoryAverage * 10) / 10,
        overallTotal: Math.round(overallTotal * 10) / 10,
        overallGradePoints,
        bestSixPoints: overallGradePoints,
        bestSixSubjects,
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
    }

    // With mandatory subjects: mandatory + best (6 - N) from remaining
    const mandatory = allSubjects.filter(s => mandatoryKeys.has(s.key));
    const optional = allSubjects.filter(s => !mandatoryKeys.has(s.key));
    
    mandatoryGradeSum = mandatory.reduce((sum, s) => sum + s.grade, 0);
    mandatory.forEach(s => bestSixSubjects.push(s.key));
    
    const remaining = 6 - mandatory.length;
    const sortedOptional = [...optional].sort((a, b) => a.grade - b.grade);
    const bestOptional = sortedOptional.slice(0, remaining);
    const optionalGradeSum = bestOptional.reduce((sum, s) => sum + s.grade, 0);
    bestOptional.forEach(s => bestSixSubjects.push(s.key));

    const overallGradePoints = mandatoryGradeSum + optionalGradeSum;

    // Score totals for the best 6
    const best6Subjects = [...mandatory, ...bestOptional];
    const overallTotal = best6Subjects.reduce((sum, s) => sum + s.score, 0);
    const compulsoryAverage = overallTotal / 6;

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
      compulsoryTotal: Math.round(mandatory.reduce((sum, s) => sum + s.score, 0) * 10) / 10,
      compulsoryAverage: Math.round(compulsoryAverage * 10) / 10,
      overallTotal: Math.round(overallTotal * 10) / 10,
      overallGradePoints,
      bestSixPoints: overallGradePoints,
      bestSixSubjects,
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

  results.sort((a, b) => a.overallGradePoints - b.overallGradePoints);
  results.forEach((result, index) => {
    result.rank = index + 1;
  });

  return results;
}

export function parseTableData(text: string): StudentData[] {
  const lines = text.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const separator = lines[0].includes('|') ? '|' : '\t';
  const headerParts = lines[0].split(separator).map(h => h.trim()).filter(h => h);

  // Build column index map
  const columnMap: { index: number; key: SeniorSubjectKey }[] = [];
  let nameIndex = -1;

  headerParts.forEach((header, idx) => {
    const lower = header.toLowerCase();
    if (lower === 'name' || lower === 'student') {
      nameIndex = idx;
      return;
    }
    const subjectKey = matchHeaderToSubject(header);
    if (subjectKey) {
      columnMap.push({ index: idx, key: subjectKey });
    }
  });

  if (nameIndex === -1) {
    // Fallback: assume first column is name
    nameIndex = 0;
  }

  const students: StudentData[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('---')) continue; // Skip separator lines
    const parts = line.split(separator).map(p => p.trim()).filter(p => p);
    if (parts.length < 2) continue;

    const student: StudentData = {
      name: parts[nameIndex] || 'Unknown',
      english: 0, biology: 0, math: 0, chemistry: 0,
      physics: 0, dAndT: 0, history: 0, re: 0, civic: 0,
    };

    columnMap.forEach(({ index, key }) => {
      const val = parseFloat(parts[index]);
      if (!isNaN(val)) {
        (student as any)[key] = val;
      }
    });

    if (student.name) students.push(student);
  }

  return students;
}

export function parseCSV(text: string): StudentData[] {
  const lines = text.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const headerParts = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
  
  const columnMap: { index: number; key: SeniorSubjectKey }[] = [];
  let nameIndex = -1;

  headerParts.forEach((header, idx) => {
    if (header === 'name' || header === 'student') {
      nameIndex = idx;
      return;
    }
    const subjectKey = matchHeaderToSubject(header);
    if (subjectKey) {
      columnMap.push({ index: idx, key: subjectKey });
    }
  });

  if (nameIndex === -1) nameIndex = 0;

  const students: StudentData[] = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
    if (parts.length < 2) continue;

    const student: StudentData = {
      name: parts[nameIndex] || 'Unknown',
      english: 0, biology: 0, math: 0, chemistry: 0,
      physics: 0, dAndT: 0, history: 0, re: 0, civic: 0,
    };

    columnMap.forEach(({ index, key }) => {
      const val = parseFloat(parts[index]);
      if (!isNaN(val)) {
        (student as any)[key] = val;
      }
    });

    if (student.name) students.push(student);
  }

  return students;
}
