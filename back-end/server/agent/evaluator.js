export function evaluateAnswer(question, userAnswer) {
  return {
    correct: question.correct_answer === userAnswer,
    concept: question.concept,
    language: question.language
  };
}
