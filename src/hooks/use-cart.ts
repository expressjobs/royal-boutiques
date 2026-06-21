import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { toast } from "sonner";

export type CartItem = {
  id: string;
  product_id: string;
  quantity: number;
  size: string | null;
  color: string | null;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    sale_price: number | null;
    image_url: string | null;
    stock: number;
  };
};

async function getOrCreateCart(userId: string) {
  const { data: existing } = await supabase.from("carts").select("id").eq("user_id", userId).maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await supabase.from("carts").insert({ user_id: userId }).select("id").single();
  if (error) throw error;
  return data.id;
}

export function useCart() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["cart", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [] as CartItem[];
      const cartId = await getOrCreateCart(user.id);
      const { data, error } = await supabase
        .from("cart_items")
        .select("id, product_id, quantity, size, color, product:products(id, name, slug, price, sale_price, image_url, stock)")
        .eq("cart_id", cartId);
      if (error) throw error;
      return (data ?? []) as unknown as CartItem[];
    },
  });

  const add = useMutation({
    mutationFn: async (input: { productId: string; quantity?: number; size?: string | null; color?: string | null }) => {
      if (!user) throw new Error("Please sign in to add to cart");
      const cartId = await getOrCreateCart(user.id);
      const { data: existing } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("cart_id", cartId)
        .eq("product_id", input.productId)
        .eq("size", input.size ?? "")
        .eq("color", input.color ?? "")
        .maybeSingle();
      if (existing) {
        const { error } = await supabase.from("cart_items").update({ quantity: existing.quantity + (input.quantity ?? 1) }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("cart_items").insert({
          cart_id: cartId,
          product_id: input.productId,
          quantity: input.quantity ?? 1,
          size: input.size ?? null,
          color: input.color ?? null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Added to bag");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateQty = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      if (quantity <= 0) {
        const { error } = await supabase.from("cart_items").delete().eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("cart_items").update({ quantity }).eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cart_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Removed from bag");
    },
  });

  const clear = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const cartId = await getOrCreateCart(user.id);
      const { error } = await supabase.from("cart_items").delete().eq("cart_id", cartId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  const items = query.data ?? [];
  const subtotal = items.reduce((sum, it) => sum + (Number(it.product.sale_price ?? it.product.price)) * it.quantity, 0);
  const count = items.reduce((sum, it) => sum + it.quantity, 0);

  return { items, subtotal, count, isLoading: query.isLoading, add, updateQty, remove, clear };
}
