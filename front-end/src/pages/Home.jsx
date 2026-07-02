import { Link } from "react-router-dom";
import Logo from "../components/Logo";

export default function Home() {
  return (
    <section className="page-container">
      <div className="card overflow-hidden">
        <div className="grid lg:grid-cols-2">
          <div className="card-body flex flex-col justify-center order-2 lg:order-1">
            <span className="badge-green w-fit mb-4">Plateforme pédagogique UDBL</span>
            <h2 className="text-3xl font-bold text-udbl-blue sm:text-4xl leading-tight">
              Apprenez la programmation avec un parcours sur mesure
            </h2>
            <p className="mt-4 text-udbl-muted text-lg leading-relaxed">
              Évaluez votre niveau en C et Python, identifiez vos lacunes et
              suivez un programme généré par l'intelligence artificielle.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/login" className="btn-primary">
                Commencer
              </Link>
              <Link to="/register" className="btn-outline">
                Créer un compte
              </Link>
            </div>
          </div>

          <div className="relative bg-gradient-to-br from-udbl-blue to-udbl-green p-10 flex items-center justify-center order-1 lg:order-2 min-h-[280px]">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_20%,white,transparent)]" />
            <Logo size="xl" showText={false} className="relative flex-col items-center [&_img]:w-36 [&_img]:h-36 [&_img]:ring-4 [&_img]:ring-white/40" />
            <p className="absolute bottom-6 text-center text-white/90 text-sm font-medium">
              Université Don Bosco de Lubumbashi
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid sm:grid-cols-3 gap-4">
        {[
          { title: "Test de niveau", desc: "10 questions QCM et pratiques", color: "blue" },
          { title: "Programme IA", desc: "Cours adaptés à vos lacunes", color: "green" },
          { title: "Agenda", desc: "Planifiez vos séances d'étude", color: "blue" }
        ].map((item) => (
          <div key={item.title} className="card card-body text-center">
            <div
              className={`mx-auto mb-3 h-1 w-12 rounded-full ${
                item.color === "green" ? "bg-udbl-green" : "bg-udbl-blue"
              }`}
            />
            <h3 className="font-bold text-udbl-dark">{item.title}</h3>
            <p className="text-sm text-udbl-muted mt-1">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
