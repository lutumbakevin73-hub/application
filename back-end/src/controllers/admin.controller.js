import * as adminService from "../services/admin.service.js";

export async function getDashboard(req, res) {
  try {
    const stats = await adminService.getDashboardStats();
    res.json({ success: true, ...stats });
  } catch (err) {
    console.error("Admin dashboard:", err);
    res.status(500).json({ message: err.message || "Erreur serveur" });
  }
}

export async function listUsers(req, res) {
  try {
    const users = await adminService.listUsersWithProgress();
    res.json({ success: true, users });
  } catch (err) {
    console.error("Admin users:", err);
    res.status(500).json({ message: err.message || "Erreur serveur" });
  }
}

function parsePage(value, fallback = 1) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseLimit(value, fallback, max) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.min(parsed, max);
}

export async function listAgendas(req, res) {
  try {
    const agendaPage = parsePage(req.query.agendaPage, 1);
    const agendaLimit = parseLimit(req.query.agendaLimit, 5, 20);
    const sessionPage = parsePage(req.query.sessionPage, 1);
    const sessionLimit = parseLimit(req.query.sessionLimit, 10, 50);

    const [agendas, upcoming_sessions] = await Promise.all([
      adminService.listAgendasPaginated(agendaPage, agendaLimit),
      adminService.getUpcomingSessionsPaginated(sessionPage, sessionLimit)
    ]);

    res.json({ success: true, agendas, upcoming_sessions });
  } catch (err) {
    console.error("Admin agendas:", err);
    res.status(500).json({ message: err.message || "Erreur serveur" });
  }
}
