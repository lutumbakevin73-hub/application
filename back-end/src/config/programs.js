export const PROGRAM_SESSION_COUNTS = {
  prog1: 2,
  prog2: 3,
  prog3: 5,
  prog4: 7
};

export function getSessionCount(program) {
  return PROGRAM_SESSION_COUNTS[program] ?? PROGRAM_SESSION_COUNTS.prog2;
}

export function normalizeProgramId(program) {
  if (program && PROGRAM_SESSION_COUNTS[program]) {
    return program;
  }
  return "prog2";
}
