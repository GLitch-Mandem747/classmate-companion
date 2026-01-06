import { JuniorStudentResult } from '@/lib/juniorGrading';
import { getGradeClass } from '@/lib/grading';
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

  // Get ordered optional subject names from first result
  const optionalSubjectNames = results[0]?.optionalSubjectNames || [];

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
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
                <TableHead className="text-center">Eng</TableHead>
                <TableHead className="text-center">Math</TableHead>
                {optionalSubjectNames.map((subject) => (
                  <TableHead key={subject} className="text-center capitalize">
                    {subject.length > 6 ? subject.slice(0, 6) + '.' : subject}
                  </TableHead>
                ))}
                <TableHead className="text-center bg-primary/20">Comp. Avg</TableHead>
                <TableHead className="text-center bg-primary/20">Grade Pts</TableHead>
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
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span>{student.english}</span>
                      <GradeBadge grade={student.grades.english} />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span>{student.math}</span>
                      <GradeBadge grade={student.grades.math} />
                    </div>
                  </TableCell>
                  {optionalSubjectNames.map((subject) => {
                    const score = student.optionalSubjects[subject];
                    const grade = student.grades[subject.toLowerCase()];
                    const isBestFour = student.bestFourSubjects.includes(subject.toLowerCase());

                    return (
                      <TableCell 
                        key={subject} 
                        className={`text-center ${isBestFour ? 'bg-green-900/20' : ''}`}
                      >
                        {score !== undefined ? (
                          <div className="flex flex-col items-center gap-1">
                            <span>{score}</span>
                            <GradeBadge grade={grade || '9'} />
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-center bg-primary/5 font-semibold">
                    {student.compulsoryAverage}%
                  </TableCell>
                  <TableCell className="text-center bg-primary/5">
                    <span className="font-bold text-lg">{student.overallGradePoints}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        
        <p className="text-xs text-muted-foreground mt-4">
          Grade Points = Mandatory (English + Math) + Best 4 optional subjects (highlighted in green). Lower points = better.
        </p>
      </CardContent>
    </Card>
  );
}
