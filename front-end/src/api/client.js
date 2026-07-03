const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function getToken() {
  return localStorage.getItem("token");
}

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  const text = await response.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    const detail =
      data.message ||
      data.error ||
      text ||
      `Erreur HTTP ${response.status}`;
    throw new Error(detail);
  }

  return data;
}

export const api = {
  register: (body) =>
    request("/api/register", { method: "POST", body: JSON.stringify(body) }),

  login: (body) =>
    request("/api/login", { method: "POST", body: JSON.stringify(body) }),

  me: () => request("/api/me"),

  chooseLanguage: (language) =>
    request("/api/user/choose-language", {
      method: "POST",
      body: JSON.stringify({ language })
    }),

  startTest: () =>
    request("/api/test/start", { method: "POST", body: "{}" }),

  correctCode: (body) =>
    request("/api/test/correct-code", {
      method: "POST",
      body: JSON.stringify(body)
    }),

  getCurrentProgram: () => request("/api/study/current"),

  getLessonProgress: () => request("/api/study/progress"),

  saveLessonProgress: (body) =>
    request("/api/study/progress", {
      method: "POST",
      body: JSON.stringify(body)
    }),

  getMyAgenda: async () => {
    const data = await request("/api/agenda/current");
    return { agenda: data.agenda ?? null };
  },

  createStudyProgram: (body) =>
    request("/api/study/register", {
      method: "POST",
      body: JSON.stringify(body)
    }),

  completeTest: (userId) =>
    request("/api/user/complete-test", {
      method: "POST",
      body: JSON.stringify({ userId })
    }),

  saveAgenda: (body) =>
    request("/api/agenda/save", {
      method: "POST",
      body: JSON.stringify(body)
    }),

  forgotPassword: (email) =>
    request("/api/password/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email })
    }),

  resetPassword: (body) =>
    request("/api/password/reset-password", {
      method: "POST",
      body: JSON.stringify(body)
    }),

  googleAuthUrl: `${API_BASE}/auth/google`,

  adminDashboard: () => request("/api/admin/dashboard"),

  adminUsers: () => request("/api/admin/users"),

  adminDeleteUser: (userId) =>
    request(`/api/admin/users/${userId}`, { method: "DELETE" }),

  adminProgressList: () => request("/api/admin/progress"),

  adminProgressDetail: (userId) => request(`/api/admin/progress/${userId}`),

  adminAgendas: ({
    agendaPage = 1,
    agendaLimit = 5,
    sessionPage = 1,
    sessionLimit = 10
  } = {}) => {
    const params = new URLSearchParams({
      agendaPage: String(agendaPage),
      agendaLimit: String(agendaLimit),
      sessionPage: String(sessionPage),
      sessionLimit: String(sessionLimit)
    });
    return request(`/api/admin/agendas?${params}`);
  }
};

export function parseJwt(token) {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const json = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
      .join("")
  );
  return JSON.parse(json);
}
