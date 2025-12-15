import { useState } from 'react';
import { FileSpreadsheet, FileText, ClipboardList, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StudentResult } from '@/lib/grading';
import { exportToExcel, exportToWord, exportReportCards } from '@/lib/export';
import { toast } from '@/hooks/use-toast';

interface ExportPanelProps {
  results: StudentResult[];
}

export function ExportPanel({ results }: ExportPanelProps) {
  const [schoolName, setSchoolName] = useState('');
  const [term, setTerm] = useState('Term 1, 2024');

  const handleExportExcel = () => {
    exportToExcel(results);
    toast({
      title: 'Export Complete',
      description: 'Results exported to Excel (CSV) file.',
    });
  };

  const handleExportWord = () => {
    exportToWord(results, schoolName || 'School Name');
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
    
    exportReportCards(results, schoolName, term);
    toast({
      title: 'Report Cards Generated',
      description: `Generated ${results.length} report cards.`,
    });
  };

  if (results.length === 0) {
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
          Export results or generate individual report cards
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
              placeholder="e.g., Term 1, 2024"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
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
          
          <Button 
            onClick={handleGenerateReportCards}
            className="w-full"
          >
            <ClipboardList className="h-4 w-4 mr-2" />
            Generate Report Cards
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground">
          Report cards will be generated as a Word document with one card per student, 
          ready for printing. Enter the school name before generating.
        </p>
      </CardContent>
    </Card>
  );
}
