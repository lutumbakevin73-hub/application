import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import AuthCard from "../components/AuthCard";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const data = await api.resetPassword({ token, newPassword: password });
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AuthCard title="Nouveau mot de passe" subtitle="Choisissez un mot de passe sécurisé">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Nouveau mot de passe</label>
          <input
            type="password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {message && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-udbl-green-dark">{message}</p>
        )}
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        <button type="submit" className="btn-primary w-full">
          Modifier
        </button>
        <Link to="/login" className="link block text-center text-sm">
          Connexion
        </Link>
      </form>
    </AuthCard>
  );
}
