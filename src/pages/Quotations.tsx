import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  FilePlus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Copy,
  Send,
  Lock,
  FileDown,
  Share2,
  ClipboardList,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuotations, useUpdateQuotationStatus, useCreateQuotation } from "@/hooks/useQuotations";
import { useCreateOrderFromQuotation } from "@/hooks/useOrders";
import { toast } from "sonner";

type QuotationStatus = "draft" | "sent" | "revised" | "approved" | "locked" | "expired";

const statusConfig: Record<QuotationStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "status-badge status-draft" },
  sent: { label: "Sent", className: "status-badge status-sent" },
  revised: { label: "Revised", className: "status-badge bg-info/15 text-info" },
  approved: { label: "Approved", className: "status-badge status-approved" },
  locked: { label: "Locked", className: "status-badge status-locked" },
  expired: { label: "Expired", className: "status-badge status-expired" },
};

export default function Quotations() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const { data: quotations = [], isLoading } = useQuotations();
  const updateStatus = useUpdateQuotationStatus();
  const createOrder = useCreateOrderFromQuotation();

  const filteredQuotations = quotations.filter((q) => {
    const matchesSearch =
      q.customers?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.quotation_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.customers?.phone.includes(searchQuery);

    if (activeTab === "all") return matchesSearch;
    return matchesSearch && q.status === activeTab;
  });

  const getStatusCount = (status: QuotationStatus | "all") => {
    if (status === "all") return quotations.length;
    return quotations.filter((q) => q.status === status).length;
  };

  const handleCreateOrder = async (quotationId: string) => {
    try {
      await createOrder.mutateAsync(quotationId);
      navigate("/orders");
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="Quotations" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Quotations"
      subtitle="Manage price estimates for your customers"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search quotations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button asChild>
            <Link to="/quotations/new">
              <FilePlus className="h-4 w-4 mr-2" />
              New Quotation
            </Link>
          </Button>
        </div>

        {/* Status Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/50">
            <TabsTrigger value="all" className="gap-2">
              All <span className="text-xs text-muted-foreground">({getStatusCount("all")})</span>
            </TabsTrigger>
            <TabsTrigger value="draft" className="gap-2">
              Draft <span className="text-xs text-muted-foreground">({getStatusCount("draft")})</span>
            </TabsTrigger>
            <TabsTrigger value="sent" className="gap-2">
              Sent <span className="text-xs text-muted-foreground">({getStatusCount("sent")})</span>
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-2">
              Approved <span className="text-xs text-muted-foreground">({getStatusCount("approved")})</span>
            </TabsTrigger>
            <TabsTrigger value="locked" className="gap-2">
              Locked <span className="text-xs text-muted-foreground">({getStatusCount("locked")})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {/* Quotations Table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Quotation</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        {searchQuery ? "No quotations found" : "No quotations yet. Create your first quotation!"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredQuotations.map((quotation) => {
                      const status = statusConfig[quotation.status as QuotationStatus];
                      const isExpired = quotation.valid_until && new Date(quotation.valid_until) < new Date();

                      return (
                        <TableRow key={quotation.id} className="hover:bg-muted/30">
                          <TableCell>
                            <div>
                              <p className="font-medium">{quotation.quotation_number}</p>
                              <p className="text-xs text-muted-foreground">
                                v{quotation.version} • {new Date(quotation.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{quotation.customers?.name || "N/A"}</p>
                              <p className="text-xs text-muted-foreground">{quotation.customers?.phone}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm text-muted-foreground max-w-[200px] truncate">
                              {quotation.quotation_items?.map(i => i.garment_type).join(", ") || "No items"}
                            </p>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-semibold">
                              ₹{quotation.total.toLocaleString("en-IN")}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={cn("text-sm", isExpired && quotation.status !== "locked" && "text-destructive")}>
                              {quotation.valid_until ? new Date(quotation.valid_until).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }) : "-"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={cn(status?.className)}>{status?.label}</span>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link to={`/quotations/${quotation.id}`}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View / Edit
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {quotation.status === "draft" && (
                                  <DropdownMenuItem onClick={() => updateStatus.mutate({ id: quotation.id, status: "sent" })}>
                                    <Send className="h-4 w-4 mr-2" />
                                    Mark as Sent
                                  </DropdownMenuItem>
                                )}
                                {quotation.status === "sent" && (
                                  <DropdownMenuItem onClick={() => updateStatus.mutate({ id: quotation.id, status: "approved" })}>
                                    <Send className="h-4 w-4 mr-2" />
                                    Mark as Approved
                                  </DropdownMenuItem>
                                )}
                                {quotation.status === "approved" && (
                                  <DropdownMenuItem 
                                    onClick={() => handleCreateOrder(quotation.id)}
                                    disabled={createOrder.isPending}
                                  >
                                    <Lock className="h-4 w-4 mr-2" />
                                    {createOrder.isPending ? "Creating..." : "Lock & Create Order"}
                                  </DropdownMenuItem>
                                )}
                                {quotation.status === "locked" && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-primary" asChild>
                                      <Link to="/orders">
                                        <ClipboardList className="h-4 w-4 mr-2" />
                                        View Orders
                                      </Link>
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
