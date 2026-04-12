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
  // Fixed 5 subjects above; additional subjects below (flexible names)
  additionalSubjects: Record<string, number>;
  additionalSubjectNames: string[]; // Ordered list
}

export interface SubjectScore {
  subject: string;
  score: number;
  grade: string;
}

// Fixed subject keys
export const FIXED_SUBJECT_KEYS = ['english', 'biology', 'math', 'chemistry', 'physics'] as const;
export type FixedSubjectKey = typeof FIXED_SUBJECT_KEYS[number];

export const SUBJECT_LABELS: Record<string, string> = {
  english: 'English',
  biology: 'Biology',
  math: 'Math',
  chemistry: 'Chemistry',
  physics: 'Physics',
  science: 'Science',
};

// Map header text variations to fixed subject keys
const HEADER_MAP: Record<string, FixedSubjectKey> = {
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
};

export function matchHeaderToFixedSubject(header: string): FixedSubjectKey | null {
  const normalized = header.trim().toLowerCase();
  return HEADER_MAP[normalized] || null;
}

export interface StudentResult extends StudentData {
  id: string;
  science: number;
  compulsoryAverage: number;
  overallGradePoints: number;
  bestSixSubjects: string[]; // Keys of subjects included in the best 6
  rank: number;
  grades: Record<string, string>; // key -> grade for all subjects
}

export function getGrade(score: number): string {
  const gradeEntry = GRADE_SCALE.find(
    (g) => score >= g.minScore && score <= g.maxScore
  );
  return gradeEntry?.grade || '9';
}

