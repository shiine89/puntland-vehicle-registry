import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo, useState } from "react";
import { Plus, Search, Eye, ArrowRightLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/admin/vehicles/")({ component: VehiclesList });

function VehiclesList() {
  const { isAdmin } = useAuth();
  const [q, setQ] = useState("");
  const { data, refetch } = useQuery({
    queryKey: ["vehicles-list"],
    queryFn: async () => {
      const { data } = await supabase.from("vehicles").select("*, owner:owners!vehicles_current_owner_id_fkey(full_name, phone)").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return data ?? [];
    return (data ?? []).filter((v: any) =>
      v.plate_number.toLowerCase().includes(t) ||
      v.chassis_number?.toLowerCase().includes(t) ||
      v.owner?.full_name?.toLowerCase().includes(t) ||
      v.model?.toLowerCase().includes(t)
    );
  }, [data, q]);

  async function onDelete(id: string, plate: string) {
    if (!confirm(`Delete vehicle ${plate}?`)) return;
    const { error } = await supabase.from("vehicles").delete().eq("id", id);
    if (error) return toast.error(error.message);
    await logAudit("delete", "vehicles", id, { plate_number: plate });
    toast.success("Deleted"); refetch();
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vehicles</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} record{filtered.length === 1 ? "" : "s"}</p>
        </div>
        <Link to="/admin/vehicles/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium"><Plus className="h-4 w-4"/> New</Link>
      </div>
      <div className="rounded-xl border border-border bg-card">
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
            <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search plate, chassis, owner, model…" className="w-full h-10 rounded-md border border-border bg-background pl-10 pr-3 outline-none focus:ring-2 focus:ring-primary/40"/>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground font-mono">
              <tr>
                <th className="text-left px-4 py-3">Plate</th>
                <th className="text-left px-4 py-3">Owner</th>
                <th className="text-left px-4 py-3">Model</th>
                <th className="text-left px-4 py-3">Chassis</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Registered</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v: any) => (
                <tr key={v.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono font-medium">{v.plate_number}</td>
                  <td className="px-4 py-3">{v.owner?.full_name ?? "—"}</td>
                  <td className="px-4 py-3">{v.manufacturer} {v.model}</td>
                  <td className="px-4 py-3 font-mono text-xs">{v.chassis_number}</td>
                  <td className="px-4 py-3"><StatusBadge v={v}/></td>
                  <td className="px-4 py-3 text-muted-foreground">{v.registration_date}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-1">
                      <Link to="/admin/vehicles/$id" params={{ id: v.id }} className="p-2 hover:bg-muted rounded" title="View"><Eye className="h-4 w-4"/></Link>
                      <Link to="/admin/vehicles/$id/transfer" params={{ id: v.id }} className="p-2 hover:bg-muted rounded" title="Transfer"><ArrowRightLeft className="h-4 w-4"/></Link>
                      {isAdmin && <button onClick={()=>onDelete(v.id, v.plate_number)} className="p-2 hover:bg-destructive/10 rounded text-destructive" title="Delete"><Trash2 className="h-4 w-4"/></button>}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">No vehicles found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ v }: { v: any }) {
  const flag = v.stolen ? "stolen" : v.wanted ? "wanted" : v.blacklisted ? "blacklisted" : v.status;
  const map: Record<string,string> = {
    active: "bg-secondary/15 text-secondary",
    sold: "bg-muted text-foreground",
    stolen: "bg-destructive/15 text-destructive",
    wanted: "bg-destructive/15 text-destructive",
    blacklisted: "bg-destructive/15 text-destructive",
    flagged: "bg-warning/20 text-warning-foreground",
  };
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${map[flag] ?? "bg-muted"}`}>{flag.toUpperCase()}</span>;
}
