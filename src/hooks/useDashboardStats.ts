import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, addDays } from "date-fns";

export interface DashboardStats {
  todaysOrders: number;
  todaysOrdersChange: number;
  pendingDeliveries: number;
  dueThisWeek: number;
  totalDues: number;
  customersWithDues: number;
  monthlyRevenue: number;
  monthlyRevenueChange: number;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard_stats"],
    queryFn: async () => {
      const today = new Date();
      const todayStart = startOfDay(today).toISOString();
      const todayEnd = endOfDay(today).toISOString();
      const monthStart = startOfMonth(today).toISOString();
      const monthEnd = endOfMonth(today).toISOString();
      const weekEnd = addDays(today, 7).toISOString();

      // Today's orders
      const { count: todaysOrders } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .gte("created_at", todayStart)
        .lte("created_at", todayEnd);

      // Pending deliveries (orders not delivered/closed)
      const { count: pendingDeliveries } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .not("status", "in", '("delivered","closed")');

      // Due this week
      const { count: dueThisWeek } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .not("status", "in", '("delivered","closed")')
        .lte("delivery_date", weekEnd.split("T")[0])
        .gte("delivery_date", today.toISOString().split("T")[0]);

      // Get all non-closed orders for dues calculation
      const { data: ordersWithDues } = await supabase
        .from("orders")
        .select("total, advance_amount, customer_id")
        .not("status", "in", '("delivered","closed")');

      let totalDues = 0;
      const customersSet = new Set<string>();
      ordersWithDues?.forEach((o) => {
        const due = (o.total || 0) - (o.advance_amount || 0);
        if (due > 0) {
          totalDues += due;
          customersSet.add(o.customer_id);
        }
      });

      // Monthly revenue (from payments)
      const { data: monthlyPayments } = await supabase
        .from("payments")
        .select("amount")
        .gte("payment_date", monthStart.split("T")[0])
        .lte("payment_date", monthEnd.split("T")[0]);

      const monthlyRevenue = monthlyPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      return {
        todaysOrders: todaysOrders || 0,
        todaysOrdersChange: 12, // Mock for now
        pendingDeliveries: pendingDeliveries || 0,
        dueThisWeek: dueThisWeek || 0,
        totalDues,
        customersWithDues: customersSet.size,
        monthlyRevenue,
        monthlyRevenueChange: 8.5, // Mock for now
      } as DashboardStats;
    },
  });
}

export interface RecentOrder {
  id: string;
  order_number: string;
  status: string;
  total: number;
  delivery_date: string | null;
  customers: {
    name: string;
  } | null;
  order_items: {
    garment_type: string;
    quantity: number;
  }[];
}

export function useRecentOrders(limit = 5) {
  return useQuery({
    queryKey: ["recent_orders", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id, order_number, status, total, delivery_date,
          customers (name),
          order_items (garment_type, quantity)
        `)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as RecentOrder[];
    },
  });
}

export interface UpcomingDelivery {
  id: string;
  order_number: string;
  delivery_date: string;
  priority: boolean;
  customers: {
    name: string;
    phone: string;
  } | null;
  order_items: {
    garment_type: string;
    quantity: number;
  }[];
}

export function useUpcomingDeliveries(limit = 5) {
  return useQuery({
    queryKey: ["upcoming_deliveries", limit],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const weekEnd = addDays(new Date(), 14).toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("orders")
        .select(`
          id, order_number, delivery_date, priority,
          customers (name, phone),
          order_items (garment_type, quantity)
        `)
        .not("status", "in", '("delivered","closed")')
        .gte("delivery_date", today)
        .lte("delivery_date", weekEnd)
        .order("delivery_date", { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data as UpcomingDelivery[];
    },
  });
}