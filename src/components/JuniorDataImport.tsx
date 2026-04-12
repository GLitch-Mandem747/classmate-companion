import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, ClipboardPaste, Loader2 } from 'lucide-react';
import { JuniorStudentData, parseJuniorTableData, parseJuniorCSV } from '@/lib/juniorGrading';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';

interface JuniorDataImportProps {
  onImport: (students: JuniorStudentData[]) => void;
}

const parseExcelData = (workbook: XLSX.WorkBook): JuniorStudentData[] => {
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

  if (jsonData.length < 2) return [];

  const headers = jsonData[0].map(h => String(h).trim());
  const nameIndex = headers.findIndex(h => {
    const l = h.toLowerCase();
    return l === 'name' || l === 'student';
  });

  if (nameIndex === -1) return [];

  const subjectHeaders: { index: number; name: string }[] = [];
  headers.forEach((header, idx) => {
    if (idx === nameIndex) return;
    if (header.trim()) {
      subjectHeaders.push({ index: idx, name: header.trim() });
    }
  });

  const subjectNames = subjectHeaders.map(s => s.name);
  const students: JuniorStudentData[] = [];

  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row || row.length < 2) continue;

    const subjects: Record<string, number> = {};
    subjectHeaders.forEach(({ index, name }) => {
      const value = parseFloat(String(row[index])) || 0;
      subjects[name] = value;
    });

    const student: JuniorStudentData = {
      name: String(row[nameIndex] || '').trim(),
      subjects,
      subjectNames,
    };

    if (student.name) students.push(student);
  }

  return students;
};

export const JuniorDataImport = ({ onImport }: JuniorDataImportProps) => {
  const [pastedData, setPastedData] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    try {
      const extension = file.name.split('.').pop()?.toLowerCase();

      if (extension === 'xlsx' || extension === 'xls') {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const students = parseExcelData(workbook);
        if (students.length > 0) onImport(students);
      } else if (extension === 'docx') {
        const buffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: buffer });
        const students = parseJuniorTableData(result.value);
        if (students.length > 0) onImport(students);
      } else if (extension === 'csv') {
        const text = await file.text();
        const students = parseJuniorCSV(text);
        if (students.length > 0) onImport(students);
      } else {
        const text = await file.text();
        const students = parseJuniorTableData(text);
        if (students.length > 0) onImport(students);
      }
    } catch (error) {
      console.error('Error processing file:', error);
    }
    setIsLoading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handlePasteImport = () => {
    if (!pastedData.trim()) return;
    let students: JuniorStudentData[] = [];
    if (pastedData.includes(',') && !pastedData.includes('|')) {
      students = parseJuniorCSV(pastedData);
    } else {
      students = parseJuniorTableData(pastedData);
    }
    if (students.length > 0) {
      onImport(students);
      setPastedData('');
    }
  };

  const handleLoadSample = () => {
    const sampleData = `| Name | English | Math | D&T | Biology | Civic Ed | Accounts | History | RE |
| John Doe | 90 | 95 | 86 | 86 | 75 | 90 | 82 | 78 |
| Jane Smith | 85 | 88 | 72 | 90 | 68 | 78 | 85 | 80 |
| Bob Wilson | 68 | 72 | 65 | 70 | 58 | 62 | 55 | 60 |`;
    const students = parseJuniorTableData(sampleData);
    if (students.length > 0) onImport(students);
  };

  return (
    <Card className="p-6 border-green-700">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold flex items-center gap-2 mb-1.5">
          <Upload className="h-5 w-5 text-green-600" />
          Import Junior Student Data
        </h2>
        <p className="text-sm text-muted-foreground">
          Import student scores from a file or paste data. Column headers determine subjects — use any names you want.
        </p>
      </div>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="upload" className="data-[state=active]:bg-green-700">
            <Upload className="h-4 w-4 mr-2" />
            Upload File
          </TabsTrigger>
          <TabsTrigger value="paste" className="data-[state=active]:bg-green-700">
            <ClipboardPaste className="h-4 w-4 mr-2" />
            Paste Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging ? 'border-green-500 bg-green-500/10' : 'border-green-700 hover:border-green-600'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".xlsx,.xls,.csv,.txt,.docx"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            />
            {isLoading ? (
              <Loader2 className="h-12 w-12 mx-auto text-green-500 animate-spin" />
            ) : (
              <FileText className="h-12 w-12 mx-auto text-green-500 mb-4" />
            )}
            <p className="text-foreground mb-2">Drag & drop your file here, or</p>
            <Button onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="bg-green-700 hover:bg-green-800">
              Browse Files
            </Button>
            <p className="text-xs text-muted-foreground mt-3">Supports: Excel (.xlsx, .xls), Word (.docx), CSV, TXT</p>
          </div>
        </TabsContent>

        <TabsContent value="paste">
          <div className="space-y-4">
            <Textarea
              placeholder={`Paste your data here...\n\nFormat (pipe or tab separated):\n| Name | English | Math | Subject3 | Subject4 | ... |\n| John Doe | 90 | 95 | 86 | 75 |`}
              value={pastedData}
              onChange={(e) => setPastedData(e.target.value)}
              className="min-h-[200px] font-mono text-sm border-green-700 focus:ring-green-500"
            />
            <div className="flex gap-3">
              <Button onClick={handlePasteImport} disabled={!pastedData.trim()} className="bg-green-700 hover:bg-green-800">
                Import Data
              </Button>
              <Button variant="outline" onClick={handleLoadSample} className="border-green-700 text-green-500 hover:bg-green-900/20">
                Load Sample Data
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};
