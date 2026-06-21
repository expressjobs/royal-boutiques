import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { toast } from "sonner";
import { Plus, Edit, Trash2, X, Image as ImageIcon, Settings as SettingsIcon } from "lucide-react";
import { ImageUploader } from "@/components/ImageUploader";

export const Route = createFileRoute("/_authenticated/admin/products")({
  component: AdminProducts,
});

type Form = {
  id?: string; name: string; slug: string; description: string;
  price: string; sale_price: string; stock: string;
  category_id: string; image_url: string;
  sizes: string; colors: string;
  is_new: boolean; is_bestseller: boolean; is_luxury: boolean; is_active: boolean;
};

const empty: Form = {
  name: "", slug: "", description: "", price: "", sale_price: "", stock: "0",
  category_id: "", image_url: "", sizes: "", colors: "",
  is_new: false, is_bestseller: false, is_luxury: false, is_active: true,
};

function AdminProducts() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"details" | "media">("details");
  const [form, setForm] = useState<Form>(empty);

  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*, category:categories(name)").order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["all-categories"],
    queryFn: async () => (await supabase.from("categories").select("id, name").order("name")).data ?? [],
  });

  const save = async () => {
    const payload = {
      name: form.name,
      slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      description: form.description,
      price: Number(form.price),
      sale_price: form.sale_price ? Number(form.sale_price) : null,
      stock: Number(form.stock),
      category_id: form.category_id || null,
      image_url: form.image_url,
      sizes: form.sizes.split(",").map((s) => s.trim()).filter(Boolean),
      colors: form.colors.split(",").map((s) => s.trim()).filter(Boolean),
      is_new: form.is_new, is_bestseller: form.is_bestseller, is_luxury: form.is_luxury, is_active: form.is_active,
    };
    const { error } = form.id
      ? await supabase.from("products").update(payload).eq("id", form.id)
      : await supabase.from("products").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(form.id ? "Product updated" : "Product added");
    setOpen(false); setForm(empty);
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  };

  const del = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  };

  const edit = (p: any) => {
    setForm({
      id: p.id, name: p.name, slug: p.slug, description: p.description ?? "",
      price: String(p.price), sale_price: p.sale_price ? String(p.sale_price) : "", stock: String(p.stock),
      category_id: p.category_id ?? "", image_url: p.image_url ?? "",
      sizes: (p.sizes ?? []).join(", "), colors: (p.colors ?? []).join(", "),
      is_new: p.is_new, is_bestseller: p.is_bestseller, is_luxury: p.is_luxury, is_active: p.is_active,
    });
    setOpen(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div><h1 className="font-serif text-3xl">Products</h1><p className="text-sm text-charcoal/60">{products.length} total</p></div>
        <button onClick={() => { setForm(empty); setOpen(true); }} className="bg-charcoal text-white px-6 py-3 text-[11px] uppercase tracking-[0.2em] font-semibold flex items-center gap-2">
          <Plus className="h-3 w-3" /> Add Product
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-charcoal/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-nude eyebrow text-charcoal/50">
            <tr><th className="text-left p-4">Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {products.map((p: any) => (
              <tr key={p.id} className="border-t border-charcoal/5">
                <td className="p-4 flex items-center gap-3">
                  {p.image_url && <img src={p.image_url} alt="" className="h-12 w-10 object-cover rounded" />}
                  <span className="font-medium">{p.name}</span>
                </td>
                <td>{p.category?.name ?? "—"}</td>
                <td>{formatPrice(p.price)}</td>
                <td>{p.stock}</td>
                <td><span className={`text-[10px] px-2 py-1 rounded ${p.is_active ? "bg-emerald-50 text-emerald-700" : "bg-charcoal/10"}`}>{p.is_active ? "Active" : "Hidden"}</span></td>
                <td className="text-right pr-4">
                  <button onClick={() => edit(p)} className="p-2 hover:text-gold"><Edit className="h-4 w-4" /></button>
                  <button onClick={() => del(p.id)} className="p-2 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-3xl w-full max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between mb-6">
              <h2 className="font-serif text-2xl">{form.id ? "Edit Product" : "New Product"}</h2>
              <button onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
            </div>

            <div className="flex gap-1 mb-6 border-b border-charcoal/10">
              <TabBtn active={tab === "details"} onClick={() => setTab("details")} icon={<SettingsIcon className="h-3.5 w-3.5" />} label="Details" />
              <TabBtn active={tab === "media"} onClick={() => setTab("media")} disabled={!form.id} icon={<ImageIcon className="h-3.5 w-3.5" />} label={form.id ? "Media" : "Save first to add media"} />
            </div>

            {tab === "details" && (
              <div className="space-y-4">
                <F label="Name" v={form.name} on={(v) => setForm({ ...form, name: v })} />
                <F label="Slug" v={form.slug} on={(v) => setForm({ ...form, slug: v })} placeholder="auto from name" />
                <F label="Description" v={form.description} on={(v) => setForm({ ...form, description: v })} textarea />
                <F label="Primary Image URL" v={form.image_url} on={(v) => setForm({ ...form, image_url: v })} placeholder="paste URL or upload via Media tab" />
                <div className="grid grid-cols-3 gap-4">
                  <F label="Price" v={form.price} on={(v) => setForm({ ...form, price: v })} type="number" />
                  <F label="Sale Price" v={form.sale_price} on={(v) => setForm({ ...form, sale_price: v })} type="number" />
                  <F label="Stock" v={form.stock} on={(v) => setForm({ ...form, stock: v })} type="number" />
                </div>
                <label className="block">
                  <span className="eyebrow text-charcoal/60 mb-2 block">Category</span>
                  <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="w-full border border-charcoal/15 px-4 py-3 text-sm rounded">
                    <option value="">—</option>
                    {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </label>
                <F label="Sizes (comma-separated)" v={form.sizes} on={(v) => setForm({ ...form, sizes: v })} placeholder="XS, S, M, L" />
                <F label="Colors (comma-separated)" v={form.colors} on={(v) => setForm({ ...form, colors: v })} placeholder="Black, Cream" />
                <div className="flex flex-wrap gap-4 text-sm">
                  <Ck label="New" v={form.is_new} on={(v) => setForm({ ...form, is_new: v })} />
                  <Ck label="Best Seller" v={form.is_bestseller} on={(v) => setForm({ ...form, is_bestseller: v })} />
                  <Ck label="Luxury" v={form.is_luxury} on={(v) => setForm({ ...form, is_luxury: v })} />
                  <Ck label="Active" v={form.is_active} on={(v) => setForm({ ...form, is_active: v })} />
                </div>
                <button onClick={save} className="w-full bg-charcoal text-white py-3 text-[11px] uppercase tracking-[0.2em] font-semibold">Save Product</button>
              </div>
            )}

            {tab === "media" && form.id && (
              <ImageUploader
                productId={form.id}
                primaryUrl={form.image_url}
                onPrimaryChange={(url) => setForm({ ...form, image_url: url })}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function F({ label, v, on, type = "text", textarea, placeholder }: { label: string; v: string; on: (v: string) => void; type?: string; textarea?: boolean; placeholder?: string }) {
  return (
    <label className="block">
      <span className="eyebrow text-charcoal/60 mb-2 block">{label}</span>
      {textarea
        ? <textarea value={v} onChange={(e) => on(e.target.value)} rows={3} placeholder={placeholder} className="w-full border border-charcoal/15 px-4 py-3 text-sm rounded" />
        : <input type={type} value={v} onChange={(e) => on(e.target.value)} placeholder={placeholder} className="w-full border border-charcoal/15 px-4 py-3 text-sm rounded" />}
    </label>
  );
}
function Ck({ label, v, on }: { label: string; v: boolean; on: (v: boolean) => void }) {
  return <label className="flex items-center gap-2"><input type="checkbox" checked={v} onChange={(e) => on(e.target.checked)} className="accent-gold h-4 w-4" />{label}</label>;
}
function TabBtn({ active, onClick, icon, label, disabled }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-[11px] uppercase tracking-[0.2em] font-semibold border-b-2 transition ${
        active ? "border-gold text-charcoal" : "border-transparent text-charcoal/50 hover:text-charcoal"
      } disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {icon} {label}
    </button>
  );
}
