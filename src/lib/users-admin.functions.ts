import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AppRole = "admin" | "officer" | "viewer";

export type ManagedUser = {
  id: string;
  email: string | null;
  full_name: string | null;
  roles: AppRole[];
  created_at: string | null;
  last_sign_in_at: string | null;
};

async function assertAdmin(context: any) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden: admin only");
}

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ManagedUser[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: authData, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (error) throw error;

    const users = authData.users;
    const ids = users.map((u) => u.id);
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id,full_name,email").in("id", ids),
      supabaseAdmin.from("user_roles").select("user_id,role").in("user_id", ids),
    ]);

    const pMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    return users.map((u) => ({
      id: u.id,
      email: u.email ?? pMap.get(u.id)?.email ?? null,
      full_name: pMap.get(u.id)?.full_name ?? (u.user_metadata as any)?.full_name ?? null,
      roles: (roles ?? [])
        .filter((r: any) => r.user_id === u.id)
        .map((r: any) => r.role as AppRole),
      created_at: u.created_at ?? null,
      last_sign_in_at: (u as any).last_sign_in_at ?? null,
    }));
  });

export const createUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string; password: string; full_name?: string; role: AppRole }) => {
    const email = String(input?.email ?? "").trim().toLowerCase();
    const password = String(input?.password ?? "");
    if (!email || !password) throw new Error("email and password are required");
    if (password.length < 8) throw new Error("password must be at least 8 characters");
    const role = (input?.role ?? "viewer") as AppRole;
    if (!["admin", "officer", "viewer"].includes(role)) throw new Error("invalid role");
    return { email, password, full_name: input?.full_name?.trim() || null, role };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name ?? data.email },
    });
    if (error) throw error;
    const uid = created.user!.id;

    await supabaseAdmin.from("profiles").upsert({
      id: uid,
      email: data.email,
      full_name: data.full_name ?? data.email,
    });
    await supabaseAdmin.from("user_roles").insert({ user_id: uid, role: data.role });
    return { ok: true, id: uid };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => ({ userId: String(input?.userId ?? "") }))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.userId === context.userId) throw new Error("You cannot delete your own account");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw error;
    return { ok: true };
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; role: AppRole }) => {
    const role = input?.role as AppRole;
    if (!["admin", "officer", "viewer"].includes(role)) throw new Error("invalid role");
    return { userId: String(input?.userId ?? ""), role };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: data.userId, role: data.role });
    if (error) throw error;
    return { ok: true };
  });

export const resetUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; password: string }) => {
    const password = String(input?.password ?? "");
    if (password.length < 8) throw new Error("password must be at least 8 characters");
    return { userId: String(input?.userId ?? ""), password };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.password,
    });
    if (error) throw error;
    return { ok: true };
  });
