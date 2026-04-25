import { Navigate, Route, Routes } from "react-router-dom";
import { Masthead } from "./components/Masthead";
import { PageEffects } from "./components/PageEffects";
import { SetupNotice } from "./components/SetupNotice";
import { useAuth } from "./lib/auth";
import { AuthCallback } from "./pages/AuthCallback";
import { Diary } from "./pages/Diary";
import { Entry } from "./pages/Entry";
import { EntryEditor } from "./pages/EntryEditor";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { NotFound } from "./pages/NotFound";
import { Onboarding } from "./pages/Onboarding";
import { Settings } from "./pages/Settings";

function RequireAuth({ children }: { children: JSX.Element }) {
  const { ready, user } = useAuth();
  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RequireProfile({ children }: { children: JSX.Element }) {
  const { ready, user, profile } = useAuth();
  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!profile) return <Navigate to="/onboarding" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <Masthead />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/onboarding"
          element={
            <RequireAuth>
              <Onboarding />
            </RequireAuth>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireProfile>
              <Settings />
            </RequireProfile>
          }
        />
        <Route
          path="/new"
          element={
            <RequireProfile>
              <EntryEditor />
            </RequireProfile>
          }
        />
        <Route
          path="/edit/:entryId"
          element={
            <RequireProfile>
              <EntryEditor />
            </RequireProfile>
          }
        />
        <Route path="/:handlePath" element={<Diary />} />
        <Route path="/:handlePath/:slug" element={<Entry />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <PageEffects />
      <SetupNotice />
    </>
  );
}
