import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ChevronLeft, ArrowRightLeft, Loader2 } from "lucide-react";
import { logAudit } from "@/lib/audit";

export const Route = createFileRoute("/admin/vehicles/$id/transfer")({ component: Transfer });

function Transfer() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const [step, setStep] = useState<"form"|"confirm">("form");
  const [saving, setSaving] = useState(false);
  const { data: v } = useQuery({
    queryKey: ["vehicle-transfer", id],
    queryFn: async () => (await supabase.from("vehicles").select("*, owner:owners!vehicles_current_owner_id_fkey(*)").eq("id", id).single()).data,
  });
  const { register, handleSubmit, getValues, formState: { errors } } = useForm({
    defaultValues: { full_name: "", national_id: "", phone: "", address: "", district: "", reason: "Ownership sale", transfer_date: new Date().toISOString().slice(0,10) },
  });

  async function doTransfer() {
    setSaving(true);
    try {
      const v2 = getValues();
      const { data: newOwner, error: oErr } = await supabase.from("owners").insert({
        full_name: v2.full_name, national_id: v2.national_id || null, phone: v2.phone, address: v2.address, district: v2.district,
      }).select().single();
      if (oErr) throw oErr;
      const { error: uErr } = await supabase.from("vehicles").update({ current_owner_id: newOwner.id }).eq("id", id);
      if (uErr) throw uErr;
      const { data: u } = await supabase.auth.getUser();
      const { error: hErr } = await supabase.from("ownership_history").insert({
        vehicle_id: id, owner_id: newOwner.id, reason: v2.reason, transfer_date: v2.transfer_date, transferred_by: u.user?.id ?? null,
      });
      if (hErr) throw hErr;
      await logAudit("transfer", "vehicles", id, { previous_owner: v?.current_owner_id }, { new_owner: newOwner.id, reason: v2.reason });
      toast.success("Ownership transferred");
      nav({ to: "/admin/vehicles/$id", params: { id } });
    } catch (e: any) {
      toast.error(e.message);
    } finally { setSaving(false); }
  }

  if (!v) return <div className="p-8">Loading…</div>;

  return (
    <div className="p-8 max-w-3xl">
      <Link to="/admin/vehicles/$id" params={{ id }} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ChevronLeft className="h-4 w-4"/> Vehicle</Link>
      <h1 className="mt-1 text-2xl font-bold">Transfer ownership</h1>
      <div className="mt-2 inline-flex items-center gap-3 px-3 py-2 rounded-md bg-muted text-sm">
        <span className="font-mono font-medium">{v.plate_number}</span>
        <span className="text-muted-foreground">Currently owned by {v.owner?.full_name ?? "—"}</span>
      </div>

      {step === "form" ? (
        <form onSubmit={handleSubmit(() => setStep("confirm"))} className="mt-6 rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-semibold">New owner</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Full name *" err={errors.full_name}><input {...register("full_name",{required:"Required"})} className={inp}/></Field>
            <Field label="National ID"><input {...register("national_id")} className={inp}/></Field>
            <Field label="Phone *" err={errors.phone}><input {...register("phone",{required:"Required"})} className={inp}/></Field>
            <Field label="District *" err={errors.district}><input {...register("district",{required:"Required"})} className={inp}/></Field>
            <Field label="Address *" err={errors.address} className="md:col-span-2"><input {...register("address",{required:"Required"})} className={inp}/></Field>
          </div>
          <h2 className="font-semibold pt-2">Transfer details</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Reason"><input {...register("reason")} className={inp}/></Field>
            <Field label="Transfer date"><input type="date" {...register("transfer_date")} className={inp}/></Field>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="inline-flex items-center gap-2 px-5 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium">
              Continue <ArrowRightLeft className="h-4 w-4"/>
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-6 rounded-xl border border-border bg-card p-6">
          <h2 className="font-semibold text-lg">Confirm transfer</h2>
          <p className="text-sm text-muted-foreground mt-1">This action creates a new ownership record and updates the current owner. The previous history is preserved.</p>
          <div className="mt-4 p-4 rounded-md bg-muted/60 text-sm space-y-1">
            <div><span className="text-muted-foreground">From:</span> {v.owner?.full_name ?? "—"}</div>
            <div><span className="text-muted-foreground">To:</span> {getValues("full_name")}</div>
            <div><span className="text-muted-foreground">Date:</span> {getValues("transfer_date")}</div>
            <div><span className="text-muted-foreground">Reason:</span> {getValues("reason")}</div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button onClick={()=>setStep("form")} className="px-4 py-2 rounded-md border border-border text-sm">Back</button>
            <button onClick={doTransfer} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2 rounded-md bg-secondary text-secondary-foreground text-sm font-medium disabled:opacity-50">
              {saving && <Loader2 className="h-4 w-4 animate-spin"/>} Confirm transfer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const inp = "w-full h-10 rounded-md border border-border bg-background px-3 outline-none focus:ring-2 focus:ring-primary/40 text-sm";
const Field = ({ label, err, children, className }: any) => (
  <div className={className}>
    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
    <div className="mt-1">{children}</div>
    {err && <p className="mt-1 text-xs text-destructive">{err.message as string}</p>}
  </div>
);
