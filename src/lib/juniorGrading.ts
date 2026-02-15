// Junior grading system - Same scale as senior but different subject structure
// Required: English, Math (mandatory)
// Optional: Up to 10 additional subjects (best 4 counted)

export interface JuniorStudentData {
  name: string;
  english: number;
  math: number;
  optionalSubjects: Record<string, number>;
}

export interface JuniorSubjectScore {
  subject: string;
  score: number;
  grade: string;
  gradePoints: number;
}

export interface JuniorStudentResult {
  id: string;
  name: string;
  english: number;
  math: number;
  optionalSubjects: Record<string, number>;
  optionalSubjectNames: string[]; // Ordered list of optional subject names
  grades: Record<string, string>;
  gradePoints: Record<string, number>;
  mandatoryPoints: number; // Math + English grade points
  bestFourOptionalPoints: number; // Best 4 optional subjects
  bestFourSubjects: string[]; // Names of best 4 subjects used
  overallGradePoints: number; // Total = mandatory + best 4 optional
  compulsoryAverage: number; // Average of English + Math scores
  rank: number;
}

// Same grading scale as senior
const GRADE_SCALE = [
  { grade: '1', minScore: 85, maxScore: 100 },
  { grade: '2', minScore: 75, maxScore: 84 },
  { grade: '3', minScore: 70, maxScore: 74 },
  { grade: '4', minScore: 65, maxScore: 69 },
  { grade: '5', minScore: 60, maxScore: 64 },
  { grade: '6', minScore: 55, maxScore: 59 },
  { grade: '7', minScore: 50, maxScore: 54 },
  { grade: '8', minScore: 40, maxScore: 49 },
  { grade: '9', minScore: 0, maxScore: 39 },
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
  const grade = parseInt(getGrade(score));
  return grade;
};

export const calculateJuniorStudentResults = (students: JuniorStudentData[]): JuniorStudentResult[] => {
  // Collect all optional subject names across all students for consistent ordering
  const allOptionalSubjects = new Set<string>();
  students.forEach(student => {
    Object.keys(student.optionalSubjects).forEach(key => allOptionalSubjects.add(key));
  });
  const orderedOptionalSubjects = Array.from(allOptionalSubjects).sort();

  const results: JuniorStudentResult[] = students.map((student, index) => {
    const grades: Record<string, string> = {};
    const gradePointsMap: Record<string, number> = {};
    const optionalWithPoints: { subject: string; points: number }[] = [];

    // Process mandatory subjects (English + Math)
    const englishGrade = getGrade(student.english);
    const mathGrade = getGrade(student.math);
    const englishPoints = getGradePoints(student.english);
    const mathPoints = getGradePoints(student.math);
    
    grades['english'] = englishGrade;
    grades['math'] = mathGrade;
    gradePointsMap['english'] = englishPoints;
    gradePointsMap['math'] = mathPoints;
    
    const mandatoryPoints = englishPoints + mathPoints;
    const compulsoryAverage = Math.round((student.english + student.math) / 2);

    // Process optional subjects
    Object.entries(student.optionalSubjects).forEach(([key, score]) => {
      const grade = getGrade(score);
      const points = getGradePoints(score);
      
      grades[key.toLowerCase()] = grade;
      gradePointsMap[key.toLowerCase()] = points;
      optionalWithPoints.push({ subject: key.toLowerCase(), points });
    });

    // Sort by points ascending (lower is better) and take best 4
    optionalWithPoints.sort((a, b) => a.points - b.points);
    const bestFour = optionalWithPoints.slice(0, 4);
    const bestFourOptionalPoints = bestFour.reduce((sum, p) => sum + p.points, 0);
    const bestFourSubjects = bestFour.map(b => b.subject);

    // Total = mandatory (English + Math) + best 4 optional
    const overallGradePoints = mandatoryPoints + bestFourOptionalPoints;

    return {
      id: `student-${index}`,
      name: student.name,
      english: student.english,
      math: student.math,
      optionalSubjects: student.optionalSubjects,
      optionalSubjectNames: orderedOptionalSubjects,
      grades,
      gradePoints: gradePointsMap,
      mandatoryPoints,
      bestFourOptionalPoints,
      bestFourSubjects,
      overallGradePoints,
      compulsoryAverage,
      rank: 0
    };
  });

  // Sort by overall grade points (ascending - lower is better)
  results.sort((a, b) => {
    if (a.overallGradePoints !== b.overallGradePoints) {
      return a.overallGradePoints - b.overallGradePoints;
    }
    // Tiebreaker: lower mandatory points first
    return a.mandatoryPoints - b.mandatoryPoints;
  });

  // Assign ranks
  results.forEach((result, index) => {
    result.rank = index + 1;
  });

  return results;
};

export const parseJuniorTableData = (text: string): JuniorStudentData[] => {
  const lines = text.trim().split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  // Detect separator
  const separator = lines[0].includes('|') ? '|' : '\t';
  
  // Parse header
  const headerLine = lines[0].split(separator).map(h => h.trim().toLowerCase()).filter(h => h);
  
  // Find column indices
  const nameIndex = headerLine.findIndex(h => h === 'name' || h === 'student');
  
  if (nameIndex === -1) return [];

  const students: JuniorStudentData[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(separator).map(v => v.trim()).filter(v => v);
    if (values.length < 2) continue;

    const student: JuniorStudentData = {
      name: values[nameIndex] || '',
      english: 0,
      math: 0,
      optionalSubjects: {}
    };

    headerLine.forEach((header, idx) => {
      if (header === 'name' || header === 'student') return;
      
      const value = parseFloat(values[idx]) || 0;
      
      if (header === 'english' || header === 'eng') {
        student.english = value;
      } else if (header === 'math' || header === 'maths' || header === 'mathematics') {
        student.math = value;
      } else {
        student.optionalSubjects[header] = value;
      }
    });

    if (student.name) {
      students.push(student);
    }
  }

  return students;
};

export const parseJuniorCSV = (text: string): JuniorStudentData[] => {
  const lines = text.trim().split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headerLine = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
  const nameIndex = headerLine.findIndex(h => h === 'name' || h === 'student');

  if (nameIndex === -1) return [];

  const students: JuniorStudentData[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    if (values.length < 2) continue;

    const student: JuniorStudentData = {
      name: values[nameIndex] || '',
      english: 0,
      math: 0,
      optionalSubjects: {}
    };

    headerLine.forEach((header, idx) => {
      if (header === 'name' || header === 'student') return;
      
      const value = parseFloat(values[idx]) || 0;
      
      if (header === 'english' || header === 'eng') {
        student.english = value;
      } else if (header === 'math' || header === 'maths' || header === 'mathematics') {
        student.math = value;
      } else {
        student.optionalSubjects[header] = value;
      }
    });

    if (student.name) {
      students.push(student);
    }
  }

  return students;
};
