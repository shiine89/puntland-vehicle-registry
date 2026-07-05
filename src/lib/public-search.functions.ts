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
  registration_date: string;
  status: string;
  blacklisted: boolean | null;
  stolen: boolean | null;
  wanted: boolean | null;
  recovered: boolean | null;
  owner: { full_name: string; district: string | null } | null;
  incidents: { id: string; incident_type: string; status: string; description: string | null; reported_date: string }[];
  history: { id: string; transfer_date: string; reason: string | null; owner: { full_name: string } | null }[];
};

const VEHICLE_COLS =
  "id,plate_number,vehicle_type,manufacturer,model,year,color,chassis_number,engine_number,registration_date,status,blacklisted,stolen,wanted,recovered,current_owner_id";

export const publicSearchVehicles = createServerFn({ method: "POST" })
  .inputValidator((input: { q: string }) => ({ q: String(input?.q ?? "").trim() }))
  .handler(async ({ data }): Promise<PublicVehicle[]> => {
    const q = data.q;
    if (!q) return [];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const term = q.toUpperCase();

    // 1) Try plate / chassis / VIN
    let { data: vehicles } = await supabaseAdmin
      .from("vehicles")
      .select(VEHICLE_COLS)
      .or(`plate_number.ilike.%${term}%,chassis_number.ilike.%${term}%,vin.ilike.%${term}%`)
      .limit(10);

    // 2) Fallback: search by owner name
    if (!vehicles || vehicles.length === 0) {
      const { data: owners } = await supabaseAdmin
        .from("owners")
        .select("id")
        .ilike("full_name", `%${q}%`)
        .limit(20);
      const ids = (owners ?? []).map((o) => o.id);
      if (ids.length) {
        const { data: byO } = await supabaseAdmin
          .from("vehicles")
          .select(VEHICLE_COLS)
          .in("current_owner_id", ids);
        vehicles = byO ?? [];
      } else {
        vehicles = [];
      }
    }

    if (!vehicles || vehicles.length === 0) return [];

    const vehicleIds = vehicles.map((v: any) => v.id);
    const ownerIds = Array.from(
      new Set(vehicles.map((v: any) => v.current_owner_id).filter(Boolean)),
    ) as string[];

    const [{ data: owners }, { data: incidents }, { data: history }] = await Promise.all([
      ownerIds.length
        ? supabaseAdmin.from("owners").select("id,full_name,district").in("id", ownerIds)
        : Promise.resolve({ data: [] as any[] }),
      supabaseAdmin
        .from("incidents")
        .select("id,vehicle_id,incident_type,status,description,reported_date")
        .in("vehicle_id", vehicleIds),
      supabaseAdmin
        .from("ownership_history")
        .select("id,vehicle_id,owner_id,transfer_date,reason")
        .in("vehicle_id", vehicleIds)
        .order("transfer_date", { ascending: false }),
    ]);

    // Fetch owner names referenced by history
    const historyOwnerIds = Array.from(
      new Set((history ?? []).map((h: any) => h.owner_id).filter(Boolean)),
    ) as string[];
    const { data: histOwners } = historyOwnerIds.length
      ? await supabaseAdmin.from("owners").select("id,full_name").in("id", historyOwnerIds)
      : { data: [] as any[] };

    const ownerMap = new Map((owners ?? []).map((o: any) => [o.id, o]));
    const histOwnerMap = new Map((histOwners ?? []).map((o: any) => [o.id, o]));

    return vehicles.map((v: any) => ({
      id: v.id,
      plate_number: v.plate_number,
      vehicle_type: v.vehicle_type,
      manufacturer: v.manufacturer,
      model: v.model,
      year: v.year,
      color: v.color,
      chassis_number: v.chassis_number,
      engine_number: v.engine_number,
      registration_date: v.registration_date,
      status: v.status,
      blacklisted: v.blacklisted,
      stolen: v.stolen,
      wanted: v.wanted,
      recovered: v.recovered,
      owner: v.current_owner_id
        ? {
            full_name: ownerMap.get(v.current_owner_id)?.full_name ?? "—",
            district: ownerMap.get(v.current_owner_id)?.district ?? null,
          }
        : null,
      incidents: (incidents ?? [])
        .filter((i: any) => i.vehicle_id === v.id)
        .map((i: any) => ({
          id: i.id,
          incident_type: i.incident_type,
          status: i.status,
          description: i.description,
          reported_date: i.reported_date,
        })),
      history: (history ?? [])
        .filter((h: any) => h.vehicle_id === v.id)
        .map((h: any) => ({
          id: h.id,
          transfer_date: h.transfer_date,
          reason: h.reason,
          owner: h.owner_id ? { full_name: histOwnerMap.get(h.owner_id)?.full_name ?? "—" } : null,
        })),
    }));
  });
