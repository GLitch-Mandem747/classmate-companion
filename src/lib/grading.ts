// Senior grading system - flexible subjects with auto-detected Science (Chemistry+Physics avg)
import { detectTableFromText, detectTableFromGrid, detectedTableToStudents } from './tableDetection';

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
  { grade: '8', minScore: 0, maxScore: 49 },
];

export interface StudentData {
  name: string;
  subjects: Record<string, number>;
  subjectNames: string[]; // Ordered list of all subject names
}

export interface SubjectScore {
  subject: string;
  score: number;
  grade: string;
}

export const SUBJECT_LABELS: Record<string, string> = {
  science: 'Science',
};

// Detect if a header maps to chemistry or physics (for science calculation)
const CHEMISTRY_ALIASES = ['chemistry', 'chem'];
const PHYSICS_ALIASES = ['physics', 'phys'];

export function findChemistryKey(subjectNames: string[]): string | null {
  return subjectNames.find(n => CHEMISTRY_ALIASES.includes(n.toLowerCase().trim())) || null;
}

export function findPhysicsKey(subjectNames: string[]): string | null {
  return subjectNames.find(n => PHYSICS_ALIASES.includes(n.toLowerCase().trim())) || null;
}

export interface StudentResult extends StudentData {
  id: string;
  science: number; // Average of chemistry + physics if both exist, else 0
  hasScience: boolean;
  chemistryKey: string | null;
  physicsKey: string | null;
  compulsoryAverage: number;
  overallGradePoints: number;
  bestSixSubjects: string[];
  rank: number;
  grades: Record<string, string>;
}

export function getGrade(score: number): string {
  const gradeEntry = GRADE_SCALE.find(
    (g) => score >= g.minScore && score <= g.maxScore
  );
  return gradeEntry?.grade || '8';
}

export function getGradePoints(score: number): number {
  const grade = getGrade(score);
  return grade === '8' ? 8 : parseInt(grade);
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
    default: return 'grade-8';
  }
}

export function getAllSubjectEntries(student: StudentResult): { key: string; score: number }[] {
  const entries: { key: string; score: number }[] = [];
  for (const name of student.subjectNames) {
    entries.push({ key: name, score: student.subjects[name] || 0 });
  }
  if (student.hasScience) {
    entries.push({ key: 'science', score: student.science });
  }
  return entries;
}

export function calculateStudentResults(
  students: StudentData[],
  mandatorySubjects: string[] = []
): StudentResult[] {
  const allSubjectNames = new Set<string>();
  students.forEach(s => s.subjectNames.forEach(n => allSubjectNames.add(n)));
  const orderedSubjects = Array.from(allSubjectNames);

  // Detect chemistry and physics keys
  const chemKey = findChemistryKey(orderedSubjects);
  const physKey = findPhysicsKey(orderedSubjects);
  const hasScience = !!(chemKey && physKey);

  const results: StudentResult[] = students.map((student, index) => {
    const science = hasScience
      ? Math.round(((student.subjects[chemKey!] || 0) + (student.subjects[physKey!] || 0)) / 2 * 10) / 10
      : 0;

    // Build all subjects for grading
    const allSubjects: { key: string; grade: number; score: number }[] = [];
    const grades: Record<string, string> = {};

    orderedSubjects.forEach(name => {
      const score = student.subjects[name] || 0;
      const grade = getGrade(score);
      grades[name] = grade;
      allSubjects.push({ key: name, grade: parseInt(grade) || 9, score });
    });

    if (hasScience) {
      const sciGrade = getGrade(science);
      grades['science'] = sciGrade;
      allSubjects.push({ key: 'science', grade: parseInt(sciGrade) || 9, score: science });
    }

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
      ...student,
      subjectNames: orderedSubjects,
      id: `student-${index}-${Date.now()}`,
      science,
      hasScience,
      chemistryKey: chemKey,
      physicsKey: physKey,
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
  const table = detectTableFromText(text);
  if (!table) return [];
  return detectedTableToStudents(table);
}

export function parseCSV(text: string): StudentData[] {
  const grid = text
    .split(/\r?\n/)
    .filter(l => l.trim())
    .map(l => l.split(',').map(v => v.trim().replace(/^["']|["']$/g, '')));
  const table = detectTableFromGrid(grid);
  if (!table) return [];
  return detectedTableToStudents(table);
}

/** Parse a 2D grid (from Excel) into senior students, ignoring extraneous rows/cols. */
export function parseGrid(grid: string[][]): StudentData[] {
  const table = detectTableFromGrid(grid);
  if (!table) return [];
  return detectedTableToStudents(table);
}
