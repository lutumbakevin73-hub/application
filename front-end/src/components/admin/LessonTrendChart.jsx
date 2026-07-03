function buildPoints(scores, width, height, padding) {
  const valid = scores
    .map((score, index) => ({ score, index }))
    .filter((item) => item.score != null);

  if (valid.length === 0) {
    return "";
  }

  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;
  const step = scores.length > 1 ? innerWidth / (scores.length - 1) : 0;

  return valid
    .map(({ score, index }) => {
      const x = padding + index * step;
      const y = padding + innerHeight - (score / 100) * innerHeight;
      return `${x},${y}`;
    })
    .join(" ");
}

export default function LessonTrendChart({ labels = [], scores = [] }) {
  const width = 640;
  const height = 220;
  const padding = 28;
  const hasData = scores.some((score) => score != null);
  const points = buildPoints(scores, width, height, padding);

  if (!hasData) {
    return (
      <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-udbl-muted">
        Le graphique d&apos;évolution apparaîtra après les premiers quiz de leçon.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[320px] w-full">
        {[0, 25, 50, 75, 100].map((tick) => {
          const y = padding + (height - padding * 2) * (1 - tick / 100);
          return (
            <g key={tick}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth="1"
              />
              <text x="4" y={y + 4} fill="#64748b" fontSize="10">
                {tick}%
              </text>
            </g>
          );
        })}

        <polyline
          fill="none"
          stroke="#2d5aa3"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={points}
        />

        {scores.map((score, index) => {
          if (score == null) return null;
          const innerWidth = width - padding * 2;
          const innerHeight = height - padding * 2;
          const step = scores.length > 1 ? innerWidth / (scores.length - 1) : 0;
          const x = padding + index * step;
          const y = padding + innerHeight - (score / 100) * innerHeight;

          return (
            <g key={labels[index] || index}>
              <circle cx={x} cy={y} r="5" fill="#2e8b57" stroke="#fff" strokeWidth="2" />
              <text x={x} y={height - 8} textAnchor="middle" fill="#64748b" fontSize="10">
                L{index + 1}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
