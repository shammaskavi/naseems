import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentOrders } from "@/components/dashboard/RecentOrders";
import { UpcomingDeliveries } from "@/components/dashboard/UpcomingDeliveries";
import { QuickActions } from "@/components/dashboard/QuickActions";
import {
  ClipboardList,
  Clock,
  IndianRupee,
  TrendingUp,
} from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();
  const currentMonth = new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <AppLayout
      title="Dashboard"
      subtitle={`Welcome back! Here's your business overview for ${new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}`}
    >
      <div className="space-y-4 md:space-y-6 animate-fade-in">
        {/* Stats Grid */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Today's Orders"
            value={isLoading ? "..." : stats?.todaysOrders.toString() || "0"}
            subtitle={isLoading ? "Loading..." : `${stats?.pendingDeliveries || 0} pending total`}
            icon={ClipboardList}
            trend={stats?.todaysOrders ? { value: stats.todaysOrdersChange, isPositive: true } : undefined}
            variant="primary"
          />
          <StatCard
            title="Pending Deliveries"
            value={isLoading ? "..." : stats?.pendingDeliveries.toString() || "0"}
            subtitle={isLoading ? "Loading..." : `${stats?.dueThisWeek || 0} due this week`}
            icon={Clock}
            variant="warning"
          />
          <StatCard
            title="Total Dues"
            value={isLoading ? "..." : `₹${(stats?.totalDues || 0).toLocaleString("en-IN")}`}
            subtitle={isLoading ? "Loading..." : `From ${stats?.customersWithDues || 0} customers`}
            icon={IndianRupee}
            variant="gold"
          />
          <StatCard
            title="Monthly Revenue"
            value={isLoading ? "..." : `₹${(stats?.monthlyRevenue || 0).toLocaleString("en-IN")}`}
            subtitle={currentMonth}
            icon={TrendingUp}
            trend={stats?.monthlyRevenue ? { value: stats.monthlyRevenueChange, isPositive: true } : undefined}
            variant="success"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
          {/* Recent Orders - Takes 2 columns on large screens */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <RecentOrders />
          </div>

          {/* Right Sidebar - Shows first on mobile for quick actions */}
          <div className="space-y-4 md:space-y-6 order-1 lg:order-2">
            <QuickActions />
            <UpcomingDeliveries />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}