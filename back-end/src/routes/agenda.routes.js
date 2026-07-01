import { Router } from "express";
import {
  authMiddleware,
  requireAgendaSaved,
  requireProgramChosen,
  requireTestPassed
} from "../middleware/auth.middleware.js";
import * as agendaController from "../controllers/agenda.controller.js";

const router = Router();

router.post(
  "/save",
  authMiddleware,
  requireTestPassed,
  requireProgramChosen,
  agendaController.saveAgenda
);

export default router;
