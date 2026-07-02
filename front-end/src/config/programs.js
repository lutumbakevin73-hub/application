export const PROGRAMS = [
  { id: "prog1", title: "1–2 jours", sessions: 2, desc: "Lacunes légères", icon: "🟢" },
  { id: "prog2", title: "3 jours", sessions: 3, desc: "Lacunes modérées", icon: "🔵" },
  { id: "prog3", title: "5 jours", sessions: 5, desc: "Lacunes importantes", icon: "🟡" },
  { id: "prog4", title: "7 jours", sessions: 7, desc: "Grandes lacunes", icon: "🔴" }
];

export const PROGRAM_SESSION_COUNTS = Object.fromEntries(
  PROGRAMS.map((p) => [p.id, p.sessions])
);

export function getSessionCount(program) {
  return PROGRAM_SESSION_COUNTS[program] ?? 3;
}

export function getRecommendedProgram(score) {
  if (score >= 80) return "prog1";
  if (score >= 60) return "prog2";
  if (score >= 40) return "prog3";
  return "prog4";
}
