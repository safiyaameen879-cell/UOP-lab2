import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/staff")({
  head: () => ({
    meta: [
      { title: "Staff access — UOP IT Lab Monitoring" },
      { name: "description", content: "Grant and revoke staff and administrator roles." },
      { property: "og:title", content: "Staff access" },
      { property: "og:description", content: "Role management." },
    ],
  }),
  component: Staff,
});

function Staff() {
  const { isAdmin, session } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["staff"],
    enabled: isAdmin,
    queryFn: async () => {
      const [{ data: p }, { data: r }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at"),
        supabase.from("user_roles").select("*"),
      ]);
      return (p ?? []).map((x) => ({ ...x, roles: (r ?? []).filter((y) => y.user_id === x.id).map((y) => y.role) }));
    },
  });
  if (!isAdmin) return <p>Administrators only.</p>;

  async function toggle(uid: string, role: "admin" | "staff", has: boolean) {
    const { error } = has
      ? await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", role)
      : await supabase.from("user_roles").insert({ user_id: uid, role });
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["staff"] });
  }

  return (
    <div>
      <PageHeader title="Staff access" sub="New accounts have no access until granted a role here" />
      <div className="panel overflow-x-auto">
        <table className="tbl">
          <thead><tr><th>Name</th><th>Email</th><th>Lab staff</th><th>Administrator</th></tr></thead>
          <tbody>
            {q.data?.map((u) => {
              const self = u.id === session?.user.id;
              return (
                <tr key={u.id}>
                  <td>{u.full_name ?? "—"}</td><td>{u.email}</td>
                  {(["staff", "admin"] as const).map((role) => {
                    const has = u.roles.includes(role);
                    return <td key={role}><Button size="sm" disabled={self} variant={has ? "hero" : "outline"} onClick={() => toggle(u.id, role, has)}>{has ? "Granted" : "Grant"}</Button></td>;
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
