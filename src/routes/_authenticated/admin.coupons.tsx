import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/coupons")({
  head: () => ({ meta: [{ title: "Coupons — Admin · Royal Boutiques" }] }),
  component: AdminCoupons,
});

type Form = { code: string; discount_type: "percent" | "amount"; discount_value: string; min_order: string; expires_at: string; is_active: boolean };
const empty: Form = { code: "", discount_type: "percent", discount_value: "10", min_order: "0", expires_at: "", is_active: true };

function AdminCoupons() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(empty);

  const { data = [] } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => (await supabase.from("coupons").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const save = async () => {
    const payload = {
      code: form.code.toUpperCase(),
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      min_order: Number(form.min_order) || 0,
      expires_at: form.expires_at || null,
      is_active: form.is_active,
    };
    const { error } = await supabase.from("coupons").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Coupon created");
    setOpen(false); setForm(empty);
    qc.invalidateQueries({ queryKey: ["admin-coupons"] });
  };

  const toggle = async (id: string, is_active: boolean) => {
    await supabase.from("coupons").update({ is_active: !is_active }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-coupons"] });
  };

  const del = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    await supabase.from("coupons").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-coupons"] });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div><h1 className="font-serif text-3xl">Coupons</h1><p className="text-sm text-charcoal/60">{data.length} total</p></div>
        <button onClick={() => setOpen(true)} className="bg-charcoal text-white px-6 py-3 text-[11px] uppercase tracking-[0.2em] font-semibold flex items-center gap-2">
          <Plus className="h-3 w-3" /> New Coupon
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-charcoal/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-nude eyebrow text-charcoal/50">
            <tr><th className="text-left p-4">Code</th><th>Discount</th><th>Min Order</th><th>Expires</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {data.map((c: any) => (
              <tr key={c.id} className="border-t border-charcoal/5">
                <td className="p-4 font-mono font-semibold">{c.code}</td>
                <td>{c.discount_type === "percent" ? `${c.discount_value}%` : `$${c.discount_value}`}</td>
                <td>${c.min_order}</td>
                <td className="text-charcoal/60">{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "—"}</td>
                <td>
                  <button onClick={() => toggle(c.id, c.is_active)} className={`text-[10px] px-2 py-1 rounded ${c.is_active ? "bg-emerald-50 text-emerald-700" : "bg-charcoal/10 text-charcoal/60"}`}>
                    {c.is_active ? "Active" : "Disabled"}
                  </button>
                </td>
                <td className="text-right pr-4">
                  <button onClick={() => del(c.id)} className="p-2 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-charcoal/50">No coupons yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between mb-6">
              <h2 className="font-serif text-2xl">New Coupon</h2>
              <button onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <F label="Code" v={form.code} on={(v) => setForm({ ...form, code: v.toUpperCase() })} placeholder="SUMMER20" />
              <label className="block">
                <span className="eyebrow text-charcoal/60 mb-2 block">Discount Type</span>
                <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value as any })} className="w-full border border-charcoal/15 px-4 py-3 text-sm rounded">
                  <option value="percent">Percent (%)</option>
                  <option value="amount">Fixed Amount ($)</option>
                </select>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <F label="Discount Value" v={form.discount_value} on={(v) => setForm({ ...form, discount_value: v })} type="number" />
                <F label="Min Order" v={form.min_order} on={(v) => setForm({ ...form, min_order: v })} type="number" />
              </div>
              <F label="Expires" v={form.expires_at} on={(v) => setForm({ ...form, expires_at: v })} type="date" />
              <button onClick={save} className="w-full bg-charcoal text-white py-3 text-[11px] uppercase tracking-[0.2em] font-semibold">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function F({ label, v, on, type = "text", placeholder }: { label: string; v: string; on: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="eyebrow text-charcoal/60 mb-2 block">{label}</span>
      <input type={type} value={v} onChange={(e) => on(e.target.value)} placeholder={placeholder} className="w-full border border-charcoal/15 px-4 py-3 text-sm rounded" />
    </label>
  );
}
