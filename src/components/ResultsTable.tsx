import { StudentResult, getGradeClass } from '@/lib/grading';
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

interface ResultsTableProps {
  results: StudentResult[];
}

function GradeBadge({ grade }: { grade: string }) {
  return (
    <span className={`grade-badge ${getGradeClass(grade)}`}>
      {grade}
    </span>
  );
}

export function ResultsTable({ results }: ResultsTableProps) {
  if (results.length === 0) {
    return null;
  }

  const totalStudents = results.length;
  const topStudent = results[results.length - 1];
  const averageScore = results.reduce((sum, r) => sum + r.overallAverage, 0) / totalStudents;

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Class Results
        </CardTitle>
        <CardDescription>
          {totalStudents} students • Ranked from lowest (1) to highest ({totalStudents})
        </CardDescription>
        <div className="flex gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2 bg-secondary px-3 py-2 rounded-lg">
            <Trophy className="h-4 w-4 text-warning" />
            <span>Top: <strong>{topStudent.name}</strong> ({topStudent.overallAverage}%)</span>
          </div>
          <div className="bg-secondary px-3 py-2 rounded-lg">
            Class Average: <strong>{averageScore.toFixed(1)}%</strong>
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
                <TableHead className="text-center">Bio</TableHead>
                <TableHead className="text-center">Math</TableHead>
                <TableHead className="text-center">Chem</TableHead>
                <TableHead className="text-center">Phys</TableHead>
                <TableHead className="text-center bg-primary/20">Sci*</TableHead>
                <TableHead className="text-center">D&T</TableHead>
                <TableHead className="text-center">Hist</TableHead>
                <TableHead className="text-center">R.E</TableHead>
                <TableHead className="text-center">Civic</TableHead>
                <TableHead className="text-center bg-primary/20">Comp. Avg</TableHead>
                <TableHead className="text-center bg-primary/20">Overall</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((student, index) => (
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
                      <span>{student.biology}</span>
                      <GradeBadge grade={student.grades.biology} />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span>{student.math}</span>
                      <GradeBadge grade={student.grades.math} />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span>{student.chemistry}</span>
                      <GradeBadge grade={student.grades.chemistry} />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span>{student.physics}</span>
                      <GradeBadge grade={student.grades.physics} />
                    </div>
                  </TableCell>
                  <TableCell className="text-center bg-primary/5">
                    <div className="flex flex-col items-center gap-1">
                      <span>{student.science}</span>
                      <GradeBadge grade={student.grades.science} />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span>{student.dAndT}</span>
                      <GradeBadge grade={student.grades.dAndT} />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span>{student.history}</span>
                      <GradeBadge grade={student.grades.history} />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span>{student.re}</span>
                      <GradeBadge grade={student.grades.re} />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span>{student.civic}</span>
                      <GradeBadge grade={student.grades.civic} />
                    </div>
                  </TableCell>
                  <TableCell className="text-center bg-primary/5 font-semibold">
                    {student.compulsoryAverage}%
                  </TableCell>
                  <TableCell className="text-center bg-primary/5">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-bold">{student.overallAverage}%</span>
                      <GradeBadge grade={student.grades.overall} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        
        <p className="text-xs text-muted-foreground mt-4">
          * Science is calculated as the average of Physics and Chemistry. 
          Compulsory subjects: Math, English, Biology, Science.
        </p>
      </CardContent>
    </Card>
  );
}
