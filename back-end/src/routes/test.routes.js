import { Router } from "express";
import { authMiddleware, requireStudent, requireTestNotPassed } from "../middleware/auth.middleware.js";
import * as testController from "../controllers/test.controller.js";

const router = Router();

router.post(
  "/start",
  authMiddleware,
  requireStudent,
  requireTestNotPassed,
  testController.startTest
);

router.post(
  "/correct-code",
  authMiddleware,
  requireStudent,
  testController.correctCodeAnswer
);

export default router;
