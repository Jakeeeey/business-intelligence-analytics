import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured in the environment variables. Please add it to your .env.local file and restart the development server." },
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
      
      Make the report look stunning with proper Markdown (headings, bold text, bullet points, and a table of key takeaways). Do not include any JSON or raw data structures in the output, just the polished executive summary.
    `;

    // Call Gemini via the new SDK (using the 2.5-flash model)
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return NextResponse.json({ report: response.text });
  } catch (error: unknown) {
    console.error("[AI Analyst Error]", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json(
      { error: "Failed to generate AI report", details: errorMessage },
      { status: 500 }
    );
  }
}
