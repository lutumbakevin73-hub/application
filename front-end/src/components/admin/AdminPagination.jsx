export default function AdminPagination({
  page,
  totalPages,
  total,
  onPageChange,
  label = "éléments"
}) {
  if (totalPages <= 1) {
    return total > 0 ? (
      <p className="mt-4 text-xs text-udbl-muted">
        {total} {label} au total
      </p>
    ) : null;
  }

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-udbl-muted">
        Page {page} sur {totalPages} — {total} {label}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="btn-outline text-xs py-1.5 px-3 disabled:opacity-40"
        >
          Précédent
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="btn-outline text-xs py-1.5 px-3 disabled:opacity-40"
        >
          Suivant
        </button>
      </div>
    </div>
  );
}
