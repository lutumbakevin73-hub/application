function formatFailedLabel(item) {
  if (!item.total && !item.test_total) {
    return "Aucune question sur ce thème";
  }
  const total = item.total ?? item.test_total;
  const failed = item.failed ?? item.test_failed;
  if (failed === 1) {
    return `Échoué sur 1 question sur ${total}`;
  }
  return `Échoué sur ${failed} questions sur ${total}`;
}

export function WeakThemesDetail({ items = [], title = "Lacunes identifiées" }) {
  if (!items.length) {
    return null;
  }

  return (
    <div className="text-left">
      <p className="mb-3 text-sm font-semibold text-udbl-blue">{title}</p>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.theme}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-udbl-blue/15 bg-udbl-blue/5 px-4 py-3"
          >
            <div>
              <p className="font-semibold capitalize text-udbl-dark">{item.theme}</p>
              <p className="mt-1 text-sm text-udbl-muted">{formatFailedLabel(item)}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-udbl-blue">
                {item.percent ?? item.test_score ?? 0}%
              </p>
              <p className="text-xs text-udbl-muted">
                {(item.correct ?? item.test_correct)}/{(item.total ?? item.test_total)} réussies
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function evolutionStatusLabel(row) {
  if (row.status === "achieved" || row.reached_goal) {
    return { label: "Objectif atteint", className: "badge-green" };
  }
  if (row.status === "progressing" || row.improved) {
    return { label: "En progrès", className: "badge-blue" };
  }
  if (row.status === "stagnant") {
    return {
      label: "À retravailler",
      className: "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800"
    };
  }
  return {
    label: "Leçon à venir",
    className: "rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500"
  };
}

export function ThemeEvolutionPanel({
  items = [],
  title = "Évolution par rapport au test d'entrée",
  subtitle = "Comparaison entre le score au test et le meilleur score en leçon pour chaque lacune"
}) {
  if (!items.length) {
    return null;
  }

  return (
    <div className="card card-body">
      <h3 className="font-bold text-udbl-blue">{title}</h3>
      <p className="mt-1 mb-4 text-xs text-udbl-muted">{subtitle}</p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-udbl-muted">
            <tr>
              <th className="px-3 py-2 font-semibold">Thème (lacune)</th>
              <th className="px-3 py-2 font-semibold">Test d&apos;entrée</th>
              <th className="px-3 py-2 font-semibold">Échecs au test</th>
              <th className="px-3 py-2 font-semibold">Meilleur score leçon</th>
              <th className="px-3 py-2 font-semibold">Évolution</th>
              <th className="px-3 py-2 font-semibold">Statut</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => {
              const status = evolutionStatusLabel(row);
              return (
                <tr key={row.theme} className="border-b border-slate-100">
                  <td className="px-3 py-3 font-medium capitalize text-udbl-dark">{row.theme}</td>
                  <td className="px-3 py-3 font-semibold text-udbl-blue">{row.test_score}%</td>
                  <td className="px-3 py-3 text-udbl-muted">
                    {row.test_failed}/{row.test_total}
                  </td>
                  <td className="px-3 py-3">
                    {row.lesson_best_score != null ? (
                      <span className="font-semibold text-udbl-green-dark">
                        {row.lesson_best_score}%
                      </span>
                    ) : (
                      <span className="text-udbl-muted">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {row.delta != null ? (
                      <span
                        className={
                          row.delta > 0
                            ? "font-semibold text-udbl-green-dark"
                            : row.delta < 0
                              ? "font-semibold text-red-600"
                              : "text-udbl-muted"
                        }
                      >
                        {row.delta > 0 ? "+" : ""}
                        {row.delta} pts
                      </span>
                    ) : (
                      <span className="text-udbl-muted">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <span className={status.className}>{status.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
