import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface StudentData {
  name: string;
  gradePoints: number;
  rank: number;
  totalStudents: number;
  subjects: { subject: string; score: number; grade: string }[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { student }: { student: StudentData } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const subjectPerformance = student.subjects
      .map(s => `${s.subject}: ${s.score}% (Grade ${s.grade})`)
      .join(", ");

    const rankPercentile = Math.round((1 - (student.rank - 1) / student.totalStudents) * 100);
    
    // Determine if student is below average (bottom half of class)
    const isBelowAverage = student.rank > Math.ceil(student.totalStudents / 2);
    
    let performanceLevel = "excellent";
    if (student.gradePoints > 18) performanceLevel = "needs improvement";
    else if (student.gradePoints > 12) performanceLevel = "satisfactory";
    else if (student.gradePoints > 8) performanceLevel = "good";

    const systemPrompt = `You are a professional school teacher writing brief, encouraging remarks for student report cards. 
Your remarks should be:
- Concise (2-3 sentences maximum)
- Professional and encouraging
- Specific to the student's performance
- Constructive when improvement is needed
- Written in third person

IMPORTANT FORMATTING RULES:
- For below-average students (bottom half of class), ALWAYS start the remark with the student's name. Example: "John has shown..."
- For above-average students (top half of class), you may start with the student's name OR use alternative openings like "An excellent performer who...", "Demonstrates strong ability in...", "Shows commendable effort in...", etc. Vary your openings naturally.

Never include:
- Generic phrases like "keep up the good work" without context
- Negative or discouraging language
- Specific grades or numbers (the reader can see those)`;

    const userPrompt = `Write a brief teacher's remark for ${student.name}.

Performance Summary:
- Overall Grade Points: ${student.gradePoints} (lower is better)
- Class Position: ${student.rank} out of ${student.totalStudents} students
- Performance Level: ${performanceLevel}
- This student is ${isBelowAverage ? 'BELOW AVERAGE (bottom half) - START the remark with their name' : 'ABOVE AVERAGE (top half) - you may start with their name or use an alternative opening'}
- Subject Scores: ${subjectPerformance}

Write an appropriate 2-3 sentence remark for this student's report card.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add more credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const remark = data.choices?.[0]?.message?.content?.trim() || "";

    console.log("Generated remark for", student.name, ":", remark);

    return new Response(
      JSON.stringify({ remark }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating remark:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
