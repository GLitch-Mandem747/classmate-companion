import { JuniorStudentResult, getGrade } from '@/lib/juniorGrading';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Trophy, TrendingUp } from 'lucide-react';

interface JuniorResultsTableProps {
  results: JuniorStudentResult[];
}

function getGradeClass(grade: string): string {
  const gradeNum = parseInt(grade);
  if (gradeNum <= 2) return 'grade-excellent';
  if (gradeNum <= 4) return 'grade-good';
  if (gradeNum <= 6) return 'grade-average';
  return 'grade-poor';
}

function GradeBadge({ grade }: { grade: string }) {
  return (
    <span className={`grade-badge ${getGradeClass(grade)}`}>
      {grade}
    </span>
  );
}

export function JuniorResultsTable({ results }: JuniorResultsTableProps) {
  if (results.length === 0) {
    return null;
  }

  const totalStudents = results.length;
  const topStudent = results[0];
  const averageGradePoints = results.reduce((sum, r) => sum + r.overallGradePoints, 0) / totalStudents;

  // Get all optional subject names from results
  const optionalSubjectNames = new Set<string>();
  results.forEach(student => {
    if (student.optionalSubjects) {
      Object.keys(student.optionalSubjects).forEach(key => {
        optionalSubjectNames.add(key);
      });
    }
  });
  const sortedOptionalSubjects = Array.from(optionalSubjectNames).sort();

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-500" />
          Class Results
        </CardTitle>
        <CardDescription>
          {totalStudents} students • Ranked by grade points (lower = better)
        </CardDescription>
        <div className="flex gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2 bg-secondary px-3 py-2 rounded-lg">
            <Trophy className="h-4 w-4 text-warning" />
            <span>Top: <strong>{topStudent.name}</strong> ({topStudent.overallGradePoints} pts)</span>
          </div>
          <div className="bg-secondary px-3 py-2 rounded-lg">
            Class Avg: <strong>{averageGradePoints.toFixed(1)} pts</strong>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full whitespace-nowrap rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="table-header">
                <TableHead className="w-[60px] sticky left-0 bg-secondary z-10">Rank</TableHead>
                <TableHead className="min-w-[150px] sticky left-[60px] bg-secondary z-10">Name</TableHead>
                <TableHead className="text-center bg-green-900/20">Eng</TableHead>
                <TableHead className="text-center bg-green-900/20">Math</TableHead>
                {sortedOptionalSubjects.map(subject => (
                  <TableHead key={subject} className="text-center capitalize">
                    {subject.length > 6 ? subject.slice(0, 6) + '.' : subject}
                  </TableHead>
                ))}
                <TableHead className="text-center bg-green-900/30">Total Pts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((student) => (
                <TableRow 
                  key={student.id} 
                  className="table-row-alt hover:bg-muted/50 transition-colors"
                >
                  <TableCell className="font-bold sticky left-0 bg-card z-10">
                    {student.rank}
                  </TableCell>
                  <TableCell className="font-medium sticky left-[60px] bg-card z-10">
                    {student.name}
                  </TableCell>
                  <TableCell className="text-center bg-green-900/10">
                    <div className="flex flex-col items-center gap-1">
                      <span>{student.english}</span>
                      <GradeBadge grade={student.grades.english} />
                    </div>
                  </TableCell>
                  <TableCell className="text-center bg-green-900/10">
                    <div className="flex flex-col items-center gap-1">
                      <span>{student.math}</span>
                      <GradeBadge grade={student.grades.math} />
                    </div>
                  </TableCell>
                  {sortedOptionalSubjects.map(subject => {
                    const score = student.optionalSubjects?.[subject];
                    const grade = student.grades[subject.toLowerCase()];
                    return (
                      <TableCell key={subject} className="text-center">
                        {score !== undefined ? (
                          <div className="flex flex-col items-center gap-1">
                            <span>{score}</span>
                            <GradeBadge grade={grade} />
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-center bg-green-900/20">
                    <span className="font-bold text-lg">{student.overallGradePoints}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        
        <p className="text-xs text-muted-foreground mt-4">
          Total Points = Mandatory subjects (Math + English) + Best 4 optional subjects. Lower points = better.
        </p>
      </CardContent>
    </Card>
  );
}