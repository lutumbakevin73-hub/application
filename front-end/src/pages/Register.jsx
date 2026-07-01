import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import AuthCard from "../components/AuthCard";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.register(form);
      navigate("/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Inscription" subtitle="Rejoignez UDBL Learning">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Nom complet</label>
          <input
            className="input-field"
            placeholder="Jean Dupont"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">E-mail</label>
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
          <label className="mb-1 block text-sm font-medium">Mot de passe</label>
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

        <button type="submit" disabled={loading} className="btn-success w-full">
          {loading ? "Inscription..." : "S'inscrire"}
        </button>

        <p className="text-center text-sm text-udbl-muted">
          Déjà inscrit ?{" "}
          <Link to="/login" className="link">
            Se connecter
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
