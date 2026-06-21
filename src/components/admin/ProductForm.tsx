import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

import {
  MEDIA_CATEGORIES,
  type MediaAsset,
  listMediaFolder,
  uploadMediaFile,
} from "@/lib/admin-media";
import { supabase } from "@/integrations/supabase/client";

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  sale_price: number | null;
  stock: number;
  category_id: string | null;
  image_url: string | null;
  sizes: string[];
  colors: string[];
  is_new: boolean;
  is_bestseller: boolean;
  is_luxury: boolean;
  is_active: boolean;
  rating: number;
  review_count: number;
  owner_type: "royal_boutiques" | "vendor";
  owner_id: string | null;
};

type ProductFormState = {
  name: string;
  slug: string;
  description: string;
  price: string;
  sale_price: string;
  stock: string;
  category_id: string;
  image_url: string;
  sizes: string;
  colors: string;
  is_new: boolean;
  is_bestseller: boolean;
  is_luxury: boolean;
  is_active: boolean;
  rating: string;
  review_count: string;
  owner_type: "royal_boutiques" | "vendor";
  owner_id: string;
};

const emptyForm: ProductFormState = {
  name: "",
  slug: "",
  description: "",
  price: "",
  sale_price: "",
  stock: "0",
  category_id: "",
  image_url: "",
  sizes: "",
  colors: "",
  is_new: false,
  is_bestseller: false,
  is_luxury: false,
  is_active: true,
  rating: "0",
  review_count: "0",
  owner_type: "royal_boutiques",
  owner_id: "",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function listFromText(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formFromProduct(product: ProductRow): ProductFormState {
  return {
    name: product.name,
    slug: product.slug,
    description: product.description ?? "",
    price: String(product.price),
    sale_price: product.sale_price == null ? "" : String(product.sale_price),
    stock: String(product.stock),
    category_id: product.category_id ?? "",
    image_url: product.image_url ?? "",
    sizes: (product.sizes ?? []).join(", "),
    colors: (product.colors ?? []).join(", "),
    is_new: product.is_new,
    is_bestseller: product.is_bestseller,
    is_luxury: product.is_luxury,
    is_active: product.is_active,
    rating: String(product.rating),
    review_count: String(product.review_count),
    owner_type: product.owner_type ?? "royal_boutiques",
    owner_id: product.owner_id ?? "",
  };
}

export function AdminProductForm({ productId }: { productId?: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(Boolean(productId));

  const isEditing = Boolean(productId);

  const productQuery = useQuery({
    queryKey: ["admin-product", productId],
    enabled: isEditing,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .maybeSingle();
      if (error) throw error;
      return data as ProductRow | null;
    },
  });

  const categoriesQuery = useQuery({
    queryKey: ["admin-product-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id, name").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const vendorsQuery = useQuery({
    queryKey: ["admin-product-vendors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("id, business_name")
        .order("business_name");
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (productQuery.data) setForm(formFromProduct(productQuery.data));
  }, [productQuery.data]);

  const previewName = useMemo(() => form.name.trim() || "Untitled product", [form.name]);

  const setName = (name: string) => {
    setForm((current) => ({
      ...current,
      name,
      slug: slugTouched ? current.slug : slugify(name),
    }));
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error("Product name is required");
    if (!form.price || Number(form.price) < 0) return toast.error("Enter a valid price");
    if (Number(form.stock) < 0) return toast.error("Stock cannot be negative");

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      slug: slugify(form.slug || form.name),
      description: form.description.trim() || null,
      price: Number(form.price),
      sale_price: form.sale_price ? Number(form.sale_price) : null,
      stock: Number(form.stock) || 0,
      category_id: form.category_id || null,
      image_url: form.image_url.trim() || null,
      sizes: listFromText(form.sizes),
      colors: listFromText(form.colors),
      is_new: form.is_new,
      is_bestseller: form.is_bestseller,
      is_luxury: form.is_luxury,
      is_active: form.is_active,
      rating: Number(form.rating) || 0,
      review_count: Number(form.review_count) || 0,
      owner_type: form.owner_type,
      owner_id: form.owner_type === "vendor" ? form.owner_id || null : null,
    };

    const { error } = productId
      ? await supabase.from("products").update(payload).eq("id", productId)
      : await supabase.from("products").insert(payload);

    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(productId ? "Product updated" : "Product created");
    await queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    navigate({ to: "/admin/products" });
  };

  if (productQuery.isLoading) return <AdminState text="Loading product..." />;
  if (productQuery.error) return <AdminState text="Could not load this product." />;
  if (isEditing && !productQuery.data) return <AdminState text="Product not found." />;

  return (
    <div className="max-w-6xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/admin/products"
            className="mb-3 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-charcoal/50 hover:text-charcoal"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Products
          </Link>
          <h1 className="font-serif text-3xl">{isEditing ? "Edit Product" : "New Product"}</h1>
          <p className="mt-1 text-sm text-charcoal/60">{previewName}</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 bg-charcoal px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Product"}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="space-y-6">
          <Panel title="Product Details">
            <div className="grid gap-4 sm:grid-cols-2">
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
            </div>
            <Field
              label="Description"
              value={form.description}
              onChange={(value) => setForm({ ...form, description: value })}
              textarea
            />
            <Field
              label="Image URL"
              value={form.image_url}
              onChange={(value) => setForm({ ...form, image_url: value })}
            />
          </Panel>

          <Panel title="Pricing and Inventory">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field
                label="Price"
                type="number"
                value={form.price}
                onChange={(value) => setForm({ ...form, price: value })}
                required
              />
              <Field
                label="Sale price"
                type="number"
                value={form.sale_price}
                onChange={(value) => setForm({ ...form, sale_price: value })}
              />
              <Field
                label="Stock"
                type="number"
                value={form.stock}
                onChange={(value) => setForm({ ...form, stock: value })}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Rating"
                type="number"
                value={form.rating}
                onChange={(value) => setForm({ ...form, rating: value })}
              />
              <Field
                label="Review count"
                type="number"
                value={form.review_count}
                onChange={(value) => setForm({ ...form, review_count: value })}
              />
            </div>
          </Panel>

          <Panel title="Options">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Sizes"
                value={form.sizes}
                onChange={(value) => setForm({ ...form, sizes: value })}
                placeholder="XS, S, M, L"
              />
              <Field
                label="Colors"
                value={form.colors}
                onChange={(value) => setForm({ ...form, colors: value })}
                placeholder="Black, Cream, Navy"
              />
            </div>
          </Panel>
        </section>

        <aside className="space-y-6">
          <Panel title="Preview">
            <div className="overflow-hidden rounded border border-charcoal/10 bg-nude">
              {form.image_url ? (
                <img src={form.image_url} alt={previewName} className="h-72 w-full object-cover" />
              ) : (
                <div className="grid h-72 place-items-center text-sm text-charcoal/40">
                  No image
                </div>
              )}
            </div>
          </Panel>

          <ProductMediaPanel
            productId={productId}
            currentImageUrl={form.image_url}
            onPrimaryImage={(url) => setForm({ ...form, image_url: url })}
          />

          <Panel title="Organization">
            <label className="block">
              <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-charcoal/50">
                Category
              </span>
              <select
                value={form.category_id}
                onChange={(event) => setForm({ ...form, category_id: event.target.value })}
                className="w-full rounded border border-charcoal/15 px-4 py-3 text-sm"
              >
                <option value="">No category</option>
                {categoriesQuery.data?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-charcoal/50">
                Owner type
              </span>
              <select
                value={form.owner_type}
                onChange={(event) =>
                  setForm({
                    ...form,
                    owner_type: event.target.value as ProductFormState["owner_type"],
                    owner_id: "",
                  })
                }
                className="w-full rounded border border-charcoal/15 px-4 py-3 text-sm"
              >
                <option value="royal_boutiques">Royal Boutiques</option>
                <option value="vendor">Vendor</option>
              </select>
            </label>
            {form.owner_type === "vendor" && (
              <label className="block">
                <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-charcoal/50">
                  Vendor
                </span>
                <select
                  value={form.owner_id}
                  onChange={(event) => setForm({ ...form, owner_id: event.target.value })}
                  className="w-full rounded border border-charcoal/15 px-4 py-3 text-sm"
                >
                  <option value="">Select vendor</option>
                  {vendorsQuery.data?.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.business_name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </Panel>

          <Panel title="Status">
            <Check
              label="Active"
              checked={form.is_active}
              onChange={(value) => setForm({ ...form, is_active: value })}
            />
            <Check
              label="New arrival"
              checked={form.is_new}
              onChange={(value) => setForm({ ...form, is_new: value })}
            />
            <Check
              label="Best seller"
              checked={form.is_bestseller}
              onChange={(value) => setForm({ ...form, is_bestseller: value })}
            />
            <Check
              label="Luxury"
              checked={form.is_luxury}
              onChange={(value) => setForm({ ...form, is_luxury: value })}
            />
          </Panel>
        </aside>
      </div>
    </div>
  );
}

function ProductMediaPanel({
  productId,
  currentImageUrl,
  onPrimaryImage,
}: {
  productId?: string;
  currentImageUrl: string;
  onPrimaryImage: (url: string) => void;
}) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [folder, setFolder] = useState<(typeof MEDIA_CATEGORIES)[number]>("uncategorized");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedMediaUrl, setSelectedMediaUrl] = useState("");

  const mediaQuery = useQuery({
    queryKey: ["admin-product-media-picker", pickerOpen],
    enabled: pickerOpen,
    queryFn: async () => {
      const imageFolders = await Promise.all(
        MEDIA_CATEGORIES.map((item) => listMediaFolder("product-images", item)),
      );
      const videoFolders = await Promise.all(
        MEDIA_CATEGORIES.map((item) => listMediaFolder("product-videos", item).catch(() => [])),
      );
      return [...imageFolders.flat(), ...videoFolders.flat()];
    },
  });

  const productImagesQuery = useQuery({
    queryKey: ["admin-product-images", productId],
    enabled: Boolean(productId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_images")
        .select("*")
        .eq("product_id", productId)
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const productMediaQuery = useQuery({
    queryKey: ["admin-product-media", productId],
    enabled: Boolean(productId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_media" as never)
        .select("*")
        .eq("product_id", productId)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Array<{
        id: string;
        url: string;
        type: "image" | "video";
        alt_text: string | null;
      }>;
    },
  });

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const uploaded = await uploadMediaFile(file, folder);
        if (uploaded.type === "image" && !currentImageUrl) onPrimaryImage(uploaded.url);
        if (productId && uploaded.type === "image") {
          await supabase
            .from("product_images")
            .insert({ product_id: productId, image_url: uploaded.url, sort_order: 0 });
        }
        if (productId && uploaded.type === "video") {
          await supabase.from("product_media" as never).insert({
            product_id: productId,
            url: uploaded.url,
            type: "video",
            alt_text: file.name,
            sort_order: 0,
            is_primary: false,
          } as never);
        }
      }
      toast.success("Media uploaded");
      queryClient.invalidateQueries({ queryKey: ["admin-product-images", productId] });
      queryClient.invalidateQueries({ queryKey: ["admin-product-media", productId] });
      queryClient.invalidateQueries({ queryKey: ["admin-media-library"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const addGalleryImage = async (url: string) => {
    if (!productId) return toast.error("Save the product before adding gallery images");
    const { error } = await supabase
      .from("product_images")
      .insert({ product_id: productId, image_url: url, sort_order: 0 });
    if (error) return toast.error(error.message);
    toast.success("Gallery image added");
    queryClient.invalidateQueries({ queryKey: ["admin-product-images", productId] });
  };

  const addVideo = async (asset: MediaAsset) => {
    if (!productId) return toast.error("Save the product before adding videos");
    const { error } = await supabase.from("product_media" as never).insert({
      product_id: productId,
      url: asset.url,
      type: "video",
      alt_text: asset.name,
      sort_order: 0,
      is_primary: false,
    } as never);
    if (error) return toast.error(error.message);
    toast.success("Video assigned");
    queryClient.invalidateQueries({ queryKey: ["admin-product-media", productId] });
  };

  const removeGalleryImage = async (id: string) => {
    if (!confirm("Remove this image from the product?")) return;
    const { error } = await supabase.from("product_images").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Image removed");
    queryClient.invalidateQueries({ queryKey: ["admin-product-images", productId] });
  };

  const removeMedia = async (id: string) => {
    if (!confirm("Remove this media item from the product?")) return;
    const { error } = await supabase
      .from("product_media" as never)
      .delete()
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Media removed");
    queryClient.invalidateQueries({ queryKey: ["admin-product-media", productId] });
  };

  return (
    <Panel title="Media">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <select
            value={folder}
            onChange={(event) => setFolder(event.target.value as typeof folder)}
            className="rounded border border-charcoal/15 px-3 py-2 text-sm"
          >
            {MEDIA_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="border border-charcoal/15 px-4 py-2 text-xs uppercase tracking-widest"
          >
            {uploading ? "Uploading..." : "Upload media"}
          </button>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="border border-charcoal/15 px-4 py-2 text-xs uppercase tracking-widest"
          >
            Pick from library
          </button>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*,video/mp4,video/webm,video/quicktime"
            className="hidden"
            onChange={(event) => upload(event.target.files)}
          />
        </div>

        {currentImageUrl && (
          <button
            type="button"
            onClick={() => setSelectedMediaUrl(currentImageUrl)}
            className="text-xs text-charcoal/60 underline"
          >
            Current main image selected
          </button>
        )}

        {productId ? (
          <>
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-charcoal/50">
                Product gallery
              </p>
              <div className="grid grid-cols-3 gap-2">
                {productImagesQuery.data?.map((image) => (
                  <button key={image.id} type="button" onClick={() => removeGalleryImage(image.id)}>
                    <img
                      src={image.image_url}
                      alt=""
                      className="h-24 w-full rounded object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-charcoal/50">
                Product videos
              </p>
              <div className="space-y-2">
                {productMediaQuery.data
                  ?.filter((item) => item.type === "video")
                  .map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => removeMedia(item.id)}
                      className="block w-full truncate rounded bg-nude px-3 py-2 text-left text-xs"
                    >
                      {item.alt_text ?? item.url}
                    </button>
                  ))}
              </div>
            </div>
          </>
        ) : (
          <p className="text-xs text-charcoal/50">
            Save the product before adding gallery images or videos. Uploaded images can still
            replace the main image.
          </p>
        )}
      </div>

      {pickerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setPickerOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded bg-white p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-serif text-2xl">Choose Media</h3>
              <button type="button" onClick={() => setPickerOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            {mediaQuery.isLoading ? (
              <p className="text-sm text-charcoal/50">Loading media...</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {mediaQuery.data?.map((asset) => (
                  <div
                    key={`${asset.bucket}:${asset.path}`}
                    className="overflow-hidden rounded border border-charcoal/10"
                  >
                    {asset.type === "image" ? (
                      <img src={asset.url} alt={asset.name} className="h-44 w-full object-cover" />
                    ) : (
                      <video src={asset.url} className="h-44 w-full object-cover" />
                    )}
                    <div className="space-y-2 p-3">
                      <p className="truncate text-xs">{asset.name}</p>
                      {asset.type === "image" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => onPrimaryImage(asset.url)}
                            className="block w-full border border-charcoal/15 px-3 py-2 text-[10px] uppercase tracking-widest"
                          >
                            Use as main
                          </button>
                          <button
                            type="button"
                            onClick={() => addGalleryImage(asset.url)}
                            className="block w-full border border-charcoal/15 px-3 py-2 text-[10px] uppercase tracking-widest"
                          >
                            Add gallery
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addVideo(asset)}
                          className="block w-full border border-charcoal/15 px-3 py-2 text-[10px] uppercase tracking-widest"
                        >
                          Add video
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Panel>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4 rounded border border-charcoal/10 bg-white p-6">
      <h2 className="font-serif text-xl">{title}</h2>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  textarea,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  textarea?: boolean;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-charcoal/50">
        {label}
        {required ? " *" : ""}
      </span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
          placeholder={placeholder}
          className="w-full rounded border border-charcoal/15 px-4 py-3 text-sm"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded border border-charcoal/15 px-4 py-3 text-sm"
        />
      )}
    </label>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 border-b border-charcoal/5 py-3 last:border-0">
      <span className="text-sm">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-gold"
      />
    </label>
  );
}

function AdminState({ text }: { text: string }) {
  return (
    <div className="rounded border border-charcoal/10 bg-white p-8 text-sm text-charcoal/60">
      {text}
    </div>
  );
}
