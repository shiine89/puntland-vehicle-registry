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
  "id,plate_number,vehicle_type,manufacturer,model,year,color,chassis_number,engine_number,vin,registration_date,status,blacklisted,stolen,wanted,recovered,current_owner_id";

// Escape PostgREST reserved chars in ilike patterns
function esc(s: string) {
  return s.replace(/[,()%*]/g, " ").trim();
}

export const publicSearchVehicles = createServerFn({ method: "POST" })
  .inputValidator((input: { q: string }) => ({ q: String(input?.q ?? "").trim() }))
  .handler(async ({ data }): Promise<PublicVehicle[]> => {
    const raw = data.q;
    if (!raw) return [];
    const q = esc(raw);
    if (!q) return [];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const pat = `%${q}%`;
    // Broad fuzzy search across vehicle fields (ilike is case-insensitive)
    const orFilter = [
      `plate_number.ilike.${pat}`,
      `chassis_number.ilike.${pat}`,
      `vin.ilike.${pat}`,
      `engine_number.ilike.${pat}`,
      `manufacturer.ilike.${pat}`,
      `model.ilike.${pat}`,
      `color.ilike.${pat}`,
      `vehicle_type.ilike.${pat}`,
    ].join(",");

    const collected = new Map<string, any>();

    const { data: byField } = await supabaseAdmin
      .from("vehicles")
      .select(VEHICLE_COLS)
      .or(orFilter)
      .limit(25);
    (byField ?? []).forEach((v: any) => collected.set(v.id, v));

    // Also search by owner name / phone / national id
    const { data: owners } = await supabaseAdmin
      .from("owners")
      .select("id")
      .or(`full_name.ilike.${pat},phone.ilike.${pat},national_id.ilike.${pat}`)
      .limit(50);
    const ownerIds = (owners ?? []).map((o: any) => o.id);
    if (ownerIds.length) {
      const { data: byO } = await supabaseAdmin
        .from("vehicles")
        .select(VEHICLE_COLS)
        .in("current_owner_id", ownerIds)
        .limit(25);
      (byO ?? []).forEach((v: any) => collected.set(v.id, v));
    }

    const vehicles = Array.from(collected.values());
    if (vehicles.length === 0) return [];

    const vehicleIds = vehicles.map((v: any) => v.id);
    const currentOwnerIds = Array.from(
      new Set(vehicles.map((v: any) => v.current_owner_id).filter(Boolean)),
    ) as string[];

    const [ownersRes, incidentsRes, historyRes] = await Promise.all([
      currentOwnerIds.length
        ? supabaseAdmin.from("owners").select("id,full_name,district").in("id", currentOwnerIds)
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
    const ownersData = ownersRes.data ?? [];
    const incidents = incidentsRes.data ?? [];
    const history = historyRes.data ?? [];

    const historyOwnerIds = Array.from(
      new Set(history.map((h: any) => h.owner_id).filter(Boolean)),
    ) as string[];
    const { data: histOwners } = historyOwnerIds.length
      ? await supabaseAdmin.from("owners").select("id,full_name").in("id", historyOwnerIds)
      : { data: [] as any[] };

    const ownerMap = new Map((ownersData ?? []).map((o: any) => [o.id, o]));
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
      incidents: incidents
        .filter((i: any) => i.vehicle_id === v.id)
        .map((i: any) => ({
          id: i.id,
          incident_type: i.incident_type,
          status: i.status,
          description: i.description,
          reported_date: i.reported_date,
        })),
      history: history
        .filter((h: any) => h.vehicle_id === v.id)
        .map((h: any) => ({
          id: h.id,
          transfer_date: h.transfer_date,
          reason: h.reason,
          owner: h.owner_id ? { full_name: histOwnerMap.get(h.owner_id)?.full_name ?? "—" } : null,
        })),
    }));
  });
