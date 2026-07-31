import { Router } from "express";
import { db } from "@workspace/db";
import { appSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/settings", async (req, res) => {
  try {
    const rows = await db.select().from(appSettingsTable).limit(1);
    const row = rows[0];
    const geminiConfigured =
      !!process.env["AI_INTEGRATIONS_GEMINI_BASE_URL"] &&
      !!process.env["AI_INTEGRATIONS_GEMINI_API_KEY"];

    if (!row) {
      res.json({
        hasApiKey: geminiConfigured,
        model: "gemini-3-flash-preview",
      });
      return;
    }

    res.json({
      hasApiKey: geminiConfigured,
      model: row.model ?? "gemini-3-flash-preview",
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get settings");
    res.status(500).json({ error: "Failed to get settings" });
  }
});

router.put("/settings", async (req, res) => {
  try {
    const { model } = req.body as { apiKey?: string; model?: string };
    const finalModel = model ?? "gemini-3-flash-preview";

    const existing = await db.select().from(appSettingsTable).limit(1);
    if (existing.length === 0) {
      await db.insert(appSettingsTable).values({ model: finalModel });
    } else {
      await db
        .update(appSettingsTable)
        .set({ model: finalModel })
        .where(eq(appSettingsTable.id, existing[0]!.id));
    }

    const geminiConfigured =
      !!process.env["AI_INTEGRATIONS_GEMINI_BASE_URL"] &&
      !!process.env["AI_INTEGRATIONS_GEMINI_API_KEY"];

    res.json({ hasApiKey: geminiConfigured, model: finalModel });
  } catch (err) {
    req.log.error({ err }, "Failed to update settings");
    res.status(500).json({ error: "Failed to update settings" });
  }
});

export default router;