export function getGradePoints(score: number): number {
  const grade = getGrade(score);
  return grade === '9' ? 9 : parseInt(grade);
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

export function getAllSubjectEntries(student: StudentData): { key: string; score: number }[] {
  const entries: { key: string; score: number }[] = [
    { key: 'english', score: student.english },
    { key: 'biology', score: student.biology },
    { key: 'math', score: student.math },
    { key: 'chemistry', score: student.chemistry },
    { key: 'physics', score: student.physics },
  ];
  // Science is computed
  const science = (student.physics + student.chemistry) / 2;
  entries.push({ key: 'science', score: science });
  // Additional subjects
  for (const name of student.additionalSubjectNames) {
    entries.push({ key: name, score: student.additionalSubjects[name] || 0 });
  }
  return entries;
}

export function calculateStudentResults(
  students: StudentData[],
  mandatorySubjects: string[] = []
): StudentResult[] {
  // Collect all additional subject names across students
  const allAdditionalNames = new Set<string>();
  students.forEach(s => s.additionalSubjectNames.forEach(n => allAdditionalNames.add(n)));
  const orderedAdditional = Array.from(allAdditionalNames).sort();

  const results: StudentResult[] = students.map((student, index) => {
    const science = (student.physics + student.chemistry) / 2;

    // Build all subjects list
    const allSubjects = getAllSubjectEntries(student).map(e => ({
      ...e,
      grade: parseInt(getGrade(e.score)) || 9,
    }));

    const grades: Record<string, string> = {};
    allSubjects.forEach(s => {
      grades[s.key] = getGrade(s.score);
    });

    const mandatorySet = new Set(mandatorySubjects);
    const bestSixSubjects: string[] = [];
    let overallGradePoints: number;

    if (mandatorySet.size === 0) {
      // No mandatory → best 6 overall
      const sorted = [...allSubjects].sort((a, b) => a.grade - b.grade);
      const best6 = sorted.slice(0, 6);
      overallGradePoints = best6.reduce((sum, s) => sum + s.grade, 0);
      best6.forEach(s => bestSixSubjects.push(s.key));
    } else {
      // Mandatory + best (6 - N) from remaining
      const mandatory = allSubjects.filter(s => mandatorySet.has(s.key));
      const optional = allSubjects.filter(s => !mandatorySet.has(s.key));
      const mandatoryGradeSum = mandatory.reduce((sum, s) => sum + s.grade, 0);
      mandatory.forEach(s => bestSixSubjects.push(s.key));
      const remaining = 6 - mandatory.length;
      const sortedOptional = [...optional].sort((a, b) => a.grade - b.grade);
      const bestOptional = sortedOptional.slice(0, remaining);
      const optionalGradeSum = bestOptional.reduce((sum, s) => sum + s.grade, 0);
      bestOptional.forEach(s => bestSixSubjects.push(s.key));
      overallGradePoints = mandatoryGradeSum + optionalGradeSum;
    }

    // Average of best 6 scores
    const best6Entries = allSubjects.filter(s => bestSixSubjects.includes(s.key));
    const totalScore = best6Entries.reduce((sum, s) => sum + s.score, 0);
    const compulsoryAverage = Math.round((totalScore / 6) * 10) / 10;

    return {
      ...student,
      additionalSubjectNames: orderedAdditional,
      id: `student-${index}-${Date.now()}`,
      science: Math.round(science * 10) / 10,
      compulsoryAverage,
      overallGradePoints,
      bestSixSubjects,
      rank: 0,
      grades,
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

  let nameIndex = -1;
  const fixedMap: { index: number; key: FixedSubjectKey }[] = [];
  const additionalMap: { index: number; name: string }[] = [];

  headerParts.forEach((header, idx) => {
    const lower = header.toLowerCase();
    if (lower === 'name' || lower === 'student') {
      nameIndex = idx;
      return;
    }
    const fixedKey = matchHeaderToFixedSubject(header);
    if (fixedKey) {
      fixedMap.push({ index: idx, key: fixedKey });
    } else {
      // It's an additional/flexible subject
      additionalMap.push({ index: idx, name: header.trim() });
    }
  });

  if (nameIndex === -1) nameIndex = 0;

  const additionalNames = additionalMap.map(a => a.name);

  const students: StudentData[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('---')) continue;
    const parts = line.split(separator).map(p => p.trim()).filter(p => p);
    if (parts.length < 2) continue;

    const student: StudentData = {
      name: parts[nameIndex] || 'Unknown',
      english: 0, biology: 0, math: 0, chemistry: 0, physics: 0,
      additionalSubjects: {},
      additionalSubjectNames: additionalNames,
    };

    fixedMap.forEach(({ index, key }) => {
      const val = parseFloat(parts[index]);
      if (!isNaN(val)) (student as any)[key] = val;
    });

    additionalMap.forEach(({ index, name }) => {
      const val = parseFloat(parts[index]);
      if (!isNaN(val)) student.additionalSubjects[name] = val;
    });

    if (student.name) students.push(student);
  }

  return students;
}

export function parseCSV(text: string): StudentData[] {
  const lines = text.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const rawHeaders = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));

  let nameIndex = -1;
  const fixedMap: { index: number; key: FixedSubjectKey }[] = [];
  const additionalMap: { index: number; name: string }[] = [];

  rawHeaders.forEach((header, idx) => {
    const lower = header.toLowerCase();
    if (lower === 'name' || lower === 'student') {
      nameIndex = idx;
      return;
    }
    const fixedKey = matchHeaderToFixedSubject(header);
    if (fixedKey) {
      fixedMap.push({ index: idx, key: fixedKey });
    } else if (header.trim()) {
      additionalMap.push({ index: idx, name: header.trim() });
    }
  });

  if (nameIndex === -1) nameIndex = 0;
  const additionalNames = additionalMap.map(a => a.name);

  const students: StudentData[] = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
    if (parts.length < 2) continue;

    const student: StudentData = {
      name: parts[nameIndex] || 'Unknown',
      english: 0, biology: 0, math: 0, chemistry: 0, physics: 0,
      additionalSubjects: {},
      additionalSubjectNames: additionalNames,
    };

    fixedMap.forEach(({ index, key }) => {
      const val = parseFloat(parts[index]);
      if (!isNaN(val)) (student as any)[key] = val;
    });

    additionalMap.forEach(({ index, name }) => {
      const val = parseFloat(parts[index]);
      if (!isNaN(val)) student.additionalSubjects[name] = val;
    });

    if (student.name) students.push(student);
  }

  return students;
}
