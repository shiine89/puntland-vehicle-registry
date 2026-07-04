import { supabase } from "@/integrations/supabase/client";

export async function logAudit(action: string, table_name: string, record_id?: string, old_data?: any, new_data?: any) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;
  await supabase.from("audit_logs").insert({
    user_id: u.user.id,
    user_email: u.user.email,
    action,
    table_name,
    record_id: record_id ?? null,
    old_data: old_data ?? null,
    new_data: new_data ?? null,
  });
}
