import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RecruiterProfile {
  user_id: string;
  name: string;
  email: string;
}

export function useRecruiters() {
  return useQuery({
    queryKey: ["recruiters"],
    queryFn: async (): Promise<RecruiterProfile[]> => {
      // Get all users with admin role (admins are recruiters)
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (!adminRoles?.length) return [];

      const userIds = adminRoles.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name, email")
        .in("user_id", userIds);

      return (profiles || []).map(p => ({
        user_id: p.user_id,
        name: p.name || p.email || "Unknown",
        email: p.email,
      }));
    },
  });
}
