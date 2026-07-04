import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import { useState } from "react";

export const Route = createFileRoute("/admin/reports")({ component: Reports });

function Reports() {
  const [from, setFrom] = useState(new Date(Date.now() - 30*86400000).toISOString().slice(0,10));
  const [to, setTo] = useState(new Date().toISOString().slice(0,10));

  const { data: stats } = useQuery({
    queryKey: ["report-stats", from, to],
    queryFn: async () => {
      const [v, t, i] = await Promise.all([
        supabase.from("vehicles").select("*", { count: "exact", head: true }).gte("registration_date", from).lte("registration_date", to),
        supabase.from("ownership_history").select("*", { count: "exact", head: true }).gte("transfer_date", from).lte("transfer_date", to),
        supabase.from("incidents").select("*", { count: "exact", head: true }).gte("reported_date", from).lte("reported_date", to),
      ]);
      return { vehicles: v.count ?? 0, transfers: t.count ?? 0, incidents: i.count ?? 0 };
    },
  });

  async function exportCsv(kind: "vehicles"|"transfers"|"incidents") {
    let rows: any[] = [];
    if (kind === "vehicles") {
      const { data } = await supabase.from("vehicles").select("plate_number, chassis_number, vehicle_type, manufacturer, model, year, color, status, registration_date").gte("registration_date", from).lte("registration_date", to);
      rows = data ?? [];
    } else if (kind === "transfers") {
      const { data } = await supabase.from("ownership_history").select("vehicle_id, owner_id, reason, transfer_date").gte("transfer_date", from).lte("transfer_date", to);
      rows = data ?? [];
    } else {
      const { data } = await supabase.from("incidents").select("vehicle_id, incident_type, description, status, reported_date").gte("reported_date", from).lte("reported_date", to);
      rows = data ?? [];
    }
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, kind);
    XLSX.writeFile(wb, `${kind}-${from}-to-${to}.xlsx`);
  }

  function exportSummary() {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    doc.setFillColor(0,87,184); doc.rect(0,0,595,50,"F");
    doc.setTextColor(255,255,255); doc.setFontSize(14); doc.setFont("helvetica","bold");
    doc.text("Puntland Vehicle Registry — Summary Report", 30, 32);
    doc.setTextColor(20,20,20); doc.setFontSize(11); doc.setFont("helvetica","normal");
    doc.text(`Period: ${from} to ${to}`, 30, 80);
    doc.setFontSize(13); doc.setFont("helvetica","bold"); doc.text("KEY METRICS", 30, 120);
    doc.setFontSize(11); doc.setFont("helvetica","normal");
    doc.text(`Registrations: ${stats?.vehicles ?? 0}`, 30, 148);
    doc.text(`Ownership transfers: ${stats?.transfers ?? 0}`, 30, 168);
    doc.text(`Incidents reported: ${stats?.incidents ?? 0}`, 30, 188);
    doc.setFontSize(9); doc.setTextColor(80,80,80);
    doc.text(`Generated ${new Date().toISOString()}`, 30, 800);
    doc.save(`registry-summary-${from}-${to}.pdf`);
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>
      <div className="rounded-xl border border-border bg-card p-5 flex flex-wrap items-end gap-4">
        <div>
          <label className="text-xs font-mono uppercase text-muted-foreground">From</label>
          <input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="mt-1 block h-10 rounded-md border border-border bg-background px-3"/>
        </div>
        <div>
          <label className="text-xs font-mono uppercase text-muted-foreground">To</label>
          <input type="date" value={to} onChange={e=>setTo(e.target.value)} className="mt-1 block h-10 rounded-md border border-border bg-background px-3"/>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Metric label="Registrations" value={stats?.vehicles ?? 0}/>
        <Metric label="Transfers" value={stats?.transfers ?? 0}/>
        <Metric label="Incidents" value={stats?.incidents ?? 0}/>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-4">Exports</h2>
        <div className="flex flex-wrap gap-2">
          <ExportBtn onClick={()=>exportCsv("vehicles")} label="Vehicles (Excel)"/>
          <ExportBtn onClick={()=>exportCsv("transfers")} label="Transfers (Excel)"/>
          <ExportBtn onClick={()=>exportCsv("incidents")} label="Incidents (Excel)"/>
          <button onClick={exportSummary} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium"><FileText className="h-4 w-4"/> Summary PDF</button>
        </div>
      </div>
    </div>
  );
}

const Metric = ({ label, value }: any) => (
  <div className="rounded-xl border border-border bg-card p-5">
    <div className="text-xs font-mono uppercase text-muted-foreground">{label}</div>
    <div className="text-3xl font-bold mt-2">{value.toLocaleString()}</div>
  </div>
);
const ExportBtn = ({ onClick, label }: any) => (
  <button onClick={onClick} className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm hover:bg-muted"><FileSpreadsheet className="h-4 w-4"/> {label}</button>
);
