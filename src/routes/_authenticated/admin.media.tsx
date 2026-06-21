import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { Copy, Grid3X3, ImageIcon, List, Play, Search, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import {
  MEDIA_CATEGORIES,
  type MediaAsset,
  type MediaType,
  deleteMedia,
  listMediaFolder,
  uploadMediaFile,
} from "@/lib/admin-media";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/media")({
  head: () => ({ meta: [{ title: "Media Library - Admin - Royal Boutiques" }] }),
  component: AdminMediaLibrary,
});

type ProductOption = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
};

function AdminMediaLibrary() {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [folder, setFolder] = useState<"all" | (typeof MEDIA_CATEGORIES)[number]>("all");
  const [uploadFolder, setUploadFolder] =
    useState<(typeof MEDIA_CATEGORIES)[number]>("uncategorized");
  const [type, setType] = useState<"all" | MediaType>("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [preview, setPreview] = useState<MediaAsset | null>(null);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [uploading, setUploading] = useState<Array<{ name: string; status: string }>>([]);
  const [autoMatch, setAutoMatch] = useState(false);
  const [unmatched, setUnmatched] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);

  const mediaQuery = useQuery({
    queryKey: ["admin-media-library"],
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

  const productsQuery = useQuery({
    queryKey: ["admin-media-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, image_url")
        .order("name");
      if (error) throw error;
      return (data ?? []) as ProductOption[];
    },
  });

  const assets = mediaQuery.data ?? [];
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return assets.filter((asset) => {
      if (folder !== "all" && asset.folder !== folder) return false;
      if (type !== "all" && asset.type !== type) return false;
      if (term && !`${asset.name} ${asset.path}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [assets, folder, type, search]);

  const uploadFiles = async (files: FileList | File[]) => {
    const fileList = Array.from(files);
    if (!fileList.length) return;
    setUnmatched([]);
    setUploading(fileList.map((file) => ({ name: file.name, status: "Waiting" })));

    const unmatchedNames: string[] = [];
    for (const file of fileList) {
      try {
        setUploading((current) =>
          current.map((item) =>
            item.name === file.name ? { ...item, status: "Uploading" } : item,
          ),
        );
        const uploaded = await uploadMediaFile(file, uploadFolder);
        setUploading((current) =>
          current.map((item) => (item.name === file.name ? { ...item, status: "Uploaded" } : item)),
        );

        if (autoMatch && uploaded.type === "image") {
          const safeName = file.name.toLowerCase();
          const product = productsQuery.data?.find((item) =>
            safeName.includes(item.slug.toLowerCase()),
          );
          if (product) {
            await assignAsPrimary(uploaded.url, product.id, false);
          } else {
            unmatchedNames.push(file.name);
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Upload failed";
        setUploading((current) =>
          current.map((item) => (item.name === file.name ? { ...item, status: message } : item)),
        );
        toast.error(`${file.name}: ${message}`);
      }
    }
    setUnmatched(unmatchedNames);
    toast.success("Upload complete");
    queryClient.invalidateQueries({ queryKey: ["admin-media-library"] });
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
  };

  const remove = useMutation({
    mutationFn: deleteMedia,
    onSuccess: () => {
      toast.success("Media deleted");
      setPreview(null);
      queryClient.invalidateQueries({ queryKey: ["admin-media-library"] });
    },
    onError: (error) => toast.error(error.message),
  });

  const assignAsPrimary = async (url: string, productId = selectedProduct, showToast = true) => {
    if (!productId) return toast.error("Choose a product first");
    const { error } = await supabase
      .from("products")
      .update({ image_url: url })
      .eq("id", productId);
    if (error) return toast.error(error.message);
    if (showToast) toast.success("Primary product image updated");
    queryClient.invalidateQueries({ queryKey: ["admin-media-products"] });
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
  };

  const addGalleryImage = async (url: string) => {
    if (!selectedProduct) return toast.error("Choose a product first");
    const { error } = await supabase
      .from("product_images")
      .insert({ product_id: selectedProduct, image_url: url, sort_order: 0 });
    if (error) return toast.error(error.message);
    toast.success("Gallery image added");
  };

  const addProductVideo = async (asset: MediaAsset) => {
    if (!selectedProduct) return toast.error("Choose a product first");
    const { error } = await supabase.from("product_media").insert({
      product_id: selectedProduct,
      url: asset.url,
      type: "video",
      alt_text: asset.name,
      sort_order: 0,
      is_primary: false,
    });
    if (error) return toast.error(error.message);
    toast.success("Product video assigned");
  };

  const copy = async (url: string) => {
    await navigator.clipboard.writeText(url);
    toast.success("URL copied");
  };

  return (
    <div>
      <div className="mb-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold">
          Admin Assets
        </p>
        <h1 className="mt-2 font-serif text-3xl">Media Library</h1>
        <p className="mt-1 text-sm text-charcoal/60">
          Upload, preview, organize, and assign product images and videos.
        </p>
      </div>

      <section
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          uploadFiles(event.dataTransfer.files);
        }}
        className={`mb-6 rounded border border-dashed p-8 text-center transition ${
          dragging ? "border-gold bg-gold/5" : "border-charcoal/20 bg-white"
        }`}
      >
        <Upload className="mx-auto mb-3 h-8 w-8 text-gold" />
        <h2 className="font-serif text-2xl">Drop media here</h2>
        <p className="mt-1 text-sm text-charcoal/60">
          Images and videos will be stored in the selected category folder.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <select
            value={uploadFolder}
            onChange={(event) => setUploadFolder(event.target.value as typeof uploadFolder)}
            className="rounded border border-charcoal/15 px-3 py-2 text-sm"
          >
            {MEDIA_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoMatch}
              onChange={(event) => setAutoMatch(event.target.checked)}
              className="accent-gold"
            />
            Auto-match by product slug
          </label>
          <button
            onClick={() => inputRef.current?.click()}
            className="bg-charcoal px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white"
          >
            Choose Files
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,video/mp4,video/webm,video/quicktime"
            className="hidden"
            onChange={(event) => event.target.files && uploadFiles(event.target.files)}
          />
        </div>
      </section>

      {!!uploading.length && (
        <div className="mb-6 rounded border border-charcoal/10 bg-white p-4">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-charcoal/50">
            Upload progress
          </p>
          <div className="grid gap-2 md:grid-cols-2">
            {uploading.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between gap-3 rounded bg-nude px-3 py-2 text-sm"
              >
                <span className="truncate">{item.name}</span>
                <span className="text-xs text-charcoal/50">{item.status}</span>
              </div>
            ))}
          </div>
          {!!unmatched.length && (
            <p className="mt-3 text-xs text-amber-700">Unmatched files: {unmatched.join(", ")}</p>
          )}
        </div>
      )}

      <div className="mb-6 grid gap-3 rounded border border-charcoal/10 bg-white p-4 lg:grid-cols-[1fr_160px_160px_auto]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-charcoal/40" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search filename"
            className="w-full rounded border border-charcoal/15 py-3 pl-10 pr-4 text-sm"
          />
        </label>
        <select
          value={type}
          onChange={(event) => setType(event.target.value as typeof type)}
          className="rounded border border-charcoal/15 px-3 py-3 text-sm"
        >
          <option value="all">All media</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
        </select>
        <select
          value={folder}
          onChange={(event) => setFolder(event.target.value as typeof folder)}
          className="rounded border border-charcoal/15 px-3 py-3 text-sm"
        >
          <option value="all">All folders</option>
          {MEDIA_CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <div className="flex rounded border border-charcoal/15">
          <button
            onClick={() => setView("grid")}
            className={`px-3 ${view === "grid" ? "bg-charcoal text-white" : ""}`}
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView("list")}
            className={`px-3 ${view === "list" ? "bg-charcoal text-white" : ""}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mb-6 rounded border border-charcoal/10 bg-white p-4">
        <label className="block max-w-xl">
          <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-charcoal/50">
            Assign selected media to product
          </span>
          <select
            value={selectedProduct}
            onChange={(event) => setSelectedProduct(event.target.value)}
            className="w-full rounded border border-charcoal/15 px-3 py-3 text-sm"
          >
            <option value="">Choose product</option>
            {productsQuery.data?.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {mediaQuery.isLoading ? (
        <State text="Loading media..." />
      ) : mediaQuery.error ? (
        <State text="Could not load media. Confirm storage buckets and policies are applied." />
      ) : filtered.length === 0 ? (
        <State text="No media found in this folder/filter." />
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((asset) => (
            <MediaCard key={`${asset.bucket}:${asset.path}`} asset={asset} onPreview={setPreview} />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded border border-charcoal/10 bg-white">
          {filtered.map((asset) => (
            <button
              key={`${asset.bucket}:${asset.path}`}
              onClick={() => setPreview(asset)}
              className="flex w-full items-center justify-between gap-4 border-b border-charcoal/5 p-4 text-left last:border-0"
            >
              <span className="flex min-w-0 items-center gap-3">
                {asset.type === "image" ? (
                  <ImageIcon className="h-5 w-5 text-gold" />
                ) : (
                  <Play className="h-5 w-5 text-gold" />
                )}
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{asset.name}</span>
                  <span className="block text-xs text-charcoal/50">
                    {asset.folder} - {asset.type}
                  </span>
                </span>
              </span>
              <span className="text-xs text-charcoal/50">
                {asset.updatedAt ? new Date(asset.updatedAt).toLocaleDateString() : "-"}
              </span>
            </button>
          ))}
        </div>
      )}

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded bg-white p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl">{preview.name}</h2>
                <p className="text-xs text-charcoal/50">
                  {preview.bucket}/{preview.path}
                </p>
              </div>
              <button onClick={() => setPreview(null)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-hidden rounded bg-nude">
              {preview.type === "image" ? (
                <img
                  src={preview.url}
                  alt={preview.name}
                  className="max-h-[60vh] w-full object-contain"
                />
              ) : (
                <video src={preview.url} controls className="max-h-[60vh] w-full" />
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={() => copy(preview.url)}
                className="inline-flex items-center gap-2 border border-charcoal/15 px-4 py-2 text-xs uppercase tracking-widest"
              >
                <Copy className="h-4 w-4" /> Copy URL
              </button>
              {preview.type === "image" && (
                <>
                  <button
                    onClick={() => assignAsPrimary(preview.url)}
                    className="border border-charcoal/15 px-4 py-2 text-xs uppercase tracking-widest"
                  >
                    Set primary image
                  </button>
                  <button
                    onClick={() => addGalleryImage(preview.url)}
                    className="border border-charcoal/15 px-4 py-2 text-xs uppercase tracking-widest"
                  >
                    Add gallery image
                  </button>
                </>
              )}
              {preview.type === "video" && (
                <button
                  onClick={() => addProductVideo(preview)}
                  className="border border-charcoal/15 px-4 py-2 text-xs uppercase tracking-widest"
                >
                  Assign video
                </button>
              )}
              <button
                onClick={() => {
                  if (confirm("Delete this media file from storage?")) remove.mutate(preview);
                }}
                className="inline-flex items-center gap-2 border border-red-200 px-4 py-2 text-xs uppercase tracking-widest text-red-600"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MediaCard({
  asset,
  onPreview,
}: {
  asset: MediaAsset;
  onPreview: (asset: MediaAsset) => void;
}) {
  return (
    <button
      onClick={() => onPreview(asset)}
      className="overflow-hidden rounded border border-charcoal/10 bg-white text-left transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="aspect-[4/5] bg-nude">
        {asset.type === "image" ? (
          <img src={asset.url} alt={asset.name} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center">
            <Play className="h-10 w-10 text-gold" />
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-medium">{asset.name}</p>
        <p className="mt-1 text-xs text-charcoal/50">
          {asset.folder} - {asset.type}
        </p>
      </div>
    </button>
  );
}

function State({ text }: { text: string }) {
  return (
    <div className="rounded border border-charcoal/10 bg-white p-10 text-center text-sm text-charcoal/60">
      {text}
    </div>
  );
}
