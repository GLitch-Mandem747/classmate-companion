import { useState, useCallback } from 'react';
import { Upload, FileText, Copy, Table } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StudentData, parseTableData, parseCSV, matchHeaderToSubject, SeniorSubjectKey } from '@/lib/grading';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';

interface DataImportProps {
  onImport: (students: StudentData[]) => void;
}

const SAMPLE_DATA = `| Name | English | Biology | Math | Chemistry | Physics | D and T | History | R.E | Civic |
| John Smith | 78 | 82 | 85 | 76 | 80 | 72 | 68 | 75 | 70 |
| Jane Doe | 92 | 88 | 95 | 90 | 87 | 85 | 90 | 88 | 92 |
| Mike Johnson | 65 | 70 | 72 | 68 | 65 | 60 | 55 | 62 | 58 |
| Sarah Williams | 88 | 75 | 80 | 78 | 82 | 70 | 85 | 80 | 75 |
| David Brown | 45 | 50 | 55 | 48 | 52 | 40 | 45 | 42 | 48 |`;

const SENIOR_HEADERS = ['Name', 'English', 'Biology', 'Math', 'Chemistry', 'Physics', 'D and T', 'History', 'R.E', 'Civic'];
const SENIOR_PREVIEW_ROWS = [
  ['John Smith', '78', '82', '85', '76', '80', '72', '68', '75', '70'],
  ['Jane Doe', '92', '88', '95', '90', '87', '85', '90', '88', '92'],
  ['Mike Johnson', '65', '70', '72', '68', '65', '60', '55', '62', '58'],
];

function SpreadsheetPreview({ headers, rows, accentClass }: { headers: string[]; rows: string[][]; accentClass: string }) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="text-xs w-full border-collapse">
        <thead>
          <tr>
            {/* Row number gutter */}
            <th className="bg-muted text-muted-foreground border border-border px-2 py-1 text-center font-normal w-6"></th>
            {headers.map((h, i) => (
              <th
                key={i}
                className={`border border-border px-2 py-1 text-center font-semibold whitespace-nowrap ${i === 0 ? 'bg-muted text-muted-foreground' : `${accentClass} text-foreground`}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="odd:bg-background even:bg-muted/30">
              <td className="bg-muted text-muted-foreground border border-border px-2 py-1 text-center font-mono">{ri + 2}</td>
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={`border border-border px-2 py-1 text-center font-mono whitespace-nowrap ${ci === 0 ? 'text-left font-medium' : ''}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
          <tr className="opacity-40">
            <td className="bg-muted text-muted-foreground border border-border px-2 py-1 text-center font-mono">{rows.length + 2}</td>
            {headers.map((_, i) => (
              <td key={i} className="border border-border px-2 py-1 text-center text-muted-foreground">…</td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function parseExcelData(workbook: XLSX.WorkBook): StudentData[] {
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
  
  const students: StudentData[] = [];
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (i === 0 && row[0]?.toString().toLowerCase().includes('name')) {
      continue;
    }
    
    if (row.length >= 10) {
      students.push({
        name: row[0]?.toString() || 'Unknown',
        english: parseFloat(row[1]?.toString()) || 0,
        biology: parseFloat(row[2]?.toString()) || 0,
        math: parseFloat(row[3]?.toString()) || 0,
        chemistry: parseFloat(row[4]?.toString()) || 0,
        physics: parseFloat(row[5]?.toString()) || 0,
        dAndT: parseFloat(row[6]?.toString()) || 0,
        history: parseFloat(row[7]?.toString()) || 0,
        re: parseFloat(row[8]?.toString()) || 0,
        civic: parseFloat(row[9]?.toString()) || 0,
      });
    }
  }
  
  return students;
}

export function DataImport({ onImport }: DataImportProps) {
  const [pasteData, setPasteData] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = useCallback(async (file: File) => {
    setIsLoading(true);
    
    try {
      const fileName = file.name.toLowerCase();
      let students: StudentData[] = [];
      
      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        students = parseExcelData(workbook);
      } else if (fileName.endsWith('.docx')) {
        const buffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: buffer });
        students = parseTableData(result.value);
      } else if (fileName.endsWith('.csv')) {
        const text = await file.text();
        students = parseCSV(text);
      } else {
        const text = await file.text();
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
    } catch (error) {
      toast({
        title: 'Import Error',
        description: 'Failed to read the file. Please check the format.',
        variant: 'destructive',
      });
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
          Import Senior Student Data
        </CardTitle>
        <CardDescription>
          Import student scores from a file or paste data directly using the Senior Grading System format
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Visual format guide */}
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Table className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Required File Format</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Your Excel or Word document must have exactly <strong>10 columns</strong> in this order. Row 1 is the header; each row after is one student.
          </p>
          <SpreadsheetPreview
            headers={SENIOR_HEADERS}
            rows={SENIOR_PREVIEW_ROWS}
            accentClass="bg-primary/10"
          />
          <div className="flex flex-wrap gap-2 pt-1">
            {SENIOR_HEADERS.map((h, i) => (
              <span
                key={i}
                className={`text-xs px-2 py-0.5 rounded-full border ${i === 0 ? 'bg-muted border-border text-muted-foreground' : 'bg-primary/10 border-primary/30 text-primary'}`}
              >
                {i === 0 ? '📋 ' : `${i}. `}{h}
              </span>
            ))}
          </div>
        </div>

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
