import { useState } from 'react';
import { Header } from '@/components/Header';
import { DataImport } from '@/components/DataImport';
import { ResultsTable } from '@/components/ResultsTable';
import { GradingScale } from '@/components/GradingScale';
import { ExportPanel } from '@/components/ExportPanel';
import { SchoolReport } from '@/components/SchoolReport';
import { StudentData, StudentResult, calculateStudentResults } from '@/lib/grading';
import { TestData } from '@/lib/export';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, Users, FileText, Check, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Index = () => {
  const [tests, setTests] = useState<[TestData | null, TestData | null, TestData | null]>([null, null, null]);
  const [activeTest, setActiveTest] = useState<0 | 1 | 2>(0);
  const [testName, setTestName] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentResult | null>(null);
  const [showReport, setShowReport] = useState(false);

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

  const handleViewReport = (student: StudentResult) => {
    setSelectedStudent(student);
    setShowReport(true);
  };

  const currentTest = tests[activeTest];
  const hasAnyData = tests.some(t => t !== null);

  // If showing report, render only the report
  if (showReport && selectedStudent && selectedStudent.subjects) {
    return (
      <>
        <div className="no-print p-4 bg-gray-900">
          <Button onClick={() => setShowReport(false)} variant="outline">
            ← Back to Dashboard
          </Button>
        </div>
        <SchoolReport
          studentName={selectedStudent.name.toUpperCase()}
          className="G11 – MARTYRS"
          entryResults="513"
          term="TERM THREE – 2025"
          subjects={selectedStudent.subjects.map(s => ({
            name: s.subject.toUpperCase(),
            test1: Math.round(s.score * 0.8),
            test2: Math.round(s.score * 0.9),
            endOfTerm: s.score
          }))}
          pointsInBestSix={selectedStudent.bestSixPoints || selectedStudent.overallGradePoints}
          position={`${selectedStudent.rank} / ${currentTest?.results.length || 0}`}
          teacherName="MR. SINYANGWE"
          remarks="An outstanding student who consistently excels and maintains excellent academic performance. He is a consistent leaner and shows great dedication towards studies, encourage him to study extra hard for better results. Keep it up."
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Test Selection Buttons */}
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
            
            {/* Import Button for selected test */}
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

        {/* Test Name Input + Import Section */}
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
                {/* Results Table with View Report Button */}
                <Card>
                  <CardHeader>
                    <CardTitle>Student Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Rank</th>
                            <th className="text-left p-2">Name</th>
                            <th className="text-center p-2">Best 6 Points</th>
                            <th className="text-center p-2">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentTest.results.map((student) => (
                            <tr key={student.name} className="border-b">
                              <td className="p-2">{student.rank}</td>
                              <td className="p-2">{student.name}</td>
                              <td className="text-center p-2">{student.bestSixPoints || student.overallGradePoints}</td>
                              <td className="text-center p-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewReport(student)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Report
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
                <ResultsTable results={currentTest.results} />
                <ExportPanel tests={tests} currentResults={currentTest.results} />
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
                <li className="flex gap-2">
                  <span className="text-primary font-bold">4.</span>
                  Click "View Report" to see individual reports
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
          Student Grading System • 8-Point Scale • Supports up to 50 students per class
        </div>
      </footer>
    </div>
  );
};

export default Index;
