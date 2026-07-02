export function formatSessionDate(dateStr, timeStr) {
  try {
    const date = new Date(`${dateStr}T${timeStr || "12:00"}`);
    return date.toLocaleString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return `${dateStr} ${timeStr || ""}`.trim();
  }
}

export function normalizePage(data, defaultLimit) {
  if (Array.isArray(data)) {
    return {
      items: data,
      total: data.length,
      page: 1,
      limit: defaultLimit,
      totalPages: 1
    };
  }

  if (data && Array.isArray(data.items)) {
    return {
      items: data.items,
      total: Number(data.total) || data.items.length,
      page: Number(data.page) || 1,
      limit: Number(data.limit) || defaultLimit,
      totalPages: Number(data.totalPages) || 1
    };
  }

  return {
    items: [],
    total: 0,
    page: 1,
    limit: defaultLimit,
    totalPages: 1
  };
}
