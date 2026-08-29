import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { ensureLogoLoaded } from '@/lib/export';

interface ReportCardPreviewProps {
  studentNames: string[];
  generatePreview: (studentName: string) => string;
  accentColor?: string;
}

export function ReportCardPreview({ studentNames, generatePreview, accentColor }: ReportCardPreviewProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [logoReady, setLogoReady] = useState(false);

  useEffect(() => {
    if (!open) {
      setLogoReady(false);
      return;
    }
    ensureLogoLoaded().then(() => setLogoReady(true));
  }, [open]);

  if (studentNames.length === 0) return null;

  const currentName = studentNames[selectedIndex] || '';
  const previewHTML = open && logoReady ? generatePreview(currentName) : '';

  const goPrev = () => setSelectedIndex(i => Math.max(0, i - 1));
  const goNext = () => setSelectedIndex(i => Math.min(studentNames.length - 1, i + 1));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          Preview Report Card
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Report Card Preview
          </DialogTitle>
        </DialogHeader>

        {/* Student selector */}
        <div className="flex items-center gap-3 px-1">
          <Button variant="ghost" size="icon" onClick={goPrev} disabled={selectedIndex === 0}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Select
            value={String(selectedIndex)}
            onValueChange={(v) => setSelectedIndex(Number(v))}
          >
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {studentNames.map((name, i) => (
                <SelectItem key={i} value={String(i)}>
                  {i + 1}. {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" onClick={goNext} disabled={selectedIndex === studentNames.length - 1}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {selectedIndex + 1} / {studentNames.length}
          </span>
        </div>

        {/* Preview iframe */}
        <div className="flex-1 overflow-auto border rounded-md bg-white min-h-[500px]">
          {!logoReady ? (
            <div className="flex items-center justify-center h-full min-h-[700px] text-sm text-muted-foreground">
              Loading preview…
            </div>
          ) : (
            <iframe
              srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;padding:0;background:white;}</style></head><body>${previewHTML}</body></html>`}
              className="w-full h-full min-h-[700px] border-0"
              title="Report Card Preview"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
