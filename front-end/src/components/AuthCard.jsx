import Logo from "./Logo";

export default function AuthCard({ title, subtitle, children }) {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-card-header">
          <div className="flex justify-center mb-4">
            <img
              src="/udbl.jpg"
              alt="UDBL"
              className="w-24 h-24 rounded-full object-cover ring-4 ring-white/30"
            />
          </div>
          <h2 className="text-2xl font-bold">{title}</h2>
          {subtitle && <p className="mt-2 text-sm text-blue-100">{subtitle}</p>}
          <p className="motto mt-3 text-green-200">Solidarité · Innovation · Travail</p>
        </div>
        <div className="card-body space-y-4">{children}</div>
      </div>
    </div>
  );
}
