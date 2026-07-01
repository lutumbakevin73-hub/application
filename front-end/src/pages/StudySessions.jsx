import { useMemo } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";

export default function StudySessions() {
  const sessions = useMemo(() => {
    const raw = localStorage.getItem("studySessions");
    return raw ? JSON.parse(raw) : [];
  }, []);

  if (!sessions.length) {
    return (
      <div className="page-container text-center">
        <div className="card card-body max-w-md mx-auto">
          <p className="text-udbl-muted">Aucun programme trouvé.</p>
          <Link to="/plan" className="link mt-4 inline-block">
            Choisir un programme
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container max-w-4xl">
      <PageHeader
        badge="Cours"
        title="Votre programme d'étude"
        subtitle={`${sessions.length} séance(s) générée(s) pour vous`}
      />

      <div className="space-y-5">
        {sessions.map((session) => (
          <article key={session.session_order} className="card overflow-hidden">
            <div className="flex items-center gap-3 bg-gradient-to-r from-udbl-blue/10 to-udbl-green/10 px-6 py-4 border-b border-slate-100">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-udbl-blue text-white font-bold text-sm">
                {session.session_order}
              </span>
              <div>
                <h2 className="font-bold text-udbl-blue">{session.theme}</h2>
                {session.language && (
                  <span className="badge-blue mt-1">{session.language}</span>
                )}
              </div>
            </div>

            <div className="card-body space-y-4 text-udbl-dark/90">
              {session.lesson?.introduction && <p>{session.lesson.introduction}</p>}
              {session.lesson?.example_code && (
                <pre className="rounded-xl bg-slate-900 p-4 text-sm text-green-300 overflow-x-auto">
                  {session.lesson.example_code}
                </pre>
              )}
              {session.lesson?.summary && (
                <p className="text-sm italic text-udbl-muted border-l-4 border-udbl-green pl-3">
                  {session.lesson.summary}
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
