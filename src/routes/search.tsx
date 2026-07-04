import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, ArrowLeft, ShieldCheck, ShieldAlert, Clock } from "lucide-react";

export const Route = createFileRoute("/search")({
  component: SearchPage,
  head: () => ({
    meta: [
      { title: "Verify a vehicle — Puntland Vehicle Registry" },
      { name: "description", content: "Search by plate number, chassis number, or owner name." },
    ],
  }),
});

type VehicleRow = any;

function SearchPage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<VehicleRow[] | null>(null);

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    const term = q.trim().toUpperCase();
    // Try plate/chassis first
    const { data: byV } = await supabase
      .from("vehicles")
      .select("*, owner:owners!vehicles_current_owner_id_fkey(*), incidents(*), history:ownership_history(*, owner:owners(*))")
      .or(`plate_number.ilike.%${term}%,chassis_number.ilike.%${term}%,vin.ilike.%${term}%`)
      .limit(10);
    let combined: any[] = byV ?? [];
    if (combined.length === 0) {
      const { data: owners } = await supabase.from("owners").select("id").ilike("full_name", `%${q.trim()}%`).limit(20);
      const ids = (owners ?? []).map((o) => o.id);
      if (ids.length) {
        const { data: byO } = await supabase
          .from("vehicles")
          .select("*, owner:owners!vehicles_current_owner_id_fkey(*), incidents(*), history:ownership_history(*, owner:owners(*))")
          .in("current_owner_id", ids);
        combined = byO ?? [];
      }
    }
    setResults(combined);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4"/> Home</Link>
          <div className="font-mono text-xs text-muted-foreground">GOV.PL · PUBLIC VERIFY</div>
        </div>
      </header>

      <div className="hero-mesh">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Verify a vehicle</h1>
          <p className="mt-3 text-muted-foreground">Enter a plate number, chassis / VIN, or owner name.</p>
          <form onSubmit={onSearch} className="mt-8 glass rounded-2xl p-3 flex gap-2 shadow-lg">
            <div className="flex-1 flex items-center gap-2 px-3">
              <Search className="h-5 w-5 text-muted-foreground"/>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. PL-4832  ·  1HGBH41JXMN109186  ·  Ahmed Ali" className="w-full h-12 bg-transparent outline-none text-base"/>
            </div>
            <button disabled={loading} className="px-6 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-50">{loading ? "Searching…" : "Search"}</button>
          </form>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {results === null && <EmptyState/>}
        {results && results.length === 0 && <NotFound/>}
        {results && results.map((v) => <VehicleCard key={v.id} v={v}/>)}
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center text-muted-foreground py-16">
      <p className="font-mono text-sm">Type any search above to begin.</p>
    </div>
  );
}
function NotFound() {
  return (
    <div className="glass rounded-xl p-10 text-center">
      <ShieldAlert className="h-10 w-10 text-warning mx-auto"/>
      <h3 className="mt-4 text-lg font-semibold">No vehicle found</h3>
      <p className="mt-1 text-sm text-muted-foreground">Check your input and try again.</p>
    </div>
  );
}

function VehicleCard({ v }: { v: any }) {
  const flags = [
    v.blacklisted && "BLACKLISTED", v.stolen && "STOLEN", v.wanted && "WANTED", v.recovered && "RECOVERED",
  ].filter(Boolean) as string[];
  const isClean = flags.length === 0 && v.status === "active";
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm mb-6">
      <div className="p-6 flex items-start justify-between border-b border-border">
        <div>
          <div className="font-mono text-xs text-muted-foreground">PLATE NUMBER</div>
          <div className="text-3xl font-bold font-mono tracking-wider mt-1">{v.plate_number}</div>
          <div className="mt-2 text-sm text-muted-foreground">{v.year} · {v.manufacturer} {v.model} · {v.color}</div>
        </div>
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${isClean ? "bg-secondary/15 text-secondary" : "bg-destructive/15 text-destructive"}`}>
          {isClean ? <ShieldCheck className="h-4 w-4"/> : <ShieldAlert className="h-4 w-4"/>}
          {isClean ? "VERIFIED · ACTIVE" : flags.join(" · ") || v.status.toUpperCase()}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 p-6">
        <div>
          <SectionLabel>Current owner</SectionLabel>
          <dl className="mt-2 space-y-2 text-sm">
            <Row k="Name" val={v.owner?.full_name ?? "—"}/>
            <Row k="Phone" val={v.owner?.phone ?? "—"}/>
            <Row k="District" val={v.owner?.district ?? "—"}/>
            <Row k="Address" val={v.owner?.address ?? "—"}/>
          </dl>
        </div>
        <div>
          <SectionLabel>Vehicle details</SectionLabel>
          <dl className="mt-2 space-y-2 text-sm">
            <Row k="Type" val={v.vehicle_type}/>
            <Row k="Chassis" val={<span className="font-mono">{v.chassis_number}</span>}/>
            <Row k="Engine" val={<span className="font-mono">{v.engine_number ?? "—"}</span>}/>
            <Row k="Registered" val={v.registration_date}/>
          </dl>
        </div>
      </div>

      {v.incidents?.length > 0 && (
        <div className="px-6 pb-6">
          <SectionLabel>Incidents</SectionLabel>
          <ul className="mt-2 space-y-2">
            {v.incidents.map((i: any) => (
              <li key={i.id} className="text-sm p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <div className="font-medium">{i.incident_type} · <span className="text-xs">{i.status}</span></div>
                <div className="text-muted-foreground text-xs mt-1">{i.description}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="px-6 pb-6">
        <SectionLabel>Ownership history</SectionLabel>
        <ol className="mt-3 border-l-2 border-border ml-2 space-y-4">
          {(v.history ?? []).sort((a: any, b: any) => (a.transfer_date < b.transfer_date ? 1 : -1)).map((h: any) => (
            <li key={h.id} className="pl-4 relative">
              <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-primary"/>
              <div className="text-sm font-medium">{h.owner?.full_name ?? "—"}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5"><Clock className="h-3 w-3"/> {h.transfer_date} · {h.reason ?? "Registration"}</div>
            </li>
          ))}
          {(!v.history || v.history.length === 0) && <li className="pl-4 text-sm text-muted-foreground">No transfers recorded.</li>}
        </ol>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">{children}</div>;
}
function Row({ k, val }: { k: string; val: React.ReactNode }) {
  return <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{k}</dt><dd className="text-right">{val}</dd></div>;
}
