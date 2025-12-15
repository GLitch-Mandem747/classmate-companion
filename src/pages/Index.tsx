import { useState } from 'react';
import { Header } from '@/components/Header';
import { DataImport } from '@/components/DataImport';
import { ResultsTable } from '@/components/ResultsTable';
import { GradingScale } from '@/components/GradingScale';
import { ExportPanel } from '@/components/ExportPanel';
import { StudentData, StudentResult, calculateStudentResults } from '@/lib/grading';
import { Button } from '@/components/ui/button';
import { RefreshCw, Users } from 'lucide-react';

const Index = () => {
  const [results, setResults] = useState<StudentResult[]>([]);

  const handleImport = (students: StudentData[]) => {
    const calculated = calculateStudentResults(students);
    setResults(calculated);
  };

  const handleClear = () => {
    setResults([]);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Stats bar when results exist */}
        {results.length > 0 && (
          <div className="flex items-center justify-between bg-card rounded-lg p-4 border border-border animate-fade-in">
            <div className="flex items-center gap-2 text-foreground">
              <Users className="h-5 w-5 text-primary" />
              <span className="font-medium">{results.length} Students Loaded</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleClear}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Clear & Start Over
            </Button>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            {results.length === 0 && (
              <DataImport onImport={handleImport} />
            )}
            
            <ResultsTable results={results} />
            
            {results.length > 0 && (
              <ExportPanel results={results} />
            )}
          </div>
          
          <aside className="space-y-6">
            <GradingScale />
            
            {results.length === 0 && (
              <div className="bg-card rounded-lg p-4 border border-border">
                <h3 className="font-semibold text-foreground mb-2">Quick Start</h3>
                <ol className="text-sm text-muted-foreground space-y-2">
                  <li className="flex gap-2">
                    <span className="text-primary font-bold">1.</span>
                    Import student data (CSV or paste)
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary font-bold">2.</span>
                    View calculated grades & rankings
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary font-bold">3.</span>
                    Export to Excel/Word or generate report cards
                  </li>
                </ol>
              </div>
            )}
          </aside>
        </div>
      </main>
      
      <footer className="border-t border-border mt-auto py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Student Grading System • 8-Point Scale • Supports up to 50 students per class
        </div>
      </footer>
    </div>
  );
};

export default Index;
