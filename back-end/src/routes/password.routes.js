import { Router } from "express";
import * as passwordController from "../controllers/password.controller.js";

const router = Router();

router.post("/forgot-password", passwordController.forgotPassword);
router.post("/reset-password", passwordController.resetPassword);

export default router;
