import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Check, Edit2, Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface RemarkStudent {
  id: string;
  name: string;
  overallGradePoints: number;
  rank: number;
  subjects: { subject: string; score: number; grade: string }[];
}

interface RemarksPanelProps {
  students: RemarkStudent[];
  totalStudents: number;
  onRemarksChange: (remarks: Map<string, string>) => void;
  accentColor?: string;
}

interface StudentRemark {
  aiRemark: string;
  approvedRemark: string;
  isApproved: boolean;
  isEditing: boolean;
  isGenerating: boolean;
}

export function RemarksPanel({ students, totalStudents, onRemarksChange, accentColor = 'primary' }: RemarksPanelProps) {
  const [remarks, setRemarks] = useState<Map<string, StudentRemark>>(new Map());
  const [generatingAll, setGeneratingAll] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  // Use a ref to always have the latest remarks in async callbacks
  const remarksRef = useRef(remarks);
  remarksRef.current = remarks;

  const updateParent = useCallback((updatedRemarks: Map<string, StudentRemark>) => {
    const approvedMap = new Map<string, string>();
    updatedRemarks.forEach((remark, name) => {
      if (remark.isApproved) {
        approvedMap.set(name, remark.approvedRemark);
      }
    });
    onRemarksChange(approvedMap);
  }, [onRemarksChange]);

  const generateRemark = useCallback(async (student: RemarkStudent) => {
    // Use ref for latest state
    const currentRemarks = remarksRef.current;
    const current = currentRemarks.get(student.name) || {
      aiRemark: '', approvedRemark: '', isApproved: false, isEditing: false, isGenerating: false
    };
    
    // Set generating state
    const generating = new Map(currentRemarks);
    generating.set(student.name, { ...current, isGenerating: true });
    setRemarks(generating);

    try {
      const { data, error } = await supabase.functions.invoke('generate-remarks', {
        body: {
          student: {
            name: student.name,
            gradePoints: student.overallGradePoints,
            rank: student.rank,
            totalStudents,
            subjects: student.subjects,
          }
        }
      });

      if (error) throw error;

      const remark = data?.remark || 'Unable to generate remark.';
      // Use ref again for latest state after async
      const latestRemarks = new Map(remarksRef.current);
      latestRemarks.set(student.name, {
        aiRemark: remark,
        approvedRemark: remark,
        isApproved: false,
        isEditing: false,
        isGenerating: false,
      });
      setRemarks(latestRemarks);
      setExpandedStudent(student.name);
    } catch (err: any) {
      console.error('Error generating remark:', err);
      const latestRemarks = new Map(remarksRef.current);
      const fallback = latestRemarks.get(student.name) || current;
      latestRemarks.set(student.name, { ...fallback, isGenerating: false });
      setRemarks(latestRemarks);
      toast({
        title: 'Error',
        description: err?.message || 'Failed to generate remark. Please try again.',
        variant: 'destructive',
      });
    }
  }, [totalStudents]);

  const generateAllRemarks = async () => {
    setGeneratingAll(true);
    for (const student of students) {
      const existing = remarksRef.current.get(student.name);
      if (!existing?.isApproved) {
        await generateRemark(student);
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

  const approveAll = () => {
    const updated = new Map(remarks);
    updated.forEach((remark, name) => {
      if (remark.aiRemark && !remark.isGenerating) {
        updated.set(name, { ...remark, isApproved: true, isEditing: false });
      }
    });
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
    setExpandedStudent(name);
  };

  const updateRemarkText = (name: string, text: string) => {
    const current = remarks.get(name);
    if (!current) return;
    const updated = new Map(remarks);
    updated.set(name, { ...current, approvedRemark: text });
    setRemarks(updated);
  };

  const approvedCount = Array.from(remarks.values()).filter(r => r.isApproved).length;
  const generatedCount = Array.from(remarks.values()).filter(r => r.aiRemark && !r.isGenerating).length;

  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Teacher Remarks
        </CardTitle>
        <CardDescription>
          Generate AI remarks for each student. Review, edit, and approve before adding to report cards.
        </CardDescription>
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <Button onClick={generateAllRemarks} disabled={generatingAll} size="sm">
            {generatingAll ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" /> Generate All</>
            )}
          </Button>
          {generatedCount > 0 && approvedCount < generatedCount && (
            <Button onClick={approveAll} size="sm" variant="outline" className="border-[hsl(var(--success))] text-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/10">
              <Check className="h-4 w-4 mr-2" /> Approve All
            </Button>
          )}
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {generatedCount} / {students.length} generated
            </Badge>
            <Badge variant="default" className="text-xs bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]">
              {approvedCount} approved
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Scrollable student list */}
        <div className="max-h-[600px] overflow-y-auto scrollbar-thin space-y-2 pr-1">
          {students.map((student) => {
            const remark = remarks.get(student.name);
            const isExpanded = expandedStudent === student.name;

            return (
              <div
                key={student.id}
                className={`border rounded-lg transition-all ${
                  remark?.isApproved
                    ? 'border-[hsl(var(--success))]/40 bg-[hsl(var(--success))]/5'
                    : remark?.aiRemark
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-border'
                }`}
              >
                {/* Student header row - always visible */}
                <button
                  onClick={() => setExpandedStudent(isExpanded ? null : student.name)}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/30 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-muted text-xs font-bold text-muted-foreground shrink-0">
                      {student.rank}
                    </div>
                    <span className="font-medium text-sm truncate">{student.name}</span>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {student.overallGradePoints} pts
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {remark?.isGenerating && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {remark?.isApproved && (
                      <Badge className="text-[10px] bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]">
                        <Check className="h-3 w-3 mr-0.5" /> Approved
                      </Badge>
                    )}
                    {!remark && !remark?.isGenerating && (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">Pending</Badge>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-3 pb-3 space-y-2 border-t border-border/50">
                    {!remark && (
                      <div className="pt-3">
                        <Button size="sm" variant="outline" onClick={() => generateRemark(student)}>
                          <Sparkles className="h-3 w-3 mr-1" /> Generate Remark
                        </Button>
                      </div>
                    )}

                    {remark?.isGenerating && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground pt-3">
                        <Loader2 className="h-4 w-4 animate-spin" /> Generating remark...
                      </div>
                    )}

                    {remark && !remark.isGenerating && (
                      <div className="space-y-2 pt-3">
                        {remark.isEditing ? (
                          <Textarea
                            value={remark.approvedRemark}
                            onChange={(e) => updateRemarkText(student.name, e.target.value)}
                            className="text-sm min-h-[80px] bg-background"
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md leading-relaxed">
                            {remark.approvedRemark}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {!remark.isApproved && (
                            <Button size="sm" onClick={() => approveRemark(student.name)} className="bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/90">
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
                )}
              </div>
            );
          })}
        </div>

        {approvedCount < students.length && generatedCount > 0 && (
          <div className="flex items-center gap-2 mt-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            Approve all remarks before generating report cards.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
