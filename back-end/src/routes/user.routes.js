import { Router } from "express";
import { authMiddleware, requireStudent } from "../middleware/auth.middleware.js";
import * as userController from "../controllers/user.controller.js";

const router = Router();

router.post("/complete-test", authMiddleware, requireStudent, userController.completeTest);
router.get("/test-result", authMiddleware, requireStudent, userController.getMyTestResult);
router.post("/choose-language", authMiddleware, requireStudent, userController.chooseLanguage);

export default router;
