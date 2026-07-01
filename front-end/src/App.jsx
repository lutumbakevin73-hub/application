import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/Layout";
import {
  RequireAgendaSaved,
  RequireProgramChosen,
  RequireProgramPending,
  TestPendingOnly
} from "./components/ProtectedRoute";
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
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="register" element={<Register />} />
            <Route path="login" element={<Login />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />

            <Route
              path="test"
              element={
                <TestPendingOnly>
                  <TestIntro />
                </TestPendingOnly>
              }
            />
            <Route
              path="quiz"
              element={
                <TestPendingOnly>
                  <Quiz />
                </TestPendingOnly>
              }
            />
            <Route
              path="plan"
              element={
                <RequireProgramPending>
                  <StudyPlan />
                </RequireProgramPending>
              }
            />
            <Route
              path="agenda"
              element={
                <RequireProgramChosen>
                  <Agenda />
                </RequireProgramChosen>
              }
            />
            <Route
              path="sessions"
              element={
                <RequireAgendaSaved>
                  <StudySessions />
                </RequireAgendaSaved>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
