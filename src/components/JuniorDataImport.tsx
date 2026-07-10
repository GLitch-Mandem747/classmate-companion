import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, ClipboardPaste, Loader2 } from 'lucide-react';
import { JuniorStudentData, parseJuniorTableData, parseJuniorCSV } from '@/lib/juniorGrading';
import { parseJuniorGrid } from '@/lib/juniorGrading';
import { htmlTablesToGrids, detectTableFromGrid, detectedTableToStudents } from '@/lib/tableDetection';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';

interface JuniorDataImportProps {
  onImport: (students: JuniorStudentData[]) => void;
}

const parseExcelData = (workbook: XLSX.WorkBook): JuniorStudentData[] => {
  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
    const grid = data.map(row => (row || []).map(c => (c == null ? '' : String(c).trim())));
    const students = parseJuniorGrid(grid);
    if (students.length > 0) return students;
  }
  return [];
};

const parseDocx = async (buffer: ArrayBuffer): Promise<JuniorStudentData[]> => {
  try {
    const html = await mammoth.convertToHtml({ arrayBuffer: buffer });
    const grids = htmlTablesToGrids(html.value);
    for (const g of grids) {
      const t = detectTableFromGrid(g);
      if (t) {
        const students = detectedTableToStudents(t);
        if (students.length) return students;
      }
    }
  } catch {
    // fall through
  }
  const raw = await mammoth.extractRawText({ arrayBuffer: buffer });
  return parseJuniorTableData(raw.value);
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

      let students: JuniorStudentData[] = [];
      if (extension === 'xlsx' || extension === 'xls') {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        students = parseExcelData(workbook);
      } else if (extension === 'docx') {
        const buffer = await file.arrayBuffer();
        students = await parseDocx(buffer);
      } else if (extension === 'csv') {
        const text = await file.text();
        students = parseJuniorCSV(text);
      } else {
        const text = await file.text();
        students = parseJuniorTableData(text);
      }

      if (students.length > 0) {
        onImport(students);
        toast.success(`Imported ${students.length} students successfully`);
      } else {
        toast.error('No valid student data found in file. Ensure the first column contains student names.');
      }
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Error processing file');
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
    // Detector handles pipe/tab/comma/multi-space uniformly.
    let students: JuniorStudentData[] = parseJuniorTableData(pastedData);
    if (students.length === 0 && pastedData.includes(',')) {
      students = parseJuniorCSV(pastedData);
    }
    if (students.length > 0) {
      onImport(students);
      setPastedData('');
      toast.success(`Imported ${students.length} students successfully`);
    } else {
      toast.error('Could not parse any student data. Make sure the first row contains column headers and the first column has student names.');
    }
  };

  const handleLoadSample = () => {
    const sampleData = `| Name | English | Math | D&T | Biology | Civic Ed | Accounts | History | RE |
| John Doe | 90 | 95 | 86 | 86 | 75 | 90 | 82 | 78 |
| Jane Smith | 85 | 88 | 72 | 90 | 68 | 78 | 85 | 80 |
| Bob Wilson | 68 | 72 | 65 | 70 | 58 | 62 | 55 | 60 |`;
    const students = parseJuniorTableData(sampleData);
    if (students.length > 0) {
      onImport(students);
      toast.success(`Loaded ${students.length} sample students`);
    }
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
