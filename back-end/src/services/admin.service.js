import { getDb } from "../config/database.js";
import { getUserProgress } from "./progress.service.js";
import { getLessonProgress } from "./lesson-progress.service.js";

function parseStoredField(value) {
  if (typeof value !== "string") {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function getJourneyStep(user, progress) {
  if (!user?.has_passed_test) {
    return "test";
  }
  if (!progress?.has_chosen_program) {
    return "programme";
  }
  if (!progress?.has_saved_agenda) {
    return "agenda";
  }
  return "cours";
}

export function getJourneyLabel(step) {
  const labels = {
    test: "Test de niveau",
    programme: "Choix du programme",
    agenda: "Planification agenda",
    cours: "Cours en cours"
  };
  return labels[step] || step;
}


export function buildCourseProgress(sessionsTotal, completedSessions = []) {
  const total = Number(sessionsTotal) || 0;
  const completed = Array.isArray(completedSessions) ? completedSessions.length : 0;

  if (total === 0) {
    return {
      course_completed: 0,
      course_total: 0,
      course_percent: null,
      course_label: "Aucun cours"
    };
  }

  const percent = Math.round((completed / total) * 100);

  return {
    course_completed: completed,
    course_total: total,
    course_percent: percent,
    course_label: `${completed}/${total} leçon${total > 1 ? "s" : ""}`
  };
}

export function buildStudentProgress(user, progress, sessionsTotal = 0, lessonProgress = null) {
  if (user?.role === "admin") {
    return {
      progress_steps: [],
      progress_percent: null,
      sessions_total: 0,
      journey_step: null,
      journey_label: "Administrateur",
      ...buildCourseProgress(0, [])
    };
  }

  const courseUnlocked =
    user?.has_passed_test &&
    progress?.has_chosen_program &&
    progress?.has_saved_agenda;

  const courseData = courseUnlocked
    ? buildCourseProgress(sessionsTotal, lessonProgress?.completed || [])
    : buildCourseProgress(sessionsTotal, []);

  const steps = [
    { key: "test", label: "Test", done: Boolean(user?.has_passed_test) },
    {
      key: "programme",
      label: "Programme",
      done: Boolean(progress?.has_chosen_program)
    },
    {
      key: "agenda",
      label: "Agenda",
      done: Boolean(progress?.has_saved_agenda)
    },
    {
      key: "cours",
      label: "Cours",
      done: Boolean(
        user?.has_passed_test &&
          progress?.has_chosen_program &&
          progress?.has_saved_agenda
      )
    }
  ];

  const journeyStep = getJourneyStep(user, progress);

  return {
    progress_steps: steps.map((step) => ({
      ...step,
      current: step.key === journeyStep && !step.done
    })),
    progress_percent: courseData.course_percent,
    sessions_total: sessionsTotal,
    journey_step: journeyStep,
    journey_label: getJourneyLabel(journeyStep),
    course_unlocked: courseUnlocked,
    ...courseData
  };
}

async function getProgramSessionCount(db, programId) {
  if (!programId) {
    return 0;
  }
  const row = await db("study_sessions")
    .where({ program_id: programId })
    .count({ count: "*" })
    .first();
  return Number(row?.count || 0);
}

async function enrichUserProgress(db, user) {
  const progress = await getUserProgress(user.id);
  let programCode = null;
  let sessionsTotal = 0;
  let lessonProgress = { completed: [], quizAttempts: {} };

  if (progress.program_id) {
    const program = await db("study_programs")
      .where({ id: progress.program_id })
      .first();
    programCode = program?.program || null;
    sessionsTotal = await getProgramSessionCount(db, progress.program_id);
    lessonProgress = await getLessonProgress(user.id, progress.program_id);
  }

  const built = buildStudentProgress(user, progress, sessionsTotal, lessonProgress);

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    has_passed_test: Boolean(user.has_passed_test),
    has_chosen_program: progress.has_chosen_program,
    has_saved_agenda: progress.has_saved_agenda,
    program_id: progress.program_id,
    program: programCode,
    sessions_total: sessionsTotal,
    ...built,
    created_at: user.created_at
  };
}

export async function getDashboardStats() {
  const db = getDb();

  const [totalUsers, testPassed, programCount, agendaCount] = await Promise.all([
    db("users").count({ count: "*" }).first(),
    db("users").where({ has_passed_test: true }).count({ count: "*" }).first(),
    db("study_programs").count({ count: "*" }).first(),
    db("agendas").count({ count: "*" }).first()
  ]);

  const users = await db("users")
    .select("id", "username", "email", "role", "has_passed_test", "created_at")
    .where({ role: "user" })
    .orderBy("id", "desc");

  const journeyCounts = { test: 0, programme: 0, agenda: 0, cours: 0 };

  const students = await Promise.all(
    users.map(async (user) => {
      const enriched = await enrichUserProgress(db, user);
      const step = enriched.journey_step;
      if (step) {
        journeyCounts[step] = (journeyCounts[step] || 0) + 1;
      }
      return enriched;
    })
  );

  const upcomingSessions = await getUpcomingSessions(5);

  return {
    totals: {
      users: Number(totalUsers?.count || 0),
      students: students.length,
      test_passed: Number(testPassed?.count || 0),
      programs: Number(programCount?.count || 0),
      agendas: Number(agendaCount?.count || 0)
    },
    journey: journeyCounts,
    students,
    upcoming_sessions: upcomingSessions
  };
}

export async function listUsersWithProgress() {
  const db = getDb();
  const users = await db("users")
    .select("id", "username", "email", "role", "has_passed_test", "created_at")
    .orderBy("id", "desc");

  return Promise.all(users.map((user) => enrichUserProgress(db, user)));
}

export async function listAgendasWithUsers() {
  const db = getDb();
  const rows = await db("agendas")
    .leftJoin("users", "agendas.user_id", "users.id")
    .select(
      "agendas.id",
      "agendas.user_id",
      "agendas.phone",
      "agendas.program",
      "agendas.sessions",
      "agendas.created_at",
      "users.username",
      "users.email"
    )
    .orderBy("agendas.id", "desc");

  return rows.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    username: row.username,
    email: row.email,
    phone: row.phone,
    program: row.program,
    sessions: parseStoredField(row.sessions) || [],
    created_at: row.created_at
  }));
}

