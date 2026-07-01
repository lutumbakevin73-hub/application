import Logo from "./Logo";

export default function PageHeader({ title, subtitle, badge }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {badge && <span className="badge-green mb-2">{badge}</span>}
        <h1 className="text-2xl font-bold text-udbl-blue sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-udbl-muted">{subtitle}</p>}
      </div>
      
    </div>
  );
}
