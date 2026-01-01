import { useState } from 'react';
import { JuniorDataImport } from '@/components/JuniorDataImport';
import { SchoolReport } from '@/components/SchoolReport';
import { JuniorStudentData, JuniorStudentResult, calculateJuniorStudentResults } from '@/lib/juniorGrading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, Users, FileText, Check, Eye, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GradingScale } from '@/components/GradingScale';

interface JuniorTestData {
  name: string;
  results: JuniorStudentResult[];
}

interface JuniorIndexProps {
  onBack: () => void;
}

const JuniorIndex = ({ onBack }: JuniorIndexProps) => {
  const [tests, setTests] = useState<[JuniorTestData | null, JuniorTestData | null, JuniorTestData | null]>([null, null, null]);
  const [activeTest, setActiveTest] = useState<0 | 1 | 2>(0);
  const [testName, setTestName] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<JuniorStudentResult | null>(null);
  const [showReport, setShowReport] = useState(false);

  const handleImport = (students: JuniorStudentData[]) => {
    const calculated = calculateJuniorStudentResults(students);
    const name = testName.trim() || `Test ${activeTest + 1}`;
    
    const newTests = [...tests] as [JuniorTestData | null, JuniorTestData | null, JuniorTestData | null];
    newTests[activeTest] = { name, results: calculated };
    setTests(newTests);
    setShowImport(false);
    setTestName('');
  };

  const handleClearTest = (index: 0 | 1 | 2) => {
    const newTests = [...tests] as [JuniorTestData | null, JuniorTestData | null, JuniorTestData | null];
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

  const handleViewReport = (student: JuniorStudentResult) => {
    setSelectedStudent(student);
    setShowReport(true);
  };

  const currentTest = tests[activeTest];
  const hasAnyData = tests.some(t => t !== null);

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
          className="JUNIOR CLASS"
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
          remarks="An outstanding student who consistently excels and maintains excellent academic performance."
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Junior Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={onBack}
              className="text-green-500 hover:text-green-400 hover:bg-green-900/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-green-500">Junior Grading System</h1>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Test Selection Buttons */}
        <Card className="animate-fade-in">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-green-500" />
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
                          ? 'bg-green-700 hover:bg-green-800 text-white' 
                          : 'border-green-700 text-green-500 hover:bg-green-900/20'
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
                <Button 
                  onClick={() => setShowImport(true)}
                  className="bg-green-700 hover:bg-green-800 text-white"
                >
                  Import Test {activeTest + 1} Data
                </Button>
              )}
              {currentTest && (
                <>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{currentTest.results.length} students loaded</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleClearTest(activeTest)}
                    className="border-green-700 text-green-500 hover:bg-green-900/20"
                  >
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
          <Card className="animate-fade-in border-green-700">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-green-500">Name Your Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Input
                  placeholder={`e.g., Term 1 Test ${activeTest + 1}`}
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  className="max-w-xs border-green-700 focus:ring-green-500"
                />
              </div>
              <JuniorDataImport onImport={handleImport} />
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            {currentTest && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-500">Student Results</CardTitle>
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
                                className="border-green-700 text-green-500 hover:bg-green-900/20"
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
            
            <div className="bg-card rounded-lg p-4 border border-green-700">
              <h3 className="font-semibold text-green-500 mb-2">Junior System Format</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Required columns: <span className="text-green-500">English, Math</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Optional: Any additional subjects
              </p>
            </div>
          </aside>
        </div>
      </main>
      
      <footer className="border-t border-border mt-auto py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Junior Grading System • 8-Point Scale
        </div>
      </footer>
    </div>
  );
};

export default JuniorIndex;
