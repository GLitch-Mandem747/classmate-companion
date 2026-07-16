import { useState } from 'react';
import { JuniorDataImport } from '@/components/JuniorDataImport';
import { JuniorResultsTable } from '@/components/JuniorResultsTable';
import { JuniorStudentData, JuniorStudentResult, calculateJuniorStudentResults } from '@/lib/juniorGrading';
import { exportJuniorToExcel, exportJuniorToWord, exportJuniorReportCards, previewJuniorReportCard } from '@/lib/export';
import { RemarksPanel, RemarkStudent } from '@/components/RemarksPanel';
import { ReportCardPreview } from '@/components/ReportCardPreview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, Users, FileText, Check, ArrowLeft, FileSpreadsheet, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GradingScale } from '@/components/GradingScale';
import { toast } from '@/hooks/use-toast';

interface JuniorTestData {
  name: string;
  results: JuniorStudentResult[];
}

interface JuniorIndexProps {
  onBack: () => void;
}

function juniorToRemarkStudents(results: JuniorStudentResult[]): RemarkStudent[] {
  return results.map(r => {
    const subjects = r.subjectNames.map(name => ({
      subject: name,
      score: r.subjects[name] || 0,
      grade: r.grades[name] || '8',
    }));
    return {
      id: r.id,
      name: r.name,
      overallGradePoints: r.overallGradePoints,
      rank: r.rank,
      subjects,
    };
  });
}

