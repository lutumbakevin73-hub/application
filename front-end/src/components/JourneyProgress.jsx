import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getCompletedStepIndex, getJourneyStepIndex, JOURNEY_STEPS } from "../config/journey";

export default function JourneyProgress() {
  const location = useLocation();
  const { user } = useAuth();
  const activeIndex = getJourneyStepIndex(location.pathname);
  const completedIndex = getCompletedStepIndex(user);

  return (
    <div className="border-b border-slate-200/80 bg-white/90">
      <div className="page-container py-4">
        <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wide text-udbl-muted">
          Votre parcours — étape {activeIndex + 1} sur {JOURNEY_STEPS.length}
        </p>

        <div className="mx-auto flex max-w-3xl items-center">
          {JOURNEY_STEPS.map((step, index) => {
            const isComplete = index <= completedIndex;
            const isActive = index === activeIndex;

            return (
              <div key={step.id} className="flex flex-1 items-center">
                <div className="flex min-w-0 flex-1 flex-col items-center text-center">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isActive
                        ? "bg-udbl-blue text-white ring-4 ring-udbl-blue/20"
                        : isComplete
                          ? "bg-udbl-green text-white"
                          : "bg-slate-100 text-udbl-muted"
                    }`}
                  >
                    {isComplete && !isActive ? "✓" : index + 1}
                  </span>
                  <span
                    className={`mt-2 hidden text-xs font-medium sm:block ${
                      isActive ? "text-udbl-blue" : isComplete ? "text-udbl-dark" : "text-udbl-muted"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>

                {index < JOURNEY_STEPS.length - 1 && (
                  <div
                    className={`h-0.5 w-full max-w-[3rem] sm:max-w-none sm:flex-1 ${
                      index < completedIndex ? "bg-udbl-green/70" : "bg-slate-200"
                    }`}
                    aria-hidden="true"
                  />
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-3 text-center text-sm font-medium text-udbl-blue sm:hidden">
          {JOURNEY_STEPS[activeIndex]?.label}
        </p>
      </div>
    </div>
  );
}
