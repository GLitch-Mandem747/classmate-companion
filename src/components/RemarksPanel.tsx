import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Check, Edit2, Loader2, AlertCircle } from 'lucide-react';
import { StudentResult } from '@/lib/grading';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface RemarksPanelProps {
  results: StudentResult[];
  totalStudents: number;
  onRemarksChange: (remarks: Map<string, string>) => void;
}

interface StudentRemark {
  aiRemark: string;
  approvedRemark: string;
  isApproved: boolean;
  isEditing: boolean;
  isGenerating: boolean;
}

export function RemarksPanel({ results, totalStudents, onRemarksChange }: RemarksPanelProps) {
  const [remarks, setRemarks] = useState<Map<string, StudentRemark>>(new Map());
  const [generatingAll, setGeneratingAll] = useState(false);

  const updateParent = (updatedRemarks: Map<string, StudentRemark>) => {
    const approvedMap = new Map<string, string>();
    updatedRemarks.forEach((remark, name) => {
      if (remark.isApproved) {
        approvedMap.set(name, remark.approvedRemark);
      }
    });
    onRemarksChange(approvedMap);
  };

  const generateRemark = async (student: StudentResult) => {
    const current = remarks.get(student.name) || {
      aiRemark: '', approvedRemark: '', isApproved: false, isEditing: false, isGenerating: false
    };
    
    const updated = new Map(remarks);
    updated.set(student.name, { ...current, isGenerating: true });
    setRemarks(updated);

    try {
      const subjects = [
        { subject: 'English', score: student.english, grade: student.grades.english },
        { subject: 'Mathematics', score: student.math, grade: student.grades.math },
        { subject: 'Biology', score: student.biology, grade: student.grades.biology },
        { subject: 'Science', score: student.science, grade: student.grades.science },
        { subject: 'Civic Education', score: student.civic, grade: student.grades.civic },
        { subject: 'Religious Education', score: student.re, grade: student.grades.re },
        { subject: 'History', score: student.history, grade: student.grades.history },
        { subject: 'Design & Technology', score: student.dAndT, grade: student.grades.dAndT },
      ];

      const { data, error } = await supabase.functions.invoke('generate-remarks', {
        body: {
          student: {
            name: student.name,
            gradePoints: student.overallGradePoints,
            rank: student.rank,
            totalStudents,
            subjects,
          }
        }
      });

      if (error) throw error;

      const remark = data?.remark || 'Unable to generate remark.';
      const newRemarks = new Map(remarks);
      newRemarks.set(student.name, {
        aiRemark: remark,
        approvedRemark: remark,
        isApproved: false,
        isEditing: false,
        isGenerating: false,
      });
      setRemarks(newRemarks);
    } catch (err: any) {
      console.error('Error generating remark:', err);
      const newRemarks = new Map(remarks);
      newRemarks.set(student.name, { ...current, isGenerating: false });
      setRemarks(newRemarks);
      toast({
        title: 'Error',
        description: err?.message || 'Failed to generate remark. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const generateAllRemarks = async () => {
    setGeneratingAll(true);
    for (const student of results) {
      const existing = remarks.get(student.name);
      if (!existing?.isApproved) {
        await generateRemark(student);
        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 500));
      }
    }
    setGeneratingAll(false);
  };

  const approveRemark = (name: string) => {
    const current = remarks.get(name);
    if (!current) return;
    const updated = new Map(remarks);
    updated.set(name, { ...current, isApproved: true, isEditing: false });
    setRemarks(updated);
    updateParent(updated);
  };

  const editRemark = (name: string) => {
    const current = remarks.get(name);
    if (!current) return;
    const updated = new Map(remarks);
    updated.set(name, { ...current, isEditing: true, isApproved: false });
    setRemarks(updated);
    updateParent(updated);
  };

  const updateRemarkText = (name: string, text: string) => {
    const current = remarks.get(name);
    if (!current) return;
    const updated = new Map(remarks);
    updated.set(name, { ...current, approvedRemark: text });
    setRemarks(updated);
  };

  const approvedCount = Array.from(remarks.values()).filter(r => r.isApproved).length;

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Teacher Remarks
        </CardTitle>
        <CardDescription>
          Generate AI remarks based on student performance. You must review and approve each remark before it appears on report cards.
        </CardDescription>
        <div className="flex items-center gap-3 mt-2">
          <Button onClick={generateAllRemarks} disabled={generatingAll} size="sm">
            {generatingAll ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" /> Generate All Remarks</>
            )}
          </Button>
          <Badge variant="secondary">
            {approvedCount} / {results.length} approved
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[500px]">
          <div className="space-y-3">
            {results.map((student) => {
              const remark = remarks.get(student.name);
              return (
                <div key={student.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{student.name}</span>
                      <Badge variant="outline" className="text-xs">
                        Rank {student.rank} • {student.overallGradePoints} pts
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      {remark?.isApproved && (
                        <Badge variant="default" className="text-xs">
                          <Check className="h-3 w-3 mr-1" /> Approved
                        </Badge>
                      )}
                      {!remark && (
                        <Button size="sm" variant="outline" onClick={() => generateRemark(student)}>
                          <Sparkles className="h-3 w-3 mr-1" /> Generate
                        </Button>
                      )}
                    </div>
                  </div>

                  {remark?.isGenerating && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Generating remark...
                    </div>
                  )}

                  {remark && !remark.isGenerating && (
                    <div className="space-y-2">
                      {remark.isEditing ? (
                        <Textarea
                          value={remark.approvedRemark}
                          onChange={(e) => updateRemarkText(student.name, e.target.value)}
                          className="text-sm min-h-[60px]"
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                          {remark.approvedRemark}
                        </p>
                      )}
                      <div className="flex gap-2">
                        {!remark.isApproved && (
                          <Button size="sm" onClick={() => approveRemark(student.name)}>
                            <Check className="h-3 w-3 mr-1" /> Approve
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => editRemark(student.name)}>
                          <Edit2 className="h-3 w-3 mr-1" /> Edit
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => generateRemark(student)}>
                          <Sparkles className="h-3 w-3 mr-1" /> Regenerate
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {approvedCount < results.length && (
          <div className="flex items-center gap-2 mt-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            Approve all remarks before generating report cards.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
