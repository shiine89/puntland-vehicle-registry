import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { logAudit } from "@/lib/audit";
import { ChevronLeft, ChevronRight, Loader2, Save, User, Car, Scale, ShieldAlert, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/admin/vehicles/new")({ component: NewVehicle });

const vehicleTypes = ["Sedan","SUV","Pickup","Truck","Bus","Motorcycle","Van","Tanker","Trailer","Tractor"] as const;

const schema = z.object({
  // owner
  full_name: z.string().min(2, "Required").max(120),
  national_id: z.string().max(60).optional().or(z.literal("")),
  driving_license_number: z.string().optional().or(z.literal("")),
  gender: z.enum(["Male","Female","Other"]).optional(),
  date_of_birth: z.string().optional().or(z.literal("")),
  phone: z.string().min(6, "Phone required").max(30),
  alt_phone: z.string().max(30).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  occupation: z.string().optional().or(z.literal("")),
  address: z.string().min(2, "Required"),
  district: z.string().min(2, "Required"),
  city: z.string().optional().or(z.literal("")),
  emergency_contact_name: z.string().optional().or(z.literal("")),
  emergency_contact_phone: z.string().optional().or(z.literal("")),
  // vehicle
  vehicle_type: z.string().min(1, "Required"),
  vehicle_type_other: z.string().optional().or(z.literal("")),
  manufacturer: z.string().min(1, "Required"),
  model: z.string().min(1, "Required"),
  year: z.coerce.number().int().min(1950).max(2100),
  color: z.string().min(1, "Required"),
  fuel_type: z.string().optional().or(z.literal("")),
  transmission: z.string().optional().or(z.literal("")),
  drive_type: z.string().optional().or(z.literal("")),
  engine_number: z.string().min(1, "Required"),
  engine_capacity: z.string().optional().or(z.literal("")),
  horsepower: z.string().optional().or(z.literal("")),
  vin: z.string().optional().or(z.literal("")),
  chassis_number: z.string().min(4, "Required"),
  plate_number: z.string().min(2, "Required"),
  odometer: z.coerce.number().optional().or(z.nan()),
  import_country: z.string().optional().or(z.literal("")),
  purchase_date: z.string().optional().or(z.literal("")),
  purchase_price: z.coerce.number().optional().or(z.nan()),
  insurance_provider: z.string().optional().or(z.literal("")),
  inspection_date: z.string().optional().or(z.literal("")),
  // legal
  registration_date: z.string().min(1),
  expiry_date: z.string().optional().or(z.literal("")),
  roadworthy: z.boolean().default(false),
  tax_paid: z.boolean().default(false),
  police_clearance: z.boolean().default(false),
  customs_clearance: z.boolean().default(false),
  // security
  has_incident: z.enum(["yes","no"]).default("no"),
  incident_details: z.string().optional().or(z.literal("")),
  blacklisted: z.boolean().default(false),
  stolen: z.boolean().default(false),
  recovered: z.boolean().default(false),
  wanted: z.boolean().default(false),
}).superRefine((v, ctx) => {
  if (v.has_incident === "yes" && !v.incident_details) {
    ctx.addIssue({ code: "custom", path: ["incident_details"], message: "Please describe the incident." });
  }
  if (v.vehicle_type === "Other" && !v.vehicle_type_other) {
    ctx.addIssue({ code: "custom", path: ["vehicle_type_other"], message: "Specify vehicle type." });
  }
});

type FormData = z.infer<typeof schema>;

const steps = [
  { id: "owner", label: "Owner", icon: User },
  { id: "vehicle", label: "Vehicle", icon: Car },
  { id: "legal", label: "Legal", icon: Scale },
  { id: "security", label: "Security", icon: ShieldAlert },
  { id: "review", label: "Review", icon: CheckCircle2 },
];

function NewVehicle() {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const form = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      registration_date: new Date().toISOString().slice(0,10),
      has_incident: "no",
      roadworthy: true, tax_paid: false, police_clearance: false, customs_clearance: false,
      blacklisted: false, stolen: false, recovered: false, wanted: false,
      gender: "Male",
    },
  });
  const { register, handleSubmit, formState: { errors }, watch, trigger, setValue } = form;

  async function next() {
    const fields: Record<number, (keyof FormData)[]> = {
      0: ["full_name","phone","address","district"],
      1: ["vehicle_type","manufacturer","model","year","color","engine_number","chassis_number","plate_number"],
      2: ["registration_date"],
      3: ["has_incident","incident_details"],
    };
    const ok = await trigger(fields[step] as any);
    if (ok) setStep(Math.min(step+1, steps.length-1));
  }

  async function onSubmit(v: FormData) {
    setSaving(true);
    try {
      // insert owner
      const ownerPayload = {
        full_name: v.full_name, national_id: v.national_id || null, driving_license_number: v.driving_license_number || null,
        gender: v.gender || null, date_of_birth: v.date_of_birth || null, phone: v.phone, alt_phone: v.alt_phone || null,
        email: v.email || null, occupation: v.occupation || null, address: v.address, district: v.district, city: v.city || null,
        emergency_contact_name: v.emergency_contact_name || null, emergency_contact_phone: v.emergency_contact_phone || null,
      };
      const { data: owner, error: oErr } = await supabase.from("owners").insert(ownerPayload).select().single();
      if (oErr) throw oErr;

      const vt = v.vehicle_type === "Other" ? v.vehicle_type_other! : v.vehicle_type;
      const vPayload = {
        plate_number: v.plate_number.toUpperCase(), chassis_number: v.chassis_number.toUpperCase(),
        engine_number: v.engine_number.toUpperCase(), vehicle_type: vt, manufacturer: v.manufacturer, model: v.model,
        year: v.year, color: v.color, fuel_type: v.fuel_type || null, transmission: v.transmission || null,
        drive_type: v.drive_type || null, engine_capacity: v.engine_capacity || null, horsepower: v.horsepower || null,
        vin: v.vin || null, odometer: isNaN(v.odometer as any) ? null : v.odometer,
        import_country: v.import_country || null, purchase_date: v.purchase_date || null,
        purchase_price: isNaN(v.purchase_price as any) ? null : v.purchase_price,
        insurance_provider: v.insurance_provider || null, inspection_date: v.inspection_date || null,
        expiry_date: v.expiry_date || null, roadworthy: v.roadworthy, tax_paid: v.tax_paid,
        police_clearance: v.police_clearance, customs_clearance: v.customs_clearance,
        blacklisted: v.blacklisted, stolen: v.stolen, recovered: v.recovered, wanted: v.wanted,
        current_owner_id: owner.id, status: "active", registration_date: v.registration_date,
      };
      const { data: vehicle, error: vErr } = await supabase.from("vehicles").insert(vPayload).select().single();
      if (vErr) throw vErr;

      await supabase.from("ownership_history").insert({
        vehicle_id: vehicle.id, owner_id: owner.id, reason: "Initial registration",
        transfer_date: v.registration_date,
      });

      if (v.has_incident === "yes") {
        await supabase.from("incidents").insert({
          vehicle_id: vehicle.id, incident_type: "Reported at registration",
          description: v.incident_details, status: "open",
        });
      }

      await logAudit("create", "vehicles", vehicle.id, null, vPayload);
      toast.success(`Vehicle ${vehicle.plate_number} registered`);
      nav({ to: "/admin/vehicles/$id", params: { id: vehicle.id } });
    } catch (e: any) {
      toast.error(e.message ?? "Failed to register");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold">Register a vehicle</h1>
      <p className="text-sm text-muted-foreground">Follow the steps. Fields marked * are required.</p>

      {/* Stepper */}
      <ol className="mt-6 flex items-center gap-2 overflow-x-auto">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const done = i < step, active = i === step;
          return (
            <li key={s.id} className="flex items-center gap-2 whitespace-nowrap">
              <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-medium ${active ? "bg-primary text-primary-foreground" : done ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"}`}>
                <Icon className="h-4 w-4"/>
              </div>
              <span className={`text-sm ${active ? "font-semibold" : "text-muted-foreground"}`}>{s.label}</span>
              {i < steps.length-1 && <span className="h-px w-8 bg-border"/>}
            </li>
          );
        })}
      </ol>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 rounded-xl border border-border bg-card p-6 space-y-6">
        {step === 0 && (
          <section className="grid md:grid-cols-2 gap-4">
            <Field label="Full name *" err={errors.full_name}><input {...register("full_name")} className={inp}/></Field>
            <Field label="National ID"><input {...register("national_id")} className={inp}/></Field>
            <Field label="Driving license"><input {...register("driving_license_number")} className={inp}/></Field>
            <Field label="Gender">
              <select {...register("gender")} className={inp}><option>Male</option><option>Female</option><option>Other</option></select>
            </Field>
            <Field label="Date of birth"><input type="date" {...register("date_of_birth")} className={inp}/></Field>
            <Field label="Phone *" err={errors.phone}><input {...register("phone")} className={inp}/></Field>
            <Field label="Alt. phone"><input {...register("alt_phone")} className={inp}/></Field>
            <Field label="Email" err={errors.email}><input {...register("email")} className={inp}/></Field>
            <Field label="Occupation"><input {...register("occupation")} className={inp}/></Field>
            <Field label="District *" err={errors.district}><input {...register("district")} className={inp}/></Field>
            <Field label="City"><input {...register("city")} className={inp}/></Field>
            <Field label="Address *" err={errors.address} className="md:col-span-2"><input {...register("address")} className={inp}/></Field>
            <Field label="Emergency contact"><input {...register("emergency_contact_name")} className={inp}/></Field>
            <Field label="Emergency phone"><input {...register("emergency_contact_phone")} className={inp}/></Field>
          </section>
        )}

        {step === 1 && (
          <section className="grid md:grid-cols-2 gap-4">
            <Field label="Vehicle type *" err={errors.vehicle_type}>
              <select {...register("vehicle_type")} className={inp}>
                <option value="">Select type…</option>
                {vehicleTypes.map(t => <option key={t}>{t}</option>)}
                <option>Other</option>
              </select>
            </Field>
            {watch("vehicle_type") === "Other" && (
              <Field label="Specify type *" err={errors.vehicle_type_other}><input {...register("vehicle_type_other")} className={inp}/></Field>
            )}
            <Field label="Manufacturer *" err={errors.manufacturer}><input {...register("manufacturer")} className={inp}/></Field>
            <Field label="Model *" err={errors.model}><input {...register("model")} className={inp}/></Field>
            <Field label="Year *" err={errors.year}><input type="number" {...register("year")} className={inp}/></Field>
            <Field label="Color *" err={errors.color}><input {...register("color")} className={inp}/></Field>
            <Field label="Fuel">
              <select {...register("fuel_type")} className={inp}><option value="">—</option><option>Petrol</option><option>Diesel</option><option>Hybrid</option><option>Electric</option><option>LPG</option></select>
            </Field>
            <Field label="Transmission">
              <select {...register("transmission")} className={inp}><option value="">—</option><option>Manual</option><option>Automatic</option><option>CVT</option></select>
            </Field>
            <Field label="Drive type">
              <select {...register("drive_type")} className={inp}><option value="">—</option><option>FWD</option><option>RWD</option><option>AWD</option><option>4WD</option></select>
            </Field>
            <Field label="Engine number *" err={errors.engine_number}><input {...register("engine_number")} className={`${inp} font-mono`}/></Field>
            <Field label="Engine capacity"><input {...register("engine_capacity")} placeholder="2.0L" className={inp}/></Field>
            <Field label="Horsepower"><input {...register("horsepower")} className={inp}/></Field>
            <Field label="VIN"><input {...register("vin")} className={`${inp} font-mono`}/></Field>
            <Field label="Chassis number *" err={errors.chassis_number}><input {...register("chassis_number")} onBlur={(e) => setValue("chassis_number", e.target.value.toUpperCase())} className={`${inp} font-mono`}/></Field>
            <Field label="Plate number *" err={errors.plate_number}><input {...register("plate_number")} onBlur={(e) => setValue("plate_number", e.target.value.toUpperCase())} className={`${inp} font-mono uppercase`}/></Field>
            <Field label="Odometer (km)"><input type="number" {...register("odometer")} className={inp}/></Field>
            <Field label="Import country"><input {...register("import_country")} className={inp}/></Field>
            <Field label="Purchase date"><input type="date" {...register("purchase_date")} className={inp}/></Field>
            <Field label="Purchase price"><input type="number" step="0.01" {...register("purchase_price")} className={inp}/></Field>
            <Field label="Insurance provider"><input {...register("insurance_provider")} className={inp}/></Field>
            <Field label="Inspection date"><input type="date" {...register("inspection_date")} className={inp}/></Field>
          </section>
        )}

        {step === 2 && (
          <section className="grid md:grid-cols-2 gap-4">
            <Field label="Registration date *" err={errors.registration_date}><input type="date" {...register("registration_date")} className={inp}/></Field>
            <Field label="Expiry date"><input type="date" {...register("expiry_date")} className={inp}/></Field>
            <Check label="Roadworthy" {...register("roadworthy")}/>
            <Check label="Tax paid" {...register("tax_paid")}/>
            <Check label="Police clearance" {...register("police_clearance")}/>
            <Check label="Customs clearance" {...register("customs_clearance")}/>
          </section>
        )}

        {step === 3 && (
          <section className="space-y-4">
            <div>
              <label className="text-sm font-medium">Previous incidents *</label>
              <div className="flex gap-4 mt-2">
                <label className="inline-flex items-center gap-2"><input type="radio" value="no" {...register("has_incident")}/> No</label>
                <label className="inline-flex items-center gap-2"><input type="radio" value="yes" {...register("has_incident")}/> Yes</label>
              </div>
            </div>
            {watch("has_incident") === "yes" && (
              <Field label="Incident details *" err={errors.incident_details}>
                <textarea rows={4} {...register("incident_details")} className={inp}/>
              </Field>
            )}
            <div className="grid md:grid-cols-2 gap-4 pt-2">
              <Check label="Blacklisted" {...register("blacklisted")}/>
              <Check label="Stolen" {...register("stolen")}/>
              <Check label="Recovered" {...register("recovered")}/>
              <Check label="Wanted" {...register("wanted")}/>
            </div>
          </section>
        )}

        {step === 4 && (
          <section>
            <h3 className="font-semibold text-lg">Review & confirm</h3>
            <p className="text-sm text-muted-foreground mt-1">Please verify everything is correct before submitting.</p>
            <div className="mt-4 grid md:grid-cols-2 gap-6 text-sm">
              <div>
                <SectionTitle>Owner</SectionTitle>
                <KV k="Name" v={watch("full_name")}/>
                <KV k="Phone" v={watch("phone")}/>
                <KV k="District" v={watch("district")}/>
                <KV k="Address" v={watch("address")}/>
              </div>
              <div>
                <SectionTitle>Vehicle</SectionTitle>
                <KV k="Plate" v={<span className="font-mono">{watch("plate_number")?.toUpperCase()}</span>}/>
                <KV k="Type" v={watch("vehicle_type") === "Other" ? watch("vehicle_type_other") : watch("vehicle_type")}/>
                <KV k="Model" v={`${watch("manufacturer")} ${watch("model")} · ${watch("year")}`}/>
                <KV k="Chassis" v={<span className="font-mono">{watch("chassis_number")?.toUpperCase()}</span>}/>
              </div>
            </div>
          </section>
        )}

        <div className="flex items-center justify-between border-t border-border pt-4">
          <button type="button" disabled={step === 0} onClick={()=>setStep(step-1)} className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm disabled:opacity-40">
            <ChevronLeft className="h-4 w-4"/> Back
          </button>
          {step < steps.length - 1 ? (
            <button type="button" onClick={next} className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium">
              Next <ChevronRight className="h-4 w-4"/>
            </button>
          ) : (
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-6 py-2 rounded-md bg-secondary text-secondary-foreground text-sm font-medium disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4"/>} Register vehicle
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

const inp = "w-full h-10 rounded-md border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/40 text-sm";

function Field({ label, err, children, className }: { label: string; err?: any; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      <div className="mt-1">{children}</div>
      {err && <p className="mt-1 text-xs text-destructive">{err.message as string}</p>}
    </div>
  );
}
const Check = ({ label, ...rest }: any) => (
  <label className="inline-flex items-center gap-2 text-sm p-3 rounded-md border border-border bg-background">
    <input type="checkbox" {...rest}/> {label}
  </label>
);
const SectionTitle = ({ children }: any) => <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">{children}</div>;
const KV = ({ k, v }: any) => <div className="flex justify-between border-b border-border/60 py-1.5"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v || "—"}</span></div>;
