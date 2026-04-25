import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <main className="auth">
      <h1 className="auth__title">curtain down.</h1>
      <p className="auth__lede">This page doesn't exist (yet).</p>
      <Link to="/" className="btn btn--accent">← home</Link>
    </main>
  );
}
