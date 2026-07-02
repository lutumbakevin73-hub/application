export default function StudentProgressBar({
  completed = 0,
  total = 0,
  percent = null,
  label = "",
  unlocked = true,
  compact = false
}) {
  if (!total) {
    return <span className="text-xs text-udbl-muted">Aucun cours assigné</span>;
  }

  if (!unlocked) {
    return (
      <div className={compact ? "min-w-[140px]" : "min-w-[220px]"}>
        <p className="text-xs text-udbl-muted">Cours non débloqué</p>
        <p className="mt-1 text-xs font-medium text-udbl-dark">{total} leçon{total > 1 ? "s" : ""} prévues</p>
      </div>
    );
  }

  const safePercent = percent ?? Math.round((completed / total) * 100);

  return (
    <div className={compact ? "min-w-[140px]" : "min-w-[220px]"}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-udbl-blue">{safePercent} %</span>
        <span className="text-xs text-udbl-muted">
          {label || `${completed}/${total} leçon${total > 1 ? "s" : ""}`}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-udbl-green transition-all"
          style={{ width: `${safePercent}%` }}
        />
      </div>

      {!compact && (
        <p className="mt-1.5 text-[11px] text-udbl-muted">
          Progression du cours — {completed} leçon{completed > 1 ? "s" : ""} validée
          {completed > 1 ? "s" : ""} sur {total}
        </p>
      )}
    </div>
  );
}
