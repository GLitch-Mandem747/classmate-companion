import { useState, useCallback } from 'react';
import { Upload, FileText, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StudentData, parseTableData, parseCSV } from '@/lib/grading';
import { parseGrid } from '@/lib/grading';
import { htmlTablesToGrids, detectTableFromGrid, detectedTableToStudents, gridHasFilledPoints, textHasFilledPoints, csvHasFilledPoints } from '@/lib/tableDetection';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';

interface DataImportProps {
  onImport: (students: StudentData[]) => void;
}

function parseExcelData(workbook: XLSX.WorkBook): { students: StudentData[]; pointsFilled: boolean } {
  // Read every sheet, try each until one yields a table.
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' });
    const grid = data.map(row => (row || []).map(c => (c == null ? '' : String(c).trim())));
    const students = parseGrid(grid);
    if (students.length > 0) return { students, pointsFilled: gridHasFilledPoints(grid) };
  }
  return { students: [], pointsFilled: false };
}

async function parseDocxData(buffer: ArrayBuffer): Promise<{ students: StudentData[]; pointsFilled: boolean }> {
  // First try structured tables via HTML.
  try {
    const html = await mammoth.convertToHtml({ arrayBuffer: buffer });
    const grids = htmlTablesToGrids(html.value);
    for (const g of grids) {
      const t = detectTableFromGrid(g);
      if (t) {
        const students = detectedTableToStudents(t);
        if (students.length) return { students, pointsFilled: t.pointsFilled };
      }
    }
  } catch {
    // fall through
  }
  // Fall back to raw text.
  const raw = await mammoth.extractRawText({ arrayBuffer: buffer });
  return { students: parseTableData(raw.value), pointsFilled: textHasFilledPoints(raw.value) };
}

export function DataImport({ onImport }: DataImportProps) {
  const [pasteData, setPasteData] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [alreadyCalculated, setAlreadyCalculated] = useState(false);

  const notifyAlreadyCalculated = () => {
    setAlreadyCalculated(true);
    toast({
      title: 'ALREADY CALCULATED',
      description: 'This file already has a points column. Import remaining tests to generate report cards.',
    });
  };

  const handleFileUpload = useCallback(async (file: File) => {
    setIsLoading(true);
    try {
      const fileName = file.name.toLowerCase();
      let students: StudentData[] = [];
      let pointsFilled = false;
      
      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        ({ students, pointsFilled } = parseExcelData(workbook));
      } else if (fileName.endsWith('.docx')) {
        const buffer = await file.arrayBuffer();
        ({ students, pointsFilled } = await parseDocxData(buffer));
      } else if (fileName.endsWith('.csv')) {
        const text = await file.text();
        students = parseCSV(text);
        pointsFilled = csvHasFilledPoints(text);
      } else {
        const text = await file.text();
        students = parseTableData(text);
        pointsFilled = textHasFilledPoints(text);
      }
      
      if (students.length > 0) {
        if (pointsFilled) notifyAlreadyCalculated(); else setAlreadyCalculated(false);
        onImport(students);
        toast({ title: 'Import Successful', description: `Imported ${students.length} students from file.` });
      } else {
        toast({ title: 'Import Failed', description: 'No valid student data found in file.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Import Error', description: 'Failed to read the file. Please check the format.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [onImport]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const handlePasteImport = () => {
    if (!pasteData.trim()) {
      toast({ title: 'No Data', description: 'Please paste some data first.', variant: 'destructive' });
      return;
    }
    let students: StudentData[];
    let pointsFilled: boolean;
    if (pasteData.includes(',') && !pasteData.includes('|')) {
      students = parseCSV(pasteData);
      pointsFilled = csvHasFilledPoints(pasteData);
    } else {
      students = parseTableData(pasteData);
      pointsFilled = textHasFilledPoints(pasteData);
    }
    if (students.length > 0) {
      if (pointsFilled) notifyAlreadyCalculated(); else setAlreadyCalculated(false);
      onImport(students);
      toast({ title: 'Import Successful', description: `Imported ${students.length} students.` });
      setPasteData('');
    } else {
      toast({ title: 'Import Failed', description: 'Could not parse the data. Check the format.', variant: 'destructive' });
    }
  };

  const handleLoadSample = () => {
    const sampleData = `| Name | English | Biology | Math | Chemistry | Physics | D and T | History | R.E | Civic |
| John Smith | 78 | 82 | 85 | 76 | 80 | 72 | 68 | 75 | 70 |
| Jane Doe | 92 | 88 | 95 | 90 | 87 | 85 | 90 | 88 | 92 |
| Mike Johnson | 65 | 70 | 72 | 68 | 65 | 60 | 55 | 62 | 58 |
| Sarah Williams | 88 | 75 | 80 | 78 | 82 | 70 | 85 | 80 | 75 |
| David Brown | 45 | 50 | 55 | 48 | 52 | 40 | 45 | 42 | 48 |`;
    const students = parseTableData(sampleData);
    onImport(students);
    toast({ title: 'Sample Loaded', description: `Loaded ${students.length} sample students.` });
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Import Student Data
        </CardTitle>
        <CardDescription>
          Import student scores from a file or paste data directly. Column headers determine subjects — use any names you want.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {alreadyCalculated && (
          <div className="rounded-md border border-primary bg-primary/10 p-3">
            <p className="font-bold text-primary">ALREADY CALCULATED</p>
            <p className="text-sm text-muted-foreground">Import remaining tests to generate report cards.</p>
          </div>
        )}
        <Tabs defaultValue="file" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file">Upload File</TabsTrigger>
            <TabsTrigger value="paste">Paste Data</TabsTrigger>
          </TabsList>
          
          <TabsContent value="file" className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-foreground font-medium mb-2">
                {isLoading ? 'Processing file...' : 'Drag & drop your file here'}
              </p>
              <p className="text-muted-foreground text-sm mb-4">
                Supports Excel (.xlsx, .xls), Word (.docx), CSV, and TXT files
              </p>
              <input
                type="file"
                accept=".csv,.txt,.xlsx,.xls,.docx"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                className="hidden"
                id="file-upload"
                disabled={isLoading}
              />
              <label htmlFor="file-upload">
                <Button variant="secondary" className="cursor-pointer" asChild disabled={isLoading}>
                  <span>{isLoading ? 'Processing...' : 'Choose File'}</span>
                </Button>
              </label>
            </div>
          </TabsContent>
          
          <TabsContent value="paste" className="space-y-4">
            <Textarea
              placeholder="Paste your student data here..."
              value={pasteData}
              onChange={(e) => setPasteData(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
            <div className="flex gap-2">
              <Button onClick={handlePasteImport}>
                <Copy className="h-4 w-4 mr-2" />
                Import Pasted Data
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="pt-2 border-t border-border">
          <Button variant="outline" onClick={handleLoadSample} className="w-full">
            Load Sample Data (5 Students)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
