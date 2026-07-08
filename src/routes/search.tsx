import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { publicSearchVehicles, type PublicVehicle } from "@/lib/public-search.functions";
import { Search, ArrowLeft, ShieldCheck, ShieldAlert, Loader2, BadgeCheck, Car } from "lucide-react";

export const Route = createFileRoute("/search")({
  component: SearchPage,
  head: () => ({
    meta: [
      { title: "Search a Vehicle — Puntland Vehicle Registry" },
      { name: "description", content: "Instantly verify whether a vehicle is officially registered in the Puntland Vehicle Registration System. Search by plate number, chassis / VIN, or engine number." },
      { property: "og:title", content: "Search a Vehicle — Puntland Vehicle Registry" },
      { property: "og:description", content: "Public vehicle verification portal for citizens, buyers, and law enforcement." },
    ],
  }),
});

function SearchPage() {
  const search = useServerFn(publicSearchVehicles);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PublicVehicle[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (!term) { setError("Please enter a plate, chassis, VIN, or engine number."); return; }
    if (term.length < 2) { setError("Search term is too short."); return; }
    setError(null);
    setLoading(true);
    try {
      const data = await search({ data: { q: term } });
      setResults(data);
    } catch (err) {
      console.error(err);
      setError("Verification service is temporarily unavailable. Please try again.");
      setResults([]);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4"/> Home
          </Link>
          <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
            <BadgeCheck className="h-4 w-4 text-primary"/> GOV.PL · PUBLIC VERIFY
          </div>
        </div>
      </header>

      <div className="hero-mesh border-b border-border">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12 sm:py-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-mono text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary"/> Official Government Verification
          </div>
          <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">Search a Vehicle</h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
            Instantly check if a vehicle is officially registered in the Puntland Vehicle Registration System.
          </p>

          <form onSubmit={onSearch} className="mt-8 glass rounded-2xl p-2 sm:p-3 flex flex-col sm:flex-row gap-2 shadow-xl text-left">
            <div className="flex-1 flex items-center gap-2 px-3">
              <Search className="h-5 w-5 text-muted-foreground shrink-0"/>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Plate · Chassis / VIN · Engine No."
                className="w-full h-12 bg-transparent outline-none text-base placeholder:text-muted-foreground/70"
                aria-label="Search vehicle"
                autoFocus
              />
            </div>
            <button
              disabled={loading}
              className="h-12 px-6 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-60 inline-flex items-center justify-center gap-2 hover:opacity-90 transition"
            >
              {loading ? (<><Loader2 className="h-4 w-4 animate-spin"/> Searching…</>) : (<>Search</>)}
            </button>
          </form>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          <p className="mt-4 text-[11px] font-mono text-muted-foreground">
            🔒 Owner information is protected. Only registration data is shown.
          </p>
        </div>
      </div>

      <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-8 sm:py-10 flex-1">
        {loading && <LoadingState/>}
        {!loading && results === null && <EmptyState/>}
        {!loading && results && results.length === 0 && <NotFound/>}
        {!loading && results && results.length > 0 && (
          <>
            <div className="mb-4 text-xs font-mono text-muted-foreground uppercase tracking-wider">
              {results.length} record{results.length === 1 ? "" : "s"} found
            </div>
            <div className="space-y-4">
              {results.map((v) => <VehicleCard key={v.id} v={v}/>)}
            </div>
          </>
        )}
      </main>

      <footer className="border-t border-border py-6">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center text-[11px] font-mono text-muted-foreground">
          PL · GOV · REGISTRY v1.0 · Issued by the Puntland Vehicle Registration Authority
        </div>
      </footer>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="rounded-2xl border border-border bg-card p-10 text-center">
      <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary"/>
      <p className="mt-3 text-sm text-muted-foreground">Checking the official registry…</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <Car className="h-10 w-10 mx-auto text-muted-foreground/60"/>
      <p className="mt-3 text-sm text-muted-foreground">Enter a plate, chassis, or VIN above to verify a vehicle.</p>
    </div>
  );
}
function NotFound() {
  return (
    <div className="rounded-2xl border border-border bg-card p-10 text-center">
      <ShieldAlert className="h-10 w-10 text-warning mx-auto"/>
      <h3 className="mt-4 text-lg font-semibold">Not officially registered</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
        No official registration record was found for this vehicle. Please double-check the details and try again.
      </p>
    </div>
  );
}

function statusStyle(v: PublicVehicle) {
  const flags = [v.blacklisted && "BLACKLISTED", v.stolen && "STOLEN", v.wanted && "WANTED"].filter(Boolean) as string[];
  if (flags.length) return { tone: "danger" as const, label: flags.join(" · ") };
  if (v.status === "active") return { tone: "ok" as const, label: "OFFICIALLY REGISTERED · ACTIVE" };
  if (v.status === "expired") return { tone: "warn" as const, label: "REGISTRATION EXPIRED" };
  if (v.status === "suspended") return { tone: "warn" as const, label: "SUSPENDED" };
  return { tone: "warn" as const, label: v.status.toUpperCase() };
}

function VehicleCard({ v }: { v: PublicVehicle }) {
  const s = statusStyle(v);
  const toneCls = s.tone === "ok"
    ? "bg-secondary/15 text-secondary border-secondary/30"
    : s.tone === "warn"
      ? "bg-warning/15 text-warning border-warning/30"
      : "bg-destructive/15 text-destructive border-destructive/30";
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      <div className={`px-6 py-3 border-b border-border flex items-center gap-2 text-xs font-mono font-medium ${toneCls} border-b`}>
        {s.tone === "ok" ? <ShieldCheck className="h-4 w-4"/> : <ShieldAlert className="h-4 w-4"/>}
        {s.label}
      </div>

      <div className="p-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-border">
        <div>
          <div className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider">Plate Number</div>
          <div className="text-3xl sm:text-4xl font-bold font-mono tracking-wider mt-1">{v.plate_number}</div>
          <div className="mt-2 text-sm text-muted-foreground">
            {[v.year, v.manufacturer, v.model].filter(Boolean).join(" · ")}
            {v.color ? ` · ${v.color}` : ""}
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider">Registered</div>
          <div className="text-sm font-medium mt-1">{new Date(v.registration_date).toLocaleDateString()}</div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3 p-6 text-sm">
        <Row k="Vehicle Type" val={v.vehicle_type}/>
        <Row k="Make" val={v.manufacturer ?? "—"}/>
        <Row k="Model" val={v.model ?? "—"}/>
        <Row k="Year" val={v.year ?? "—"}/>
        <Row k="Color" val={v.color ?? "—"}/>
        <Row k="Chassis / VIN" val={<span className="font-mono">{v.vin || v.chassis_number}</span>}/>
        <Row k="Engine No." val={<span className="font-mono">{v.engine_number ?? "—"}</span>}/>
        <Row k="Owner Name" val={v.owner_name ?? "—"}/>
        <Row k="Owner Phone" val={<span className="font-mono">{v.owner_phone ?? "—"}</span>}/>
        <Row k="Authority" val="Puntland Vehicle Registry"/>
      </div>

      <div className="px-6 py-3 bg-muted/30 border-t border-border text-[11px] font-mono text-muted-foreground flex items-center gap-2">
        <BadgeCheck className="h-3.5 w-3.5 text-primary"/>
        Verified record from the official Puntland Vehicle Registry.
      </div>
    </div>
  );
}

function Row({ k, val }: { k: string; val: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/50 pb-2 last:border-0">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="text-right font-medium">{val}</dd>
    </div>
  );
}
