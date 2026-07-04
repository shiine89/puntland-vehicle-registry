
CREATE POLICY "vehicle-files auth read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'vehicle-files');
CREATE POLICY "vehicle-files staff insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'vehicle-files' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'officer')));
CREATE POLICY "vehicle-files staff update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'vehicle-files' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'officer')));
