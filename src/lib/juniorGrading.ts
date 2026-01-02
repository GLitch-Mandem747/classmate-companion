// Junior grading system - Same scale as senior but different subject structure
// Required: English, Math
// Optional: Any other subjects

export interface JuniorStudentData {
  name: string;
  english: number;
  math: number;
  optionalSubjects?: Record<string, number>;
}

export interface JuniorSubjectScore {
  subject: string;
  score: number;
  grade: string;
}

export interface JuniorStudentResult {
  id: string;
  name: string;
  english: number;
  math: number;
  optionalSubjects?: Record<string, number>;
  subjects: JuniorSubjectScore[];
  grades: Record<string, string>;
  mandatoryPoints: number; // Math + English grade points
  bestFourOptionalPoints: number; // Best 4 optional subjects
  overallGradePoints: number; // Total = mandatory + best 4 optional
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
  const grade = parseInt(getGrade(score));
  return grade;
};

export const calculateJuniorStudentResults = (students: JuniorStudentData[]): JuniorStudentResult[] => {
  const results: JuniorStudentResult[] = students.map((student, index) => {
    const subjects: JuniorSubjectScore[] = [];
    const grades: Record<string, string> = {};
    const optionalGradePoints: number[] = [];

    // Process mandatory subjects (Math + English)
    const englishGrade = getGrade(student.english);
    const mathGrade = getGrade(student.math);
    const englishPoints = getGradePoints(student.english);
    const mathPoints = getGradePoints(student.math);
    
    subjects.push({ subject: 'English', score: student.english, grade: englishGrade });
    subjects.push({ subject: 'Math', score: student.math, grade: mathGrade });
    
    grades['english'] = englishGrade;
    grades['math'] = mathGrade;
    
    const mandatoryPoints = englishPoints + mathPoints;

    // Process optional subjects
    if (student.optionalSubjects) {
      Object.entries(student.optionalSubjects).forEach(([key, value]) => {
        const score = value;
        const grade = getGrade(score);
        const points = getGradePoints(score);
        
        subjects.push({
          subject: key.charAt(0).toUpperCase() + key.slice(1),
          score,
          grade
        });
        
        grades[key.toLowerCase()] = grade;
        optionalGradePoints.push(points);
      });
    }

    // Sort optional grade points ascending (lower is better) and take best 4
    optionalGradePoints.sort((a, b) => a - b);
    const bestFourOptionalPoints = optionalGradePoints.slice(0, 4).reduce((sum, p) => sum + p, 0);

    // Total = mandatory (Math + English) + best 4 optional
    const overallGradePoints = mandatoryPoints + bestFourOptionalPoints;

    return {
      id: `student-${index}`,
      name: student.name,
      english: student.english,
      math: student.math,
      optionalSubjects: student.optionalSubjects,
      subjects,
      grades,
      mandatoryPoints,
      bestFourOptionalPoints,
      overallGradePoints,
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
      } else if (student.optionalSubjects) {
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
      } else if (student.optionalSubjects) {
        student.optionalSubjects[header] = value;
      }
    });

    if (student.name) {
      students.push(student);
    }
  }

  return students;
};
