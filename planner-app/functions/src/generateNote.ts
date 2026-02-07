import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import Anthropic from "@anthropic-ai/sdk";
import type { Request, Response } from "express";

const claudeApiKey = defineSecret("CLAUDE_API_KEY");

// =============================================================================
// Types
// =============================================================================

interface GenerateNoteRequestBody {
  query: string;
  categories: Array<{ id: string; name: string }>;
  selectedDate: string;
}

interface ParsedNoteData {
  title: string;
  categoryName: string | null;
  content: string;
  confidence: number;
}

interface SuccessResponse {
  success: true;
  data: ParsedNoteData;
}

interface ErrorResponse {
  success: false;
  error: string;
}

// =============================================================================
// Validation
// =============================================================================

function validateRequestBody(
  body: unknown
): { valid: true; data: GenerateNoteRequestBody } | { valid: false; error: string } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body must be a JSON object." };
  }

  const { query, categories, selectedDate } = body as Record<string, unknown>;

  if (typeof query !== "string" || query.trim().length === 0) {
    return { valid: false, error: "Field \"query\" is required and must be a non-empty string." };
  }

  if (query.length > 5000) {
    return {
      valid: false,
      error: `Field "query" must be 5000 characters or fewer. Received ${query.length} characters.`,
    };
  }

  if (!Array.isArray(categories)) {
    return { valid: false, error: "Field \"categories\" is required and must be an array." };
  }

  if (categories.length > 100) {
    return { valid: false, error: "Field \"categories\" must have 100 or fewer entries." };
  }

  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    if (
      !cat ||
      typeof cat !== "object" ||
      typeof cat.id !== "string" ||
      typeof cat.name !== "string"
    ) {
      return {
        valid: false,
        error: `Each category must have "id" (string) and "name" (string). Invalid at index ${i}.`,
      };
    }
  }

  if (typeof selectedDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
    return {
      valid: false,
      error: "Field \"selectedDate\" is required and must be in YYYY-MM-DD format.",
    };
  }

  return {
    valid: true,
    data: {
      query: query.trim(),
      categories: categories as GenerateNoteRequestBody["categories"],
      selectedDate,
    },
  };
}

// =============================================================================
// Prompt Construction
// =============================================================================

function buildSystemPrompt(categories: Array<{ name: string }>): string {
  const categoryNames =
    categories.length > 0
      ? categories.map((c) => c.name).join(", ")
      : "No categories available";

  return `You are a note generation assistant for a productivity app. Your job is to take spoken/dictated text and transform it into a well-structured note.

The user has the following categories available: ${categoryNames}

## Your Tasks

1. **Extract a Title**: Create a concise, descriptive title (max 100 characters) that captures the main topic of the note.

2. **Match a Category**: Pick the most appropriate category from the user's list. Use fuzzy matching (e.g., "work stuff" matches "Work", "gym notes" matches "Health & Fitness"). If no category clearly matches, return null.

3. **Organize the Content**: Transform the raw spoken text into well-structured HTML content:
   - Use <h3> tags for section headings where appropriate
   - Use <ul>/<li> for bullet point lists
   - Use <ol>/<li> for numbered/ordered items
   - Use <p> tags for paragraphs
   - Use <strong> for emphasis on key points
   - Identify and group: key points, action items, decisions, deadlines, questions
   - Clean up speech artifacts (filler words like "um", "uh", repeated words)
   - Fix grammar and punctuation while preserving the original meaning
   - Keep the content faithful to what was said - don't add information that wasn't spoken

## Output Format
Return ONLY a valid JSON object (no markdown, no code fences, no explanation) with these fields:
{
  "title": "Concise note title",
  "categoryName": "exact category name from the list" | null,
  "content": "<h3>Section</h3><ul><li>Point 1</li></ul>...",
  "confidence": number between 0 and 1
}

The confidence score reflects how well you could structure the content:
- 0.9-1.0: Clear, well-structured input with obvious organization
- 0.7-0.89: Mostly clear, some interpretation needed
- 0.5-0.69: Rambling or disorganized input, significant structuring needed
- Below 0.5: Very unclear or minimal input`;
}

