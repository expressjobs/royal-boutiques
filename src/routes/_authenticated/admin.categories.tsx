import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Edit, Trash2, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  head: () => ({ meta: [{ title: "Categories — Admin · Royal Boutiques" }] }),
  component: AdminCategories,
});

type Form = { id?: string; name: string; slug: string; description: string; image_url: string; is_featured: boolean; sort_order: string };
const empty: Form = { name: "", slug: "", description: "", image_url: "", is_featured: false, sort_order: "0" };

function AdminCategories() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(empty);

  const { data = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("sort_order")).data ?? [],
  });

  const save = async () => {
    const payload = {
      name: form.name,
      slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      description: form.description || null,
      image_url: form.image_url || null,
      is_featured: form.is_featured,
      sort_order: Number(form.sort_order) || 0,
    };
    const { error } = form.id
      ? await supabase.from("categories").update(payload).eq("id", form.id)
      : await supabase.from("categories").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    setOpen(false); setForm(empty);
    qc.invalidateQueries({ queryKey: ["admin-categories"] });
  };

  const del = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin-categories"] });
  };

  const edit = (c: any) => {
    setForm({ id: c.id, name: c.name, slug: c.slug, description: c.description ?? "", image_url: c.image_url ?? "", is_featured: c.is_featured, sort_order: String(c.sort_order) });
    setOpen(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div><h1 className="font-serif text-3xl">Categories</h1><p className="text-sm text-charcoal/60">{data.length} total</p></div>
        <button onClick={() => { setForm(empty); setOpen(true); }} className="bg-charcoal text-white px-6 py-3 text-[11px] uppercase tracking-[0.2em] font-semibold flex items-center gap-2">
          <Plus className="h-3 w-3" /> Add Category
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-charcoal/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-nude eyebrow text-charcoal/50">
            <tr><th className="text-left p-4">Category</th><th>Slug</th><th>Featured</th><th>Order</th><th></th></tr>
          </thead>
          <tbody>
            {data.map((c: any) => (
              <tr key={c.id} className="border-t border-charcoal/5">
                <td className="p-4 flex items-center gap-3">
                  {c.image_url && <img src={c.image_url} alt="" className="h-10 w-10 object-cover rounded" />}
                  <span className="font-medium">{c.name}</span>
                </td>
                <td className="text-charcoal/60">{c.slug}</td>
                <td>{c.is_featured ? <span className="text-[10px] px-2 py-1 rounded bg-gold/10 text-gold">Featured</span> : "—"}</td>
                <td>{c.sort_order}</td>
                <td className="text-right pr-4">
                  <button onClick={() => edit(c)} className="p-2 hover:text-gold"><Edit className="h-4 w-4" /></button>
                  <button onClick={() => del(c.id)} className="p-2 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between mb-6">
              <h2 className="font-serif text-2xl">{form.id ? "Edit Category" : "New Category"}</h2>
              <button onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <F label="Name" v={form.name} on={(v) => setForm({ ...form, name: v })} />
              <F label="Slug" v={form.slug} on={(v) => setForm({ ...form, slug: v })} placeholder="auto from name" />
              <F label="Description" v={form.description} on={(v) => setForm({ ...form, description: v })} />
              <F label="Image URL" v={form.image_url} on={(v) => setForm({ ...form, image_url: v })} />
              <F label="Sort Order" v={form.sort_order} on={(v) => setForm({ ...form, sort_order: v })} type="number" />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="accent-gold h-4 w-4" /> Featured on homepage
              </label>
              <button onClick={save} className="w-full bg-charcoal text-white py-3 text-[11px] uppercase tracking-[0.2em] font-semibold">Save</button>
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
