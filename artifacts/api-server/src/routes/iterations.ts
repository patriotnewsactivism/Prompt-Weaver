import { Router } from "express";
import { db } from "@workspace/db";
import {
  sessionsTable,
  iterationsTable,
  appSettingsTable,
} from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { ai } from "@workspace/integrations-gemini-ai";

const router = Router();

router.get("/sessions/:id/iterations", async (req, res) => {
  try {
    const id = parseInt(req.params["id"]!, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const iterations = await db
      .select()
      .from(iterationsTable)
      .where(eq(iterationsTable.sessionId, id))
      .orderBy(iterationsTable.iterationNumber);

    res.json(iterations);
  } catch (err) {
    req.log.error({ err }, "Failed to list iterations");
    res.status(500).json({ error: "Failed to list iterations" });
  }
});

router.post("/sessions/:id/iterate", async (req, res) => {
  const id = parseInt(req.params["id"]!, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    const [session] = await db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.id, id));

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const previousIterations = await db
      .select()
      .from(iterationsTable)
      .where(eq(iterationsTable.sessionId, id))
      .orderBy(iterationsTable.iterationNumber);

    const { userFeedback, focusArea } = req.body as {
      userFeedback?: string | null;
      focusArea?: string | null;
    };

    // Get the model from settings
    const settingsRows = await db.select().from(appSettingsTable).limit(1);
    const model =
      settingsRows[0]?.model ?? "gemini-3-flash-preview";

    const iterationNumber = previousIterations.length + 1;
    const lastIteration =
      previousIterations[previousIterations.length - 1] ?? null;

    // Build the system prompt
    const systemInstruction = `You are an expert prompt engineer specializing in crafting precise, effective prompts for AI models. Your task is to generate and iteratively improve prompts.

Output your response in EXACTLY this format — no deviations:

REASONING:
<your detailed analysis of what makes a great prompt for this situation and how to improve upon the previous one>

IMPROVED PROMPT:
<the complete, ready-to-use improved prompt>

Rules:
- The REASONING section explains your thinking: what aspects you're improving, why, and what techniques you're applying
- The IMPROVED PROMPT section is the complete, standalone prompt — ready to copy and use directly
- Be specific, analytical, and insightful in your reasoning
- The improved prompt should be noticeably better than the previous iteration`;

    let userMessage: string;

    if (iterationNumber === 1) {
      userMessage = `Create the best possible prompt for the following situation:

SITUATION: ${session.situation}

Generate an initial high-quality prompt optimized for this exact use case. In your reasoning, explain the key principles you're applying: what makes this prompt effective, what techniques you're using (role assignment, context setting, output format, constraints, examples), and why these choices are optimal for this situation.`;
    } else {
      const prevPrompt = lastIteration!.prompt;
      const focusInstruction = focusArea
        ? `\n\nFocus your improvement specifically on: **${focusArea}**`
        : "";
      const feedbackInstruction = userFeedback
        ? `\n\nUser feedback on the previous prompt: "${userFeedback}"`
        : "";

      userMessage = `Improve the following prompt for the situation described below.

SITUATION: ${session.situation}

CURRENT PROMPT (iteration ${iterationNumber - 1}):
${prevPrompt}
${feedbackInstruction}${focusInstruction}

Analyze the current prompt's weaknesses and produce a meaningfully better version. In your reasoning, identify specific issues with the current prompt and explain exactly how your improvements address them.`;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let fullResponse = "";
    let currentPhase: "reasoning" | "prompt" | "unknown" = "unknown";
    const REASONING_MARKER = "REASONING:";
    const PROMPT_MARKER = "IMPROVED PROMPT:";

    const stream = await ai.models.generateContentStream({
      model,
      contents: [{ role: "user", parts: [{ text: userMessage }] }],
      config: {
        systemInstruction,
        maxOutputTokens: 8192,
      },
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (!text) continue;

      fullResponse += text;

      // Detect phase transitions
      if (
        currentPhase === "unknown" &&
        fullResponse.includes(REASONING_MARKER)
      ) {
        currentPhase = "reasoning";
      }
      if (currentPhase === "reasoning" && fullResponse.includes(PROMPT_MARKER)) {
        currentPhase = "prompt";
      }

      res.write(
        `data: ${JSON.stringify({ content: text, phase: currentPhase })}\n\n`,
      );
    }

    // Parse final response
    let reasoning = "";
    let prompt = "";

    const reasoningStart = fullResponse.indexOf(REASONING_MARKER);
    const promptStart = fullResponse.indexOf(PROMPT_MARKER);

    if (reasoningStart !== -1 && promptStart !== -1) {
      reasoning = fullResponse
        .slice(reasoningStart + REASONING_MARKER.length, promptStart)
        .trim();
      prompt = fullResponse
        .slice(promptStart + PROMPT_MARKER.length)
        .trim();
    } else {
      // Fallback: treat whole response as prompt
      reasoning = "Generated based on your situation.";
      prompt = fullResponse.trim();
    }

    // Save to DB
    await db.insert(iterationsTable).values({
      sessionId: id,
      iterationNumber,
      prompt,
      reasoning,
      focusArea: focusArea ?? null,
    });

    // Update session iteration count and updatedAt
    await db
      .update(sessionsTable)
      .set({
        iterationCount: iterationNumber,
        updatedAt: new Date(),
      })
      .where(eq(sessionsTable.id, id));

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "Failed to generate iteration");
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate iteration" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Generation failed" })}\n\n`);
      res.end();
    }
  }
});

export default router;
