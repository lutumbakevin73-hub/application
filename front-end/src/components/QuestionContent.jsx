import { useMemo } from "react";
import { parseQuestionContent } from "../utils/questionContent";

export default function QuestionContent({ text, className = "" }) {
  const parts = useMemo(() => parseQuestionContent(text), [text]);

  return (
    <div className={`question-content space-y-3 ${className}`.trim()}>
      {parts.map((part, index) =>
        part.type === "code" ? (
          <pre
            key={`code-${index}`}
            className="overflow-x-auto rounded-xl bg-slate-900 p-4 font-mono text-sm leading-6 text-green-300 whitespace-pre"
          >
            {part.content}
          </pre>
        ) : (
          <p key={`text-${index}`} className="whitespace-pre-line leading-relaxed text-udbl-dark">
            {part.content}
          </p>
        )
      )}
    </div>
  );
}
