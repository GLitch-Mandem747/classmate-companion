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
    const body = await req.json();
    let students: StudentData[] = [];
    
    // Support both single and batched requests for backward compatibility
    if (body.student) {
      students = [body.student];
    } else if (body.students && Array.isArray(body.students)) {
      students = body.students;
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid student data provided." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (students.length === 0) {
       return new Response(
        JSON.stringify({ error: "No students provided." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a school teacher writing very short report card remarks. 
STRICT RULES:
- Maximum 15 words ONLY per remark. Never exceed this.
- Third person (e.g. "John has shown...")
- No grades or numbers
- Encouraging but honest
- Single sentence only
- Return a valid JSON array of objects. Each object MUST have "name" and "remark" properties.`;

    const userPrompt = `Write a 15-word MAX report card remark for each of the following students based on their performance.

${students.map(student => {
    const isBelowAverage = student.rank > Math.ceil(student.totalStudents / 2);
    let performanceLevel = "excellent";
    if (student.gradePoints > 18) performanceLevel = "needs improvement";
    else if (student.gradePoints > 12) performanceLevel = "satisfactory";
    else if (student.gradePoints > 8) performanceLevel = "good";

    const bestSubject = student.subjects.reduce((best, s) => s.score > best.score ? s : best, student.subjects[0]);
    const weakSubject = student.subjects.reduce((weak, s) => s.score < weak.score ? s : weak, student.subjects[0]);

    return `Student: ${student.name}
Performance: ${performanceLevel}
Best subject: ${bestSubject?.subject}
Needs work: ${weakSubject?.subject}
Rule for this student: ${isBelowAverage ? `MUST start with "${student.name.split(" ")[0]}"` : "Vary the opening style."}
---`;
}).join('\n')}

Output ONLY a valid JSON array like this:
[{"name": "Student Name 1", "remark": "The remark 1..."}, {"name": "Student Name 2", "remark": "The remark 2..."}]`;

    // Retry up to 3 times within the edge function itself
    let lastError: string | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            max_tokens: students.length * 60,
            temperature: 0.6,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          if (response.status === 429) {
            // Rate limited — wait and retry
            lastError = "Rate limit exceeded";
            if (attempt < 2) {
              await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
              continue;
            }
            return new Response(
              JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
              { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          if (response.status === 402) {
            return new Response(
              JSON.stringify({ error: "AI credits exhausted. Please add more credits." }),
              { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          console.error(`AI gateway error (attempt ${attempt + 1}):`, response.status, errorText);
          lastError = `AI gateway error: ${response.status}`;
          if (attempt < 2) {
            await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
            continue;
          }
          throw new Error(lastError);
        }

        const data = await response.json();
        let content = data.choices?.[0]?.message?.content?.trim() || "[]";
        
        // Remove markdown JSON code blocks if present
        content = content.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

        let remarksArray: {name: string, remark: string}[] = [];
        try {
            const parsed = JSON.parse(content);
            remarksArray = Array.isArray(parsed) ? parsed : (parsed.remarks || []);
        } catch (e) {
            console.error("Failed to parse JSON response from AI:", content);
            throw new Error("Invalid response format from AI");
        }
        
        // Clean remarks
        remarksArray = remarksArray.map(item => {
            let remark = (item.remark || "").replace(/^["']|["']$/g, "").trim();
            const words = remark.split(/\s+/);
            if (words.length > 20) {
              remark = words.slice(0, 20).join(" ").replace(/[,;]$/, "") + ".";
            }
            return { name: item.name, remark };
        });

        console.log(`Generated remarks for ${remarksArray.length} students (attempt ${attempt + 1})`);

        return new Response(
          JSON.stringify({ remarks: remarksArray }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (fetchErr) {
        lastError = fetchErr instanceof Error ? fetchErr.message : "Fetch error";
        console.error(`Fetch attempt ${attempt + 1} failed:`, lastError);
        if (attempt < 2) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }

    throw new Error(lastError || "Failed after 3 attempts");
  } catch (error) {
    console.error("Error generating remark:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});