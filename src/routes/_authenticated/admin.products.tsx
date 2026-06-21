import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CheckSquare, Edit, Eye, EyeOff, Package, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/products")({
  component: AdminProducts,
});

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  sale_price: number | null;
  stock: number;
  category_id: string | null;
  image_url: string | null;
  is_active: boolean;
  owner_type: "royal_boutiques" | "vendor";
  category: { name: string | null } | null;
};

const PAGE_SIZE = 20;

function AdminProducts() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [lowStock, setLowStock] = useState(false);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkCategory, setBulkCategory] = useState("");

  const productsQuery = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(
          "id, name, slug, price, sale_price, stock, category_id, image_url, is_active, owner_type, category:categories(name)",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const categoriesQuery = useQuery({
    queryKey: ["admin-categories-options"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id, name").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const products = productsQuery.data ?? [];
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      if (term && !`${product.name} ${product.slug}`.toLowerCase().includes(term)) return false;
      if (category && product.category_id !== category) return false;
      if (status === "active" && !product.is_active) return false;
      if (status === "inactive" && product.is_active) return false;
      if (lowStock && product.stock > 10) return false;
      return true;
    });
  }, [products, search, category, status, lowStock]);

  const maxPage = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-products"] });

  const updateProduct = async (id: string, payload: Partial<Product>) => {
    const { error } = await supabase.from("products").update(payload).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Product updated");
    invalidate();
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Product deleted");
    invalidate();
  };

  const bulkSetActive = async (is_active: boolean) => {
    if (!selected.length) return toast.error("Select products first");
    const { error } = await supabase.from("products").update({ is_active }).in("id", selected);
    if (error) return toast.error(error.message);
    toast.success(is_active ? "Products activated" : "Products deactivated");
    setSelected([]);
    invalidate();
  };

  const bulkMoveCategory = async () => {
    if (!selected.length) return toast.error("Select products first");
    if (!bulkCategory) return toast.error("Choose a category");
    const { error } = await supabase
      .from("products")
      .update({ category_id: bulkCategory })
      .in("id", selected);
    if (error) return toast.error(error.message);
    toast.success("Products moved");
    setSelected([]);
    setBulkCategory("");
    invalidate();
  };

  const toggleSelected = (id: string) => {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-serif text-3xl">Products</h1>
          <p className="text-sm text-charcoal/60">
            {filtered.length} shown from {products.length} products
          </p>
        </div>
        <Link
          to="/admin/products/new"
          className="inline-flex items-center justify-center gap-2 bg-charcoal px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white"
        >
          <Plus className="h-4 w-4" /> Create Product
        </Link>
      </div>

      <div className="mb-6 grid gap-3 rounded border border-charcoal/10 bg-white p-4 lg:grid-cols-[1fr_180px_150px_130px]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-charcoal/40" />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search name or slug"
            className="w-full rounded border border-charcoal/15 py-3 pl-10 pr-4 text-sm"
          />
        </label>
        <select
          value={category}
          onChange={(event) => {
            setCategory(event.target.value);
            setPage(1);
          }}
          className="rounded border border-charcoal/15 px-3 py-3 text-sm"
        >
          <option value="">All categories</option>
          {categoriesQuery.data?.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as typeof status);
            setPage(1);
          }}
          className="rounded border border-charcoal/15 px-3 py-3 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <label className="flex items-center gap-2 rounded border border-charcoal/15 px-3 py-3 text-sm">
          <input
            type="checkbox"
            checked={lowStock}
            onChange={(event) => {
              setLowStock(event.target.checked);
              setPage(1);
            }}
            className="accent-gold"
          />
          Low stock
        </label>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded border border-charcoal/10 bg-white p-4">
        <span className="text-sm text-charcoal/60">{selected.length} selected</span>
        <button
          onClick={() => bulkSetActive(true)}
          className="border border-charcoal/15 px-4 py-2 text-xs uppercase tracking-widest"
        >
          Activate
        </button>
        <button
          onClick={() => bulkSetActive(false)}
          className="border border-charcoal/15 px-4 py-2 text-xs uppercase tracking-widest"
        >
          Deactivate
        </button>
        <select
          value={bulkCategory}
          onChange={(event) => setBulkCategory(event.target.value)}
          className="rounded border border-charcoal/15 px-3 py-2 text-sm"
        >
          <option value="">Bulk category</option>
          {categoriesQuery.data?.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <button
          onClick={bulkMoveCategory}
          className="border border-charcoal/15 px-4 py-2 text-xs uppercase tracking-widest"
        >
          Apply category
        </button>
      </div>

      <div className="overflow-hidden rounded border border-charcoal/10 bg-white">
        {productsQuery.isLoading ? (
          <AdminState text="Loading products..." />
        ) : productsQuery.error ? (
          <AdminState text="Could not load products." />
        ) : visible.length === 0 ? (
          <AdminState text="No products match these filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-nude text-[10px] uppercase tracking-[0.2em] text-charcoal/50">
                <tr>
                  <th className="p-4 text-left">
                    <CheckSquare className="h-4 w-4" />
                  </th>
                  <th className="p-4 text-left">Product</th>
                  <th className="p-4 text-left">Category</th>
                  <th className="p-4 text-left">Price</th>
                  <th className="p-4 text-left">Sale</th>
                  <th className="p-4 text-left">Stock</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((product) => (
                  <tr key={product.id} className="border-t border-charcoal/5">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selected.includes(product.id)}
                        onChange={() => toggleSelected(product.id)}
                        className="accent-gold"
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="h-14 w-12 rounded object-cover"
                          />
                        ) : (
                          <div className="grid h-14 w-12 place-items-center rounded bg-nude">
                            <Package className="h-4 w-4 text-charcoal/30" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-charcoal/50">{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">{product.category?.name ?? "None"}</td>
                    <td className="p-4">
                      <InlineNumber
                        value={product.price}
                        onSave={(value) =>
                          updateProduct(product.id, { price: value } as Partial<Product>)
                        }
                      />
                    </td>
                    <td className="p-4">
                      <InlineNumber
                        value={product.sale_price ?? 0}
                        nullable
                        onSave={(value) =>
                          updateProduct(product.id, {
                            sale_price: value || null,
                          } as Partial<Product>)
                        }
                      />
                    </td>
                    <td className="p-4">
                      <InlineNumber
                        value={product.stock}
                        onSave={(value) =>
                          updateProduct(product.id, { stock: value } as Partial<Product>)
                        }
                      />
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => updateProduct(product.id, { is_active: !product.is_active })}
                        className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] uppercase tracking-widest ${product.is_active ? "bg-emerald-50 text-emerald-700" : "bg-charcoal/10 text-charcoal/60"}`}
                      >
                        {product.is_active ? (
                          <Eye className="h-3 w-3" />
                        ) : (
                          <EyeOff className="h-3 w-3" />
                        )}
                        {product.is_active ? "Active" : "Hidden"}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        to="/admin/products/$id/edit"
                        params={{ id: product.id }}
                        className="inline-flex p-2 hover:text-gold"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => deleteProduct(product.id)}
                        className="inline-flex p-2 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between text-sm text-charcoal/60">
        <button
          disabled={page === 1}
          onClick={() => setPage((value) => Math.max(1, value - 1))}
          className="border border-charcoal/15 px-4 py-2 disabled:opacity-40"
        >
          Previous
        </button>
        <span>
          Page {page} of {maxPage}
        </span>
        <button
          disabled={page === maxPage}
          onClick={() => setPage((value) => Math.min(maxPage, value + 1))}
          className="border border-charcoal/15 px-4 py-2 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function InlineNumber({
  value,
  onSave,
  nullable,
}: {
  value: number;
  onSave: (value: number) => void;
  nullable?: boolean;
}) {
  const [draft, setDraft] = useState(String(value || ""));
  return (
    <input
      type="number"
      value={draft}
      placeholder={nullable ? "-" : undefined}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => onSave(draft ? Number(draft) : 0)}
      className="w-24 rounded border border-transparent bg-nude px-2 py-1 focus:border-gold focus:bg-white"
    />
  );
}

function AdminState({ text }: { text: string }) {
  return <div className="p-10 text-center text-sm text-charcoal/60">{text}</div>;
}