const JuniorIndex = ({ onBack }: JuniorIndexProps) => {
  const [rawStudents, setRawStudents] = useState<[JuniorStudentData[] | null, JuniorStudentData[] | null, JuniorStudentData[] | null]>([null, null, null]);
  const [tests, setTests] = useState<[JuniorTestData | null, JuniorTestData | null, JuniorTestData | null]>([null, null, null]);
  const [activeTest, setActiveTest] = useState<0 | 1 | 2>(0);
  const [testName, setTestName] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [approvedRemarks, setApprovedRemarks] = useState<Map<string, string>>(new Map());
  const [className, setClassName] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [term, setTerm] = useState('');
  const [mandatorySubjects, setMandatorySubjects] = useState<string[]>([]);

  const handleImport = (students: JuniorStudentData[]) => {
    const calculated = calculateJuniorStudentResults(students, mandatorySubjects);
    const name = testName.trim() || `Test ${activeTest + 1}`;

    const newRaw = [...rawStudents] as [JuniorStudentData[] | null, JuniorStudentData[] | null, JuniorStudentData[] | null];
    newRaw[activeTest] = students;
    setRawStudents(newRaw);
    
    const newTests = [...tests] as [JuniorTestData | null, JuniorTestData | null, JuniorTestData | null];
    newTests[activeTest] = { name, results: calculated };
    setTests(newTests);
    setShowImport(false);
    setTestName('');
  };

  const handleToggleMandatory = (subjectKey: string) => {
    let newMandatory: string[];
    if (mandatorySubjects.includes(subjectKey)) {
      newMandatory = mandatorySubjects.filter(s => s !== subjectKey);
    } else {
      if (mandatorySubjects.length >= 4) return;
      newMandatory = [...mandatorySubjects, subjectKey];
    }
    setMandatorySubjects(newMandatory);
    // Recalculate all loaded tests
    const newTests = [...tests] as [JuniorTestData | null, JuniorTestData | null, JuniorTestData | null];
    rawStudents.forEach((students, idx) => {
      if (students && tests[idx]) {
        newTests[idx] = {
          name: tests[idx]!.name,
          results: calculateJuniorStudentResults(students, newMandatory),
        };
      }
    });
    setTests(newTests);
  };

  const handleClearTest = (index: 0 | 1 | 2) => {
    const newTests = [...tests] as [JuniorTestData | null, JuniorTestData | null, JuniorTestData | null];
    newTests[index] = null;
    setTests(newTests);
    const newRaw = [...rawStudents] as [JuniorStudentData[] | null, JuniorStudentData[] | null, JuniorStudentData[] | null];
    newRaw[index] = null;
    setRawStudents(newRaw);
    if (activeTest === index) setShowImport(false);
  };

  const handleClearAll = () => {
    setTests([null, null, null]);
    setRawStudents([null, null, null]);
    setShowImport(false);
    setApprovedRemarks(new Map());
  };

  const handleExportExcel = () => {
    if (!currentTest) return;
    exportJuniorToExcel(currentTest.results, currentTest.name.replace(/\s+/g, '_'));
    toast({ title: 'Export Complete', description: 'Results exported to Excel (CSV) file.' });
  };

  const handleExportWord = () => {
    if (!currentTest) return;
    exportJuniorToWord(currentTest.results, 'Junior School Results');
    toast({ title: 'Export Complete', description: 'Results exported to Word file.' });
  };

  const currentTest = tests[activeTest];
  const hasAnyData = tests.some(t => t !== null);
  const allTestsLoaded = tests.every(t => t !== null);
  const latestResults = tests[2]?.results || tests[1]?.results || tests[0]?.results || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack} className="text-green-500 hover:text-green-400 hover:bg-green-900/20">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-green-500">Junior Grading System</h1>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8 space-y-6">
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
                      hasData ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' 
                        : isActive ? 'bg-green-700 hover:bg-green-800 text-white' 
                          : 'border-green-700 text-green-500 hover:bg-green-900/20'
                    }`}
                    onClick={() => { setActiveTest(index as 0 | 1 | 2); setShowImport(false); }}
                  >
                    {hasData && <Check className="h-4 w-4 mr-2" />}
                    {test?.name || `Test ${index + 1}`}
                  </Button>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {!currentTest && !showImport && (
                <Button onClick={() => setShowImport(true)} className="bg-green-700 hover:bg-green-800 text-white">
                  Import Test {activeTest + 1} Data
                </Button>
              )}
              {currentTest && (
                <>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{currentTest.results.length} students loaded</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleClearTest(activeTest)} className="border-green-700 text-green-500 hover:bg-green-900/20">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Clear {currentTest.name}
                  </Button>
                </>
              )}
              {hasAnyData && (
                <Button variant="destructive" size="sm" onClick={handleClearAll}>Clear All Tests</Button>
              )}
            </div>
          </CardContent>
        </Card>

        {showImport && !currentTest && (
          <Card className="animate-fade-in border-green-700">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-green-500">Name Your Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Input placeholder={`e.g., Term 1 Test ${activeTest + 1}`} value={testName} onChange={(e) => setTestName(e.target.value)} className="max-w-xs border-green-700 focus:ring-green-500" />
              </div>
              <JuniorDataImport onImport={handleImport} />
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            {currentTest && (
              <>
                <Card className="animate-fade-in">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Download className="h-5 w-5 text-green-500" />
                      Export Results
                    </CardTitle>
                    <CardDescription>Export current test results to Excel or Word format</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Button onClick={handleExportExcel} variant="secondary" className="w-full">
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Export to Excel
                      </Button>
                      <Button onClick={handleExportWord} variant="secondary" className="w-full">
                        <FileText className="h-4 w-4 mr-2" />
                        Export to Word
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <JuniorResultsTable
                  results={currentTest.results}
                  mandatorySubjects={mandatorySubjects}
                  onToggleMandatory={handleToggleMandatory}
                />
              </>
            )}
            
            {!currentTest && !showImport && (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Select a test above and click "Import" to add student data</p>
              </Card>
            )}

            {allTestsLoaded && latestResults.length > 0 && (
              <RemarksPanel
                students={juniorToRemarkStudents(latestResults)}
                totalStudents={latestResults.length}
                onRemarksChange={setApprovedRemarks}
              />
            )}

            {allTestsLoaded && (
              <Card className="animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5 text-green-500" />
                    Generate Report Cards
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Class Name</label>
                      <Input placeholder="e.g., Grade 9A" value={className} onChange={(e) => setClassName(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Teacher Surname</label>
                      <Input placeholder="e.g., Mr. Banda" value={teacherName} onChange={(e) => setTeacherName(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Term</label>
                      <Input placeholder="e.g., Term 1 2026" value={term} onChange={(e) => setTerm(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      onClick={async () => {
                        if (!className.trim() || !teacherName.trim() || !term.trim()) {
                          toast({ title: 'Missing Info', description: 'Please enter the class name, teacher name, and term.', variant: 'destructive' });
                          return;
                        }
                        await exportJuniorReportCards(tests, "ST. DOMINIC'S BOYS SECONDARY SCHOOL", term, className, teacherName, approvedRemarks, mandatorySubjects);
                        toast({ title: 'Report Cards Generated', description: 'Report cards have been downloaded.' });
                      }}
                      className="w-full sm:w-auto bg-green-700 hover:bg-green-800 text-white"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Report Cards
                    </Button>
                    <ReportCardPreview
                      studentNames={latestResults.map(r => r.name)}
                      generatePreview={(name) =>
                        previewJuniorReportCard(tests, name, "ST. DOMINIC'S BOYS SECONDARY SCHOOL", term || 'Term', className || 'Class', teacherName || 'Teacher', approvedRemarks, mandatorySubjects)
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          <aside className="space-y-6">
            <GradingScale />
            <div className="bg-card rounded-lg p-4 border border-green-700">
              <h3 className="font-semibold text-green-500 mb-2">Quick Start</h3>
              <ol className="text-sm text-muted-foreground space-y-2">
                <li className="flex gap-2"><span className="text-green-500 font-bold">1.</span>Select a test (1, 2, or 3)</li>
                <li className="flex gap-2"><span className="text-green-500 font-bold">2.</span>Name it and import data</li>
                <li className="flex gap-2"><span className="text-green-500 font-bold">3.</span>Click circles to set mandatory subjects</li>
                <li className="flex gap-2"><span className="text-green-500 font-bold">4.</span>Generate & approve AI remarks</li>
                <li className="flex gap-2"><span className="text-green-500 font-bold">5.</span>Export report cards</li>
              </ol>
            </div>
          </aside>
        </div>
      </main>
      
      <footer className="border-t border-border mt-auto py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Junior Grading System • 8-Point Scale
        </div>
        <div className="container mx-auto px-4 text-center mt-2">
          <p className="text-xs font-bold tracking-[0.3em] text-muted-foreground">SOFTWAREARMY</p>
        </div>
      </footer>
    </div>
  );
};

export default JuniorIndex;
