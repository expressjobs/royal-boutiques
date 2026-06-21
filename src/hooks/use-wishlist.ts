import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { toast } from "sonner";

export function useWishlist() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["wishlist", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wishlist_items")
        .select("id, product_id, product:products(id, name, slug, price, sale_price, image_url, stock, rating)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const toggle = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error("Please sign in to save favorites");
      const { data: existing } = await supabase
        .from("wishlist_items")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .maybeSingle();
      if (existing) {
        await supabase.from("wishlist_items").delete().eq("id", existing.id);
        return "removed" as const;
      }
      await supabase.from("wishlist_items").insert({ user_id: user.id, product_id: productId });
      return "added" as const;
    },
    onSuccess: (action) => {
      qc.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success(action === "added" ? "Saved to wishlist" : "Removed from wishlist");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const ids = new Set((query.data ?? []).map((i) => i.product_id));

  return { items: query.data ?? [], ids, isLoading: query.isLoading, toggle };
}
