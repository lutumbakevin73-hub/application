const LOGO_SRC = "/udbl.jpg";

export default function Logo({ size = "md", showText = true, className = "" }) {
  const sizes = {
    sm: { img: "w-10 h-10", title: "text-base", sub: "text-[10px]" },
    md: { img: "w-12 h-12", title: "text-lg", sub: "text-xs" },
    lg: { img: "w-20 h-20", title: "text-2xl", sub: "text-sm" },
    xl: { img: "w-28 h-28", title: "text-3xl", sub: "text-sm" }
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
          <p className={`${s.sub} motto hidden sm:block`}>
            Solidarité · Innovation · Travail
          </p>
        </div>
      )}
    </div>
  );
}

export { LOGO_SRC };
