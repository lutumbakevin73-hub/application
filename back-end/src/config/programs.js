export const PROGRAM_SESSION_COUNTS = {
  prog1: 2,
  prog2: 3,
  prog3: 5,
  prog4: 7
};

export const PROGRAM_LABELS = {
  prog1: "1–2 jours",
  prog2: "3 jours",
  prog3: "5 jours",
  prog4: "7 jours"
};

export function getSessionCount(program) {
  return PROGRAM_SESSION_COUNTS[program] ?? PROGRAM_SESSION_COUNTS.prog2;
}

export function getProgramLabel(program) {
  return PROGRAM_LABELS[program] || PROGRAM_LABELS.prog2;
}

export function normalizeProgramId(program) {
  if (program && PROGRAM_SESSION_COUNTS[program]) {
    return program;
  }
  return "prog2";
}
