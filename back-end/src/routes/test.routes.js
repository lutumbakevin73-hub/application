import { Router } from "express";
import { authMiddleware, requireTestNotPassed } from "../middleware/auth.middleware.js";
import * as testController from "../controllers/test.controller.js";

const router = Router();

router.post(
  "/start",
  authMiddleware,
  requireTestNotPassed,
  testController.startTest
);
router.post("/correct-code", authMiddleware, testController.correctCodeAnswer);

export default router;
