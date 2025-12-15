import { GRADE_SCALE, getGradeClass } from '@/lib/grading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';

export function GradingScale() {
  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Info className="h-4 w-4 text-primary" />
          Grading Scale
        </CardTitle>
        <CardDescription>
          Grades are awarded on a 1-9 scale (1 = best, 9 = lowest)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {GRADE_SCALE.map((g) => (
            <div 
              key={g.grade}
              className="flex flex-col items-center p-2 rounded-lg bg-secondary"
            >
              <span className={`grade-badge mb-1 ${getGradeClass(g.grade)}`}>
                {g.grade}
              </span>
              <span className="text-xs text-muted-foreground">
                {g.minScore}-{g.maxScore}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