export async function getUpcomingSessions(limit = 20) {
  const all = await collectUpcomingSessions();
  return all.slice(0, limit);
}

export function paginateList(items, page = 1, limit = 10) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit) || 1);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * limit;

  return {
    items: items.slice(start, start + limit),
    total,
    page: safePage,
    limit,
    totalPages
  };
}

async function collectUpcomingSessions() {
  const agendas = await listAgendasWithUsers();
  const upcoming = [];
  const now = new Date();

  for (const agenda of agendas) {
    for (const session of agenda.sessions) {
      if (!session?.date || !session?.time) {
        continue;
      }

      const datetime = new Date(`${session.date}T${session.time}`);
      if (Number.isNaN(datetime.getTime()) || datetime < now) {
        continue;
      }

      upcoming.push({
        agenda_id: agenda.id,
        user_id: agenda.user_id,
        student: agenda.username || agenda.email || "—",
        email: agenda.email,
        phone: agenda.phone,
        program: agenda.program,
        theme: session.theme || null,
        date: session.date,
        time: session.time,
        datetime: datetime.toISOString()
      });
    }
  }

  return upcoming.sort((a, b) => a.datetime.localeCompare(b.datetime));
}

export async function getUpcomingSessionsPaginated(page = 1, limit = 10) {
  const all = await collectUpcomingSessions();
  return paginateList(all, page, limit);
}

export async function listAgendasPaginated(page = 1, limit = 5) {
  const all = await listAgendasWithUsers();
  return paginateList(all, page, limit);
}
