import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, ClipboardPaste, Loader2, Table } from 'lucide-react';
import { JuniorStudentData, parseJuniorTableData, parseJuniorCSV } from '@/lib/juniorGrading';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';

interface JuniorDataImportProps {
  onImport: (students: JuniorStudentData[]) => void;
}

const SAMPLE_DATA = `| Name | English | Math | D&T | Biology | Civic Ed | Accounts | History | RE |
| John Doe | 90 | 95 | 86 | 86 | 75 | 90 | 82 | 78 |
| Jane Smith | 85 | 88 | 72 | 90 | 68 | 78 | 85 | 80 |
| Bob Wilson | 68 | 72 | 65 | 70 | 58 | 62 | 55 | 60 |`;

const JUNIOR_HEADERS = ['Name', 'English', 'Math', 'D&T', 'Biology', 'Civic Ed', 'Accounts', 'History', 'RE'];
const JUNIOR_PREVIEW_ROWS = [
  ['John Doe',    '90', '95', '86', '86', '75', '90', '82', '78'],
  ['Jane Smith',  '85', '88', '72', '90', '68', '78', '85', '80'],
  ['Bob Wilson',  '68', '72', '65', '70', '58', '62', '55', '60'],
];

function SpreadsheetPreview({ headers, rows, required, accentClass }: {
  headers: string[];
  rows: string[][];
  required: number; // number of required columns (including Name)
  accentClass: string;
}) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="text-xs w-full border-collapse">
        <thead>
          <tr>
            <th className="bg-muted text-muted-foreground border border-border px-2 py-1 text-center font-normal w-6"></th>
            {headers.map((h, i) => (
              <th
                key={i}
                className={`border border-border px-2 py-1 text-center font-semibold whitespace-nowrap ${
                  i === 0
                    ? 'bg-muted text-muted-foreground'
                    : i < required
                    ? `${accentClass} text-foreground`
                    : 'bg-yellow-500/10 text-foreground'
                }`}
              >
                {h}
                {i > 0 && i < required && (
                  <span className="block text-[9px] font-normal text-green-600">required</span>
                )}
                {i >= required && (
                  <span className="block text-[9px] font-normal text-yellow-600">optional</span>
                )}
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

const parseExcelData = (workbook: XLSX.WorkBook): JuniorStudentData[] => {
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

  if (jsonData.length < 2) return [];

  const headers = jsonData[0].map(h => String(h).trim().toLowerCase());
  const nameIndex = headers.findIndex(h => h === 'name' || h === 'student');

  if (nameIndex === -1) return [];

  const students: JuniorStudentData[] = [];

  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row || row.length < 2) continue;

    const student: JuniorStudentData = {
      name: String(row[nameIndex] || '').trim(),
      english: 0,
      math: 0,
      optionalSubjects: {}
    };

    headers.forEach((header, idx) => {
      if (header === 'name' || header === 'student') return;
      const value = parseFloat(String(row[idx])) || 0;
      if (header === 'english' || header === 'eng') {
        student.english = value;
      } else if (header === 'math' || header === 'maths' || header === 'mathematics') {
        student.math = value;
      } else if (header && value) {
        student.optionalSubjects[header] = value;
      }
    });

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
      } else if (extension === 'txt') {
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
    const students = parseJuniorTableData(SAMPLE_DATA);
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
          Import student scores from a file or paste data directly using the Junior Grading System format
        </p>
      </div>

      {/* Visual format guide */}
      <div className="rounded-lg border border-green-700/40 bg-green-900/10 p-4 space-y-3 mb-6">
        <div className="flex items-center gap-2">
          <Table className="h-4 w-4 text-green-600" />
          <p className="text-sm font-semibold text-foreground">Required File Format</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Your Excel or Word document must start with <strong>Name, English, and Math</strong> (required), followed by up to 10 optional subject columns. Row 1 is the header; each row after is one student.
        </p>
        <SpreadsheetPreview
          headers={JUNIOR_HEADERS}
          rows={JUNIOR_PREVIEW_ROWS}
          required={3}
          accentClass="bg-green-700/20"
        />
        <div className="flex flex-wrap gap-2 pt-1">
          {JUNIOR_HEADERS.map((h, i) => (
            <span
              key={i}
              className={`text-xs px-2 py-0.5 rounded-full border ${
                i === 0
                  ? 'bg-muted border-border text-muted-foreground'
                  : i < 3
                  ? 'bg-green-700/20 border-green-700/40 text-green-600'
                  : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600'
              }`}
            >
              {i === 0 ? '📋 ' : i < 3 ? '✅ ' : '➕ '}{h}
            </span>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-600 inline-block"></span> Required columns</span>
          {'  '}
          <span className="inline-flex items-center gap-1 ml-3"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block"></span> Optional subjects (add as many as needed)</span>
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
              isDragging 
                ? 'border-green-500 bg-green-500/10' 
                : 'border-green-700 hover:border-green-600'
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
            
            <p className="text-foreground mb-2">
              Drag & drop your file here, or
            </p>
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="bg-green-700 hover:bg-green-800"
            >
              Browse Files
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              Supports: Excel (.xlsx, .xls), Word (.docx), CSV, TXT
            </p>
          </div>
        </TabsContent>

        <TabsContent value="paste">
          <div className="space-y-4">
            <Textarea
              placeholder={`Paste your data here...\n\nFormat (pipe or tab separated):\n| Name | English | Math | D&T | Biology | Civic Ed | Accounts |\n| John Doe | 90 | 95 | 86 | 86 | 75 | 90 |`}
              value={pastedData}
              onChange={(e) => setPastedData(e.target.value)}
              className="min-h-[200px] font-mono text-sm border-green-700 focus:ring-green-500"
            />
            <div className="flex gap-3">
              <Button 
                onClick={handlePasteImport} 
                disabled={!pastedData.trim()}
                className="bg-green-700 hover:bg-green-800"
              >
                Import Data
              </Button>
              <Button 
                variant="outline" 
                onClick={handleLoadSample}
                className="border-green-700 text-green-500 hover:bg-green-900/20"
              >
                Load Sample Data
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};
