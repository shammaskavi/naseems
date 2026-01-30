import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MeasurementProfile {
  id: string;
  customer_id: string;
  name: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface MeasurementSet {
  id: string;
  order_item_id: string | null;
  customer_id: string | null;
  measurement_profile_id: string | null;
  // Upper body
  shoulder: number | null;
  chest: number | null;
  mid_chest: number | null;
  stomach: number | null;
  hip_upper: number | null;
  neck: number | null;
  arm: number | null;
  elbow: number | null;
  cuff: number | null;
  c_front: number | null;
  c_back: number | null;
  h_back: number | null;
  sleeve: number | null;
  // Lower body
  high_waist: number | null;
  low_waist: number | null;
  hip_lower: number | null;
  inseam: number | null;
  thigh: number | null;
  knee: number | null;
  calf: number | null;
  fork: number | null;
  bottom: number | null;
  // Fit & notes
  fit_type: "regular" | "slim" | "comfort";
  body_posture: string | null;
  design_notes: string | null;
  reference_images: string[] | null;
  created_at: string;
  updated_at: string;
}

export function useMeasurementProfiles(customerId: string | undefined) {
  return useQuery({
    queryKey: ["measurement_profiles", customerId],
    queryFn: async () => {
      if (!customerId) return [];
      const { data, error } = await supabase
        .from("measurement_profiles")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as MeasurementProfile[];
    },
    enabled: !!customerId,
  });
}

export function useMeasurementSet(orderItemId: string | undefined) {
  return useQuery({
    queryKey: ["measurement_sets", orderItemId],
    queryFn: async () => {
      if (!orderItemId || orderItemId === "new") return null;
      const { data, error } = await supabase
        .from("measurement_sets")
        .select("*")
        .eq("order_item_id", orderItemId)
        .maybeSingle();

      if (error) throw error;
      return data as MeasurementSet | null;
    },
    enabled: !!orderItemId && orderItemId !== "new",
  });
}

// NEW HOOK: Fetches all measurements for a customer (History)
export function useCustomerMeasurements(customerId?: string) {
  return useQuery({
    queryKey: ["customer_measurements_history", customerId],
    queryFn: async () => {
      if (!customerId) return [];

      const { data, error } = await supabase
        .from("measurement_sets")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as MeasurementSet[];
    },
    enabled: !!customerId,
  });
}

export function useLatestCustomerMeasurement(customerId: string | undefined) {
  return useQuery({
    queryKey: ["latest_measurement", customerId],
    queryFn: async () => {
      if (!customerId) return null;

      // Updated: Check for direct customer_id link first, then fallback to order_items join
      const { data, error } = await supabase
        .from("measurement_sets")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as MeasurementSet | null;
    },
    enabled: !!customerId,
  });
}

export function useCreateMeasurementSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (measurement: Omit<MeasurementSet, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("measurement_sets")
        .insert(measurement)
        .select()
        .single();

      if (error) throw error;

      // Only update order status if this measurement is linked to an order item
      if (measurement.order_item_id) {
        await checkAndUpdateOrderStatus(measurement.order_item_id);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["measurement_sets"] });
      queryClient.invalidateQueries({ queryKey: ["customer_measurements_history", variables.customer_id] });
      queryClient.invalidateQueries({ queryKey: ["latest_measurement", variables.customer_id] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Measurements saved successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to save measurements: ${error.message}`);
    },
  });
}

export function useUpdateMeasurementSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...measurement }: Partial<MeasurementSet> & { id: string }) => {
      const { data, error } = await supabase
        .from("measurement_sets")
        .update(measurement)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["measurement_sets"] });
      queryClient.invalidateQueries({ queryKey: ["customer_measurements_history", data.customer_id] });
      queryClient.invalidateQueries({ queryKey: ["latest_measurement", data.customer_id] });
      toast.success("Measurements updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update measurements: ${error.message}`);
    },
  });
}

async function checkAndUpdateOrderStatus(orderItemId: string) {
  const { data: orderItem } = await supabase
    .from("order_items")
    .select("order_id")
    .eq("id", orderItemId)
    .single();

  if (!orderItem) return;

  const { data: allItems } = await supabase
    .from("order_items")
    .select("id")
    .eq("order_id", orderItem.order_id);

  if (!allItems || allItems.length === 0) return;

  const { data: measurements } = await supabase
    .from("measurement_sets")
    .select("order_item_id")
    .in("order_item_id", allItems.map((i) => i.id));

  const allMeasured = measurements && measurements.length >= allItems.length;

  if (allMeasured) {
    await supabase
      .from("orders")
      .update({ status: "in_production" })
      .eq("id", orderItem.order_id)
      .eq("status", "measurement_pending");
  }
}