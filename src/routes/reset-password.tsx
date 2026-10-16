import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/brand";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set new password — UOP IT Lab Monitoring" },
      { name: "description", content: "Choose a new password for your staff account." },
      { property: "og:title", content: "Set new password" },
      { property: "og:description", content: "Staff password reset." },
    ],
  }),
  component: Reset,
});

function Reset() {
  const [pw, setPw] = useState("");
  const nav = useNavigate();
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-soft p-6">
      <form
        className="panel w-full max-w-sm space-y-4 p-7"
        onSubmit={async (e) => {
          e.preventDefault();
          const { error } = await supabase.auth.updateUser({ password: pw });
          if (error) return toast.error(error.message);
          toast.success("Password updated");
          nav({ to: "/dashboard" });
        }}
      >
        <Brand compact />
        <h2 className="text-2xl font-semibold">Set a new password</h2>
        <input className="field" type="password" minLength={8} required value={pw} onChange={(e) => setPw(e.target.value)} />
        <Button variant="hero" className="w-full" type="submit">Update password</Button>
      </form>
    </div>
  );
}
