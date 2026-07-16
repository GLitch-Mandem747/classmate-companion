import { StudentResult, getGradeClass, SUBJECT_LABELS } from '@/lib/grading';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Trophy, TrendingUp } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ResultsTableProps {
  results: StudentResult[];
  mandatorySubjects: string[];
  onToggleMandatory: (subjectKey: string) => void;
}

function GradeBadge({ grade }: { grade: string }) {
  return (
    <span className={`grade-badge ${getGradeClass(grade)}`}>
      {grade}
    </span>
  );
}

function MandatoryCircle({ 
  subjectKey, isMandatory, onToggle, disabled 
}: { 
  subjectKey: string; isMandatory: boolean; onToggle: () => void; disabled: boolean;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onToggle}
            disabled={disabled && !isMandatory}
            className={`w-5 h-5 rounded-full border-2 transition-all inline-flex items-center justify-center text-[10px] font-bold mx-auto cursor-pointer ${
              isMandatory
                ? 'bg-primary border-primary text-primary-foreground'
                : disabled
                  ? 'border-muted-foreground/30 text-transparent cursor-not-allowed'
                  : 'border-muted-foreground/50 hover:border-primary/70 text-transparent hover:bg-primary/10'
            }`}
          >
            {isMandatory ? 'M' : ''}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          {isMandatory 
            ? `Click to remove ${SUBJECT_LABELS[subjectKey] || subjectKey} as mandatory` 
            : disabled 
              ? 'Max 4 mandatory subjects reached' 
              : `Click to set ${SUBJECT_LABELS[subjectKey] || subjectKey} as mandatory`}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function ResultsTable({ results, mandatorySubjects, onToggleMandatory }: ResultsTableProps) {
  if (results.length === 0) return null;

  const totalStudents = results.length;
  const topStudent = results[0];
  const averageGradePoints = results.reduce((sum, r) => sum + r.overallGradePoints, 0) / totalStudents;
  const mandatorySet = new Set(mandatorySubjects);
  const maxMandatoryReached = mandatorySubjects.length >= 4;

  // Build columns: all subject names + science if available
  const subjectNames = results[0]?.subjectNames || [];
  const hasScience = results[0]?.hasScience || false;

  // Build column list
  const columns: { key: string; label: string; isScience?: boolean }[] = subjectNames.map(name => ({
    key: name,
    label: name.length > 6 ? name.slice(0, 6) + '.' : name,
  }));

  if (hasScience) {
    columns.push({ key: 'science', label: 'Sci*', isScience: true });
  }

  const pointsLabel = mandatorySubjects.length > 0
    ? `${mandatorySubjects.map(k => SUBJECT_LABELS[k] || k).join(', ')} (mandatory) + best ${6 - mandatorySubjects.length}`
    : 'Best 6 overall';

  const getScore = (student: StudentResult, key: string): number => {
    if (key === 'science') return student.science;
    return student.subjects[key] || 0;
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Class Results
        </CardTitle>
        <CardDescription>
          {totalStudents} students • {pointsLabel} • Ranked by grade points (lower = better)
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
        <p className="text-xs text-muted-foreground mt-2">
          💡 Click the circles below each subject header to mark it as mandatory (up to 4). Mandatory subjects are always included in the grade points calculation.
        </p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full whitespace-nowrap rounded-md border">
          <Table>
            <TableHeader>
              {/* Mandatory toggle row */}
              <TableRow className="border-b-0">
                <TableHead className="w-[60px] sticky left-0 bg-secondary z-10"></TableHead>
                <TableHead className="min-w-[150px] sticky left-[60px] bg-secondary z-10"></TableHead>
                {columns.map((col) => (
                  <TableHead key={col.key} className={`text-center ${col.isScience ? 'bg-primary/20' : ''}`}>
                    <MandatoryCircle
                      subjectKey={col.key}
                      isMandatory={mandatorySet.has(col.key)}
                      onToggle={() => onToggleMandatory(col.key)}
                      disabled={maxMandatoryReached}
                    />
                  </TableHead>
                ))}
                <TableHead className="text-center bg-primary/20"></TableHead>
                <TableHead className="text-center bg-primary/20"></TableHead>
              </TableRow>
              {/* Header labels row */}
              <TableRow className="table-header">
                <TableHead className="w-[60px] sticky left-0 bg-secondary z-10">Rank</TableHead>
                <TableHead className="min-w-[150px] sticky left-[60px] bg-secondary z-10">Name</TableHead>
                {columns.map((col) => (
                  <TableHead key={col.key} className={`text-center ${col.isScience ? 'bg-primary/20' : ''}`}>
                    {col.label}
                  </TableHead>
                ))}
                <TableHead className="text-center bg-primary/20">Best 6 Avg</TableHead>
                <TableHead className="text-center bg-primary/20">Grade Pts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((student) => {
                const bestSixSet = new Set(student.bestSixSubjects || []);
                return (
                  <TableRow key={student.id} className="table-row-alt hover:bg-muted/50 transition-colors">
                    <TableCell className="font-bold sticky left-0 bg-card z-10">{student.rank}</TableCell>
                    <TableCell className="font-medium sticky left-[60px] bg-card z-10">{student.name}</TableCell>
                    {columns.map((col) => {
                      const score = getScore(student, col.key);
                      const grade = student.grades[col.key] || '8';
                      const isInBest6 = bestSixSet.has(col.key);
                      return (
                        <TableCell key={col.key} className={`text-center ${col.isScience ? 'bg-primary/5' : ''} ${isInBest6 ? 'bg-green-500/10' : ''}`}>
                          <div className="flex flex-col items-center gap-1">
                            <span>{typeof score === 'number' ? score : 0}</span>
                            <GradeBadge grade={grade} />
                          </div>
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center bg-primary/5 font-semibold">{student.compulsoryAverage}%</TableCell>
                    <TableCell className="text-center bg-primary/5">
                      <span className="font-bold text-lg">{student.overallGradePoints}</span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-4">
          {hasScience && <span>* Science = (Physics + Chemistry) / 2</span>}
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded bg-green-500/20 border border-green-500/40"></span>
            Subjects counted in best 6
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full bg-primary border-2 border-primary"></span>
            Mandatory subject
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
