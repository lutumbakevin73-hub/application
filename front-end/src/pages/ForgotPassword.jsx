import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import AuthCard from "../components/AuthCard";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const data = await api.forgotPassword(email);
      setMessage(data.message);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AuthCard title="Mot de passe oublié" subtitle="Recevez un lien de réinitialisation">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">E-mail</label>
          <input
            type="email"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
          Envoyer
        </button>
        <Link to="/login" className="link block text-center text-sm">
          Retour à la connexion
        </Link>
      </form>
    </AuthCard>
  );
}
