import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

function cleanMarkdownLatex(text: string): string {
  if (!text) return "";
  return text
    // Replace LaTeX inequality and math symbols
    .replace(/\\le(?:q)?\b\s*/g, "<= ")
    .replace(/\\ge(?:q)?\b\s*/g, ">= ")
    .replace(/\\approx\b\s*/g, "~ ")
    .replace(/\\neq\b\s*/g, "!= ")
    .replace(/\\times\b\s*/g, "× ")
    // Replace \text{...} with the content inside
    .replace(/\\text\{([^}]+)\}/g, "$1")
    // Replace escaped percent \%
    .replace(/\\%/g, "%")
    // Clean dollar signs enclosing math notation
    .replace(/\$([^$]+)\$/g, (_, inner) => inner.trim());
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "GEMINI_API_KEY is not configured in the environment variables. Please add it to your .env.local file and restart the development server.",
        },
        { status: 500 }
      );
    }

    // Initialize the Google Gen AI client
    const ai = new GoogleGenAI({ apiKey });

    const body = await request.json();
    const { rows, metrics } = body;

    // Build the prompt for the AI Analyst
    const prompt = `
      You are a Super Intelligent AI Data Analyst specializing in Supply Chain Management and Customer Lead Time.
      You are providing an exceptional and excellent executive report based on the following data snapshot.
      
      The dashboard tracks the lead time from when a Purchase Order (PO) is created to Approval, Picking/Consolidation, Dispatch, and Delivery.
      
      Here are the current metrics from the dashboard:
      ${JSON.stringify(metrics, null, 2)}
      
      Here is a summary of the underlying row data (up to 50 rows for context):
      ${JSON.stringify((rows || []).slice(0, 50), null, 2)}
      
      Please write a comprehensive, professional Markdown report that:
      1. Summarizes the overall performance (identifying bottlenecks in Approval, Pick/Conso, or Dispatch).
      2. Highlights any critical delays (anything taking more than 3 days is considered critical).
      3. **Explicitly includes a dedicated "Recommendations" section detailing step-by-step how to fix the problems and bottlenecks identified.**
      
      CRITICAL FORMATTING INSTRUCTIONS:
      - Do NOT use LaTeX math syntax or dollar signs (e.g., do NOT write $\\le$, $\\ge$, or $\\text{Day}$).
      - Always write symbols and comparisons in clear standard plain text (e.g., "<= 1.0 Day", ">= 90%", "~ 2 Days").
      - Make the report look stunning with proper Markdown (headings, bold text, bullet points, and a table of key takeaways).
      - Do not include any raw JSON or code fences in the output, just the polished executive summary.
    `;

    // Candidate models to try with automatic fallback (current Gemini 3.x generation)
    const userModel = process.env.GEMINI_MODEL?.trim();
    const candidateModels = [
      ...(userModel ? [userModel] : []),
      "gemini-3.8-flash",
      "gemini-3.6-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
    ];
    const modelsToTry = Array.from(new Set(candidateModels));

    let lastError: unknown = null;
    let responseText = "";

    for (const currentModel of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: currentModel,
          contents: prompt,
        });

        if (response && response.text) {
          responseText = cleanMarkdownLatex(response.text);
          break;
        }
      } catch (err: unknown) {
        lastError = err;
        console.warn(`[AI Analyst] Model '${currentModel}' failed, attempting fallback...`);
      }
    }

    if (!responseText) {
      throw (
        lastError ||
        new Error("Failed to generate AI report across available candidate models.")
      );
    }

    return NextResponse.json({ report: responseText });
  } catch (error: unknown) {
    console.error("[AI Analyst Error]", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json(
      { error: "Failed to generate AI report", details: errorMessage },
      { status: 500 }
    );
  }
}
