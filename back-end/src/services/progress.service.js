import { getDb } from "../config/database.js";

export async function getUserProgress(userId) {
  const db = getDb();
  const [program, agenda] = await Promise.all([
    db("study_programs").where({ user_id: userId }).orderBy("id", "desc").first(),
    db("agendas").where({ user_id: userId }).orderBy("id", "desc").first()
  ]);

  return {
    has_chosen_program: Boolean(program),
    has_saved_agenda: Boolean(agenda),
    program_id: program?.id ?? null
  };
}

export function getPostLoginRedirect(user, progress) {
  if (user?.role === "admin") {
    return "/admin";
  }
  if (!user?.has_passed_test) {
    return "/test";
  }
  if (!progress?.has_chosen_program) {
    return "/plan";
  }
  if (!progress?.has_saved_agenda) {
    return "/agenda";
  }
  return "/sessions";
}
