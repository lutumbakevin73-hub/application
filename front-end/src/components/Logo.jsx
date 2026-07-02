const LOGO_SRC = "/udbl.jpg";

export default function Logo({ size = "md", showText = true, className = "" }) {
  const sizes = {
    sm: { img: "w-10 h-10", title: "text-base" },
    md: { img: "w-12 h-12", title: "text-lg" },
    lg: { img: "w-20 h-20", title: "text-2xl" },
    xl: { img: "w-28 h-28", title: "text-3xl" }
  };

  const s = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src={LOGO_SRC}
        alt="Logo UDBL"
        className={`${s.img} rounded-full object-cover ring-2 ring-udbl-green/30 ring-offset-2`}
      />
      {showText && (
        <div className="text-left leading-tight">
          <p className={`${s.title} font-bold text-udbl-blue`}>UDBL Learning</p>
        </div>
      )}
    </div>
  );
}

export { LOGO_SRC };
