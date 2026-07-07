
-- Public RPC: aggregate stats (counts only, no row exposure)
CREATE OR REPLACE FUNCTION public.public_registry_stats()
RETURNS TABLE(vehicles bigint, owners bigint, transfers bigint, flagged bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT count(*) FROM public.vehicles),
    (SELECT count(*) FROM public.owners),
    (SELECT count(*) FROM public.ownership_history),
    (SELECT count(*) FROM public.vehicles WHERE blacklisted = true OR stolen = true OR wanted = true)
$$;

GRANT EXECUTE ON FUNCTION public.public_registry_stats() TO anon, authenticated;

-- Public RPC: search vehicles (safe columns only, no owner PII)
CREATE OR REPLACE FUNCTION public.public_search_vehicles(q text)
RETURNS TABLE(
  id uuid,
  plate_number text,
  vehicle_type text,
  manufacturer text,
  model text,
  year int,
  color text,
  chassis_number text,
  engine_number text,
  vin text,
  registration_date date,
  status text,
  blacklisted boolean,
  stolen boolean,
  wanted boolean,
  recovered boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT v.id, v.plate_number, v.vehicle_type, v.manufacturer, v.model, v.year,
         v.color, v.chassis_number, v.engine_number, v.vin, v.registration_date,
         v.status, v.blacklisted, v.stolen, v.wanted, v.recovered
  FROM public.vehicles v
  WHERE q IS NOT NULL AND length(trim(q)) > 0 AND (
    v.plate_number     ILIKE '%' || q || '%'
    OR v.chassis_number ILIKE '%' || q || '%'
    OR coalesce(v.vin,'')            ILIKE '%' || q || '%'
    OR coalesce(v.engine_number,'')  ILIKE '%' || q || '%'
    OR coalesce(v.manufacturer,'')   ILIKE '%' || q || '%'
    OR coalesce(v.model,'')          ILIKE '%' || q || '%'
    OR coalesce(v.color,'')          ILIKE '%' || q || '%'
    OR v.vehicle_type ILIKE '%' || q || '%'
    OR EXISTS (
      SELECT 1 FROM public.owners o
      WHERE o.id = v.current_owner_id
        AND (o.full_name ILIKE '%' || q || '%' OR coalesce(o.phone,'') ILIKE '%' || q || '%')
    )
  )
  ORDER BY v.registration_date DESC
  LIMIT 25
$$;

GRANT EXECUTE ON FUNCTION public.public_search_vehicles(text) TO anon, authenticated;
