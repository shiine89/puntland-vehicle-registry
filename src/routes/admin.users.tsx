import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({ component: Users });

function Users() {
  const { data, refetch } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles").select("*");
      const { data: roles } = await supabase.from("user_roles").select("*");
      return (profiles ?? []).map((p: any) => ({ ...p, roles: (roles ?? []).filter((r: any) => r.user_id === p.id).map((r: any) => r.role) }));
    },
  });

  async function setRole(userId: string, role: "admin"|"officer"|"viewer") {
    await supabase.from("user_roles").delete().eq("user_id", userId);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (error) return toast.error(error.message);
    toast.success("Role updated");
    refetch();
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">User management</h1>
      <p className="text-sm text-muted-foreground">Assign roles. New users are invited via Cloud → Users; then set their role here.</p>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground font-mono">
            <tr>
              <th className="text-left px-4 py-3">User</th>
              <th className="text-left px-4 py-3">Current role</th>
              <th className="text-right px-4 py-3">Assign role</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((u: any) => (
              <tr key={u.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <div className="font-medium">{u.full_name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                </td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">{u.roles[0] ?? "no role"}</span></td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-1">
                    {(["admin","officer","viewer"] as const).map((r) => (
                      <button key={r} onClick={()=>setRole(u.id, r)} className="px-3 py-1.5 text-xs rounded-md border border-border hover:bg-primary hover:text-primary-foreground">
                        {r}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
