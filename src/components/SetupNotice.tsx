import { useAuth } from "../lib/auth";

export function SetupNotice() {
  const { configured } = useAuth();
  if (configured) return null;
  return (
    <div className="setup-notice">
      <strong>Supabase not configured.</strong> Copy <code>.env.example</code> to <code>.env</code>, fill in your project URL + anon key, then restart <code>npm run dev</code>. Full instructions in <code>SETUP.md</code>.
    </div>
  );
}
