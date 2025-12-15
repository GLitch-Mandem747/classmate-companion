import { useState, useCallback } from 'react';
import { Upload, FileText, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StudentData, parseTableData, parseCSV } from '@/lib/grading';
import { toast } from '@/hooks/use-toast';

interface DataImportProps {
  onImport: (students: StudentData[]) => void;
}

const SAMPLE_DATA = `| Name | English | Biology | Math | Chemistry | Physics | D and T | History | R.E | Civic |
| John Smith | 78 | 82 | 85 | 76 | 80 | 72 | 68 | 75 | 70 |
| Jane Doe | 92 | 88 | 95 | 90 | 87 | 85 | 90 | 88 | 92 |
| Mike Johnson | 65 | 70 | 72 | 68 | 65 | 60 | 55 | 62 | 58 |
| Sarah Williams | 88 | 75 | 80 | 78 | 82 | 70 | 85 | 80 | 75 |
| David Brown | 45 | 50 | 55 | 48 | 52 | 40 | 45 | 42 | 48 |`;

export function DataImport({ onImport }: DataImportProps) {
  const [pasteData, setPasteData] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      let students: StudentData[];
      
      if (file.name.endsWith('.csv')) {
        students = parseCSV(text);
      } else {
        students = parseTableData(text);
      }
      
      if (students.length > 0) {
        onImport(students);
        toast({
          title: 'Import Successful',
          description: `Imported ${students.length} students from file.`,
        });
      } else {
        toast({
          title: 'Import Failed',
          description: 'No valid student data found in file.',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
  }, [onImport]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handlePasteImport = () => {
    if (!pasteData.trim()) {
      toast({
        title: 'No Data',
        description: 'Please paste some data first.',
        variant: 'destructive',
      });
      return;
    }
    
    const students = parseTableData(pasteData);
    
    if (students.length > 0) {
      onImport(students);
      toast({
        title: 'Import Successful',
        description: `Imported ${students.length} students.`,
      });
      setPasteData('');
    } else {
      toast({
        title: 'Import Failed',
        description: 'Could not parse the data. Check the format.',
        variant: 'destructive',
      });
    }
  };

  const handleLoadSample = () => {
    const students = parseTableData(SAMPLE_DATA);
    onImport(students);
    toast({
      title: 'Sample Loaded',
      description: `Loaded ${students.length} sample students.`,
    });
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Import Student Data
        </CardTitle>
        <CardDescription>
          Import student scores from a file or paste data directly
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="file" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file">Upload File</TabsTrigger>
            <TabsTrigger value="paste">Paste Data</TabsTrigger>
          </TabsList>
          
          <TabsContent value="file" className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border hover:border-primary/50'
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-foreground font-medium mb-2">
                Drag & drop your file here
              </p>
              <p className="text-muted-foreground text-sm mb-4">
                Supports CSV, TXT files with pipe or tab separated values
              </p>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button variant="secondary" className="cursor-pointer" asChild>
                  <span>Choose File</span>
                </Button>
              </label>
            </div>
          </TabsContent>
          
          <TabsContent value="paste" className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Expected format: <code className="text-primary">| Name | English | Biology | Math | Chemistry | Physics | D and T | History | R.E | Civic |</code>
              </p>
              <Textarea
                placeholder="Paste your student data here..."
                value={pasteData}
                onChange={(e) => setPasteData(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handlePasteImport}>
                <Copy className="h-4 w-4 mr-2" />
                Import Pasted Data
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 pt-6 border-t border-border">
          <Button variant="outline" onClick={handleLoadSample} className="w-full">
            Load Sample Data (5 Students)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
