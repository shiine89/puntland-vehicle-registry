import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Car, Users, ArrowRightLeft, AlertTriangle, FileText, Settings, LogOut, Loader2, UserCog, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({ component: AdminLayout });

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/vehicles", label: "Vehicles", icon: Car },
  { to: "/admin/owners", label: "Owners", icon: Users },
  { to: "/admin/transfers", label: "Transfers", icon: ArrowRightLeft },
  { to: "/admin/incidents", label: "Incidents", icon: AlertTriangle },
  { to: "/admin/reports", label: "Reports", icon: FileText },
  { to: "/admin/audit", label: "Audit Log", icon: ShieldCheck, adminOnly: true },
  { to: "/admin/users", label: "Users", icon: UserCog, adminOnly: true },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

function AdminLayout() {
  const { session, loading, role, user, isAdmin } = useAuth();
  const navi = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !session) navi({ to: "/auth" });
  }, [session, loading, navi]);

  if (loading || !session) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary"/></div>;
  }

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navi({ to: "/auth" });
  }

  return (
    <div className="min-h-screen flex bg-muted/30">
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        <div className="h-16 flex items-center gap-3 px-5 border-b border-border">
          <div className="h-9 w-9 rounded-md gov-gradient flex items-center justify-center text-white font-bold">P</div>
          <div>
            <div className="text-sm font-semibold leading-tight">PL Registry</div>
            <div className="text-[10px] font-mono text-muted-foreground">ADMIN CONSOLE</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.filter(i => !i.adminOnly || isAdmin).map((item) => {
            const active = item.end ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link key={item.to} to={item.to as any}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition ${active ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:bg-muted"}`}>
                <item.icon className="h-4 w-4"/> {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <div className="px-3 py-2 mb-2">
            <div className="text-xs font-medium truncate">{user?.email}</div>
            <div className="text-[10px] font-mono uppercase text-muted-foreground">{role ?? "no role"}</div>
          </div>
          <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-foreground/70 hover:bg-muted">
            <LogOut className="h-4 w-4"/> Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <Outlet/>
      </main>
    </div>
  );
}
