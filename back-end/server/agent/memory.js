const sessions = new Map();

export function initSession(userId, testData) {
  sessions.set(userId, {
    index: 0,
    answers: [],
    test: testData
  });
}

export function getCurrentQuestion(userId) {
  const session = sessions.get(userId);
  return session.test.questions[session.index];
}

export function nextQuestion(userId) {
  const session = sessions.get(userId);
  session.index++;
  return session.test.questions[session.index];
}

export function saveAnswer(userId, answer) {
  sessions.get(userId).answers.push(answer);
}

export function getSession(userId) {
  return sessions.get(userId);
}
