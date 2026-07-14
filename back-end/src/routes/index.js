import { Router } from "express";
import testRoutes from "./test.routes.js";
import studyRoutes from "./study.routes.js";
import userRoutes from "./user.routes.js";
import passwordRoutes from "./password.routes.js";
import agendaRoutes from "./agenda.routes.js";
import adminRoutes from "./admin.routes.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import * as authController from "../controllers/auth.controller.js";

const router = Router();

router.use("/test", testRoutes);
router.use("/study", studyRoutes);
router.use("/user", userRoutes);
router.use("/password", passwordRoutes);
router.use("/agenda", agendaRoutes);
router.use("/admin", adminRoutes);

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", authMiddleware, authController.me);

export default router;
