import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import CodeEditor from "../components/CodeEditor";
import { useAuth } from "../context/AuthContext";

function analyzeResults(results) {
  const summary = {
    total: results.length,
    correct: 0,
    byTheme: {},
    byLanguage: {},
    details: results
  };

  results.forEach((r) => {
    if (r.correct) summary.correct++;
    if (!summary.byTheme[r.theme]) {
      summary.byTheme[r.theme] = { total: 0, correct: 0 };
    }
    summary.byTheme[r.theme].total++;
    if (r.correct) summary.byTheme[r.theme].correct++;

    if (!summary.byLanguage[r.language]) {
      summary.byLanguage[r.language] = { total: 0, correct: 0 };
    }
    summary.byLanguage[r.language].total++;
    if (r.correct) summary.byLanguage[r.language].correct++;
  });

  summary.percentage = Math.round((summary.correct / summary.total) * 100);
  return summary;
}

export default function Quiz() {
  const navigate = useNavigate();
  const { user, markTestPassed } = useAuth();
  const questions = useMemo(() => {
    const raw = localStorage.getItem("currentTest");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : parsed.questions || [];
  }, []);

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState("");
  const [code, setCode] = useState("");
  const [modal, setModal] = useState(null);
  const [finished, setFinished] = useState(null);
  const [loading, setLoading] = useState(false);
  const [programError, setProgramError] = useState("");
  const finishingRef = useRef(false);

  if (!questions.length) {
    return (
      <div className="page-container text-center">
        <div className="card card-body max-w-md mx-auto">
          <p className="text-udbl-muted">Aucune question trouvée.</p>
          <Link to="/test" className="link mt-4 inline-block">
            Relancer le test
          </Link>
        </div>
      </div>
    );
  }

  const progress = ((current + 1) / questions.length) * 100;

  const q = questions[current];

  async function submitAnswer() {
    setLoading(true);
    let userAnswer;
    let isCorrect = false;
    let correction = null;

    try {
      if (q.type === "qcm") {
        if (selected === "") return alert("Choisissez une réponse");
        userAnswer = Number(selected);
        isCorrect = userAnswer === q.correctAnswer;
      } else {
        if (!code.trim()) return alert("Écris ton code avant de soumettre");
        userAnswer = code.trim();
        correction = await api.correctCode({
          language: q.language,
          question: q.question,
          correctAnswer: q.correctAnswer,
          userAnswer
        });
        isCorrect = correction.correct;
      }

      const entry = {
        questionId: q.id,
        theme: q.theme,
        language: q.language,
        type: q.type,
        userAnswer,
        correctAnswer: q.correctAnswer,
        correct: isCorrect,
        lastCorrection: correction
      };

      const nextAnswers = [...answers, entry];
      setAnswers(nextAnswers);
      setModal({ isCorrect, count: nextAnswers.filter((a) => a.correct).length });
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function finishTest(finalAnswers) {
    if (finishingRef.current) {
      return;
    }
    finishingRef.current = true;

    const evaluation = analyzeResults(finalAnswers);
    const themes = Object.entries(evaluation.byTheme)
      .filter(([, t]) => (t.correct / t.total) * 100 < 70)
      .map(([theme]) => theme);

    if (themes.length === 0) {
      themes.push("variables", "conditions");
    }

    if (!user?.id) {
      setProgramError("Session expirée. Reconnectez-vous.");
      setFinished(evaluation);
      return;
    }

    try {
      await api.completeTest(user.id);
      markTestPassed();
      localStorage.setItem("userScore", String(evaluation.percentage));
      localStorage.setItem("weakThemes", JSON.stringify(themes));
    } catch (err) {
      console.error(err);
      setProgramError(err.message || "Impossible d'enregistrer la fin du test.");
      setFinished(evaluation);
      finishingRef.current = false;
      return;
    }

    setFinished(evaluation);
  }

  function continueQuiz() {
    setModal(null);
    setSelected("");
    setCode("");
    const next = current + 1;
    if (next < questions.length) {
      setCurrent(next);
    } else {
      finishTest(answers);
    }
  }

  if (finished) {
    return (
      <div className="page-container max-w-3xl">
        <div className="card card-body text-center">
          <span className="badge-green">Test terminé</span>
          <h2 className="mt-4 text-2xl font-bold text-udbl-blue">Vos résultats</h2>
          <div className="my-6 inline-flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-udbl-blue to-udbl-green text-3xl font-bold text-white shadow-lg">
            {finished.percentage}%
          </div>
          <p className="text-udbl-muted">
            {finished.correct} / {finished.total} bonnes réponses
          </p>
          {programError && (
            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{programError}</p>
          )}
          <button onClick={() => navigate("/plan")} className="btn-primary mt-8">
            Choisir mon programme
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container max-w-3xl">
      <div className="mb-6">
        <div className="flex justify-between text-sm text-udbl-muted mb-2">
          <span>Question {current + 1} / {questions.length}</span>
          <span className="badge-blue">{q.language}</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="card card-body">
        {q.theme && (
          <span className="badge-green mb-3">{q.theme}</span>
        )}
        <h2 className="text-lg font-semibold text-udbl-dark leading-relaxed mb-6">{q.question}</h2>

        {q.type === "qcm" ? (
          <div className="space-y-3">
            {q.options?.map((opt, index) => (
              <label
                key={index}
                className={`option-card ${selected === String(index) ? "option-card-selected" : ""}`}
              >
                <input
                  type="radio"
                  name="answer"
                  value={index}
                  checked={selected === String(index)}
                  onChange={(e) => setSelected(e.target.value)}
                  className="accent-udbl-blue"
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        ) : (
          <CodeEditor
            value={code}
            onChange={setCode}
            language={q.language}
            disabled={loading}
          />
        )}

        <button
          onClick={submitAnswer}
          disabled={loading}
          className="btn-success mt-6 w-full sm:w-auto"
        >
          {loading ? "Correction..." : "Soumettre"}
        </button>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-udbl-dark/50 p-4 backdrop-blur-sm">
          <div className="card card-body max-w-sm w-full text-center animate-in">
            <div
              className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-3xl ${
                modal.isCorrect ? "bg-green-100" : "bg-red-100"
              }`}
            >
              {modal.isCorrect ? "✓" : "✗"}
            </div>
            <h3 className={`text-xl font-bold ${modal.isCorrect ? "text-udbl-green-dark" : "text-red-600"}`}>
              {modal.isCorrect ? "Bonne réponse !" : "Mauvaise réponse"}
            </h3>
            <p className="mt-2 text-udbl-muted">
              {modal.count} bonne(s) réponse(s) sur {answers.length}
            </p>
            <button onClick={continueQuiz} className="btn-primary mt-6 w-full">
              Continuer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
