import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import Anthropic from "@anthropic-ai/sdk";
import type { Request, Response } from "express";

const claudeApiKey = defineSecret("CLAUDE_API_KEY");

// =============================================================================
// Types
// =============================================================================

interface ParseTaskRequestBody {
  query: string;
  categories: Array<{ id: string; name: string }>;
  selectedDate: string;
}

interface ParsedTaskData {
  title: string;
  priority: "A" | "B" | "C" | "D";
  date: string | null;
  startTime: string | null;
  categoryName: string | null;
  duration: number | null;
  confidence: number;
}

interface SuccessResponse {
  success: true;
  data: ParsedTaskData;
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
): { valid: true; data: ParseTaskRequestBody } | { valid: false; error: string } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body must be a JSON object." };
  }

  const { query, categories, selectedDate } = body as Record<string, unknown>;

  if (typeof query !== "string" || query.trim().length === 0) {
    return { valid: false, error: "Field \"query\" is required and must be a non-empty string." };
  }

  if (query.length > 500) {
    return {
      valid: false,
      error: `Field "query" must be 500 characters or fewer. Received ${query.length} characters.`,
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
      categories: categories as ParseTaskRequestBody["categories"],
      selectedDate,
    },
  };
}

// =============================================================================
// Prompt Construction
// =============================================================================

function buildSystemPrompt(categories: Array<{ name: string }>, selectedDate: string): string {
  const categoryNames =
    categories.length > 0
      ? categories.map((c) => c.name).join(", ")
      : "No categories available";

  return `You are a task parsing assistant for a Franklin-Covey productivity app. Your job is to extract structured task information from natural language input.

Today's date (the user's currently selected date) is: ${selectedDate}

The user has the following categories available: ${categoryNames}

## Priority System
The app uses an A-B-C-D priority system:
- A = Vital (must do, serious consequences if not done). Map words like "vital", "urgent", "critical", "asap", "emergency" to A.
- B = Important (should do, mild consequences if not done). Map words like "important" or no specific priority hint to B. This is the default.
- C = Optional (nice to do, no real consequences). Map words like "optional", "nice to have", "low priority", "whenever" to C.
- D = Delegate (can be assigned to others or deferred). Map words like "delegate", "assign to", "ask someone" to D.

## Date Resolution
Resolve relative dates based on today's date (${selectedDate}):
- "today" = ${selectedDate}
- "tomorrow" = the day after ${selectedDate}
- "next Monday", "next Tuesday", etc. = the next occurrence of that weekday after ${selectedDate}
- "Friday" (without "next") = the upcoming Friday (could be this week or next)
- Specific dates like "January 15" or "Jan 15" = resolve to the nearest future occurrence
- If no date is mentioned, return null

## Time Parsing
- "at 9am", "at 9:00", "9 AM" = "09:00"
- "at 2pm", "at 14:00" = "14:00"
- "morning" = "09:00"
- "afternoon" = "13:00"
- "evening" = "18:00"
- If no time is mentioned, return null
- Always use 24-hour HH:MM format

## Duration Parsing
- "for 30 minutes", "30 min" = 30
- "for 1 hour", "1hr" = 60
- "for 1.5 hours" = 90
- "for 2 hours" = 120
- If no duration is mentioned, return null
- Always return duration in minutes as an integer

## Category Matching
- Match the task description to the most appropriate category from the available list
- Use fuzzy matching (e.g., "work" matches "Work", "gym" matches "Health & Fitness")
- If no category clearly matches, return null

## Output Format
Return ONLY a valid JSON object (no markdown, no code fences, no explanation) with these fields:
{
  "title": "Clean, concise task title extracted from the input (remove date/time/priority hints from the title)",
  "priority": "A" | "B" | "C" | "D",
  "date": "YYYY-MM-DD" | null,
  "startTime": "HH:MM" | null,
  "categoryName": "exact category name from the list" | null,
  "duration": number | null,
  "confidence": number between 0 and 1
}

The confidence score reflects how certain you are about the overall parsing:
- 0.9-1.0: Very clear input, all fields confidently extracted
- 0.7-0.89: Mostly clear, some minor ambiguity
- 0.5-0.69: Moderate ambiguity, some guessing involved
- Below 0.5: Very ambiguous input, significant guessing`;
}

// =============================================================================
// Claude API Call
// =============================================================================

async function parseWithClaude(
  query: string,
  categories: Array<{ name: string }>,
  selectedDate: string
): Promise<ParsedTaskData> {
  const apiKey = claudeApiKey.value();
  if (!apiKey) {
    throw new Error("CLAUDE_API_KEY environment variable is not configured.");
  }

  const client = new Anthropic({ apiKey });

  const systemPrompt = buildSystemPrompt(categories, selectedDate);

  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Parse the following task description and return the structured JSON:\n\n"${query}"`,
      },
    ],
    system: systemPrompt,
  });

  // Extract text content from the response
  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response received from Claude API.");
  }

  const rawText = textBlock.text.trim();

  // Parse the JSON response, stripping any accidental markdown fences
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

function validateParsedResponse(parsed: unknown): ParsedTaskData {
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Claude returned an invalid response structure.");
  }

  const data = parsed as Record<string, unknown>;

  const title = typeof data.title === "string" ? data.title.trim() : "";
  if (!title) {
    throw new Error("Claude response missing required \"title\" field.");
  }

  const validPriorities = ["A", "B", "C", "D"] as const;
  const priority = validPriorities.includes(data.priority as "A" | "B" | "C" | "D")
    ? (data.priority as "A" | "B" | "C" | "D")
    : "B";

  let date: string | null = null;
  if (typeof data.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    date = data.date;
  }

  let startTime: string | null = null;
  if (typeof data.startTime === "string" && /^\d{2}:\d{2}$/.test(data.startTime)) {
    startTime = data.startTime;
  }

  const categoryName =
    typeof data.categoryName === "string" && data.categoryName.trim().length > 0
      ? data.categoryName.trim()
      : null;

  let duration: number | null = null;
  if (typeof data.duration === "number" && data.duration > 0 && Number.isFinite(data.duration)) {
    duration = Math.round(data.duration);
  }

  let confidence = 0.5;
  if (typeof data.confidence === "number" && Number.isFinite(data.confidence)) {
    confidence = Math.max(0, Math.min(1, data.confidence));
  }

  return {
    title,
    priority,
    date,
    startTime,
    categoryName,
    duration,
    confidence,
  };
}

// =============================================================================
// Cloud Function
// =============================================================================

export const parseTask = onRequest(
  {
    secrets: [claudeApiKey],
    region: "us-central1",
    cors: [
      "https://neill-planner.web.app",
      "https://neill-planner.firebaseapp.com",
      "http://localhost:5173",
      "http://localhost:3000",
    ],
  },
  async (req: Request, res: Response) => {
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

    const { query, categories, selectedDate } = validation.data;

    try {
      const parsedTaskResult = await parseWithClaude(query, categories, selectedDate);

      const successResponse: SuccessResponse = {
        success: true,
        data: parsedTaskResult,
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

      console.error("parse-task error:", error);

      const errorResponse: ErrorResponse = {
        success: false,
        error: "An unexpected error occurred while parsing the task. Please try again.",
      };
      res.status(500).json(errorResponse);
    }
  }
);
