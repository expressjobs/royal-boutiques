import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/account/")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({ full_name: "", phone: "", address: "", city: "", country: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) setProfile({
        full_name: data.full_name ?? "", phone: data.phone ?? "",
        address: data.address ?? "", city: data.city ?? "", country: data.country ?? "",
      });
    });
  }, [user]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({ id: user.id, ...profile });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
  };

  return (
    <form onSubmit={save} className="space-y-5 max-w-lg">
      <h2 className="font-serif text-2xl mb-4">Your Details</h2>
      <p className="text-sm text-charcoal/60 mb-6">{user?.email}</p>
      <Field label="Full Name" value={profile.full_name} onChange={(v) => setProfile({ ...profile, full_name: v })} />
      <Field label="Phone" value={profile.phone} onChange={(v) => setProfile({ ...profile, phone: v })} />
      <Field label="Address" value={profile.address} onChange={(v) => setProfile({ ...profile, address: v })} />
      <div className="grid grid-cols-2 gap-4">
        <Field label="City" value={profile.city} onChange={(v) => setProfile({ ...profile, city: v })} />
        <Field label="Country" value={profile.country} onChange={(v) => setProfile({ ...profile, country: v })} />
      </div>
      <button disabled={saving} className="bg-charcoal text-white px-8 py-3 text-[11px] uppercase tracking-[0.25em] font-semibold disabled:opacity-50">
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="eyebrow text-charcoal/60 mb-2 block">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full border border-charcoal/15 px-4 py-3 text-sm rounded focus:outline-none focus:border-gold" />
    </label>
  );
}
