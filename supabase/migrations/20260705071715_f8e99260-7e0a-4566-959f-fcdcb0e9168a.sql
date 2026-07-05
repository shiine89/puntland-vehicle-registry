
DROP POLICY IF EXISTS "inc public read" ON public.incidents;
DROP POLICY IF EXISTS "owners public read" ON public.owners;
DROP POLICY IF EXISTS "hist public read" ON public.ownership_history;
DROP POLICY IF EXISTS "vehicles public read" ON public.vehicles;
DROP POLICY IF EXISTS "imgs public read" ON public.vehicle_images;

REVOKE SELECT ON public.incidents FROM anon;
REVOKE SELECT ON public.owners FROM anon;
REVOKE SELECT ON public.ownership_history FROM anon;
REVOKE SELECT ON public.vehicles FROM anon;
REVOKE SELECT ON public.vehicle_images FROM anon;

CREATE POLICY "docs delete admin" ON public.vehicle_documents
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
