export const JOURNEY_STEPS = [
  { id: "language", label: "Langage", paths: ["/language"] },
  { id: "test", label: "Test", paths: ["/test", "/quiz"] },
  { id: "plan", label: "Programme", paths: ["/plan"] },
  { id: "agenda", label: "Agenda", paths: ["/agenda"] },
  { id: "courses", label: "Cours", paths: ["/sessions"] }
];

export const PUBLIC_PATHS = ["/", "/login", "/register", "/forgot-password", "/reset-password"];

export function getJourneyStepIndex(pathname) {
  const index = JOURNEY_STEPS.findIndex((step) =>
    step.paths.some((path) => pathname === path || pathname.startsWith(`${path}/`))
  );
  return index >= 0 ? index : 0;
}

export function getCompletedStepIndex(profile) {
  if (!profile?.preferred_language && !profile?.has_passed_test) {
    return -1;
  }
  if (!profile?.has_passed_test) {
    return 0;
  }
  if (!profile?.has_chosen_program) {
    return 1;
  }
  if (!profile?.has_saved_agenda) {
    return 2;
  }
  return 3;
}
