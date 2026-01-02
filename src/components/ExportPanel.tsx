import { FileSpreadsheet, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StudentResult } from '@/lib/grading';
import { exportToExcel, exportToWord } from '@/lib/export';
import { toast } from '@/hooks/use-toast';

interface ExportPanelProps {
  currentResults: StudentResult[];
}

export function ExportPanel({ currentResults }: ExportPanelProps) {
  const handleExportExcel = () => {
    exportToExcel(currentResults);
    toast({
      title: 'Export Complete',
      description: 'Results exported to Excel (CSV) file.',
    });
  };

  const handleExportWord = () => {
    exportToWord(currentResults, 'School Results');
    toast({
      title: 'Export Complete',
      description: 'Results exported to Word file.',
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
          Export Results
        </CardTitle>
        <CardDescription>
          Export current test results to Excel or Word format
        </CardDescription>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}
