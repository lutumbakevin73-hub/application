function parseRawJson(value) {
  if (value == null) return null;
  if (typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return null;
}

function normalizeQuestion(question, fallbackTheme = "la leçon") {
  const raw = question && typeof question === "object" ? question : {};
  let options = Array.isArray(raw.options) ? raw.options.filter(Boolean) : [];

  if (options.length === 0) {
    options = ["Réponse A", "Réponse B", "Réponse C", "Réponse D"];
  }

  const answer =
    raw.answer ||
    raw.correct_answer ||
    raw.correctAnswer ||
    options[0];

  return {
    question:
      raw.question ||
      `Quelle affirmation est correcte concernant ${fallbackTheme} ?`,
    options,
    answer: String(answer),
    explanation: raw.explanation || raw.feedback || ""
  };
}

export function getQuizData(miniQuiz, fallbackTheme = "la leçon") {
  const parsed = parseRawJson(miniQuiz) || miniQuiz;

  if (!parsed || typeof parsed !== "object") {
    return {
      title: "Quiz de fin de leçon",
      passing_score: 70,
      questions: [normalizeQuestion(null, fallbackTheme)]
    };
  }

  if (Array.isArray(parsed.questions) && parsed.questions.length > 0) {
    return {
      title: parsed.title || "Quiz de fin de leçon",
      passing_score: Number(parsed.passing_score) || 70,
      questions: parsed.questions.map((q) => normalizeQuestion(q, fallbackTheme))
    };
  }

  if (parsed.question || parsed.options) {
    return {
      title: parsed.title || "Quiz de fin de leçon",
      passing_score: Number(parsed.passing_score) || 70,
      questions: [normalizeQuestion(parsed, fallbackTheme)]
    };
  }

  return {
    title: "Quiz de fin de leçon",
    passing_score: 70,
    questions: [normalizeQuestion(null, fallbackTheme)]
  };
}

export function parseExercise(exercise) {
  if (!exercise) {
    return {
      title: "Exercice pratique",
      instructions: "Appliquez la notion vue dans la leçon.",
      hints: [],
      starter_code: "",
      expected_result: ""
    };
  }

  const parsed = parseRawJson(exercise);

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    return normalizeExerciseObject(parsed);
  }

  if (typeof exercise === "string") {
    return {
      title: "Exercice pratique",
      instructions: exercise,
      hints: [],
      starter_code: "",
      expected_result: ""
    };
  }

  if (typeof exercise === "object") {
    return normalizeExerciseObject(exercise);
  }

  return {
    title: "Exercice pratique",
    instructions: String(exercise),
    hints: [],
    starter_code: "",
    expected_result: ""
  };
}

function normalizeExerciseObject(value) {
  return {
    title: value.title || "Exercice pratique",
    instructions: value.instructions || value.description || "",
    hints: Array.isArray(value.hints) ? value.hints : [],
    starter_code: value.starter_code || value.starterCode || "",
    expected_result: value.expected_result || value.expectedResult || "",
    solution_approach: value.solution_approach || value.solutionApproach || ""
  };
}

export function normalizeStudySession(session) {
  if (!session) return session;
  return {
    ...session,
    lesson: parseRawJson(session.lesson) || session.lesson || {},
    exercise: parseExercise(session.exercise),
    mini_quiz: getQuizData(session.mini_quiz, session.theme)
  };
}

export function getThemeIllustration(theme = "") {
  const key = theme.toLowerCase();
  if (key.includes("variable")) return "variables";
  if (key.includes("condition") || key.includes("if")) return "conditions";
  if (key.includes("boucle") || key.includes("loop")) return "loops";
  if (key.includes("fonction") || key.includes("function")) return "functions";
  if (key.includes("tableau") || key.includes("liste") || key.includes("array"))
    return "arrays";
  return "code";
}
