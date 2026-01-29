import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Worker {
  id: string;
  name: string;
  phone: string | null;
  specialization: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useWorkers() {
  return useQuery({
    queryKey: ["workers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workers")
        .select("*")
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data as Worker[];
    },
  });
}

export function useAllWorkers() {
  return useQuery({
    queryKey: ["workers", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workers")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as Worker[];
    },
  });
}

export function useCreateWorker() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (worker: Omit<Worker, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("workers")
        .insert(worker)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workers"] });
      toast.success("Worker added successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to add worker: ${error.message}`);
    },
  });
}

export function useUpdateWorker() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...worker }: Partial<Worker> & { id: string }) => {
      const { data, error } = await supabase
        .from("workers")
        .update(worker)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workers"] });
      toast.success("Worker updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update worker: ${error.message}`);
    },
  });
}

export function useDeleteWorker() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("workers")
        .update({ is_active: false })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workers"] });
      toast.success("Worker removed successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove worker: ${error.message}`);
    },
  });
}
