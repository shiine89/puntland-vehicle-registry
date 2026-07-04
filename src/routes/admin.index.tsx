import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Car, Users, ArrowRightLeft, AlertTriangle, TrendingUp, Plus } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, LineChart, Line } from "recharts";

export const Route = createFileRoute("/admin/")({ component: Dashboard });

function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const [total, todayReg, active, sold, flagged, byType, vehicles, transfers] = await Promise.all([
        supabase.from("vehicles").select("*", { count: "exact", head: true }),
        supabase.from("vehicles").select("*", { count: "exact", head: true }).eq("registration_date", today),
        supabase.from("vehicles").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("vehicles").select("*", { count: "exact", head: true }).eq("status", "sold"),
        supabase.from("vehicles").select("*", { count: "exact", head: true }).or("blacklisted.eq.true,stolen.eq.true,wanted.eq.true"),
        supabase.from("vehicles").select("vehicle_type"),
        supabase.from("vehicles").select("registration_date"),
        supabase.from("ownership_history").select("transfer_date"),
      ]);
      // monthly registrations
      const monthly: Record<string, number> = {};
      (vehicles.data ?? []).forEach((v: any) => {
        const k = (v.registration_date ?? "").slice(0, 7);
        if (k) monthly[k] = (monthly[k] ?? 0) + 1;
      });
      const monthlyArr = Object.entries(monthly).sort().map(([month, count]) => ({ month, count }));
      // pie
      const typeCount: Record<string, number> = {};
      (byType.data ?? []).forEach((v: any) => typeCount[v.vehicle_type] = (typeCount[v.vehicle_type] ?? 0) + 1);
      const typeArr = Object.entries(typeCount).map(([name, value]) => ({ name, value }));
      // transfers over time
      const tByMonth: Record<string, number> = {};
      (transfers.data ?? []).forEach((t: any) => {
        const k = (t.transfer_date ?? "").slice(0, 7);
        if (k) tByMonth[k] = (tByMonth[k] ?? 0) + 1;
      });
      const transferArr = Object.entries(tByMonth).sort().map(([month, count]) => ({ month, count }));
      return {
        total: total.count ?? 0,
        today: todayReg.count ?? 0,
        active: active.count ?? 0,
        sold: sold.count ?? 0,
        flagged: flagged.count ?? 0,
        monthlyArr, typeArr, transferArr,
      };
    },
  });
}

const PIE_COLORS = ["#0057B8", "#008A5A", "#FFB400", "#DC2626", "#7C3AED", "#0891B2"];

function Dashboard() {
  const { data } = useDashboard();
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Live overview of the vehicle registry.</p>
        </div>
        <Link to="/admin/vehicles/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"><Plus className="h-4 w-4"/> Register Vehicle</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Kpi icon={Car} label="Total Vehicles" value={data?.total ?? 0} tone="primary"/>
        <Kpi icon={TrendingUp} label="Today" value={data?.today ?? 0} tone="secondary"/>
        <Kpi icon={ArrowRightLeft} label="Active" value={data?.active ?? 0} tone="secondary"/>
        <Kpi icon={Users} label="Sold" value={data?.sold ?? 0} tone="accent"/>
        <Kpi icon={AlertTriangle} label="Flagged" value={data?.flagged ?? 0} tone="destructive"/>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold">Monthly registrations</h2>
          <div className="h-64 mt-4">
            <ResponsiveContainer>
              <BarChart data={data?.monthlyArr ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
                <XAxis dataKey="month" tick={{ fontSize: 12 }}/>
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }}/>
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }}/>
                <Bar dataKey="count" fill="#0057B8" radius={[6,6,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold">By vehicle type</h2>
          <div className="h-64 mt-4">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data?.typeArr ?? []} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                  {(data?.typeArr ?? []).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold">Transfers over time</h2>
        <div className="h-56 mt-4">
          <ResponsiveContainer>
            <LineChart data={data?.transferArr ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
              <XAxis dataKey="month" tick={{ fontSize: 12 }}/>
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }}/>
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }}/>
              <Line type="monotone" dataKey="count" stroke="#008A5A" strokeWidth={2} dot={{ r: 3 }}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, tone }: any) {
  const toneMap: Record<string,string> = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/15 text-secondary",
    accent: "bg-accent/25 text-accent-foreground",
    destructive: "bg-destructive/10 text-destructive",
  };
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className={`h-9 w-9 rounded-md flex items-center justify-center ${toneMap[tone]}`}><Icon className="h-5 w-5"/></div>
      <div className="mt-3 text-xs uppercase tracking-wider text-muted-foreground font-mono">{label}</div>
      <div className="text-2xl font-bold mt-1">{value.toLocaleString()}</div>
    </div>
  );
}
