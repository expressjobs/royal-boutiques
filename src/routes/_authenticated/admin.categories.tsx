import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Edit, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  head: () => ({ meta: [{ title: "Categories - Admin - Royal Boutiques" }] }),
  component: AdminCategories,
});

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_featured: boolean;
  sort_order: number;
};

type Form = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  is_featured: boolean;
  sort_order: string;
};

const empty: Form = {
  name: "",
  slug: "",
  description: "",
  image_url: "",
  is_featured: false,
  sort_order: "0",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function AdminCategories() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(empty);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const categoriesQuery = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order")
        .order("name");
      if (error) throw error;
      return (data ?? []) as Category[];
    },
  });

  const openNew = () => {
    setForm(empty);
    setSlugTouched(false);
    setOpen(true);
  };

  const edit = (category: Category) => {
    setForm({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description ?? "",
      image_url: category.image_url ?? "",
      is_featured: category.is_featured,
      sort_order: String(category.sort_order),
    });
    setSlugTouched(true);
    setOpen(true);
  };

  const setName = (name: string) => {
    setForm((current) => ({ ...current, name, slug: slugTouched ? current.slug : slugify(name) }));
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error("Category name is required");
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      slug: slugify(form.slug || form.name),
      description: form.description.trim() || null,
      image_url: form.image_url.trim() || null,
      is_featured: form.is_featured,
      sort_order: Number(form.sort_order) || 0,
    };
    const { error } = form.id
      ? await supabase.from("categories").update(payload).eq("id", form.id)
      : await supabase.from("categories").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(form.id ? "Category updated" : "Category created");
    setOpen(false);
    setForm(empty);
    queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this category? Products in it will keep existing and lose this category."))
      return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Category deleted");
    queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
  };

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl">Categories</h1>
          <p className="text-sm text-charcoal/60">
            {categoriesQuery.data?.length ?? 0} departments and collections
          </p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center justify-center gap-2 bg-charcoal px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white"
        >
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>

      <div className="overflow-hidden rounded border border-charcoal/10 bg-white">
        {categoriesQuery.isLoading ? (
          <State text="Loading categories..." />
        ) : categoriesQuery.error ? (
          <State text="Could not load categories." />
        ) : !categoriesQuery.data?.length ? (
          <State text="No categories yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-nude text-[10px] uppercase tracking-[0.2em] text-charcoal/50">
                <tr>
                  <th className="p-4 text-left">Category</th>
                  <th className="p-4 text-left">Slug</th>
                  <th className="p-4 text-left">Featured</th>
                  <th className="p-4 text-left">Sort</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categoriesQuery.data.map((category) => (
                  <tr key={category.id} className="border-t border-charcoal/5">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {category.image_url ? (
                          <img
                            src={category.image_url}
                            alt={category.name}
                            className="h-12 w-12 rounded object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded bg-nude" />
                        )}
                        <div>
                          <p className="font-medium">{category.name}</p>
                          <p className="text-xs text-charcoal/50">
                            {category.description ?? "No description"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-charcoal/60">{category.slug}</td>
                    <td className="p-4">
                      {category.is_featured ? (
                        <Badge text="Featured" />
                      ) : (
                        <span className="text-charcoal/40">No</span>
                      )}
                    </td>
                    <td className="p-4">{category.sort_order}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => edit(category)}
                        className="inline-flex p-2 hover:text-gold"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => remove(category.id)}
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

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded bg-white p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-serif text-2xl">{form.id ? "Edit Category" : "New Category"}</h2>
              <button onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-4">
              <Field label="Name" value={form.name} onChange={setName} required />
              <Field
                label="Slug"
                value={form.slug}
                onChange={(value) => {
                  setSlugTouched(true);
                  setForm({ ...form, slug: value });
                }}
                required
              />
              <Field
                label="Description"
                value={form.description}
                onChange={(value) => setForm({ ...form, description: value })}
              />
              <Field
                label="Image URL"
                value={form.image_url}
                onChange={(value) => setForm({ ...form, image_url: value })}
              />
              {form.image_url && (
                <img src={form.image_url} alt="" className="h-36 w-full rounded object-cover" />
              )}
              <Field
                label="Sort order"
                type="number"
                value={form.sort_order}
                onChange={(value) => setForm({ ...form, sort_order: value })}
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(event) => setForm({ ...form, is_featured: event.target.checked })}
                  className="h-4 w-4 accent-gold"
                />
                Featured on homepage
              </label>
              <button
                onClick={save}
                disabled={saving}
                className="bg-charcoal py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Category"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-charcoal/50">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded border border-charcoal/15 px-4 py-3 text-sm"
      />
    </label>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded bg-gold/10 px-2 py-1 text-[10px] uppercase tracking-widest text-gold">
      {text}
    </span>
  );
}

function State({ text }: { text: string }) {
  return <div className="p-10 text-center text-sm text-charcoal/60">{text}</div>;
}
