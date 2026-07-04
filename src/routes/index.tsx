import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, ShieldCheck, ArrowRightLeft, AlertTriangle, FileCheck2, Lock, ArrowRight, Car } from "lucide-react";

export const Route = createFileRoute("/")({ component: Landing });

function useStats() {
  return useQuery({
    queryKey: ["landing-stats"],
    queryFn: async () => {
      const [vehicles, owners, transfers, flagged] = await Promise.all([
        supabase.from("vehicles").select("*", { count: "exact", head: true }),
        supabase.from("owners").select("*", { count: "exact", head: true }),
        supabase.from("ownership_history").select("*", { count: "exact", head: true }),
        supabase.from("vehicles").select("*", { count: "exact", head: true }).or("blacklisted.eq.true,stolen.eq.true,wanted.eq.true"),
      ]);
      return {
        vehicles: vehicles.count ?? 0,
        owners: owners.count ?? 0,
        transfers: transfers.count ?? 0,
        flagged: flagged.count ?? 0,
      };
    },
  });
}

function Landing() {
  const { data: stats } = useStats();
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/70 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-md gov-gradient flex items-center justify-center text-white font-bold">P</div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">Puntland Vehicle Registry</div>
              <div className="text-[11px] text-muted-foreground font-mono">GOV.PL · OFFICIAL</div>
            </div>
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/search" className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground">Verify</Link>
            <Link to="/auth" className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">Admin Login</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="hero-mesh">
        <div className="mx-auto max-w-7xl px-6 py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs font-mono">
              <span className="h-2 w-2 rounded-full bg-secondary animate-pulse"/> LIVE · GOVERNMENT SYSTEM
            </div>
            <h1 className="mt-6 text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
              Puntland Vehicle<br/>Registration System
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-lg font-display">
              Diiwaan Rasmi ah, Amaan, oo Degdeg ah — a centralized platform for registering vehicles, tracking ownership, and instant public verification.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/search" className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90">
                <Search className="h-4 w-4"/> Search Vehicle
              </Link>
              <Link to="/auth" className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-secondary text-secondary-foreground font-medium hover:opacity-90">
                <Car className="h-4 w-4"/> Register Vehicle
              </Link>
              <Link to="/auth" className="inline-flex items-center gap-2 px-5 py-3 rounded-md border border-border font-medium hover:bg-muted">
                <Lock className="h-4 w-4"/> Admin Login
              </Link>
            </div>
          </div>
          <div className="glass rounded-2xl p-6 shadow-xl">
            <div className="grid grid-cols-2 gap-4">
              <Stat label="Total Vehicles" value={stats?.vehicles ?? 0} accent="primary"/>
              <Stat label="Active Owners" value={stats?.owners ?? 0} accent="secondary"/>
              <Stat label="Transfers" value={stats?.transfers ?? 0} accent="accent"/>
              <Stat label="Flagged" value={stats?.flagged ?? 0} accent="destructive"/>
            </div>
            <div className="mt-5 p-4 rounded-lg bg-muted/50 font-mono text-xs text-muted-foreground">
              PL · GOV · REGISTRY v1.0 · Uptime 99.98%
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="text-3xl font-bold tracking-tight text-center">A trusted government-grade platform</h2>
        <p className="mt-3 text-center text-muted-foreground max-w-2xl mx-auto">Every capability required to run a modern national vehicle registry.</p>
        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-border/70 bg-card p-6 hover:border-primary/40 transition">
              <div className="h-10 w-10 rounded-md gov-gradient flex items-center justify-center text-white"><f.icon className="h-5 w-5"/></div>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted/30 border-y border-border">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <h2 className="text-3xl font-bold tracking-tight text-center">How it works</h2>
          <div className="mt-12 grid md:grid-cols-4 gap-4">
            {steps.map((s, i) => (
              <div key={s.title} className="relative rounded-xl bg-card border border-border p-6">
                <div className="font-mono text-xs text-primary">STEP {String(i+1).padStart(2,"0")}</div>
                <h3 className="mt-2 font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                {i < steps.length - 1 && <ArrowRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-border"/>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-background">
        <div className="mx-auto max-w-7xl px-6 py-12 grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-md gov-gradient flex items-center justify-center text-white font-bold">P</div>
              <div>
                <div className="font-semibold">Government of Puntland</div>
                <div className="text-xs text-muted-foreground">Ministry of Transportation</div>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Official vehicle registration system of the Puntland State of Somalia.</p>
          </div>
          <div>
            <div className="font-semibold text-sm mb-3">Quick Links</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/search" className="hover:text-foreground">Verify a vehicle</Link></li>
              <li><Link to="/auth" className="hover:text-foreground">Officer login</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-sm mb-3">Contact</div>
            <p className="text-sm text-muted-foreground">Garowe, Puntland<br/>support@puntlandreg.so</p>
          </div>
        </div>
        <div className="border-t border-border py-6 text-center text-xs text-muted-foreground font-mono">
          © {new Date().getFullYear()} PUNTLAND VEHICLE REGISTRY · ALL RIGHTS RESERVED
        </div>
      </footer>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent: string }) {
  const colors: Record<string,string> = {
    primary: "text-primary", secondary: "text-secondary", accent: "text-accent-foreground", destructive: "text-destructive"
  };
  return (
    <div className="rounded-xl bg-background/60 p-5 border border-border/60">
      <div className="text-xs uppercase tracking-wider text-muted-foreground font-mono">{label}</div>
      <div className={`mt-2 text-4xl font-bold font-display ${colors[accent]}`}>{value.toLocaleString()}</div>
    </div>
  );
}

const features = [
  { title: "Digital Registration", desc: "Register vehicles in minutes with digital records and verifiable identity.", icon: FileCheck2 },
  { title: "Ownership Tracking", desc: "Complete chain of ownership, append-only, audit-safe.", icon: ArrowRightLeft },
  { title: "Instant Verification", desc: "Anyone can verify a plate or chassis and see status in real time.", icon: Search },
  { title: "Secure Records", desc: "Row-level security, role-based access, and full audit trail.", icon: ShieldCheck },
  { title: "Incident Flagging", desc: "Report and flag stolen, wanted, or blacklisted vehicles.", icon: AlertTriangle },
  { title: "Admin Control", desc: "Role-based admin, officer, and viewer accounts with real permissions.", icon: Lock },
];

const steps = [
  { title: "Register", desc: "Officer captures owner + vehicle data in a guided form." },
  { title: "Issue Certificate", desc: "System generates certificate with QR code." },
  { title: "Public Verification", desc: "Anyone can search by plate or chassis." },
  { title: "Transfer & Audit", desc: "Ownership transfers logged forever." },
];
