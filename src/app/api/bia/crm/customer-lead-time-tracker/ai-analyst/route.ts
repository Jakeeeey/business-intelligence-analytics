import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

function cleanMarkdownLatex(text: string): string {
  if (!text) return "";
  let cleaned = text;

  // 1. Remove display math blocks $$...$$ or \[...\]
  cleaned = cleaned.replace(/\$\$([\s\S]*?)\$\$/g, "$1");
  cleaned = cleaned.replace(/\\\[([\s\S]*?)\\\]/g, "$1");

  // 2. Remove inline math delimiters \(...\)
  cleaned = cleaned.replace(/\\\(([\s\S]*?)\\\)/g, "$1");

  // 3. LaTeX text wrappers with space normalization: \text{...}, \mathrm{...}, \textbf{...}, etc.
  cleaned = cleaned.replace(/(\d)\s*\\(?:text|mathrm|mathbf|textit|mathit|textbf|bold)\{([^}]*)\}/g, "$1 $2");
  cleaned = cleaned.replace(/\\(?:text|mathrm|mathbf|textit|mathit|textbf|bold)\{([^}]*)\}/g, "$1");

  // 4. LaTeX math relational & arithmetic operators
  cleaned = cleaned.replace(/\\(?:le|leq)(?=[^a-zA-Z]|$)\s*/g, "≤ ");
  cleaned = cleaned.replace(/\\(?:ge|geq)(?=[^a-zA-Z]|$)\s*/g, "≥ ");
  cleaned = cleaned.replace(/\\(?:ne|neq)(?=[^a-zA-Z]|$)\s*/g, "≠ ");
  cleaned = cleaned.replace(/\\(?:approx|sim)(?=[^a-zA-Z]|$)\s*/g, "≈ ");
  cleaned = cleaned.replace(/\\pm(?=[^a-zA-Z]|$)\s*/g, "± ");
  cleaned = cleaned.replace(/\\times(?=[^a-zA-Z]|$)\s*/g, "× ");
  cleaned = cleaned.replace(/\\cdot(?=[^a-zA-Z]|$)\s*/g, "· ");
  cleaned = cleaned.replace(/\\(?:dots|ldots)(?=[^a-zA-Z]|$)\s*/g, "...");
  cleaned = cleaned.replace(/\\infty(?=[^a-zA-Z]|$)\s*/g, "∞");
  cleaned = cleaned.replace(/\\(?:lt)(?=[^a-zA-Z]|$)\s*/g, "< ");
  cleaned = cleaned.replace(/\\(?:gt)(?=[^a-zA-Z]|$)\s*/g, "> ");

  // 5. LaTeX spacing and escaped symbols
  cleaned = cleaned.replace(/\\(?:quad|qquad)\s*/g, " ");
  cleaned = cleaned.replace(/\\[,;:!]\s*/g, " ");
  cleaned = cleaned.replace(/\\%/g, "%");
  cleaned = cleaned.replace(/\\_/g, "_");

  // 6. Strip math dollar signs: e.g. "$≤ 1.0 Day$" or "$90.0%$"
  cleaned = cleaned.replace(/\$([^\$\n]*?(?:[≤≥≠≈±×·<>]|%|\b(?:Days?|Hours?|Mins?|Secs?)\b)[^\$\n]*?)\$/gi, "$1");
  cleaned = cleaned.replace(/\$([^\$\n]+?)\$/g, (match, inner) => {
    // Preserve pure currency like $100 or $25.50
    if (/^\s*[\d,]+(?:\.\d+)?\s*$/.test(inner)) return match;
    return inner;
  });

  // 7. Clean up accidental multiple spaces (preserving newlines)
  cleaned = cleaned.replace(/([^\S\r\n]{2,})/g, " ");

  return cleaned.trim();
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
    const { rows, metrics, messages, mode } = body;

    const isChatMode = mode === "chat" || (Array.isArray(messages) && messages.length > 0);

    // Build the system context
    const systemContext = `
You are a Super Intelligent AI Data Analyst specializing in Supply Chain Management and Customer Lead Time.
You provide exceptional, actionable data insights and recommendations based on the following dataset.

The dashboard tracks the lead time from when a Purchase Order (PO) is created to Approval, Picking/Consolidation, Dispatch, and Delivery.

Current metrics from the dashboard:
${JSON.stringify(metrics || {}, null, 2)}

Sample row data (up to 50 rows for context):
${JSON.stringify((rows || []).slice(0, 50), null, 2)}

CRITICAL FORMATTING INSTRUCTIONS:
- Do NOT use LaTeX math syntax or dollar signs (e.g., do NOT write $\le$, $\ge$, $\approx$, or $\text{Day}$).
- Always write symbols and comparisons in clear standard plain text or unicode (e.g., "≤ 1.0 Day", "≥ 90%", "~ 2 Days").
- Make your answers formatted in clean, professional Markdown with bullet points, bolding, and tables where applicable.
- Do not output raw JSON, code blocks, or debug data structures unless specifically requested.
`;

    let prompt = "";

    if (isChatMode) {
      const historyText = (messages || [])
        .map(
          (m: { role: string; content: string }) =>
            `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`
        )
        .join("\n\n");

      prompt = `
${systemContext}

CONVERSATION HISTORY:
${historyText}

Answer the latest user message directly, professionally, and concisely using the dataset and metrics above. If asking for recommendations, provide specific actionable operational steps.

Assistant:`;
    } else {
      prompt = `
${systemContext}

Please write a comprehensive, professional Markdown report that:
1. Summarizes the overall performance (identifying bottlenecks in Approval, Pick/Conso, or Dispatch).
2. Highlights any critical delays (anything taking more than 3 days is considered critical).
3. **Explicitly includes a dedicated "Recommendations" section detailing step-by-step how to fix the problems and bottlenecks identified.**

Make the report look stunning with proper Markdown (headings, bold text, bullet points, and a table of key takeaways).
`;
    }

    // Candidate models to try with automatic fallback.
    // Prioritize ultra-fast flash-lite models (<1.5s latency) over congested models.
    const fastModels = [
      "gemini-3.5-flash-lite",
      "gemini-flash-lite-latest",
      "gemini-3.5-flash",
      "gemini-3.6-flash",
    ];

    const userModel = process.env.GEMINI_MODEL?.trim();
    // If user specified a custom model in .env.local that is NOT congested gemini-3.8-flash, try it first;
    // otherwise prioritize ultra-fast models with gemini-3.8-flash as a fallback.
    const candidateModels =
      userModel && userModel !== "gemini-3.8-flash"
        ? [userModel, ...fastModels]
        : [...fastModels, ...(userModel ? [userModel] : []), "gemini-3.8-flash"];

    const modelsToTry = Array.from(new Set(candidateModels));

    let lastError: unknown = null;
    let responseText = "";

    // Helper to race API call with a strict timeout to prevent long UI freezes
    const generateWithTimeout = async (model: string, timeoutMs = 7000) => {
      let timer: NodeJS.Timeout | undefined;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`Timeout: model '${model}' exceeded ${timeoutMs}ms limit.`));
        }, timeoutMs);
      });

      try {
        const result = await Promise.race([
          ai.models.generateContent({
            model,
            contents: prompt,
          }),
          timeoutPromise,
        ]);
        return result;
      } finally {
        if (timer) clearTimeout(timer);
      }
    };

    for (const currentModel of modelsToTry) {
      try {
        const response = await generateWithTimeout(currentModel, 7000);

        if (response && response.text) {
          responseText = cleanMarkdownLatex(response.text);
          break;
        }
      } catch (err: unknown) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[AI Analyst] Model '${currentModel}' failed or timed out (${msg}), attempting fallback...`);
      }
    }

    if (!responseText) {
      throw (
        lastError ||
        new Error("Failed to generate AI report across available candidate models.")
      );
    }

    return NextResponse.json({
      report: responseText,
      reply: responseText,
    });
  } catch (error: unknown) {
    console.error("[AI Analyst Error]", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json(
      { error: "Failed to generate AI response", details: errorMessage },
      { status: 500 }
    );
  }
}
