import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function Masthead() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="app-mast">
      <div className="app-mast__brand">
        <Link to="/">
          stage <em>diary</em>
        </Link>
      </div>
      <div className="app-mast__center">
        a small archive of your shows
      </div>
      <div className="app-mast__nav">
        {user && profile ? (
          <>
            <Link to={`/@${profile.handle}`} className="pill">@{profile.handle}</Link>
            <Link to="/new" className="pill pill--accent">new entry</Link>
            <Link to="/settings">settings</Link>
            <button
              className="pill"
              onClick={async () => {
                await signOut();
                navigate("/");
              }}
            >
              sign out
            </button>
          </>
        ) : user && !profile ? (
          <Link to="/onboarding" className="pill pill--accent">finish setup</Link>
        ) : (
          <Link to="/login" className="pill">sign in</Link>
        )}
      </div>
    </nav>
  );
}