// =============================================================================
// Claude API Call
// =============================================================================

async function generateWithClaude(
  query: string,
  categories: Array<{ name: string }>
): Promise<ParsedNoteData> {
  const apiKey = claudeApiKey.value();
  if (!apiKey) {
    throw new Error("CLAUDE_API_KEY environment variable is not configured.");
  }

  const client = new Anthropic({ apiKey });

  const systemPrompt = buildSystemPrompt(categories);

  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Transform the following spoken/dictated text into a structured note and return the JSON:\n\n"${query}"`,
      },
    ],
    system: systemPrompt,
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response received from Claude API.");
  }

  const rawText = textBlock.text.trim();

  let jsonText = rawText;
  if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error(`Failed to parse Claude response as JSON. Raw response: ${rawText}`);
  }

  return validateParsedResponse(parsed);
}

// =============================================================================
// Response Validation
// =============================================================================

function validateParsedResponse(parsed: unknown): ParsedNoteData {
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Claude returned an invalid response structure.");
  }

  const data = parsed as Record<string, unknown>;

  const title = typeof data.title === "string" ? data.title.trim() : "";
  if (!title) {
    throw new Error("Claude response missing required \"title\" field.");
  }

  const categoryName =
    typeof data.categoryName === "string" && data.categoryName.trim().length > 0
      ? data.categoryName.trim()
      : null;

  const content = typeof data.content === "string" ? data.content.trim() : "";
  if (!content) {
    throw new Error("Claude response missing required \"content\" field.");
  }

  let confidence = 0.5;
  if (typeof data.confidence === "number" && Number.isFinite(data.confidence)) {
    confidence = Math.max(0, Math.min(1, data.confidence));
  }

  return {
    title,
    categoryName,
    content,
    confidence,
  };
}

// =============================================================================
// CORS
// =============================================================================

const ALLOWED_ORIGINS = [
  "https://neill-planner.web.app",
  "https://neill-planner.firebaseapp.com",
  "http://localhost:5173",
  "http://localhost:3000",
];

function setCorsHeaders(req: Request, res: Response): boolean {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
  }
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.set("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return true;
  }
  return false;
}

// =============================================================================
// Cloud Function
// =============================================================================

export const generateNote = onRequest(
  { secrets: [claudeApiKey], region: "us-central1" },
  async (req: Request, res: Response) => {
    if (setCorsHeaders(req, res)) return;

    if (req.method !== "POST") {
      const errorResponse: ErrorResponse = {
        success: false,
        error: `Method ${req.method} not allowed. Only POST requests are accepted.`,
      };
      res.status(405).json(errorResponse);
      return;
    }

    const validation = validateRequestBody(req.body);
    if (!validation.valid) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: validation.error,
      };
      res.status(400).json(errorResponse);
      return;
    }

    const { query, categories } = validation.data;

    try {
      const parsedNote = await generateWithClaude(query, categories);

      const successResponse: SuccessResponse = {
        success: true,
        data: parsedNote,
      };
      res.status(200).json(successResponse);
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes("CLAUDE_API_KEY")) {
        const errorResponse: ErrorResponse = {
          success: false,
          error: "Server configuration error. The AI service is not properly configured.",
        };
        res.status(500).json(errorResponse);
        return;
      }

      if (error instanceof Anthropic.APIError) {
        const statusCode = error.status;
        let userMessage = "An error occurred while processing your request with the AI service.";

        if (statusCode === 401) {
          userMessage = "AI service authentication failed. Please contact support.";
        } else if (statusCode === 429) {
          userMessage = "AI service rate limit reached. Please try again in a moment.";
        } else if (statusCode === 529) {
          userMessage = "AI service is temporarily overloaded. Please try again later.";
        }

        const errorResponse: ErrorResponse = {
          success: false,
          error: userMessage,
        };
        res.status(statusCode >= 500 ? 502 : statusCode).json(errorResponse);
        return;
      }

      console.error("generate-note error:", error);

      const errorResponse: ErrorResponse = {
        success: false,
        error: "An unexpected error occurred while generating the note. Please try again.",
      };
      res.status(500).json(errorResponse);
    }
  }
);
