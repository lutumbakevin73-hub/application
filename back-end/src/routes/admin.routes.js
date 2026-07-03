import { Router } from "express";
import { authMiddleware, requireAdmin } from "../middleware/auth.middleware.js";
import * as adminController from "../controllers/admin.controller.js";

const router = Router();

router.use(authMiddleware, requireAdmin);

router.get("/dashboard", adminController.getDashboard);
router.get("/users", adminController.listUsers);
router.delete("/users/:id", adminController.deleteUser);
router.get("/progress", adminController.listProgress);
router.get("/progress/:userId", adminController.getProgressDetail);
router.get("/agendas", adminController.listAgendas);

export default router;
