import { useState } from 'react';
import { FileSpreadsheet, FileText, ClipboardList, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StudentResult } from '@/lib/grading';
import { exportToExcel, exportToWord, exportReportCards, TestData } from '@/lib/export';
import { toast } from '@/hooks/use-toast';

interface ExportPanelProps {
  tests: [TestData | null, TestData | null, TestData | null];
  currentResults: StudentResult[];
}

export function ExportPanel({ tests, currentResults }: ExportPanelProps) {
  const [schoolName, setSchoolName] = useState("ST. DOMINIC'S BOYS SECONDARY SCHOOL");
  const [term, setTerm] = useState('Term Three – 2025');
  const [className, setClassName] = useState('G11 – MARTYRS');
  const [teacherName, setTeacherName] = useState('');

  const allTestsUploaded = tests[0] !== null && tests[1] !== null && tests[2] !== null;

  const handleExportExcel = () => {
    exportToExcel(currentResults);
    toast({
      title: 'Export Complete',
      description: 'Results exported to Excel (CSV) file.',
    });
  };

  const handleExportWord = () => {
    exportToWord(currentResults, schoolName || 'School Name');
    toast({
      title: 'Export Complete',
      description: 'Results exported to Word file.',
    });
  };

  const handleGenerateReportCards = () => {
    if (!schoolName.trim()) {
      toast({
        title: 'School Name Required',
        description: 'Please enter a school name to generate report cards.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!teacherName.trim()) {
      toast({
        title: 'Teacher Name Required',
        description: 'Please enter the class teacher\'s name.',
        variant: 'destructive',
      });
      return;
    }
    
    exportReportCards(tests, schoolName, term, className, teacherName);
    
    const totalStudents = new Set(
      tests.flatMap(t => t?.results.map(r => r.name) || [])
    ).size;
    
    toast({
      title: 'Report Cards Generated',
      description: `Generated ${totalStudents} report cards.`,
    });
  };

  if (currentResults.length === 0) {
    return null;
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5 text-primary" />
          Export & Report Cards
        </CardTitle>
        <CardDescription>
          {allTestsUploaded 
            ? 'Export results or generate individual report cards'
            : 'Export current test results. Report cards will be available after all 3 tests are uploaded.'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Export for current test */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Button 
            onClick={handleExportExcel}
            variant="secondary"
            className="w-full"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export to Excel
          </Button>
          
          <Button 
            onClick={handleExportWord}
            variant="secondary"
            className="w-full"
          >
            <FileText className="h-4 w-4 mr-2" />
            Export to Word
          </Button>
        </div>

        {/* Report Cards Section - Only show when all tests uploaded */}
        {allTestsUploaded && (
          <>
            <div className="border-t pt-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Generate Report Cards
              </h4>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="schoolName">School Name</Label>
                  <Input
                    id="schoolName"
                    placeholder="Enter school name"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="term">Term / Semester</Label>
                  <Input
                    id="term"
                    placeholder="e.g., Term Three – 2025"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="className">Class Name</Label>
                  <Input
                    id="className"
                    placeholder="e.g., G11 – MARTYRS"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teacherName">Class Teacher's Name</Label>
                  <Input
                    id="teacherName"
                    placeholder="e.g., MR. SINYANGWE"
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                  />
                </div>
              </div>

              <Button 
                onClick={handleGenerateReportCards}
                className="w-full mt-4"
              >
                <ClipboardList className="h-4 w-4 mr-2" />
                Generate Report Cards
              </Button>
              
              <p className="text-xs text-muted-foreground mt-3">
                Report cards will be generated as a Word document with one card per student, 
                including all 3 test scores, ready for printing.
              </p>
            </div>
          </>
        )}
        
        {!allTestsUploaded && (
          <p className="text-xs text-muted-foreground border-t pt-4">
            📋 Upload all 3 tests to enable report card generation with all test scores.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
