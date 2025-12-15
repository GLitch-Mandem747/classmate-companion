import { GraduationCap } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Student Grading System
            </h1>
            <p className="text-sm text-muted-foreground">
              Import • Calculate • Export Report Cards
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
