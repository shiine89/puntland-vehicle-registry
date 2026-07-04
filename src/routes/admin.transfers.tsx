import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRightLeft } from "lucide-react";

export const Route = createFileRoute("/admin/transfers")({ component: Transfers });

function Transfers() {
  const { data } = useQuery({
    queryKey: ["transfers"],
    queryFn: async () => (await supabase.from("ownership_history").select("*, vehicle:vehicles(plate_number, model, manufacturer), owner:owners(full_name)").order("transfer_date", { ascending: false }).limit(200)).data ?? [],
  });
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Ownership transfers</h1>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground font-mono">
            <tr>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Plate</th>
              <th className="text-left px-4 py-3">Vehicle</th>
              <th className="text-left px-4 py-3">Owner</th>
              <th className="text-left px-4 py-3">Reason</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((t: any) => (
              <tr key={t.id} className="border-t border-border">
                <td className="px-4 py-3 text-muted-foreground">{t.transfer_date}</td>
                <td className="px-4 py-3">
                  <Link to="/admin/vehicles/$id" params={{ id: t.vehicle_id }} className="font-mono font-medium text-primary hover:underline">{t.vehicle?.plate_number}</Link>
                </td>
                <td className="px-4 py-3">{t.vehicle?.manufacturer} {t.vehicle?.model}</td>
                <td className="px-4 py-3">{t.owner?.full_name}</td>
                <td className="px-4 py-3 text-muted-foreground">{t.reason}</td>
              </tr>
            ))}
            {(!data || data.length === 0) && <tr><td colSpan={5} className="text-center py-10 text-muted-foreground"><ArrowRightLeft className="h-8 w-8 mx-auto mb-2"/>No transfers yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
