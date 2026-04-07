import { useState, useCallback } from 'react';
import { DataImport } from '@/components/DataImport';
import { ResultsTable } from '@/components/ResultsTable';
import { GradingScale } from '@/components/GradingScale';
import { ExportPanel } from '@/components/ExportPanel';
import { RemarksPanel, RemarkStudent } from '@/components/RemarksPanel';
import { ReportCardPreview } from '@/components/ReportCardPreview';
import { StudentData, StudentResult, calculateStudentResults, SUBJECT_LABELS } from '@/lib/grading';
import { TestData, exportReportCards, previewSeniorReportCard } from '@/lib/export';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, Users, FileText, Check, ArrowLeft, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

interface SeniorDashboardProps {
  onBack?: () => void;
}

export const SeniorDashboard = ({ onBack }: SeniorDashboardProps) => {
  const [rawStudents, setRawStudents] = useState<[StudentData[] | null, StudentData[] | null, StudentData[] | null]>([null, null, null]);
  const [tests, setTests] = useState<[TestData | null, TestData | null, TestData | null]>([null, null, null]);
  const [activeTest, setActiveTest] = useState<0 | 1 | 2>(0);
  const [testName, setTestName] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [approvedRemarks, setApprovedRemarks] = useState<Map<string, string>>(new Map());
  const [className, setClassName] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [term, setTerm] = useState('');
  const [mandatorySubjects, setMandatorySubjects] = useState<string[]>([]);

  // Recalculate all tests when mandatory subjects change
  const recalculate = useCallback((raw: [StudentData[] | null, StudentData[] | null, StudentData[] | null], mandatory: string[], currentTests: [TestData | null, TestData | null, TestData | null]) => {
    const newTests = [...currentTests] as [TestData | null, TestData | null, TestData | null];
    raw.forEach((students, idx) => {
      if (students && currentTests[idx]) {
        newTests[idx] = {
          name: currentTests[idx]!.name,
          results: calculateStudentResults(students, mandatory),
        };
      }
    });
    return newTests;
  }, []);

  const handleImport = (students: StudentData[]) => {
    const calculated = calculateStudentResults(students, mandatorySubjects);
    const name = testName.trim() || `Test ${activeTest + 1}`;

    const newRaw = [...rawStudents] as [StudentData[] | null, StudentData[] | null, StudentData[] | null];
    newRaw[activeTest] = students;
    setRawStudents(newRaw);

    const newTests = [...tests] as [TestData | null, TestData | null, TestData | null];
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
    const newTests = recalculate(rawStudents, newMandatory, tests);
    setTests(newTests);
  };

  const handleClearTest = (index: 0 | 1 | 2) => {
    const newTests = [...tests] as [TestData | null, TestData | null, TestData | null];
    newTests[index] = null;
    setTests(newTests);
    const newRaw = [...rawStudents] as [StudentData[] | null, StudentData[] | null, StudentData[] | null];
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

  const handleExportReportCards = async () => {
    if (!className.trim() || !teacherName.trim() || !term.trim()) {
      toast({
        title: 'Missing Info',
        description: 'Please enter the class name, teacher name, and term before generating report cards.',
        variant: 'destructive',
      });
      return;
    }
    await exportReportCards(tests, "ST. DOMINIC'S BOYS SECONDARY SCHOOL", term, className, teacherName, approvedRemarks, mandatorySubjects);
    toast({ title: 'Report Cards Generated', description: 'Report cards have been downloaded.' });
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
            {onBack && (
              <Button variant="ghost" onClick={onBack} className="text-primary hover:text-primary/80 hover:bg-primary/10">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
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
                    className={`min-w-[140px] transition-all ${hasData ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' : isActive ? 'bg-primary hover:bg-primary/90' : 'hover:bg-primary/10'}`}
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
                <Button onClick={() => setShowImport(true)}>Import Test {activeTest + 1} Data</Button>
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
                <Button variant="destructive" size="sm" onClick={handleClearAll}>Clear All Tests</Button>
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
                <Input placeholder={`e.g., Term 1 Test ${activeTest + 1}`} value={testName} onChange={(e) => setTestName(e.target.value)} className="max-w-xs" />
              </div>
              <DataImport onImport={handleImport} />
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            {currentTest && (
              <>
                <ResultsTable
                  results={currentTest.results}
                  mandatorySubjects={mandatorySubjects}
                  onToggleMandatory={handleToggleMandatory}
                />
                <ExportPanel currentResults={currentTest.results} />
              </>
            )}

            {!currentTest && !showImport && (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Select a test above and click "Import" to add student data</p>
              </Card>
            )}

            {allTestsLoaded && latestResults.length > 0 && (
              <RemarksPanel
                students={latestResults.map(r => ({
                  id: r.id,
                  name: r.name,
                  overallGradePoints: r.overallGradePoints,
                  rank: r.rank,
                  subjects: [
                    { subject: 'English', score: r.english, grade: r.grades.english },
                    { subject: 'Mathematics', score: r.math, grade: r.grades.math },
                    { subject: 'Biology', score: r.biology, grade: r.grades.biology },
                    { subject: 'Science', score: r.science, grade: r.grades.science },
                    { subject: 'Civic Education', score: r.civic, grade: r.grades.civic },
                    { subject: 'Religious Education', score: r.re, grade: r.grades.re },
                    { subject: 'History', score: r.history, grade: r.grades.history },
                    { subject: 'Design & Technology', score: r.dAndT, grade: r.grades.dAndT },
                  ],
                } as RemarkStudent))}
                totalStudents={latestResults.length}
                onRemarksChange={setApprovedRemarks}
              />
            )}

            {allTestsLoaded && (
              <Card className="animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5 text-primary" />
                    Generate Report Cards
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Class Name</label>
                      <Input placeholder="e.g., Form 4A" value={className} onChange={(e) => setClassName(e.target.value)} />
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
                    <Button onClick={handleExportReportCards} className="w-full sm:w-auto">
                      <Download className="h-4 w-4 mr-2" />
                      Download Report Cards
                    </Button>
                    <ReportCardPreview
                      studentNames={latestResults.map(r => r.name)}
                      generatePreview={(name) =>
                        previewSeniorReportCard(tests, name, "ST. DOMINIC'S BOYS SECONDARY SCHOOL", term || 'Term', className || 'Class', teacherName || 'Teacher', approvedRemarks, mandatorySubjects)
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <aside className="space-y-6">
            <GradingScale />
            <div className="bg-card rounded-lg p-4 border border-border">
              <h3 className="font-semibold text-foreground mb-2">Quick Start</h3>
              <ol className="text-sm text-muted-foreground space-y-2">
                <li className="flex gap-2"><span className="text-primary font-bold">1.</span>Select a test (1, 2, or 3)</li>
                <li className="flex gap-2"><span className="text-primary font-bold">2.</span>Name it and import data</li>
                <li className="flex gap-2"><span className="text-primary font-bold">3.</span>Click circles to set mandatory subjects</li>
                <li className="flex gap-2"><span className="text-primary font-bold">4.</span>Generate & approve AI remarks</li>
                <li className="flex gap-2"><span className="text-primary font-bold">5.</span>Export report cards</li>
              </ol>
            </div>
          </aside>
        </div>
      </main>

      <footer className="border-t border-border mt-auto py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Senior Grading System • Grades 1-7 & 9 • Supports up to 50 students per class
        </div>
      </footer>
    </div>
  );
};
