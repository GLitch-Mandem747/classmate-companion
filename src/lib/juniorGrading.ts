// Junior grading system - fully flexible subjects
// All subjects are dynamic - user chooses mandatory via UI

export interface JuniorStudentData {
  name: string;
  subjects: Record<string, number>;
  subjectNames: string[]; // Ordered list of subject names
}

export interface JuniorStudentResult {
  id: string;
  name: string;
  subjects: Record<string, number>;
  subjectNames: string[];
  grades: Record<string, string>;
  gradePoints: Record<string, number>;
  overallGradePoints: number;
  bestSixSubjects: string[];
  compulsoryAverage: number;
  rank: number;
}

const GRADE_SCALE = [
  { grade: '1', minScore: 85, maxScore: 100 },
  { grade: '2', minScore: 75, maxScore: 84 },
  { grade: '3', minScore: 70, maxScore: 74 },
  { grade: '4', minScore: 65, maxScore: 69 },
  { grade: '5', minScore: 60, maxScore: 64 },
  { grade: '6', minScore: 55, maxScore: 59 },
  { grade: '7', minScore: 50, maxScore: 54 },
  { grade: '9', minScore: 0, maxScore: 49 },
];

export const getGrade = (score: number): string => {
  for (const scale of GRADE_SCALE) {
    if (score >= scale.minScore && score <= scale.maxScore) {
      return scale.grade;
    }
  }
  return '9';
};

export const getGradePoints = (score: number): number => {
  const grade = getGrade(score);
  return grade === '9' ? 9 : parseInt(grade);
};

export const calculateJuniorStudentResults = (
  students: JuniorStudentData[],
  mandatorySubjects: string[] = []
): JuniorStudentResult[] => {
  const allSubjectNames = new Set<string>();
  students.forEach(s => s.subjectNames.forEach(n => allSubjectNames.add(n)));
  const orderedSubjects = Array.from(allSubjectNames);

  const results: JuniorStudentResult[] = students.map((student, index) => {
    const grades: Record<string, string> = {};
    const gradePointsMap: Record<string, number> = {};

    const allSubjects: { key: string; grade: number; score: number }[] = [];

    orderedSubjects.forEach(name => {
      const score = student.subjects[name] || 0;
      const grade = getGrade(score);
      const points = getGradePoints(score);
      grades[name] = grade;
      gradePointsMap[name] = points;
      allSubjects.push({ key: name, grade: points, score });
    });

    const mandatorySet = new Set(mandatorySubjects);
    const bestSixSubjects: string[] = [];
    let overallGradePoints: number;

    if (mandatorySet.size === 0) {
      const sorted = [...allSubjects].sort((a, b) => a.grade - b.grade);
      const best6 = sorted.slice(0, 6);
      overallGradePoints = best6.reduce((sum, s) => sum + s.grade, 0);
      best6.forEach(s => bestSixSubjects.push(s.key));
    } else {
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

    const best6Entries = allSubjects.filter(s => bestSixSubjects.includes(s.key));
    const totalScore = best6Entries.reduce((sum, s) => sum + s.score, 0);
    const compulsoryAverage = Math.round((totalScore / Math.max(best6Entries.length, 1)) * 10) / 10;

    return {
      id: `student-${index}`,
      name: student.name,
      subjects: student.subjects,
      subjectNames: orderedSubjects,
      grades,
      gradePoints: gradePointsMap,
      overallGradePoints,
      bestSixSubjects,
      compulsoryAverage,
      rank: 0,
    };
  });

  results.sort((a, b) => a.overallGradePoints - b.overallGradePoints);
  results.forEach((result, index) => {
    result.rank = index + 1;
  });

  return results;
};

/**
 * Parse pipe-separated or tab-separated table data.
 * Falls back to first column as name if no "Name"/"Student" header found.
 */
export const parseJuniorTableData = (text: string): JuniorStudentData[] => {
  const lines = text.trim().split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const separator = lines[0].includes('|') ? '|' : '\t';
  const rawHeaderParts = lines[0].split(separator).map(h => h.trim());

  let nameIndex = -1;
  const subjectHeaders: { index: number; name: string }[] = [];

  rawHeaderParts.forEach((header, idx) => {
    if (!header) return;
    const l = header.toLowerCase();
    if (nameIndex === -1 && (l === 'name' || l === 'student' || l === 'student name' || l === 'learner')) {
      nameIndex = idx;
      return;
    }
    subjectHeaders.push({ index: idx, name: header.trim() });
  });

  // Fallback: use first non-empty column as name
  if (nameIndex === -1) {
    const firstNonEmpty = rawHeaderParts.findIndex(h => h.length > 0);
    if (firstNonEmpty === -1) return [];
    nameIndex = firstNonEmpty;
    // Remove it from subjects if it was added
    const subIdx = subjectHeaders.findIndex(s => s.index === nameIndex);
    if (subIdx !== -1) subjectHeaders.splice(subIdx, 1);
  }

  if (subjectHeaders.length === 0) return [];

  const subjectNames = subjectHeaders.map(s => s.name);
  const students: JuniorStudentData[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('---')) continue;
    const rawParts = line.split(separator).map(v => v.trim());
    if (rawParts.filter(v => v).length < 2) continue;

    const subjects: Record<string, number> = {};
    subjectHeaders.forEach(({ index, name }) => {
      const value = parseFloat(rawParts[index]) || 0;
      subjects[name] = value;
    });

    const studentName = (rawParts[nameIndex] || '').trim();
    if (!studentName) continue;

    students.push({ name: studentName, subjects, subjectNames });
  }

  return students;
};

/**
 * Parse CSV data. Falls back to first column as name if no "Name"/"Student" header found.
 */
export const parseJuniorCSV = (text: string): JuniorStudentData[] => {
  const lines = text.trim().split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const rawHeaders = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  let nameIndex = -1;
  const subjectHeaders: { index: number; name: string }[] = [];

  rawHeaders.forEach((header, idx) => {
    if (!header) return;
    const l = header.toLowerCase();
    if (nameIndex === -1 && (l === 'name' || l === 'student' || l === 'student name' || l === 'learner')) {
      nameIndex = idx;
      return;
    }
    subjectHeaders.push({ index: idx, name: header.trim() });
  });

  // Fallback: use first non-empty column as name
  if (nameIndex === -1) {
    const firstNonEmpty = rawHeaders.findIndex(h => h.length > 0);
    if (firstNonEmpty === -1) return [];
    nameIndex = firstNonEmpty;
    const subIdx = subjectHeaders.findIndex(s => s.index === nameIndex);
    if (subIdx !== -1) subjectHeaders.splice(subIdx, 1);
  }

  if (subjectHeaders.length === 0) return [];

  const subjectNames = subjectHeaders.map(s => s.name);
  const students: JuniorStudentData[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    if (values.length < 2) continue;

    const subjects: Record<string, number> = {};
    subjectHeaders.forEach(({ index, name }) => {
      const value = parseFloat(values[index]) || 0;
      subjects[name] = value;
    });

    const studentName = (values[nameIndex] || '').trim();
    if (!studentName) continue;

    students.push({ name: studentName, subjects, subjectNames });
  }

  return students;
};
