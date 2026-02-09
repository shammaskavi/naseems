import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Trash2,
  Save,
  Send,
  Calculator,
  User,
  Check,
  ChevronsUpDown,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCustomers, useCreateCustomer } from "@/hooks/useCustomers";
import { useProducts } from "@/hooks/useProducts";
import { useQuotation, useCreateQuotation, useUpdateQuotation, useDeleteQuotation } from "@/hooks/useQuotations";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface QuotationItem {
  id: string;
  product_id: string | null;
  garment_type: string;
  fabric_name: string;
  stitching_cost: number;
  design_charges: number;
  addons: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes: string;
}

const emptyItem: Omit<QuotationItem, "id"> = {
  product_id: null,
  garment_type: "",
  fabric_name: "",
  stitching_cost: 0,
  design_charges: 0,
  addons: "",
  quantity: 1,
  unit_price: 0,
  total_price: 0,
  notes: "",
};

export default function QuotationBuilder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();

  const [customerOpen, setCustomerOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [items, setItems] = useState<QuotationItem[]>([{ id: "1", ...emptyItem }]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [notes, setNotes] = useState("");
  const [validDays, setValidDays] = useState(15);
  const [deliveryDate, setDeliveryDate] = useState<string>("");

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const deleteQuotation = useDeleteQuotation();

  const { data: customers = [] } = useCustomers();
  const { data: products = [] } = useProducts(true);
  const { data: existingQuotation, isLoading: isLoadingQuotation } = useQuotation(id);
  const createQuotation = useCreateQuotation();
  const updateQuotation = useUpdateQuotation();

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Load existing quotation data
  useEffect(() => {
    if (existingQuotation) {
      setSelectedCustomerId(existingQuotation.customer_id);
      setNotes(existingQuotation.notes || "");
      setDiscountPercent(existingQuotation.discount_value || 0);
      setDeliveryDate(existingQuotation.delivery_date || "");


      if (existingQuotation.quotation_items && existingQuotation.quotation_items.length > 0) {
        setItems(existingQuotation.quotation_items.map((item) => ({
          id: item.id,
          product_id: item.product_id,
          garment_type: item.garment_type,
          fabric_name: item.fabric_name || "",
          stitching_cost: item.stitching_cost,
          design_charges: item.design_charges,
          addons: item.addons || "",
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          notes: item.notes || "",
        })));
      }
    }
  }, [existingQuotation]);

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), ...emptyItem }]);
  };

  const removeItem = (itemId: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== itemId));
    }
  };

  const updateItem = (itemId: string, field: keyof QuotationItem, value: string | number | null) => {
    setItems(
      items.map((item) => {
        if (item.id !== itemId) return item;

        const updated = { ...item, [field]: value };

        // Auto-calculate unit_price and total_price
        updated.unit_price = updated.stitching_cost + updated.design_charges;
        updated.total_price = updated.unit_price * updated.quantity;

        return updated;
      })
    );
  };

  const handleProductSelect = (itemId: string, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setItems(
        items.map((item) => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            product_id: productId,
            garment_type: product.name,
            stitching_cost: product.base_stitching_price || 0,
            unit_price: product.base_stitching_price || 0,
            total_price: (product.base_stitching_price || 0) * item.quantity,
          };
        })
      );
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const taxableAmount = subtotal - discountAmount;
  const cgst = taxableAmount * 0.025;
  const sgst = taxableAmount * 0.025;
  const totalAmount = taxableAmount + cgst + sgst;

  const handleSave = async (status: "draft" | "sent" = "draft") => {
    if (!selectedCustomerId) {
      toast.error("Please select a customer");
      return;
    }

    if (items.every((item) => !item.garment_type)) {
      toast.error("Please add at least one item");
      return;
    }

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validDays);

    const quotationData = {
      customer_id: selectedCustomerId,
      status,
      version: existingQuotation ? existingQuotation.version : 1,
      discount_type: "percentage" as const,
      discount_value: discountPercent,
      subtotal,
      discount_amount: discountAmount,
      tax_amount: cgst + sgst,
      total: totalAmount,
      valid_until: validUntil.toISOString().split("T")[0],
      delivery_date: deliveryDate || null, // ADD THIS LINE
      notes,
      created_by: user?.id || null,
    };

    const itemsData = items
      .filter((item) => item.garment_type)
      .map((item) => ({
        product_id: item.product_id,
        garment_type: item.garment_type,
        fabric_name: item.fabric_name || null,
        stitching_cost: item.stitching_cost,
        design_charges: item.design_charges,
        addons: item.addons || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        notes: item.notes || null,
      }));

    try {
      if (id && existingQuotation) {
        await updateQuotation.mutateAsync({
          id,
          quotation: quotationData,
          items: itemsData,
        });
      } else {
        await createQuotation.mutateAsync({
          quotation: quotationData,
          items: itemsData,
        });
      }
      navigate("/quotations");
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (id && isLoadingQuotation) {
    return (
      <AppLayout title="Loading..." subtitle="">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const isLocked = existingQuotation?.status === "locked";

  return (
    <AppLayout
      title={id ? `Edit Quotation ${existingQuotation?.quotation_number || ""}` : "New Quotation"}
      subtitle={isLocked ? "This quotation is locked and cannot be edited" : "Create a price estimate for your customer"}
    >
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-8">
        {/* Customer Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedCustomer ? (
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-lg">
                    {selectedCustomer.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold">{selectedCustomer.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
                  </div>
                </div>
                {!isLocked && (
                  <Button variant="ghost" size="sm" onClick={() => setSelectedCustomerId(null)}>
                    Change
                  </Button>
                )}
              </div>
            ) : (
              <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between">
                    Select a customer...
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search customer..." />
                    <CommandList>
                      <CommandEmpty>No customer found.</CommandEmpty>
                      <CommandGroup>
                        {customers.map((customer) => (
                          <CommandItem
                            key={customer.id}
                            value={`${customer.name} ${customer.phone}`}
                            onSelect={() => {
                              setSelectedCustomerId(customer.id);
                              setCustomerOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedCustomerId === customer.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div>
                              <p className="font-medium">{customer.name}</p>
                              <p className="text-xs text-muted-foreground">{customer.phone}</p>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <CardTitle>Quotation Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="p-4 rounded-lg border border-border bg-muted/20 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Item #{index + 1}
                  </span>
                  {items.length > 1 && !isLocked && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Product / Garment Type *</Label>
                    <Select
                      value={item.product_id || "custom"}
                      onValueChange={(v) => {
                        if (v === "custom") {
                          updateItem(item.id, "product_id", null);
                        } else {
                          handleProductSelect(item.id, v);
                        }
                      }}
                      disabled={isLocked}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">Custom Item</SelectItem>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} {product.base_stitching_price ? `(₹${product.base_stitching_price})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!item.product_id && (
                      <Input
                        placeholder="Enter garment type"
                        value={item.garment_type}
                        onChange={(e) => updateItem(item.id, "garment_type", e.target.value)}
                        disabled={isLocked}
                        className="mt-2"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Fabric / Material</Label>
                    <Input
                      placeholder="e.g., Silk, Cotton, Brocade"
                      value={item.fabric_name}
                      onChange={(e) => updateItem(item.id, "fabric_name", e.target.value)}
                      disabled={isLocked}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 1)}
                      disabled={isLocked}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Stitching Cost (₹) *</Label>
                    <Input
                      type="number"
                      min="0"
                      value={item.stitching_cost || ""}
                      onChange={(e) => updateItem(item.id, "stitching_cost", parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      disabled={isLocked}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Add-ons</Label>
                    <Input
                      placeholder="Lining, Buttons, etc."
                      value={item.addons}
                      onChange={(e) => updateItem(item.id, "addons", e.target.value)}
                      disabled={isLocked}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Add-on Charges (₹)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={item.design_charges || ""}
                      onChange={(e) => updateItem(item.id, "design_charges", parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      disabled={isLocked}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-border">
                  <p className="font-semibold">
                    Item Total: ₹{item.total_price.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            ))}

            {!isLocked && (
              <Button variant="outline" className="w-full" onClick={addItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Another Item
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Summary & Options */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Options */}
          <Card>
            <CardHeader>
              <CardTitle>Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Discount (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent || ""}
                  onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  disabled={isLocked}
                />
              </div>

              <div className="space-y-2">
                <Label>Target Delivery Date</Label>
                <Input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  disabled={isLocked}
                  className="border-primary/20 bg-primary/5 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label>Valid For (Days)</Label>
                <Select
                  value={validDays.toString()}
                  onValueChange={(v) => setValidDays(parseInt(v))}
                  disabled={isLocked}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="15">15 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="45">45 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Additional notes or terms..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  disabled={isLocked}
                />
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                {discountPercent > 0 && (
                  <div className="flex justify-between text-sm text-success">
                    <span>Discount ({discountPercent}%)</span>
                    <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Taxable Amount</span>
                  <span>₹{taxableAmount.toLocaleString("en-IN")}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">CGST (2.5%)</span>
                  <span>₹{cgst.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">SGST (2.5%)</span>
                  <span>₹{sgst.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount</span>
                  <span className="text-primary">
                    ₹{totalAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        {id && (
          <Button
            variant="destructive"
            type="button"
            onClick={() => setShowDeleteDialog(true)}
            disabled={deleteQuotation.isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Permanently
          </Button>
        )}
        {!isLocked && (
          <div className="flex flex-wrap gap-3 justify-end pt-4 border-t border-border">
            <Button variant="outline" onClick={() => navigate("/quotations")}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleSave("draft")}
              disabled={createQuotation.isPending || updateQuotation.isPending}
            >
              {(createQuotation.isPending || updateQuotation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              <Save className="h-4 w-4 mr-2" />
              Save as Draft
            </Button>
            <Button
              onClick={() => handleSave("sent")}
              disabled={createQuotation.isPending || updateQuotation.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              Save & Send
            </Button>
          </div>
        )}
      </div>


      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="border-destructive/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Permanent Deletion
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                You are about to permanently delete <strong>{existingQuotation?.quotation_number}</strong>.
              </p>
              <div className="bg-destructive/10 p-3 rounded-md text-destructive text-xs space-y-1">
                <p className="font-bold uppercase">This will also permanently delete:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>All associated line items</li>
                  <li>The linked Order record (if any)</li>
                  <li>Active Stitching Jobs for this order</li>
                  <li>Invoices and Payment records</li>
                </ul>
              </div>
              <p className="text-sm">This action is irreversible and cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Quotation</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteQuotation.mutate(id!)}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteQuotation.isPending ? "Deleting Everything..." : "Yes, Delete Everything"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
