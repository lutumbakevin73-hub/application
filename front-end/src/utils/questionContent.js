function normalizeNewlines(text) {
  return String(text || "").replace(/\\n/g, "\n").trim();
}

function splitInlineCode(text) {
  const patterns = [
    /([?.!])\s+(#include\b[\s\S]*)$/i,
    /([?.!])\s+(int\s+main\s*\([\s\S]*)$/i,
    /([?.!])\s+(void\s+main\s*\([\s\S]*)$/i,
    /([?.!])\s+(def\s+\w+\s*\([\s\S]*)$/i,
    /([?.!])\s+(import\s+[\s\S]*)$/i,
    /([?.!])\s+(public\s+class\s+[\s\S]*)$/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return [
        { type: "text", content: text.slice(0, match.index + match[1].length).trim() },
        { type: "code", content: match[2].trim() }
      ];
    }
  }

  return null;
}

function looksLikeCodeLine(line) {
  const trimmed = line.trim();
  if (!trimmed) {
    return false;
  }

  return (
    /^(#include|#define|int |void |float |double |char |for |while |if |else|return |printf|scanf|main\s*\(|def |import |from |print\(|class |public |# )/.test(
      trimmed
    ) ||
    trimmed.includes("{") ||
    trimmed.includes("};") ||
    trimmed.includes(");") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("#") ||
    /^[{}]\s*$/.test(trimmed)
  );
}

export function parseQuestionContent(text) {
  const normalized = normalizeNewlines(text);
  if (!normalized) {
    return [{ type: "text", content: "" }];
  }

  const inlineSplit = splitInlineCode(normalized);
  if (inlineSplit) {
    return inlineSplit;
  }

  if (normalized.includes("```")) {
    const parts = [];
    const segments = normalized.split("```");
    segments.forEach((segment, index) => {
      const chunk = segment.trim();
      if (!chunk) {
        return;
      }
      if (index % 2 === 1) {
        const code = chunk.replace(/^[a-z]+\n/i, "");
        parts.push({ type: "code", content: code });
      } else {
        parts.push({ type: "text", content: chunk });
      }
    });
    return parts.length ? parts : [{ type: "text", content: normalized }];
  }

  const lines = normalized.split("\n");
  const parts = [];
  let textBuffer = [];
  let codeBuffer = [];
  let inCode = false;

  function flushText() {
    if (textBuffer.length) {
      parts.push({ type: "text", content: textBuffer.join("\n").trim() });
      textBuffer = [];
    }
  }

  function flushCode() {
    if (codeBuffer.length) {
      parts.push({ type: "code", content: codeBuffer.join("\n") });
      codeBuffer = [];
      inCode = false;
    }
  }

  for (const line of lines) {
    const isCode = looksLikeCodeLine(line) || (inCode && (line.startsWith("  ") || line.startsWith("\t")));

    if (isCode) {
      flushText();
      inCode = true;
      codeBuffer.push(line);
    } else {
      flushCode();
      textBuffer.push(line);
    }
  }

  flushText();
  flushCode();

  if (!parts.length) {
    return [{ type: "text", content: normalized }];
  }

  return parts;
}

export function isPracticalQuestion(question) {
  if (!question) {
    return false;
  }
  const type = String(question.type || "").toLowerCase();
  return type === "pratique" || type === "code" || type === "practical";
}
