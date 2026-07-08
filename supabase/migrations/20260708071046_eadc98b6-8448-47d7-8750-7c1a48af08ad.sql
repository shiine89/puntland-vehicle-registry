
DROP FUNCTION IF EXISTS public.public_search_vehicles(text);

CREATE OR REPLACE FUNCTION public.public_search_vehicles(q text)
 RETURNS TABLE(id uuid, plate_number text, vehicle_type text, manufacturer text, model text, year integer, color text, chassis_number text, engine_number text, vin text, registration_date date, status text, blacklisted boolean, stolen boolean, wanted boolean, recovered boolean, owner_name text, owner_phone text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT v.id, v.plate_number, v.vehicle_type, v.manufacturer, v.model, v.year,
         v.color, v.chassis_number, v.engine_number, v.vin, v.registration_date,
         v.status, v.blacklisted, v.stolen, v.wanted, v.recovered,
         o.full_name AS owner_name,
         o.phone     AS owner_phone
  FROM public.vehicles v
  LEFT JOIN public.owners o ON o.id = v.current_owner_id
  WHERE q IS NOT NULL AND length(trim(q)) > 0 AND (
    v.plate_number     ILIKE '%' || q || '%'
    OR v.chassis_number ILIKE '%' || q || '%'
    OR coalesce(v.vin,'')            ILIKE '%' || q || '%'
    OR coalesce(v.engine_number,'')  ILIKE '%' || q || '%'
    OR coalesce(v.manufacturer,'')   ILIKE '%' || q || '%'
    OR coalesce(v.model,'')          ILIKE '%' || q || '%'
    OR coalesce(v.color,'')          ILIKE '%' || q || '%'
    OR v.vehicle_type ILIKE '%' || q || '%'
    OR coalesce(o.full_name,'') ILIKE '%' || q || '%'
    OR coalesce(o.phone,'')     ILIKE '%' || q || '%'
  )
  ORDER BY v.registration_date DESC
  LIMIT 25
$function$;
