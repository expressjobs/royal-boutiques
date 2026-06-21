import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BoutiqueLayout } from "@/components/layout/BoutiqueLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign In — Royal Boutiques" }] }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/account" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
        navigate({ to: "/account" });
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: `${window.location.origin}/account`,
          },
        });
        if (error) throw error;
        toast.success("Account created");
        navigate({ to: "/account" });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Check your email for a reset link");
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/account` },
    });
    if (error) {
      toast.error("Google sign-in failed");
      setBusy(false);
    }
  };

  return (
    <BoutiqueLayout>
      <div className="max-w-md mx-auto px-6 py-16">
        <p className="eyebrow text-gold text-center">The Royal Boutiques Circle</p>
        <h1 className="font-serif text-4xl text-center mt-3 mb-2">
          {mode === "signin"
            ? "Welcome Back"
            : mode === "signup"
              ? "Create Account"
              : "Reset Password"}
        </h1>
        <p className="text-center text-sm text-charcoal/60 mb-10">
          {mode === "signin"
            ? "Sign in to continue shopping."
            : mode === "signup"
              ? "Join us for early access and exclusive offers."
              : "We'll email you a reset link."}
        </p>

        <button
          onClick={google}
          disabled={busy}
          className="w-full border border-charcoal/20 py-4 text-[11px] uppercase tracking-[0.25em] font-semibold flex items-center justify-center gap-3 hover:bg-nude transition mb-6"
        >
          Continue with Google
        </button>
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-px bg-charcoal/10" />
          </div>
          <div className="relative text-center">
            <span className="bg-white px-4 text-[10px] uppercase tracking-widest text-charcoal/50">
              Or with email
            </span>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name"
              required
              className="w-full border border-charcoal/15 px-4 py-3 text-sm rounded focus:outline-none focus:border-gold"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full border border-charcoal/15 px-4 py-3 text-sm rounded focus:outline-none focus:border-gold"
          />
          {mode !== "forgot" && (
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              minLength={8}
              required
              className="w-full border border-charcoal/15 px-4 py-3 text-sm rounded focus:outline-none focus:border-gold"
            />
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-charcoal text-white py-4 text-[11px] uppercase tracking-[0.25em] font-semibold disabled:opacity-50"
          >
            {busy
              ? "..."
              : mode === "signin"
                ? "Sign In"
                : mode === "signup"
                  ? "Create Account"
                  : "Send Reset Link"}
          </button>
        </form>

        <div className="mt-8 text-center text-sm space-y-2">
          {mode === "signin" && (
            <>
              <p>
                <button
                  onClick={() => setMode("forgot")}
                  className="text-charcoal/60 hover:text-gold"
                >
                  Forgot your password?
                </button>
              </p>
              <p className="text-charcoal/60">
                New here?{" "}
                <button onClick={() => setMode("signup")} className="text-charcoal underline">
                  Create an account
                </button>
              </p>
            </>
          )}
          {mode === "signup" && (
            <p className="text-charcoal/60">
              Already have an account?{" "}
              <button onClick={() => setMode("signin")} className="text-charcoal underline">
                Sign in
              </button>
            </p>
          )}
          {mode === "forgot" && (
            <p>
              <button
                onClick={() => setMode("signin")}
                className="text-charcoal/60 hover:text-gold"
              >
                Back to sign in
              </button>
            </p>
          )}
        </div>

        <Link
          to="/"
          className="block text-center mt-10 text-xs uppercase tracking-widest text-charcoal/40 hover:text-charcoal"
        >
          Back to boutique
        </Link>
      </div>
    </BoutiqueLayout>
  );
}
