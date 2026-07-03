function getBarColor(score, completed) {
  if (score == null) {
    return completed ? "bg-udbl-green/40" : "bg-slate-200";
  }
  if (score >= 80) return "bg-udbl-green";
  if (score >= 60) return "bg-udbl-blue";
  return "bg-amber-500";
}

export default function LessonScoreChart({ labels = [], scores = [], completed = [] }) {
  if (!labels.length) {
    return (
      <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-udbl-muted">
        Aucun quiz de leçon enregistré pour le moment.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {labels.map((label, index) => {
        const score = scores[index];
        const width = score != null ? Math.max(score, 4) : completed[index] ? 100 : 0;

        return (
          <div key={label}>
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
              <span className="font-medium text-udbl-dark">{label}</span>
              <span className="text-udbl-muted">
                {score != null ? `${score} %` : completed[index] ? "Validée" : "—"}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all ${getBarColor(score, completed[index])}`}
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
