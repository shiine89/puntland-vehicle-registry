import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const nav = useNavigate();
  const { session, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) nav({ to: "/admin" });
  }, [session, loading, nav]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      await supabase.from("audit_logs").insert({ action: "login_failed", table_name: "auth", user_email: email }).then(()=>{});
      return;
    }
    toast.success("Signed in");
    nav({ to: "/admin" });
  }

  return (
    <div className="min-h-screen hero-mesh flex flex-col">
      <header className="px-6 h-16 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4"/> Home</Link>
        <div className="font-mono text-xs text-muted-foreground">GOV.PL · ADMIN</div>
      </header>
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="glass rounded-2xl p-8 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="h-14 w-14 rounded-xl gov-gradient flex items-center justify-center text-white shadow-md">
                <ShieldCheck className="h-7 w-7"/>
              </div>
              <h1 className="mt-4 text-2xl font-bold">Government Portal</h1>
              <p className="text-sm text-muted-foreground mt-1">Sign in with your credentials</p>
            </div>
            <form onSubmit={onSubmit} className="mt-8 space-y-4">
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Email</label>
                <input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} className="mt-1 w-full h-11 rounded-md border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/40"/>
              </div>
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Password</label>
                <input type="password" required value={password} onChange={(e)=>setPassword(e.target.value)} className="mt-1 w-full h-11 rounded-md border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/40"/>
              </div>
              <button disabled={busy} className="w-full h-11 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50 inline-flex items-center justify-center gap-2">
                {busy && <Loader2 className="h-4 w-4 animate-spin"/>} Sign In
              </button>
            </form>
            <p className="mt-6 text-[11px] font-mono text-center text-muted-foreground">This system is monitored. Unauthorized access is prohibited.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
