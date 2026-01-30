import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { cn } from "@/lib/utils";

export function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  // We mirror the state here to handle padding
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <div className="min-h-screen bg-background">
      {/* Pass state to Sidebar if you update Sidebar to accept props */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      <div className={cn(
        "transition-all duration-300",
        // Padding changes based on collapse state on large screens
        isCollapsed ? "lg:pl-20" : "lg:pl-64"
      )}>
        <Header title={title} subtitle={subtitle} />
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}