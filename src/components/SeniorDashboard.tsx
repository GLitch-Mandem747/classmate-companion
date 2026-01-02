import { useState } from 'react';
import { DataImport } from '@/components/DataImport';
import { ResultsTable } from '@/components/ResultsTable';
import { GradingScale } from '@/components/GradingScale';
import { ExportPanel } from '@/components/ExportPanel';
import { StudentData, StudentResult, calculateStudentResults } from '@/lib/grading';
import { TestData } from '@/lib/export';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, Users, FileText, Check, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SeniorDashboardProps {
  onBack: () => void;
}

export const SeniorDashboard = ({ onBack }: SeniorDashboardProps) => {
  const [tests, setTests] = useState<[TestData | null, TestData | null, TestData | null]>([null, null, null]);
  const [activeTest, setActiveTest] = useState<0 | 1 | 2>(0);
  const [testName, setTestName] = useState('');
  const [showImport, setShowImport] = useState(false);

  const handleImport = (students: StudentData[]) => {
    const calculated = calculateStudentResults(students);
    const name = testName.trim() || `Test ${activeTest + 1}`;
    
    const newTests = [...tests] as [TestData | null, TestData | null, TestData | null];
    newTests[activeTest] = { name, results: calculated };
    setTests(newTests);
    setShowImport(false);
    setTestName('');
  };

  const handleClearTest = (index: 0 | 1 | 2) => {
    const newTests = [...tests] as [TestData | null, TestData | null, TestData | null];
    newTests[index] = null;
    setTests(newTests);
    if (activeTest === index) {
      setShowImport(false);
    }
  };

  const handleClearAll = () => {
    setTests([null, null, null]);
    setShowImport(false);
  };

  const currentTest = tests[activeTest];
  const hasAnyData = tests.some(t => t !== null);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={onBack}
              className="text-primary hover:text-primary/80 hover:bg-primary/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-primary">Senior Grading System</h1>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8 space-y-6">
        <Card className="animate-fade-in">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              Select Test
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {[0, 1, 2].map((index) => {
                const test = tests[index as 0 | 1 | 2];
                const isActive = activeTest === index;
                const hasData = test !== null;
                
                return (
                  <Button
                    key={index}
                    variant={isActive ? "default" : "outline"}
                    className={`min-w-[140px] transition-all ${
                      hasData 
                        ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' 
                        : isActive 
                          ? 'bg-primary hover:bg-primary/90' 
                          : 'hover:bg-primary/10'
                    }`}
                    onClick={() => {
                      setActiveTest(index as 0 | 1 | 2);
                      setShowImport(false);
                    }}
                  >
                    {hasData && <Check className="h-4 w-4 mr-2" />}
                    {test?.name || `Test ${index + 1}`}
                  </Button>
                );
              })}
            </div>
            
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {!currentTest && !showImport && (
                <Button onClick={() => setShowImport(true)}>
                  Import Test {activeTest + 1} Data
                </Button>
              )}
              {currentTest && (
                <>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{currentTest.results.length} students loaded</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleClearTest(activeTest)}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Clear {currentTest.name}
                  </Button>
                </>
              )}
              {hasAnyData && (
                <Button variant="destructive" size="sm" onClick={handleClearAll}>
                  Clear All Tests
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {showImport && !currentTest && (
          <Card className="animate-fade-in border-primary">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Name Your Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Input
                  placeholder={`e.g., Term 1 Test ${activeTest + 1}`}
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  className="max-w-xs"
                />
              </div>
              <DataImport onImport={handleImport} />
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            {currentTest && (
              <>
                <ResultsTable results={currentTest.results} />
                <ExportPanel currentResults={currentTest.results} />
              </>
            )}
            
            {!currentTest && !showImport && (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">
                  Select a test above and click "Import" to add student data
                </p>
              </Card>
            )}
          </div>
          
          <aside className="space-y-6">
            <GradingScale />
            
            <div className="bg-card rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-foreground mb-2">Quick Start</h3>
              <ol className="text-sm text-muted-foreground space-y-2">
                <li className="flex gap-2">
                  <span className="text-primary font-bold">1.</span>
                  Select a test (1, 2, or 3)
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">2.</span>
                  Name it and import data
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">3.</span>
                  View grades & export results
                </li>
              </ol>
              <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                Blue = empty • Green = data loaded
              </p>
            </div>
          </aside>
        </div>
      </main>
      
      <footer className="border-t border-border mt-auto py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Senior Grading System • 8-Point Scale • Supports up to 50 students per class
        </div>
      </footer>
    </div>
  );
};
