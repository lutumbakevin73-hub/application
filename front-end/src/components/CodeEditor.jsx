import { useCallback, useEffect, useMemo, useRef } from "react";

const PLACEHOLDERS = {
  C: `#include <stdio.h>\n\nint main() {\n    // Votre code ici\n    return 0;\n}`,
  Python: `# Votre code Python\n`
};

function normalizeLanguage(language) {
  const value = String(language || "").toLowerCase();
  if (value.includes("python")) {
    return "Python";
  }
  return "C";
}

export default function CodeEditor({
  value,
  onChange,
  language = "C",
  placeholder,
  minLines = 14,
  disabled = false
}) {
  const textareaRef = useRef(null);
  const gutterRef = useRef(null);
  const lang = normalizeLanguage(language);

  const lines = useMemo(() => {
    const count = Math.max(minLines, value.split("\n").length);
    return Array.from({ length: count }, (_, index) => index + 1);
  }, [value, minLines]);

  const syncScroll = useCallback(() => {
    if (gutterRef.current && textareaRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  useEffect(() => {
    syncScroll();
  }, [value, syncScroll]);

  function handleKeyDown(event) {
    if (event.key !== "Tab") {
      return;
    }

    event.preventDefault();
    const field = textareaRef.current;
    if (!field) {
      return;
    }

    const indent = "    ";
    const start = field.selectionStart;
    const end = field.selectionEnd;
    const nextValue = `${value.slice(0, start)}${indent}${value.slice(end)}`;
    onChange(nextValue);

    requestAnimationFrame(() => {
      field.selectionStart = start + indent.length;
      field.selectionEnd = start + indent.length;
    });
  }

  return (
    <div className="code-editor">
      <div className="code-editor-toolbar">
        <span className="code-editor-lang">{lang}</span>
        <span className="code-editor-hint">Tab = indentation</span>
      </div>

      <div className="code-editor-shell">
        <div ref={gutterRef} className="code-editor-gutter" aria-hidden="true">
          {lines.map((line) => (
            <span key={line} className="code-editor-line-number">
              {line}
            </span>
          ))}
        </div>

        <textarea
          ref={textareaRef}
          className="code-editor-input"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={syncScroll}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          disabled={disabled}
          rows={lines.length}
          placeholder={placeholder || PLACEHOLDERS[lang]}
        />
      </div>
    </div>
  );
}
