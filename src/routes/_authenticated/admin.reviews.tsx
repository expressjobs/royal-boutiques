import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/reviews")({
  component: AdminReviews,
});

function AdminReviews() {
  const qc = useQueryClient();
  const { data: reviews = [] } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => (await supabase.from("reviews").select("*, product:products(name), profile:profiles(full_name)").order("created_at", { ascending: false })).data ?? [],
  });

  const toggle = async (id: string, is_approved: boolean) => {
    await supabase.from("reviews").update({ is_approved: !is_approved }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-reviews"] });
  };
  const del = async (id: string) => {
    if (!confirm("Delete this review?")) return;
    await supabase.from("reviews").delete().eq("id", id);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin-reviews"] });
  };

  return (
    <div>
      <h1 className="font-serif text-3xl mb-8">Reviews</h1>
      <div className="space-y-4">
        {reviews.length === 0 && <p className="text-charcoal/60">No reviews yet.</p>}
        {reviews.map((r: any) => (
          <div key={r.id} className="bg-white rounded-2xl p-6 border border-charcoal/5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <p className="font-medium">{r.product?.name}</p>
                <p className="text-xs text-charcoal/60">{r.profile?.full_name ?? "Customer"} · {new Date(r.created_at).toLocaleDateString()}</p>
                <div className="flex gap-0.5 mt-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-3 w-3 ${i < r.rating ? "fill-gold text-gold" : "text-charcoal/20"}`} />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggle(r.id, r.is_approved)} className={`text-[10px] px-3 py-1.5 uppercase tracking-widest font-semibold rounded ${r.is_approved ? "bg-emerald-50 text-emerald-700" : "bg-charcoal/10"}`}>
                  {r.is_approved ? "Approved" : "Hidden"}
                </button>
                <button onClick={() => del(r.id)} className="p-2 text-charcoal/50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <p className="text-sm text-charcoal/80">{r.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
