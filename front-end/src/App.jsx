import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { DialogProvider } from "./context/DialogContext";
import Layout from "./components/Layout";
import AdminShell from "./components/AdminShell";
import { AdminRedirect } from "./components/AdminRedirect";
import {
  LanguagePendingOnly,
  RequireAgendaSaved,
  RequireAdmin,
  RequireProgramChosen,
  RequireProgramPending,
  TestPendingOnly
} from "./components/ProtectedRoute";
import ChooseLanguage from "./pages/ChooseLanguage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAgendas from "./pages/admin/AdminAgendas";
import AdminSessions from "./pages/admin/AdminSessions";
import AdminProgress from "./pages/admin/AdminProgress";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import TestIntro from "./pages/TestIntro";
import Quiz from "./pages/Quiz";
import StudyPlan from "./pages/StudyPlan";
import StudySessions from "./pages/StudySessions";
import Agenda from "./pages/Agenda";

export default function App() {
  return (
    <AuthProvider>
      <DialogProvider>
        <BrowserRouter>
        <Routes>
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminShell />
              </RequireAdmin>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="progress" element={<AdminProgress />} />
            <Route path="agendas" element={<AdminAgendas />} />
            <Route path="sessions" element={<AdminSessions />} />
          </Route>

          <Route element={<Layout />}>
            <Route
              index
              element={
                <AdminRedirect>
                  <Home />
                </AdminRedirect>
              }
            />
            <Route path="register" element={<Register />} />
            <Route path="login" element={<Login />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />

            <Route
              path="language"
              element={
                <AdminRedirect>
                  <LanguagePendingOnly>
                    <ChooseLanguage />
                  </LanguagePendingOnly>
                </AdminRedirect>
              }
            />
            <Route
              path="test"
              element={
                <AdminRedirect>
                  <TestPendingOnly>
                    <TestIntro />
                  </TestPendingOnly>
                </AdminRedirect>
              }
            />
            <Route
              path="quiz"
              element={
                <AdminRedirect>
                  <TestPendingOnly>
                    <Quiz />
                  </TestPendingOnly>
                </AdminRedirect>
              }
            />
            <Route
              path="plan"
              element={
                <AdminRedirect>
                  <RequireProgramPending>
                    <StudyPlan />
                  </RequireProgramPending>
                </AdminRedirect>
              }
            />
            <Route
              path="agenda"
              element={
                <AdminRedirect>
                  <RequireProgramChosen>
                    <Agenda />
                  </RequireProgramChosen>
                </AdminRedirect>
              }
            />
            <Route
              path="sessions"
              element={
                <AdminRedirect>
                  <RequireAgendaSaved>
                    <StudySessions />
                  </RequireAgendaSaved>
                </AdminRedirect>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </DialogProvider>
    </AuthProvider>
  );
}
