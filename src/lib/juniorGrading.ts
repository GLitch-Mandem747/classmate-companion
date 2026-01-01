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
  name: string;
  english: number;
  math: number;
  optionalSubjects?: Record<string, number>;
  subjects: JuniorSubjectScore[];
  totalScore: number;
  averageScore: number;
  overallGradePoints: number;
  bestSixPoints: number;
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
  const results: JuniorStudentResult[] = students.map(student => {
    const subjects: JuniorSubjectScore[] = [];
    let totalScore = 0;
    let subjectCount = 0;
    const gradePoints: number[] = [];

    // Process required subjects
    const englishGrade = getGrade(student.english);
    const mathGrade = getGrade(student.math);
    
    subjects.push({ subject: 'English', score: student.english, grade: englishGrade });
    subjects.push({ subject: 'Math', score: student.math, grade: mathGrade });
    
    totalScore += student.english + student.math;
    subjectCount += 2;
    gradePoints.push(getGradePoints(student.english), getGradePoints(student.math));

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
        
        totalScore += score;
        subjectCount++;
        gradePoints.push(points);
      });
    }

    // Sort grade points ascending (lower is better) and take best 6
    gradePoints.sort((a, b) => a - b);
    const bestSixPoints = gradePoints.slice(0, 6).reduce((sum, p) => sum + p, 0);

    const averageScore = subjectCount > 0 ? Math.round(totalScore / subjectCount) : 0;
    const overallGradePoints = gradePoints.reduce((sum, p) => sum + p, 0);

    return {
      name: student.name,
      english: student.english,
      math: student.math,
      optionalSubjects: student.optionalSubjects,
      subjects,
      totalScore,
      averageScore,
      overallGradePoints,
      bestSixPoints,
      rank: 0
    };
  });

  // Sort by best six points (ascending - lower is better), then by total score (descending)
  results.sort((a, b) => {
    if (a.bestSixPoints !== b.bestSixPoints) {
      return a.bestSixPoints - b.bestSixPoints;
    }
    return b.totalScore - a.totalScore;
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
