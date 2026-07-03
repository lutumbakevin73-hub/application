export const LEARNING_LANGUAGES = ["C", "Python"];

export function normalizeLearningLanguage(value) {
  const normalized = String(value || "").trim();
  if (normalized.toLowerCase() === "python") {
    return "Python";
  }
  if (normalized.toUpperCase() === "C") {
    return "C";
  }
  return null;
}
