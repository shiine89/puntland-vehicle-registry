import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo, useState } from "react";
import { Search, User } from "lucide-react";

export const Route = createFileRoute("/admin/owners")({ component: OwnersPage });

function OwnersPage() {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const { data } = useQuery({
    queryKey: ["owners"],
    queryFn: async () => {
      const { data } = await supabase.from("owners").select("*, vehicles:vehicles!vehicles_current_owner_id_fkey(id, plate_number, model, manufacturer)").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return data ?? [];
    return (data ?? []).filter((o: any) =>
      o.full_name.toLowerCase().includes(t) || o.national_id?.toLowerCase().includes(t) ||
      o.phone.toLowerCase().includes(t) || o.district?.toLowerCase().includes(t)
    );
  }, [data, q]);

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Owners</h1>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card">
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
              <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search name, ID, phone, district…" className="w-full h-10 rounded-md border border-border bg-background pl-10 pr-3 outline-none focus:ring-2 focus:ring-primary/40"/>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground font-mono">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Phone</th>
                <th className="text-left px-4 py-3">District</th>
                <th className="text-right px-4 py-3">Vehicles</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o: any) => (
                <tr key={o.id} onClick={()=>setSelected(o)} className="cursor-pointer border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{o.full_name}</td>
                  <td className="px-4 py-3 font-mono">{o.phone}</td>
                  <td className="px-4 py-3">{o.district ?? "—"}</td>
                  <td className="px-4 py-3 text-right">{o.vehicles?.length ?? 0}</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={4} className="text-center py-10 text-muted-foreground">No owners.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          {!selected ? (
            <div className="text-center py-16 text-muted-foreground">
              <User className="h-10 w-10 mx-auto mb-3"/>
              <p className="text-sm">Select an owner to view details</p>
            </div>
          ) : (
            <div>
              <div className="text-xs font-mono uppercase text-muted-foreground">Owner profile</div>
              <h2 className="text-xl font-bold mt-1">{selected.full_name}</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <Row k="National ID" v={selected.national_id}/>
                <Row k="Phone" v={selected.phone}/>
                <Row k="Alt phone" v={selected.alt_phone}/>
                <Row k="Email" v={selected.email}/>
                <Row k="Occupation" v={selected.occupation}/>
                <Row k="District" v={selected.district}/>
                <Row k="City" v={selected.city}/>
                <Row k="Address" v={selected.address}/>
              </dl>
              <div className="mt-5 text-xs font-mono uppercase text-muted-foreground">Vehicles ({selected.vehicles?.length ?? 0})</div>
              <ul className="mt-2 space-y-2">
                {(selected.vehicles ?? []).map((v: any) => (
                  <li key={v.id} className="p-2 rounded-md bg-muted/50 text-sm flex justify-between">
                    <span className="font-mono">{v.plate_number}</span>
                    <span className="text-muted-foreground">{v.manufacturer} {v.model}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
const Row = ({ k, v }: any) => <div className="flex justify-between border-b border-border/40 py-1.5"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v || "—"}</dd></div>;
