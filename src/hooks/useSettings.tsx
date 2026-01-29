import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function useSettings() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Fetch current profile and business settings
    const { data: settings, isLoading } = useQuery({
        queryKey: ["settings", user?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user?.id)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: !!user?.id,
    });

    // Mutation to update settings
    const updateSettings = useMutation({
        mutationFn: async (updates: any) => {
            const { error } = await supabase
                .from("profiles")
                .update(updates)
                .eq("id", user?.id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["settings"] });
            queryClient.invalidateQueries({ queryKey: ["profile"] }); // Updates Header identity
            toast.success("Settings updated successfully");
        },
    });

    return { settings, isLoading, updateSettings };
}