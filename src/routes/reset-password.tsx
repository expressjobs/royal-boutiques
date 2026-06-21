import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { BoutiqueLayout } from "@/components/layout/BoutiqueLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset Password — Royal Boutiques" }] }),
  component: ResetPage,
});

function ResetPage() {
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    navigate({ to: "/account" });
  };
  return (
    <BoutiqueLayout>
      <div className="max-w-md mx-auto px-6 py-16">
        <h1 className="font-serif text-4xl text-center mb-8">Set New Password</h1>
        <form onSubmit={submit} className="space-y-4">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" minLength={8} required className="w-full border border-charcoal/15 px-4 py-3 text-sm rounded" />
          <button className="w-full bg-charcoal text-white py-4 text-[11px] uppercase tracking-[0.25em] font-semibold">Update Password</button>
        </form>
      </div>
    </BoutiqueLayout>
  );
}
