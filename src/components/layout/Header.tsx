import { useState, useEffect } from "react";
import { Search, User, LogOut, Settings, Building2, ClipboardList, Users, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { MobileSidebar } from "./MobileSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // 1. DATA ROBUSTNESS: Fetching the real name from public.profiles
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!user?.id,
  });

  // 2. KEYBOARD SHORTCUT: Implement ⌘K / Ctrl+K listener
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Priority logic for display name
  const fullName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Staff Member";
  const userInitial = fullName.charAt(0).toUpperCase();

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <MobileSidebar />
          <div className="min-w-0 flex flex-col">
            <h1 className="font-display text-sm md:text-lg font-bold text-foreground truncate uppercase tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[10px] md:text-xs text-muted-foreground truncate hidden sm:block font-medium">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* SEARCH TRIGGER: Replaces static input with Command Palette trigger */}
          {/* <Button
            variant="outline"
            size="sm"
            className="hidden lg:flex items-center gap-2 text-muted-foreground w-48 xl:w-64 justify-start bg-secondary/30 hover:bg-secondary/50 border-none transition-all"
            onClick={() => setOpen(true)}
          >
            <Search className="h-4 w-4" />
            <span className="text-xs">Search orders, customers...</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button> */}

          {/* USER MENU: Dynamic naming fixed */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 md:w-auto md:h-10 md:gap-2 md:px-3 rounded-full md:rounded-md hover:bg-accent">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground border border-primary/20">
                  <span className="text-xs font-bold">{userInitial}</span>
                </div>
                <span className="hidden md:inline-block text-sm font-semibold truncate max-w-[120px]">
                  {fullName}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 mt-2 shadow-xl border-border/50">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold leading-none">{fullName}</p>
                  <p className="text-xs leading-none text-muted-foreground italic truncate">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
                <User className="h-4 w-4 mr-2" />Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer">
                <Settings className="h-4 w-4 mr-2" />Business Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer">
                <LogOut className="h-4 w-4 mr-2" />Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* COMMAND PALETTE DIALOG */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search everything (customers, orders, jobs)..." />
        <CommandList className="max-h-[450px]">
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Quick Actions">
            <CommandItem onSelect={() => { navigate("/quotations/new"); setOpen(false); }} className="cursor-pointer">
              <Plus className="mr-2 h-4 w-4" /> New Quotation
            </CommandItem>
            <CommandItem onSelect={() => { navigate("/customers/new"); setOpen(false); }} className="cursor-pointer">
              <Users className="mr-2 h-4 w-4" /> Register New Customer
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => { navigate("/orders"); setOpen(false); }} className="cursor-pointer">
              <ClipboardList className="mr-2 h-4 w-4" /> View All Orders
            </CommandItem>
            <CommandItem onSelect={() => { navigate("/measurements"); setOpen(false); }} className="cursor-pointer">
              <Search className="mr-2 h-4 w-4" /> Measurement Records
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}