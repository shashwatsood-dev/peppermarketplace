import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPods } from "./db-store";
import type { PodV2 } from "./talent-client-types";

export function usePods() {
  return useQuery<PodV2[]>({
    queryKey: ["pods"],
    queryFn: fetchPods,
    staleTime: 5000,
  });
}

export function useRefreshPods() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["pods"] });
}
