import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

export const Route = createFileRoute("/admin/audit")({ component: Audit });

function Audit() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const { data } = useQuery({
    queryKey: ["audit"],
    queryFn: async () => (await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(500)).data ?? [],
  });
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Audit log</h1>
      <p className="text-sm text-muted-foreground">Every sensitive action leaves a trace.</p>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground font-mono">
            <tr>
              <th className="text-left px-4 py-3">When</th>
              <th className="text-left px-4 py-3">User</th>
              <th className="text-left px-4 py-3">Action</th>
              <th className="text-left px-4 py-3">Table</th>
              <th className="text-left px-4 py-3">Record</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((r: any) => (
              <>
                <tr key={r.id} className="border-t border-border cursor-pointer hover:bg-muted/30" onClick={()=>setExpanded(expanded === r.id ? null : r.id)}>
                  <td className="px-4 py-3 font-mono text-xs">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">{r.user_email ?? "—"}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">{r.action}</span></td>
                  <td className="px-4 py-3">{r.table_name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.record_id ?? "—"}</td>
                </tr>
                {expanded === r.id && (
                  <tr className="bg-muted/30 border-t border-border">
                    <td colSpan={5} className="px-6 py-4">
                      <div className="grid md:grid-cols-2 gap-4 text-xs">
                        <div>
                          <div className="font-mono uppercase text-muted-foreground mb-1">Before</div>
                          <pre className="p-3 bg-background rounded border border-border overflow-x-auto">{JSON.stringify(r.old_data, null, 2)}</pre>
                        </div>
                        <div>
                          <div className="font-mono uppercase text-muted-foreground mb-1">After</div>
                          <pre className="p-3 bg-background rounded border border-border overflow-x-auto">{JSON.stringify(r.new_data, null, 2)}</pre>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {(!data || data.length === 0) && <tr><td colSpan={5} className="text-center py-10 text-muted-foreground">No audit entries yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
