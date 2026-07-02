import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { getJourneyPath, useAuth } from "../context/AuthContext";
import AuthCard from "../components/AuthCard";

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const oauthToken = params.get("token");
    if (!oauthToken) return;

    async function handleOAuth() {
      login(oauthToken);
      try {
        const profile = await api.me();
        navigate(getJourneyPath(profile), { replace: true });
      } catch {
        navigate("/test", { replace: true });
      }
    }

    handleOAuth();
  }, [params, login, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.login(form);
      login(data.token);
      navigate(data.redirect || "/test");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Connexion"
      subtitle="Étudiants : accédez à votre parcours. Les administrateurs utilisent un compte dédié."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-udbl-dark">E-mail</label>
          <input
            type="email"
            className="input-field"
            placeholder="votre@email.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-udbl-dark">Mot de passe</label>
          <input
            type="password"
            className="input-field"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Connexion..." : "Se connecter"}
        </button>

        <div className="relative py-2 text-center text-sm text-udbl-muted">
          <span className="bg-white px-2 relative z-10">ou</span>
          <div className="absolute inset-x-0 top-1/2 border-t border-slate-200" />
        </div>

        <button
          type="button"
          onClick={() => (window.location.href = api.googleAuthUrl)}
          className="btn-outline w-full"
        >
          Continuer avec Google
        </button>

        <p className="text-center text-sm">
          <Link to="/forgot-password" className="link">
            Mot de passe oublié ?
          </Link>
        </p>
        <p className="text-center text-sm text-udbl-muted">
          Pas encore de compte ?{" "}
          <Link to="/register" className="link">
            S'inscrire
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
