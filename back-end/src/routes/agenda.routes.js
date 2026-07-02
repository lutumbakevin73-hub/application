import { Router } from "express";
import {
  authMiddleware,
  requireProgramChosen,
  requireStudent,
  requireTestPassed
} from "../middleware/auth.middleware.js";
import * as agendaController from "../controllers/agenda.controller.js";

const router = Router();

router.get(
  "/current",
  authMiddleware,
  requireStudent,
  requireTestPassed,
  requireProgramChosen,
  agendaController.getMyAgenda
);

router.post(
  "/save",
  authMiddleware,
  requireStudent,
  requireTestPassed,
  requireProgramChosen,
  agendaController.saveAgenda
);

export default router;
