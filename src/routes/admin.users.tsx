import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  listUsers,
  createUser,
  deleteUser,
  setUserRole,
  resetUserPassword,
  type AppRole,
  type ManagedUser,
} from "@/lib/users-admin.functions";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Trash2, KeyRound, UserPlus, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/admin/users")({ component: Users });

function Users() {
  const { user, isAdmin } = useAuth();
  const list = useServerFn(listUsers);
  const create = useServerFn(createUser);
  const del = useServerFn(deleteUser);
  const setRole = useServerFn(setUserRole);
  const resetPw = useServerFn(resetUserPassword);

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => list(),
    enabled: isAdmin,
  });

  const [form, setForm] = useState({ email: "", password: "", full_name: "", role: "viewer" as AppRole });
  const [busy, setBusy] = useState(false);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await create({ data: form });
      toast.success(`User ${form.email} created`);
      setForm({ email: "", password: "", full_name: "", role: "viewer" });
      refetch();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to create user");
    }
    setBusy(false);
  }

  async function onDelete(u: ManagedUser) {
    if (!confirm(`Delete ${u.email}? This cannot be undone.`)) return;
    try {
      await del({ data: { userId: u.id } });
      toast.success("User deleted");
      refetch();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to delete");
    }
  }

  async function onSetRole(u: ManagedUser, role: AppRole) {
    try {
      await setRole({ data: { userId: u.id, role } });
      toast.success(`Role updated to ${role}`);
      refetch();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed");
    }
  }

  async function onResetPw(u: ManagedUser) {
    const pw = prompt(`New password for ${u.email} (min 8 chars):`);
    if (!pw) return;
    try {
      await resetPw({ data: { userId: u.id, password: pw } });
      toast.success("Password updated");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed");
    }
  }

  if (!isAdmin) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm">
          Admin access required.
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><ShieldCheck className="h-6 w-6 text-primary"/> User management</h1>
        <p className="text-sm text-muted-foreground mt-1">Create, delete, and assign roles for staff and admins.</p>
      </div>

      <form onSubmit={onCreate} className="rounded-xl border border-border bg-card p-5 grid md:grid-cols-5 gap-3">
        <div className="md:col-span-5 flex items-center gap-2 text-sm font-medium"><UserPlus className="h-4 w-4"/> Create new user</div>
        <input required type="email" placeholder="email@puntlandreg.so" value={form.email}
          onChange={(e)=>setForm({...form,email:e.target.value})}
          className="md:col-span-2 h-10 px-3 rounded-md border border-border bg-background text-sm"/>
        <input placeholder="Full name" value={form.full_name}
          onChange={(e)=>setForm({...form,full_name:e.target.value})}
          className="h-10 px-3 rounded-md border border-border bg-background text-sm"/>
        <input required type="text" placeholder="Password (min 8)" value={form.password}
          onChange={(e)=>setForm({...form,password:e.target.value})}
          className="h-10 px-3 rounded-md border border-border bg-background text-sm"/>
        <div className="flex gap-2">
          <select value={form.role} onChange={(e)=>setForm({...form,role:e.target.value as AppRole})}
            className="h-10 px-3 rounded-md border border-border bg-background text-sm flex-1">
            <option value="viewer">viewer</option>
            <option value="officer">officer</option>
            <option value="admin">admin</option>
          </select>
          <button disabled={busy} className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
            {busy ? "Creating…" : "Create"}
          </button>
        </div>
      </form>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary"/></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground font-mono">
              <tr>
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-left px-4 py-3">Last sign-in</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((u) => {
                const isMe = u.id === user?.id;
                const currentRole = u.roles[0] ?? "viewer";
                return (
                  <tr key={u.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <div className="font-medium">{u.full_name ?? "—"} {isMe && <span className="text-xs text-primary">(you)</span>}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={currentRole}
                        onChange={(e)=>onSetRole(u, e.target.value as AppRole)}
                        className="h-8 px-2 rounded-md border border-border bg-background text-xs">
                        <option value="viewer">viewer</option>
                        <option value="officer">officer</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <button onClick={()=>onResetPw(u)} title="Reset password"
                          className="px-2 py-1.5 text-xs rounded-md border border-border hover:bg-muted inline-flex items-center gap-1">
                          <KeyRound className="h-3 w-3"/> Password
                        </button>
                        <button disabled={isMe} onClick={()=>onDelete(u)} title="Delete"
                          className="px-2 py-1.5 text-xs rounded-md border border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-destructive inline-flex items-center gap-1">
                          <Trash2 className="h-3 w-3"/> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {(data ?? []).length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground text-sm">No users found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
