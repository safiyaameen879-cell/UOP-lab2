import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Staff sign in — UOP IT Lab Monitoring" },
      { name: "description", content: "Sign in for Department of IT laboratory staff and administrators." },
      { property: "og:title", content: "Staff sign in — UOP IT Lab Monitoring" },
      { property: "og:description", content: "Secure access for laboratory staff." },
    ],
  }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const { session } = useAuth();
  const [mode, setMode] = useState<"in" | "up" | "reset">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) nav({ to: "/dashboard" });
  }, [session, nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === "up") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/dashboard", data: { full_name: name } },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account. An administrator must then grant you access.");
        setMode("in");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/reset-password" });
        if (error) throw error;
        toast.success("Password reset link sent.");
        setMode("in");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden flex-col justify-between bg-charcoal p-10 md:flex">
        <Brand light />
        <div>
          <div className="mb-6 h-1.5 w-20 rounded bg-gradient-gold" />
          <h1 className="text-4xl font-semibold text-charcoal-foreground">Laboratory Usage Monitoring</h1>
          <p className="mt-3 max-w-md text-sidebar-foreground/70">
            Restricted to authorised Department of IT staff. QR code access does not grant administrative privileges.
          </p>
        </div>
        <p className="text-xs text-sidebar-foreground/50">© University of Peradeniya</p>
      </div>
      <div className="flex items-center justify-center bg-gradient-soft p-6">
        <form onSubmit={submit} className="panel w-full max-w-sm space-y-4 p-7">
          <div className="md:hidden">
            <Brand compact />
          </div>
          <h2 className="text-2xl font-semibold">
            {mode === "in" ? "Staff sign in" : mode === "up" ? "Request staff account" : "Reset password"}
          </h2>
          {mode === "up" && (
            <div>
              <label className="field-label">Full name</label>
              <input className="field" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          )}
          <div>
            <label className="field-label">Email</label>
            <input className="field" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {mode !== "reset" && (
            <div>
              <label className="field-label">Password</label>
              <input className="field" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          )}
          <Button type="submit" variant="hero" className="w-full" disabled={busy}>
            {busy ? "Please wait…" : mode === "in" ? "Sign in" : mode === "up" ? "Create account" : "Send reset link"}
          </Button>
          <div className="flex justify-between text-sm">
            {mode === "in" ? (
              <>
                <button type="button" className="text-gold-deep hover:underline" onClick={() => setMode("up")}>Request account</button>
                <button type="button" className="text-muted-foreground hover:underline" onClick={() => setMode("reset")}>Forgot password?</button>
              </>
            ) : (
              <button type="button" className="text-gold-deep hover:underline" onClick={() => setMode("in")}>Back to sign in</button>
            )}
          </div>
          <Link to="/" className="block text-center text-xs text-muted-foreground hover:underline">← Public home</Link>
        </form>
      </div>
    </div>
  );
}
