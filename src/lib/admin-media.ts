import { supabase } from "@/integrations/supabase/client";

export const MEDIA_CATEGORIES = [
  "women",
  "men",
  "kids",
  "shoes",
  "jewelry",
  "home-living",
  "beauty",
  "sale",
  "uncategorized",
] as const;

export type MediaCategory = (typeof MEDIA_CATEGORIES)[number];
export type MediaType = "image" | "video";

export type MediaAsset = {
  bucket: "product-images" | "product-videos";
  name: string;
  path: string;
  folder: string;
  type: MediaType;
  size: number;
  updatedAt: string | null;
  url: string;
};

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

export function getMediaType(file: File): MediaType | null {
  if (IMAGE_TYPES.includes(file.type)) return "image";
  if (VIDEO_TYPES.includes(file.type)) return "video";
  return null;
}

export function bucketForType(type: MediaType) {
  return type === "image" ? "product-images" : "product-videos";
}

export function sanitizeFileName(name: string) {
  const dot = name.lastIndexOf(".");
  const base = dot >= 0 ? name.slice(0, dot) : name;
  const ext = dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
  const safeBase =
    base
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "media";
  return { base: safeBase, ext };
}

export function createStoragePath(file: File, folder: string) {
  const { base, ext } = sanitizeFileName(file.name);
  const suffix = `${Date.now()}-${crypto.randomUUID()}`;
  return `${folder || "uncategorized"}/${base}-${suffix}${ext ? `.${ext}` : ""}`;
}

export async function uploadMediaFile(file: File, folder: string) {
  const type = getMediaType(file);
  if (!type) throw new Error(`${file.name} is not a supported image or video file.`);

  const bucket = bucketForType(type);
  const path = createStoragePath(file, folder);
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return {
    bucket,
    path,
    folder: path.split("/")[0] ?? "uncategorized",
    type,
    url: data.publicUrl,
  };
}

export async function listMediaFolder(bucket: "product-images" | "product-videos", folder: string) {
  const { data, error } = await supabase.storage.from(bucket).list(folder, {
    limit: 1000,
    offset: 0,
    sortBy: { column: "updated_at", order: "desc" },
  });
  if (error) throw error;

  return (data ?? [])
    .filter((item) => item.name && item.id !== null)
    .map((item) => {
      const path = `${folder}/${item.name}`;
      const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path);
      return {
        bucket,
        name: item.name,
        path,
        folder,
        type: bucket === "product-images" ? "image" : "video",
        size: item.metadata?.size ?? 0,
        updatedAt: item.updated_at ?? null,
        url: publicData.publicUrl,
      } satisfies MediaAsset;
    });
}

export async function deleteMedia(asset: MediaAsset) {
  const { error } = await supabase.storage.from(asset.bucket).remove([asset.path]);
  if (error) throw error;
}
