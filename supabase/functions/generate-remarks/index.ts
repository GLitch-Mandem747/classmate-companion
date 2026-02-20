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
    const student: StudentData = body.student;

    if (!student || !student.name) {
      return new Response(
        JSON.stringify({ error: "Invalid student data provided." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const isBelowAverage = student.rank > Math.ceil(student.totalStudents / 2);

    let performanceLevel = "excellent";
    if (student.gradePoints > 18) performanceLevel = "needs improvement";
    else if (student.gradePoints > 12) performanceLevel = "satisfactory";
    else if (student.gradePoints > 8) performanceLevel = "good";

    const bestSubject = student.subjects.reduce((best, s) => s.score > best.score ? s : best, student.subjects[0]);
    const weakSubject = student.subjects.reduce((weak, s) => s.score < weak.score ? s : weak, student.subjects[0]);

    const systemPrompt = `You are a school teacher writing very short report card remarks. 
STRICT RULES:
- Maximum 15 words ONLY. Never exceed this.
- Third person (e.g. "John has shown...")
- ${isBelowAverage ? `MUST start with the student's first name "${student.name.split(" ")[0]}"` : "May start with the student name or vary the opening"}
- No grades or numbers
- Encouraging but honest
- Single sentence only`;

    const userPrompt = `Write a 15-word MAX report card remark for ${student.name}.
Performance: ${performanceLevel}. Best subject: ${bestSubject?.subject}. Needs work: ${weakSubject?.subject}.
${isBelowAverage ? `START with "${student.name.split(" ")[0]}"` : "Vary the opening style."}
ONE sentence, 15 words maximum.`;

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
            max_tokens: 60,
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
        let remark = data.choices?.[0]?.message?.content?.trim() || "";

        // Strip quotes if AI wrapped it in them
        remark = remark.replace(/^["']|["']$/g, "").trim();

        // Hard-cap at 20 words as a safety net
        const words = remark.split(/\s+/);
        if (words.length > 20) {
          remark = words.slice(0, 20).join(" ").replace(/[,;]$/, "") + ".";
        }

        console.log(`Generated remark for ${student.name} (attempt ${attempt + 1}):`, remark);

        return new Response(
          JSON.stringify({ remark }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (fetchErr) {
        lastError = fetchErr instanceof Error ? fetchErr.message : "Fetch error";
        console.error(`Fetch attempt ${attempt + 1} failed for ${student.name}:`, lastError);
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
