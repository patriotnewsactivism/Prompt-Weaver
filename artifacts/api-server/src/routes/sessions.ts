import { Router } from "express";
import { db } from "@workspace/db";
import { sessionsTable, iterationsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/sessions", async (req, res) => {
  try {
    const sessions = await db
      .select()
      .from(sessionsTable)
      .orderBy(desc(sessionsTable.updatedAt));

    // For each session get the latest prompt
    const result = await Promise.all(
      sessions.map(async (session) => {
        const latestIteration = await db
          .select({ prompt: iterationsTable.prompt })
          .from(iterationsTable)
          .where(eq(iterationsTable.sessionId, session.id))
          .orderBy(desc(iterationsTable.iterationNumber))
          .limit(1);

        return {
          ...session,
          latestPrompt: latestIteration[0]?.prompt ?? null,
        };
      }),
    );

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to list sessions");
    res.status(500).json({ error: "Failed to list sessions" });
  }
});

router.post("/sessions", async (req, res) => {
  try {
    const { title, situation } = req.body as {
      title: string;
      situation: string;
    };

    if (!title?.trim() || !situation?.trim()) {
      res.status(400).json({ error: "title and situation are required" });
      return;
    }

    const [session] = await db
      .insert(sessionsTable)
      .values({ title: title.trim(), situation: situation.trim() })
      .returning();

    res.status(201).json(session);
  } catch (err) {
    req.log.error({ err }, "Failed to create session");
    res.status(500).json({ error: "Failed to create session" });
  }
});

router.get("/sessions/:id", async (req, res) => {
  try {
    const id = parseInt(req.params["id"]!, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const [session] = await db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.id, id));

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const iterations = await db
      .select()
      .from(iterationsTable)
      .where(eq(iterationsTable.sessionId, id))
      .orderBy(iterationsTable.iterationNumber);

    res.json({ ...session, iterations });
  } catch (err) {
    req.log.error({ err }, "Failed to get session");
    res.status(500).json({ error: "Failed to get session" });
  }
});

router.delete("/sessions/:id", async (req, res) => {
  try {
    const id = parseInt(req.params["id"]!, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const [session] = await db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.id, id));

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    await db.delete(iterationsTable).where(eq(iterationsTable.sessionId, id));
    await db.delete(sessionsTable).where(eq(sessionsTable.id, id));

    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete session");
    res.status(500).json({ error: "Failed to delete session" });
  }
});

export default router;
