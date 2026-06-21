import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useRef, useState, useCallback } from "react";
import { Upload, X, Star, Loader2 } from "lucide-react";

const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 10; // 10 years

type ImgRow = {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number;
};

async function uploadOne(productId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${productId}/${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from("product-images")
    .upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
  if (upErr) throw upErr;
  const { data: signed, error: sErr } = await supabase.storage
    .from("product-images")
    .createSignedUrl(path, SIGNED_URL_TTL);
  if (sErr || !signed?.signedUrl) throw sErr ?? new Error("Failed to sign URL");
  return signed.signedUrl;
}

export function ImageUploader({ productId, primaryUrl, onPrimaryChange }: {
  productId: string;
  primaryUrl?: string | null;
  onPrimaryChange?: (url: string) => void;
}) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const { data: images = [], isLoading } = useQuery({
    queryKey: ["product-images", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_images")
        .select("*")
        .eq("product_id", productId)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as ImgRow[];
    },
  });

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!arr.length) return;
    setProgress({ done: 0, total: arr.length });
    try {
      let next = (images[images.length - 1]?.sort_order ?? -1) + 1;
      for (const file of arr) {
        const url = await uploadOne(productId, file);
        const { error } = await supabase.from("product_images").insert({
          product_id: productId,
          image_url: url,
          sort_order: next++,
        });
        if (error) throw error;
        setProgress((p) => (p ? { ...p, done: p.done + 1 } : null));
      }
      toast.success(`Uploaded ${arr.length} image${arr.length > 1 ? "s" : ""}`);
      qc.invalidateQueries({ queryKey: ["product-images", productId] });
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setProgress(null);
    }
  }, [images, productId, qc]);

  const del = useMutation({
    mutationFn: async (img: ImgRow) => {
      // Try to extract storage path from URL to also clean the object
      const match = img.image_url.match(/product-images\/([^?]+)/);
      if (match) await supabase.storage.from("product-images").remove([match[1]]);
      const { error } = await supabase.from("product_images").delete().eq("id", img.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product-images", productId] });
      toast.success("Image removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${
          dragging ? "border-gold bg-gold/5" : "border-charcoal/15 hover:border-gold/60 bg-nude"
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        {progress ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-gold" />
            <p className="text-sm">Uploading {progress.done}/{progress.total}…</p>
          </div>
        ) : (
          <>
            <Upload className="h-6 w-6 text-gold mx-auto mb-2" />
            <p className="text-sm font-medium">Drop images or click to upload</p>
            <p className="text-xs text-charcoal/50 mt-1">PNG, JPG, WEBP · up to 20MB each</p>
          </>
        )}
      </div>

      {isLoading ? (
        <p className="text-xs text-charcoal/50">Loading gallery…</p>
      ) : images.length > 0 ? (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {images.map((img) => {
            const isPrimary = primaryUrl === img.image_url;
            return (
              <div key={img.id} className="relative group aspect-square bg-soft rounded-xl overflow-hidden border border-charcoal/5">
                <img src={img.image_url} alt="Product" className="h-full w-full object-cover" />
                {isPrimary && (
                  <span className="absolute top-1 left-1 bg-gold text-white text-[9px] uppercase px-1.5 py-0.5 rounded font-bold tracking-wider">
                    Primary
                  </span>
                )}
                <div className="absolute inset-0 bg-charcoal/0 group-hover:bg-charcoal/40 transition flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                  {onPrimaryChange && !isPrimary && (
                    <button
                      type="button"
                      onClick={() => { onPrimaryChange(img.image_url); toast.success("Set as primary"); }}
                      aria-label="Set as primary"
                      className="bg-white text-charcoal p-1.5 rounded-full hover:bg-gold hover:text-white"
                    >
                      <Star className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => { if (confirm("Remove this image?")) del.mutate(img); }}
                    aria-label="Delete"
                    className="bg-white text-charcoal p-1.5 rounded-full hover:bg-red-600 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-charcoal/50 text-center py-4">No gallery images yet.</p>
      )}
    </div>
  );
}
