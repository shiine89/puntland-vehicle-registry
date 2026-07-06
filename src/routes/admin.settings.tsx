import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { KeyRound, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/admin/settings")({ component: SettingsPage });

function SettingsPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return toast.error("Password must be at least 8 characters");
    if (pw !== pw2) return toast.error("Passwords do not match");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    setPw(""); setPw2("");
  }

  async function signOutAll() {
    await supabase.auth.signOut({ scope: "global" });
    toast.success("Signed out from all devices");
    nav({ to: "/auth" });
  }

  return (
    <div className="p-8 max-w-2xl">
      <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4"/> Dashboard
      </Link>
      <h1 className="text-2xl font-bold">Account settings</h1>
      <p className="text-sm text-muted-foreground mt-1">Signed in as <span className="font-mono">{user?.email}</span></p>

      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
            <KeyRound className="h-5 w-5"/>
          </div>
          <div>
            <h2 className="font-semibold">Change password</h2>
            <p className="text-xs text-muted-foreground">Minimum 8 characters.</p>
          </div>
        </div>
        <form onSubmit={changePassword} className="space-y-4">
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">New password</label>
            <input type="password" required value={pw} onChange={(e)=>setPw(e.target.value)}
              className="mt-1 w-full h-11 rounded-md border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/40"/>
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Confirm new password</label>
            <input type="password" required value={pw2} onChange={(e)=>setPw2(e.target.value)}
              className="mt-1 w-full h-11 rounded-md border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/40"/>
          </div>
          <button disabled={busy} className="h-11 px-6 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-2">
            {busy && <Loader2 className="h-4 w-4 animate-spin"/>} Update password
          </button>
        </form>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card p-6">
        <h2 className="font-semibold">Sessions</h2>
        <p className="text-xs text-muted-foreground mt-1">Sign out from every device where this account is signed in.</p>
        <button onClick={signOutAll} className="mt-4 h-10 px-5 rounded-md border border-border text-sm hover:bg-muted">
          Sign out everywhere
        </button>
      </div>
    </div>
  );
}
