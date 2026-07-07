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

const VEHICLE_COLS =
  "id,plate_number,vehicle_type,manufacturer,model,year,color,chassis_number,engine_number,vin,registration_date,status,blacklisted,stolen,wanted,recovered";

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

    const { data: rows } = await supabaseAdmin
      .from("vehicles")
      .select(VEHICLE_COLS)
      .or(orFilter)
      .limit(25);

    return (rows ?? []).map((v: any) => ({
      id: v.id,
      plate_number: v.plate_number,
      vehicle_type: v.vehicle_type,
      manufacturer: v.manufacturer,
      model: v.model,
      year: v.year,
      color: v.color,
      chassis_number: v.chassis_number,
      engine_number: v.engine_number,
      vin: v.vin,
      registration_date: v.registration_date,
      status: v.status,
      blacklisted: v.blacklisted,
      stolen: v.stolen,
      wanted: v.wanted,
      recovered: v.recovered,
    }));
  });
