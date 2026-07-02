import { Router } from "express";
import {
  authMiddleware,
  requireAgendaSaved,
  requireProgramChosen,
  requireStudent,
  requireTestPassed
} from "../middleware/auth.middleware.js";
import * as studyController from "../controllers/study.controller.js";

const router = Router();

router.get(
  "/current",
  authMiddleware,
  requireStudent,
  requireTestPassed,
  studyController.getMyProgram
);
router.post(
  "/register",
  authMiddleware,
  requireStudent,
  requireTestPassed,
  studyController.createProgram
);
router.get(
  "/progress",
  authMiddleware,
  requireStudent,
  requireTestPassed,
  requireProgramChosen,
  requireAgendaSaved,
  studyController.getProgress
);
router.post(
  "/progress",
  authMiddleware,
  requireStudent,
  requireTestPassed,
  requireProgramChosen,
  requireAgendaSaved,
  studyController.saveProgress
);
router.get(
  "/:programId/sessions",
  authMiddleware,
  requireStudent,
  requireTestPassed,
  requireProgramChosen,
  requireAgendaSaved,
  studyController.getSessions
);

export default router;
