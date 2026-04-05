import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { 
  ArrowLeft, Plus, FileText, Sparkles, Download, Check, X, 
  Loader2, Users, Trash2, Edit
} from 'lucide-react';
import { DataImport } from '@/components/DataImport';
import { JuniorDataImport } from '@/components/JuniorDataImport';
import { ResultsTable } from '@/components/ResultsTable';
import { JuniorResultsTable } from '@/components/JuniorResultsTable';
import { GradingScale } from '@/components/GradingScale';
import { StudentResult, StudentData, calculateStudentResults } from '@/lib/grading';
import { JuniorStudentResult, JuniorStudentData, calculateJuniorStudentResults } from '@/lib/juniorGrading';
import { exportReportCards, TestData } from '@/lib/export';

interface ClassData {
  id: string;
  name: string;
  teacher_surname: string;
  term: string;
  year: number;
  grading_system: string;
}

interface StudentRemark {
  id: string;
  student_id: string;
  test_number: number;
  ai_generated_remark: string | null;
  approved_remark: string | null;
  is_approved: boolean;
}

const ClassView = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Test data management
  const [tests, setTests] = useState<[TestData | null, TestData | null, TestData | null]>([null, null, null]);
  const [activeTest, setActiveTest] = useState<0 | 1 | 2>(0);
  const [showImport, setShowImport] = useState(false);
  const [testName, setTestName] = useState('');

  // Junior tests
  const [juniorTests, setJuniorTests] = useState<[JuniorStudentResult[] | null, JuniorStudentResult[] | null, JuniorStudentResult[] | null]>([null, null, null]);

  // Remarks management
  const [remarks, setRemarks] = useState<Map<string, StudentRemark>>(new Map());
  const [generatingRemarks, setGeneratingRemarks] = useState<Set<string>>(new Set());
  const [remarkDialogOpen, setRemarkDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<{name: string, id: string, remark: StudentRemark | null} | null>(null);
  const [editedRemark, setEditedRemark] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && classId) {
      fetchClassData();
    }
  }, [user, classId]);

  const fetchClassData = async () => {
    if (!classId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('id', classId)
      .single();

    if (error || !data) {
      console.error('Error fetching class:', error);
      toast({ title: 'Error', description: 'Failed to load class', variant: 'destructive' });
      navigate('/dashboard');
    } else {
      setClassData(data);
    }
    setLoading(false);
  };

  const handleImport = (students: StudentData[]) => {
    const calculated = calculateStudentResults(students);
    const name = testName.trim() || `Test ${activeTest + 1}`;
    
    const newTests = [...tests] as [TestData | null, TestData | null, TestData | null];
    newTests[activeTest] = { name, results: calculated };
    setTests(newTests);
    setShowImport(false);
    setTestName('');
  };

  const handleJuniorImport = (students: JuniorStudentData[]) => {
    const calculated = calculateJuniorStudentResults(students);
    
    const newTests = [...juniorTests] as [JuniorStudentResult[] | null, JuniorStudentResult[] | null, JuniorStudentResult[] | null];
    newTests[activeTest] = calculated;
    setJuniorTests(newTests);
    setShowImport(false);
    setTestName('');
  };

  const handleClearTest = (index: 0 | 1 | 2) => {
    if (classData?.grading_system === 'junior') {
      const newTests = [...juniorTests] as [JuniorStudentResult[] | null, JuniorStudentResult[] | null, JuniorStudentResult[] | null];
      newTests[index] = null;
      setJuniorTests(newTests);
    } else {
      const newTests = [...tests] as [TestData | null, TestData | null, TestData | null];
      newTests[index] = null;
      setTests(newTests);
    }
    if (activeTest === index) {
      setShowImport(false);
    }
  };

  const generateAIRemark = async (student: StudentResult | JuniorStudentResult) => {
    const studentKey = `${student.name}-${activeTest}`;
    setGeneratingRemarks(prev => new Set(prev).add(studentKey));

    try {
      // Build subjects array for the AI
      let subjects: { subject: string; score: number; grade: string }[] = [];
      let gradePoints = 0;
      let rank = student.rank;
      let totalStudents = 0;

      if ('subjects' in student) {
        // Senior student
        subjects = student.subjects;
        gradePoints = student.overallGradePoints;
        totalStudents = tests[activeTest]?.results.length || 0;
      } else {
        // Junior student
        subjects = [
          { subject: 'English', score: student.english, grade: student.grades['english'] },
          { subject: 'Math', score: student.math, grade: student.grades['math'] },
          ...Object.entries(student.optionalSubjects).map(([subj, score]) => ({
            subject: subj,
            score,
            grade: student.grades[subj.toLowerCase()] || '9'
          }))
        ];
        gradePoints = student.overallGradePoints;
        totalStudents = juniorTests[activeTest]?.length || 0;
      }

      const { data, error } = await supabase.functions.invoke('generate-remarks', {
        body: {
          student: {
            name: student.name,
            gradePoints,
            rank,
            totalStudents,
            subjects
          }
        }
      });

      if (error) throw error;

      const generatedRemark = data.remark;
      
      // Update local state
      const remarkKey = `${student.name}-${activeTest}`;
      const newRemark: StudentRemark = {
        id: remarkKey,
        student_id: student.name,
        test_number: activeTest + 1,
        ai_generated_remark: generatedRemark,
        approved_remark: null,
        is_approved: false
      };
      
      setRemarks(prev => new Map(prev).set(remarkKey, newRemark));
      toast({ title: 'Remark generated', description: `AI remark generated for ${student.name}` });
    } catch (error) {
      console.error('Error generating remark:', error);
      toast({ title: 'Error', description: 'Failed to generate AI remark', variant: 'destructive' });
    } finally {
      setGeneratingRemarks(prev => {
        const next = new Set(prev);
        next.delete(studentKey);
        return next;
      });
    }
  };

  const openRemarkDialog = (student: StudentResult | JuniorStudentResult) => {
    const remarkKey = `${student.name}-${activeTest}`;
    const remark = remarks.get(remarkKey) || null;
    
    setSelectedStudent({
      name: student.name,
      id: student.name,
      remark
    });
    setEditedRemark(remark?.approved_remark || remark?.ai_generated_remark || '');
    setRemarkDialogOpen(true);
  };

  const handleApproveRemark = () => {
    if (!selectedStudent) return;

    const remarkKey = `${selectedStudent.name}-${activeTest}`;
    const currentRemark = remarks.get(remarkKey);
    
    const updatedRemark: StudentRemark = {
      id: remarkKey,
      student_id: selectedStudent.name,
      test_number: activeTest + 1,
      ai_generated_remark: currentRemark?.ai_generated_remark || null,
      approved_remark: editedRemark,
      is_approved: true
    };

    setRemarks(prev => new Map(prev).set(remarkKey, updatedRemark));
    setRemarkDialogOpen(false);
    toast({ title: 'Remark approved', description: `Remark for ${selectedStudent.name} has been approved` });
  };

  const handleExportReports = () => {
    if (!classData) return;

    // Build remarks map from approved remarks
    const remarksMap = new Map<string, string>();
    remarks.forEach((remark, key) => {
      if (remark.is_approved && remark.approved_remark) {
        // Key format is "studentName-testIndex", extract student name
        const studentName = key.substring(0, key.lastIndexOf('-'));
        remarksMap.set(studentName, remark.approved_remark);
      }
    });

    exportReportCards(
      tests,
      'ST. DOMINIC\'S BOYS SECONDARY SCHOOL',
      `${classData.term} ${classData.year}`,
      classData.name,
      classData.teacher_surname,
      remarksMap
    );
    toast({ title: 'Reports exported', description: 'Report cards have been downloaded' });
  };

  const currentTest = classData?.grading_system === 'junior' 
    ? juniorTests[activeTest] 
    : tests[activeTest];
  const hasAnyData = classData?.grading_system === 'junior'
    ? juniorTests.some(t => t !== null)
    : tests.some(t => t !== null);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!classData) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-bold text-primary">{classData.name}</h1>
              <p className="text-sm text-muted-foreground">
                {classData.teacher_surname} • {classData.term} {classData.year}
              </p>
            </div>
          </div>
          {hasAnyData && classData.grading_system === 'senior' && (
            <Button onClick={handleExportReports}>
              <Download className="h-4 w-4 mr-2" />
              Export Report Cards
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Test Selection */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              Select Test
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {[0, 1, 2].map((index) => {
                const test = classData.grading_system === 'junior' 
                  ? juniorTests[index as 0 | 1 | 2]
                  : tests[index as 0 | 1 | 2];
                const isActive = activeTest === index;
                const hasData = test !== null;
                const testLabel = index === 2 ? 'End of Term' : `Test ${index + 1}`;
                
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
                    {testLabel}
                  </Button>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {!currentTest && !showImport && (
                <Button onClick={() => setShowImport(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Import Test Data
                </Button>
              )}
              {currentTest && (
                <>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>
                      {Array.isArray(currentTest) ? currentTest.length : currentTest.results.length} students loaded
                    </span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleClearTest(activeTest)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Test
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Import Section */}
        {showImport && !currentTest && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle>Import Student Data</CardTitle>
            </CardHeader>
            <CardContent>
              {classData.grading_system === 'junior' ? (
                <JuniorDataImport onImport={handleJuniorImport} />
              ) : (
                <DataImport onImport={handleImport} />
              )}
            </CardContent>
          </Card>
        )}

        {/* Results Table with AI Remarks */}
        {currentTest && (
          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            <div className="space-y-6">
              {classData.grading_system === 'junior' && Array.isArray(currentTest) ? (
                <JuniorResultsTable results={currentTest} />
              ) : !Array.isArray(currentTest) ? (
                <ResultsTable results={currentTest.results} mandatorySubjects={[]} onToggleMandatory={() => {}} />
              ) : null}

              {/* AI Remarks Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI Teacher Remarks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate AI-powered remarks for each student based on their performance. 
                    You can edit and approve remarks before including them in reports.
                  </p>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {(classData.grading_system === 'junior' && Array.isArray(currentTest) 
                      ? currentTest 
                      : !Array.isArray(currentTest) ? currentTest.results : []
                    ).map((student) => {
                      const remarkKey = `${student.name}-${activeTest}`;
                      const remark = remarks.get(remarkKey);
                      const isGenerating = generatingRemarks.has(remarkKey);

                      return (
                        <div 
                          key={student.name}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{student.name}</p>
                            {remark?.is_approved ? (
                              <p className="text-sm text-green-600 flex items-center gap-1">
                                <Check className="h-3 w-3" />
                                Remark approved
                              </p>
                            ) : remark?.ai_generated_remark ? (
                              <p className="text-sm text-yellow-600">Pending approval</p>
                            ) : null}
                          </div>
                          <div className="flex gap-2">
                            {!remark?.ai_generated_remark && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => generateAIRemark(student)}
                                disabled={isGenerating}
                              >
                                {isGenerating ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Sparkles className="h-4 w-4 mr-1" />
                                    Generate
                                  </>
                                )}
                              </Button>
                            )}
                            {remark?.ai_generated_remark && (
                              <Button 
                                size="sm"
                                variant={remark.is_approved ? "outline" : "default"}
                                onClick={() => openRemarkDialog(student)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                {remark.is_approved ? 'Edit' : 'Review'}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <aside className="space-y-6">
              <GradingScale />
            </aside>
          </div>
        )}

        {/* Empty State */}
        {!currentTest && !showImport && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              Select a test above and click "Import Test Data" to add student scores
            </p>
          </Card>
        )}
      </main>

      {/* Remark Dialog */}
      <Dialog open={remarkDialogOpen} onOpenChange={setRemarkDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review Remark for {selectedStudent?.name}</DialogTitle>
            <DialogDescription>
              Edit the AI-generated remark if needed, then approve it for the report card.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedStudent?.remark?.ai_generated_remark && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">AI Generated:</Label>
                <p className="text-sm bg-muted p-3 rounded-lg">
                  {selectedStudent.remark.ai_generated_remark}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="remark">Final Remark:</Label>
              <Textarea
                id="remark"
                value={editedRemark}
                onChange={(e) => setEditedRemark(e.target.value)}
                rows={4}
                placeholder="Enter or edit the teacher's remark..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemarkDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleApproveRemark}>
              <Check className="h-4 w-4 mr-2" />
              Approve Remark
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClassView;
