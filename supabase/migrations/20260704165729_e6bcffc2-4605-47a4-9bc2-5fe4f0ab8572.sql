
-- Roles enum & user_roles
CREATE TYPE public.app_role AS ENUM ('admin','officer','viewer');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles self read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles self update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles self insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "user_roles self read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "user_roles admin manage" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Owners
CREATE TABLE public.owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  national_id TEXT,
  driving_license_number TEXT,
  gender TEXT,
  date_of_birth DATE,
  phone TEXT NOT NULL,
  alt_phone TEXT,
  email TEXT,
  occupation TEXT,
  address TEXT,
  district TEXT,
  city TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.owners TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.owners TO authenticated;
GRANT ALL ON public.owners TO service_role;
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners public read" ON public.owners FOR SELECT TO anon USING (true);
CREATE POLICY "owners auth read" ON public.owners FOR SELECT TO authenticated USING (true);
CREATE POLICY "owners insert staff" ON public.owners FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'officer'));
CREATE POLICY "owners update staff" ON public.owners FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'officer'));
CREATE POLICY "owners delete admin" ON public.owners FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Vehicles
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_number TEXT UNIQUE NOT NULL,
  chassis_number TEXT UNIQUE NOT NULL,
  engine_number TEXT,
  vehicle_type TEXT NOT NULL,
  manufacturer TEXT,
  model TEXT,
  year INT,
  color TEXT,
  fuel_type TEXT,
  transmission TEXT,
  drive_type TEXT,
  engine_capacity TEXT,
  horsepower TEXT,
  vin TEXT,
  odometer INT,
  import_country TEXT,
  purchase_date DATE,
  purchase_price NUMERIC,
  insurance_provider TEXT,
  inspection_date DATE,
  expiry_date DATE,
  roadworthy BOOLEAN DEFAULT false,
  tax_paid BOOLEAN DEFAULT false,
  police_clearance BOOLEAN DEFAULT false,
  customs_clearance BOOLEAN DEFAULT false,
  blacklisted BOOLEAN DEFAULT false,
  stolen BOOLEAN DEFAULT false,
  recovered BOOLEAN DEFAULT false,
  wanted BOOLEAN DEFAULT false,
  current_owner_id UUID REFERENCES public.owners(id),
  status TEXT NOT NULL DEFAULT 'active',
  registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.vehicles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT ALL ON public.vehicles TO service_role;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vehicles public read" ON public.vehicles FOR SELECT TO anon USING (true);
CREATE POLICY "vehicles auth read" ON public.vehicles FOR SELECT TO authenticated USING (true);
CREATE POLICY "vehicles insert staff" ON public.vehicles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'officer'));
CREATE POLICY "vehicles update staff" ON public.vehicles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'officer'));
CREATE POLICY "vehicles delete admin" ON public.vehicles FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Ownership history (append-only)
CREATE TABLE public.ownership_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.owners(id),
  transferred_by UUID REFERENCES auth.users(id),
  reason TEXT,
  transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ownership_history TO anon;
GRANT SELECT, INSERT ON public.ownership_history TO authenticated;
GRANT ALL ON public.ownership_history TO service_role;
ALTER TABLE public.ownership_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hist public read" ON public.ownership_history FOR SELECT TO anon USING (true);
CREATE POLICY "hist auth read" ON public.ownership_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "hist insert staff" ON public.ownership_history FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'officer'));

-- Incidents
CREATE TABLE public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  incident_type TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  reported_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.incidents TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.incidents TO authenticated;
GRANT ALL ON public.incidents TO service_role;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inc public read" ON public.incidents FOR SELECT TO anon USING (true);
CREATE POLICY "inc auth read" ON public.incidents FOR SELECT TO authenticated USING (true);
CREATE POLICY "inc insert staff" ON public.incidents FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'officer'));
CREATE POLICY "inc update staff" ON public.incidents FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'officer'));
CREATE POLICY "inc delete admin" ON public.incidents FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Vehicle documents & images
CREATE TABLE public.vehicle_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.vehicle_documents TO authenticated;
GRANT ALL ON public.vehicle_documents TO service_role;
ALTER TABLE public.vehicle_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "docs auth read" ON public.vehicle_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "docs staff write" ON public.vehicle_documents FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'officer'));
CREATE POLICY "docs staff update" ON public.vehicle_documents FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'officer'));

CREATE TABLE public.vehicle_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  image_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.vehicle_images TO anon;
GRANT SELECT, INSERT, UPDATE ON public.vehicle_images TO authenticated;
GRANT ALL ON public.vehicle_images TO service_role;
ALTER TABLE public.vehicle_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "imgs public read" ON public.vehicle_images FOR SELECT TO anon USING (true);
CREATE POLICY "imgs auth read" ON public.vehicle_images FOR SELECT TO authenticated USING (true);
CREATE POLICY "imgs staff write" ON public.vehicle_images FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'officer'));
CREATE POLICY "imgs staff update" ON public.vehicle_images FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'officer'));

-- Audit logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id TEXT,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit admin read" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "audit auth insert" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE INDEX ON public.vehicles (plate_number);
CREATE INDEX ON public.vehicles (chassis_number);
CREATE INDEX ON public.ownership_history (vehicle_id);
CREATE INDEX ON public.incidents (vehicle_id);
