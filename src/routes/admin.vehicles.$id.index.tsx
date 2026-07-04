import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRightLeft, Download, FileText, QrCode, ChevronLeft, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/admin/vehicles/$id/")({ component: VehicleDetail });

function VehicleDetail() {
  const { id } = Route.useParams();
  const { isAdmin } = useAuth();
  const nav = useNavigate();
  const { data: v, refetch } = useQuery({
    queryKey: ["vehicle", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("vehicles")
        .select("*, owner:owners!vehicles_current_owner_id_fkey(*), incidents(*), history:ownership_history(*, owner:owners(*))")
        .eq("id", id).single();
      return data;
    },
  });
  const [qr, setQr] = useState<string>("");
  const verifyUrl = typeof window !== "undefined" ? `${window.location.origin}/search?q=${v?.plate_number ?? ""}` : "";

  useEffect(() => {
    if (v?.plate_number) QRCode.toDataURL(verifyUrl, { width: 300, margin: 1 }).then(setQr);
  }, [v?.plate_number, verifyUrl]);

  async function issueCert() {
    if (!v) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    doc.setFillColor(0, 87, 184); doc.rect(0, 0, 595, 60, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(16); doc.setFont("helvetica","bold");
    doc.text("GOVERNMENT OF PUNTLAND · MINISTRY OF TRANSPORTATION", 30, 38);
    doc.setTextColor(20, 20, 20); doc.setFont("helvetica","bold"); doc.setFontSize(22);
    doc.text("VEHICLE REGISTRATION CERTIFICATE", 297.5, 100, { align: "center" });
    doc.setLineWidth(1); doc.rect(30, 130, 535, 640);
    doc.setFontSize(11); doc.setFont("helvetica","normal");
    let y = 170;
    const line = (k: string, val: string) => {
      doc.setFont("helvetica","bold"); doc.text(k, 60, y);
      doc.setFont("helvetica","normal"); doc.text(String(val || "—"), 220, y);
      y += 26;
    };
    doc.setFontSize(13); doc.setFont("helvetica","bold"); doc.text("VEHICLE INFORMATION", 60, y); y += 24;
    doc.setFontSize(11);
    line("Plate Number:", v.plate_number);
    line("Chassis Number:", v.chassis_number);
    line("Engine Number:", v.engine_number ?? "—");
    line("Type:", v.vehicle_type);
    line("Manufacturer:", `${v.manufacturer ?? ""} ${v.model ?? ""}`);
    line("Year / Color:", `${v.year ?? "—"} / ${v.color ?? "—"}`);
    y += 10;
    doc.setFontSize(13); doc.setFont("helvetica","bold"); doc.text("REGISTERED OWNER", 60, y); y += 24;
    doc.setFontSize(11);
    line("Name:", v.owner?.full_name ?? "—");
    line("Phone:", v.owner?.phone ?? "—");
    line("District:", v.owner?.district ?? "—");
    line("Address:", v.owner?.address ?? "—");
    y += 10;
    doc.setFontSize(13); doc.setFont("helvetica","bold"); doc.text("VALIDITY", 60, y); y += 24;
    doc.setFontSize(11);
    line("Registered:", v.registration_date);
    line("Expiry:", v.expiry_date ?? "—");
    line("Status:", (v.status ?? "active").toUpperCase());
    if (qr) doc.addImage(qr, "PNG", 420, 560, 130, 130);
    doc.setFontSize(9); doc.setTextColor(80,80,80);
    doc.text(`Verify at ${verifyUrl}`, 30, 790);
    doc.text(`Issued ${new Date().toISOString()}`, 30, 805);
    doc.save(`registration-${v.plate_number}.pdf`);
    await logAudit("certificate_issued", "vehicles", v.id);
    toast.success("Certificate downloaded");
  }

  async function del() {
    if (!confirm(`Delete ${v?.plate_number}?`)) return;
    const { error } = await supabase.from("vehicles").delete().eq("id", id);
    if (error) return toast.error(error.message);
    await logAudit("delete", "vehicles", id);
    nav({ to: "/admin/vehicles" });
  }

  if (!v) return <div className="p-8">Loading…</div>;

  return (
    <div className="p-8 space-y-6 max-w-6xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link to="/admin/vehicles" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ChevronLeft className="h-4 w-4"/> Vehicles</Link>
          <h1 className="mt-1 text-3xl font-bold font-mono">{v.plate_number}</h1>
          <p className="text-sm text-muted-foreground">{v.year} {v.manufacturer} {v.model} · {v.color}</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <button onClick={issueCert} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium"><FileText className="h-4 w-4"/> Issue certificate</button>
          <Link to="/admin/vehicles/$id/transfer" params={{ id }} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-secondary text-secondary-foreground text-sm font-medium"><ArrowRightLeft className="h-4 w-4"/> Transfer</Link>
          {isAdmin && <button onClick={del} className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-destructive/50 text-destructive text-sm"><Trash2 className="h-4 w-4"/> Delete</button>}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Vehicle information">
            <KVGrid data={[
              ["Type", v.vehicle_type], ["Manufacturer", v.manufacturer], ["Model", v.model], ["Year", v.year],
              ["Color", v.color], ["Fuel", v.fuel_type], ["Transmission", v.transmission], ["Drive", v.drive_type],
              ["Chassis", <span className="font-mono">{v.chassis_number}</span>], ["Engine", <span className="font-mono">{v.engine_number}</span>],
              ["VIN", <span className="font-mono">{v.vin ?? "—"}</span>], ["Engine capacity", v.engine_capacity],
            ]}/>
          </Card>
          <Card title="Current owner">
            {v.owner ? (
              <KVGrid data={[
                ["Full name", v.owner.full_name], ["National ID", v.owner.national_id],
                ["Phone", v.owner.phone], ["Email", v.owner.email],
                ["District", v.owner.district], ["Address", v.owner.address],
              ]}/>
            ) : <p className="text-sm text-muted-foreground">No owner assigned.</p>}
          </Card>
          <Card title="Ownership history">
            <ol className="border-l-2 border-border ml-2 space-y-4">
              {(v.history ?? []).sort((a: any, b: any) => a.transfer_date < b.transfer_date ? 1 : -1).map((h: any) => (
                <li key={h.id} className="pl-4 relative">
                  <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-primary"/>
                  <div className="text-sm font-medium">{h.owner?.full_name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{h.transfer_date} · {h.reason ?? "—"}</div>
                </li>
              ))}
            </ol>
          </Card>
          <Card title="Incidents">
            {v.incidents?.length ? (
              <ul className="space-y-2">
                {v.incidents.map((i: any) => (
                  <li key={i.id} className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                    <div className="font-medium text-sm">{i.incident_type} · <span className="text-xs">{i.status}</span></div>
                    <div className="text-xs text-muted-foreground mt-1">{i.description}</div>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No incidents reported.</p>}
          </Card>
        </div>
        <div className="space-y-6">
          <Card title="Verification QR">
            {qr ? <img src={qr} alt="QR" className="w-full rounded-md border border-border"/> : <div className="h-48 flex items-center justify-center text-muted-foreground"><QrCode className="h-6 w-6"/></div>}
            <p className="mt-3 text-xs text-muted-foreground break-all">{verifyUrl}</p>
          </Card>
          <Card title="Status flags">
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                ["Roadworthy", v.roadworthy], ["Tax paid", v.tax_paid],
                ["Police clearance", v.police_clearance], ["Customs", v.customs_clearance],
                ["Blacklisted", v.blacklisted, true], ["Stolen", v.stolen, true],
                ["Recovered", v.recovered], ["Wanted", v.wanted, true],
              ].map(([k, val, warn]: any) => (
                <div key={k} className={`flex justify-between p-2 rounded ${val ? (warn ? "bg-destructive/10 text-destructive" : "bg-secondary/10 text-secondary") : "bg-muted"}`}>
                  <span>{k}</span><span className="font-mono text-xs">{val ? "YES" : "NO"}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

const Card = ({ title, children }: any) => (
  <div className="rounded-xl border border-border bg-card p-5">
    <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">{title}</h3>
    {children}
  </div>
);
const KVGrid = ({ data }: { data: [string, any][] }) => (
  <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
    {data.map(([k, v]) => (
      <div key={k} className="flex justify-between border-b border-border/40 py-1.5">
        <dt className="text-muted-foreground">{k}</dt><dd className="font-medium text-right">{v || "—"}</dd>
      </div>
    ))}
  </dl>
);
