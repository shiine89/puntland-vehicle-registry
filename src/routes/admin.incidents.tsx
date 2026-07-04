import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/admin/incidents")({ component: Incidents });

function Incidents() {
  const { data } = useQuery({
    queryKey: ["incidents"],
    queryFn: async () => (await supabase.from("incidents").select("*, vehicle:vehicles(plate_number, model, manufacturer)").order("reported_date", { ascending: false })).data ?? [],
  });
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Incidents</h1>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground font-mono">
            <tr>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Plate</th>
              <th className="text-left px-4 py-3">Type</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Description</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((i: any) => (
              <tr key={i.id} className="border-t border-border">
                <td className="px-4 py-3 text-muted-foreground">{i.reported_date}</td>
                <td className="px-4 py-3">
                  <Link to="/admin/vehicles/$id" params={{ id: i.vehicle_id }} className="font-mono font-medium text-primary hover:underline">{i.vehicle?.plate_number}</Link>
                </td>
                <td className="px-4 py-3">{i.incident_type}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${i.status === "open" ? "bg-destructive/10 text-destructive" : "bg-secondary/15 text-secondary"}`}>{i.status}</span></td>
                <td className="px-4 py-3 text-muted-foreground max-w-md truncate">{i.description}</td>
              </tr>
            ))}
            {(!data || data.length === 0) && <tr><td colSpan={5} className="text-center py-10 text-muted-foreground"><AlertTriangle className="h-8 w-8 mx-auto mb-2"/>No incidents.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
