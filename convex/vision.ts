import { v, ConvexError } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

const EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    extracted: { type: "boolean" },
    runtimeValue: { type: ["string", "null"] },
    runtimePercentile: { type: ["number", "null"] },
    memoryValue: { type: ["string", "null"] },
    memoryPercentile: { type: ["number", "null"] },
    reason: { type: ["string", "null"] },
  },
  required: ["extracted", "runtimeValue", "runtimePercentile", "memoryValue", "memoryPercentile", "reason"],
  additionalProperties: false,
};

const PROMPT = `You are reading a screenshot of a LeetCode "Accepted" submission result panel.
Extract these four fields, which always appear together on the panel:
1. runtimeValue: the raw runtime, formatted exactly like the panel shows it (e.g. "17 ms").
2. runtimePercentile: the runtime percentile (e.g. "Beats 48.12%" -> 48.12). A plain number, 0-100.
3. memoryValue: the raw memory usage, formatted exactly like the panel shows it (e.g. "32.35 MB").
4. memoryPercentile: the memory percentile (e.g. "Beats 34.10%" -> 34.10). A plain number, 0-100.

Set extracted=true only if you can confidently read all four fields directly from the panel (not inferred/guessed).
If the image is not a LeetCode accepted-submission panel, is cropped so a field is missing, or a field is genuinely
unreadable, set extracted=false, set the unreadable fields to null, and explain what went wrong in reason (plain
text, no markdown).`;

type ExtractionResult = {
  extracted: boolean;
  runtimeValue: string | null;
  runtimePercentile: number | null;
  memoryValue: string | null;
  memoryPercentile: number | null;
  reason: string | null;
};

export const extractSubmission = action({
  args: {
    questionId: v.id("questions"),
    imageBase64: v.string(),
    mimeType: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new ConvexError("Not authenticated");

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new ConvexError("The reader isn't configured on this deployment yet.");

    const dataUrl = `data:${args.mimeType};base64,${args.imageBase64}`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-2024-08-06",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: PROMPT },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "extraction", strict: true, schema: EXTRACTION_SCHEMA },
        },
        max_tokens: 500,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      await ctx.runMutation(internal.submissions.recordExtractionFailure, {
        userId,
        questionId: args.questionId,
        reason: `Vision API error: ${res.status} ${text.slice(0, 300)}`,
      });
      throw new ConvexError("The reader is temporarily unavailable. Try again in a moment.");
    }

    const body = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = body.choices?.[0]?.message?.content;
    let parsed: ExtractionResult | null;
    try {
      parsed = raw ? (JSON.parse(raw) as ExtractionResult) : null;
    } catch {
      parsed = null;
    }

    const runtimeOk =
      parsed !== null &&
      parsed.runtimePercentile !== null &&
      parsed.runtimePercentile >= 0 &&
      parsed.runtimePercentile <= 100 &&
      !!parsed.runtimeValue;
    const memoryOk =
      parsed !== null &&
      parsed.memoryPercentile !== null &&
      parsed.memoryPercentile >= 0 &&
      parsed.memoryPercentile <= 100 &&
      !!parsed.memoryValue;

    if (parsed === null || !parsed.extracted || !runtimeOk || !memoryOk) {
      const reason = parsed?.reason ?? "Could not parse a structured reading from the panel.";
      await ctx.runMutation(internal.submissions.recordExtractionFailure, {
        userId,
        questionId: args.questionId,
        reason,
      });
      throw new ConvexError(reason);
    }

    const result: { current: unknown; best: unknown } = await ctx.runMutation(
      internal.submissions.recordSubmission,
      {
        userId,
        questionId: args.questionId,
        runtimePercentile: parsed.runtimePercentile as number,
        memoryPercentile: parsed.memoryPercentile as number,
        runtimeValue: parsed.runtimeValue as string,
        memoryValue: parsed.memoryValue as string,
      },
    );

    return result;
  },
});
