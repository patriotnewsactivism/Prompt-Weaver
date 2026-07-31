import { Router, type IRouter } from "express";
import healthRouter from "./health";
import settingsRouter from "./settings";
import sessionsRouter from "./sessions";
import iterationsRouter from "./iterations";

const router: IRouter = Router();

router.use(healthRouter);
router.use(settingsRouter);
router.use(sessionsRouter);
router.use(iterationsRouter);

export default router;
