import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card"; // Added this line

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  UserPlus,
  Search,
  MoreHorizontal,
  Phone,
  FileText,
  Ruler,
  Edit,
  Loader2,
  Plus,
  Calendar,
  ChevronRight
} from "lucide-react";
import { useCustomers, useCreateCustomer, useUpdateCustomer } from "@/hooks/useCustomers";
import { useCustomerMeasurements } from "@/hooks/useMeasurements"; // Updated hook for history
import { format } from "date-fns";
import { toast } from "sonner";

// Measurements History Dialog Component
function CustomerMeasurementsDialog({ customer, open, onOpenChange }: { customer: any, open: boolean, onOpenChange: (open: boolean) => void }) {
  const { data: history = [], isLoading } = useCustomerMeasurements(customer?.id);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  // Auto-select the latest record when history loads
  if (history.length > 0 && !selectedRecord && !isLoading) {
    setSelectedRecord(history[0]);
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) setSelectedRecord(null);
      onOpenChange(val);
    }}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5 text-primary" />
            Measurement History: {customer?.name}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : history.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
            {/* Left Sidebar: History Timeline */}
            <div className="md:col-span-1 border-r pr-4 space-y-2 max-h-[400px] overflow-y-auto">
              <p className="text-[10px] font-bold text-muted-foreground uppercase mb-3">Past Records</p>
              {history.map((record: any) => (
                <button
                  key={record.id}
                  onClick={() => setSelectedRecord(record)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${selectedRecord?.id === record.id
                    ? "bg-primary/10 border-primary shadow-sm"
                    : "hover:bg-muted border-transparent"
                    }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold">{format(new Date(record.created_at), "dd MMM yyyy")}</span>
                    <ChevronRight className={`h-3 w-3 ${selectedRecord?.id === record.id ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-tighter">
                    {record.order_item_id ? "Order-Linked" : "Profile Update"}
                  </p>
                </button>
              ))}
            </div>

            {/* Right Side: Details View */}
            <div className="md:col-span-2 space-y-6">
              {selectedRecord ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="border rounded-lg p-2 bg-muted/20">
                      <p className="text-[9px] text-muted-foreground uppercase font-bold">Chest</p>
                      <p className="text-base font-bold">{selectedRecord.chest || "-"}"</p>
                    </div>
                    <div className="border rounded-lg p-2 bg-muted/20">
                      <p className="text-[9px] text-muted-foreground uppercase font-bold">Shoulder</p>
                      <p className="text-base font-bold">{selectedRecord.shoulder || "-"}"</p>
                    </div>
                    <div className="border rounded-lg p-2 bg-muted/20">
                      <p className="text-[9px] text-muted-foreground uppercase font-bold">Waist</p>
                      <p className="text-base font-bold">{selectedRecord.low_waist || "-"}"</p>
                    </div>
                    <div className="border rounded-lg p-2 bg-muted/20">
                      <p className="text-[9px] text-muted-foreground uppercase font-bold">Hip</p>
                      <p className="text-base font-bold">{selectedRecord.hip_lower || "-"}"</p>
                    </div>
                    <div className="border rounded-lg p-2 bg-muted/20">
                      <p className="text-[9px] text-muted-foreground uppercase font-bold">Sleeve</p>
                      <p className="text-base font-bold">{selectedRecord.sleeve || "-"}"</p>
                    </div>
                    <div className="border rounded-lg p-2 bg-muted/20">
                      <p className="text-[9px] text-muted-foreground uppercase font-bold">Neck</p>
                      <p className="text-base font-bold">{selectedRecord.neck || "-"}"</p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-primary/5 p-4 border border-primary/10">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-xs font-bold text-primary uppercase">Design & Fit Notes</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold capitalize">
                        {selectedRecord.fit_type} Fit
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed italic">
                      "{selectedRecord.design_notes || "No specific design notes for this session."}"
                    </p>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground italic">
                  Select a date to view details
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
            <Ruler className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="font-medium">No measurement history found.</p>
            <p className="text-xs mt-1">Add measurements via the "Add Measurements" menu option.</p>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Close History</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Customers() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingMeasurements, setViewingMeasurements] = useState<any>(null);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  const { data: customers = [], isLoading } = useCustomers();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery)
  );

  const handleOpenDialog = (customer?: any) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        phone: customer.phone,
        email: customer.email || "",
        address: customer.address || "",
        notes: customer.notes || "",
      });
    } else {
      setEditingCustomer(null);
      setFormData({ name: "", phone: "", email: "", address: "", notes: "" });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await updateCustomer.mutateAsync({ id: editingCustomer.id, ...formData });
      } else {
        await createCustomer.mutateAsync(formData);
      }
      setIsDialogOpen(false);
      setFormData({ name: "", phone: "", email: "", address: "", notes: "" });
    } catch (error) { }
  };

  if (isLoading) {
    return (
      <AppLayout title="Customers" subtitle="Loading...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Customers" subtitle={`${customers.length} total customers`}>
      <div className="space-y-6 animate-fade-in pb-12">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editingCustomer ? "Edit Customer" : "Add New Customer"}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} rows={2} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createCustomer.isPending || updateCustomer.isPending}>
                    {(createCustomer.isPending || updateCustomer.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingCustomer ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-4 flex items-center gap-4">
            <div className="bg-primary/10 p-2 rounded-full"><UserPlus className="h-5 w-5 text-primary" /></div>
            <div><p className="text-xs text-muted-foreground uppercase font-bold">Total</p><p className="text-xl font-bold">{customers.length}</p></div>
          </Card>
          <Card className="p-4 flex items-center gap-4">
            <div className="bg-success/10 p-2 rounded-full"><Calendar className="h-5 w-5 text-success" /></div>
            <div><p className="text-xs text-muted-foreground uppercase font-bold">New This Month</p><p className="text-xl font-bold text-success">{customers.filter(c => new Date(c.created_at).getMonth() === new Date().getMonth()).length}</p></div>
          </Card>
          <Card className="p-4 flex items-center gap-4">
            <div className="bg-amber-500/10 p-2 rounded-full"><FileText className="h-5 w-5 text-amber-500" /></div>
            <div><p className="text-xs text-muted-foreground uppercase font-bold">Incomplete Data</p><p className="text-xl font-bold">{customers.filter(c => !c.address || !c.email).length}</p></div>
          </Card>
        </div>

        {/* Table View */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader><TableRow className="bg-muted/50">
              <TableHead>Customer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div><p className="font-bold text-sm">{customer.name}</p>{customer.email && <p className="text-[10px] text-muted-foreground">{customer.email}</p>}</div>
                    </div>
                  </TableCell>
                  <TableCell><div className="flex items-center gap-1 text-xs font-medium"><Phone className="h-3 w-3" /> {customer.phone}</div></TableCell>
                  <TableCell><span className="text-xs text-muted-foreground max-w-[150px] truncate block">{customer.address || "-"}</span></TableCell>
                  <TableCell><span className="text-xs font-mono">{format(new Date(customer.created_at), "dd/MM/yy")}</span></TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDialog(customer)}><Edit className="h-4 w-4 mr-2" /> Edit Info</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/measurements/new?customerId=${customer.id}`)}><Plus className="h-4 w-4 mr-2" /> Add Measurements</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setViewingMeasurements(customer)}><Ruler className="h-4 w-4 mr-2" /> History & Latest</DropdownMenuItem>
                        <DropdownMenuItem><FileText className="h-4 w-4 mr-2" /> Orders</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <CustomerMeasurementsDialog customer={viewingMeasurements} open={!!viewingMeasurements} onOpenChange={(open) => !open && setViewingMeasurements(null)} />
    </AppLayout>
  );
}