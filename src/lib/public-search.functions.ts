import { createServerFn } from "@tanstack/react-start";

export type PublicVehicle = {
  id: string;
  plate_number: string;
  vehicle_type: string;
  manufacturer: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  chassis_number: string;
  engine_number: string | null;
  vin: string | null;
  registration_date: string;
  status: string;
  blacklisted: boolean | null;
  stolen: boolean | null;
  wanted: boolean | null;
  recovered: boolean | null;
};

export type PublicStats = {
  vehicles: number;
  owners: number;
  transfers: number;
  flagged: number;
};


export const publicSearchVehicles = createServerFn({ method: "POST" })
  .inputValidator((input: { q: string }) => ({ q: String(input?.q ?? "").trim() }))
  .handler(async ({ data }): Promise<PublicVehicle[]> => {
    if (!data.q) return [];
    const { createClient } = await import("@supabase/supabase-js");
    const client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    });
    const { data: rows, error } = await client.rpc("public_search_vehicles", { q: data.q });
    if (error) {
      console.error("[publicSearchVehicles] rpc error", error);
      return [];
    }
    return (rows ?? []) as PublicVehicle[];
  });

export const publicRegistryStats = createServerFn({ method: "GET" })
  .handler(async (): Promise<PublicStats> => {
    const { createClient } = await import("@supabase/supabase-js");
    const client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    });
    const { data, error } = await client.rpc("public_registry_stats");
    if (error || !data || !data[0]) {
      if (error) console.error("[publicRegistryStats] rpc error", error);
      return { vehicles: 0, owners: 0, transfers: 0, flagged: 0 };
    }
    const r = data[0] as { vehicles: number; owners: number; transfers: number; flagged: number };
    return {
      vehicles: Number(r.vehicles) || 0,
      owners: Number(r.owners) || 0,
      transfers: Number(r.transfers) || 0,
      flagged: Number(r.flagged) || 0,
    };
  });
