import { Router } from "express";
import {
  authMiddleware,
  requireAgendaSaved,
  requireProgramChosen,
  requireTestPassed
} from "../middleware/auth.middleware.js";
import * as studyController from "../controllers/study.controller.js";

const router = Router();

router.get(
  "/current",
  authMiddleware,
  requireTestPassed,
  studyController.getMyProgram
);
router.post(
  "/register",
  authMiddleware,
  requireTestPassed,
  studyController.createProgram
);
router.get(
  "/:programId/sessions",
  authMiddleware,
  requireTestPassed,
  requireProgramChosen,
  requireAgendaSaved,
  studyController.getSessions
);

export default router;
