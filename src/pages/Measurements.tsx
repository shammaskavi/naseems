import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, ArrowLeft, Copy, Ruler } from "lucide-react";
import {
  useMeasurementSet,
  useCreateMeasurementSet,
  useUpdateMeasurementSet,
  useLatestCustomerMeasurement,
  useMeasurementConfig
} from "@/hooks/useMeasurements";
import { useOrderItem } from "@/hooks/useOrders";
import { useCustomer } from "@/hooks/useCustomers";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

type FitType = "regular" | "slim" | "comfort";

interface MeasurementInputProps {
  label: string;
  field: string;
  value: string;
  onChange: (field: string, val: string) => void;
  index: number;
}

const MeasurementInput = ({ label, field, value, onChange, index }: MeasurementInputProps) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // Find the next input in the DOM with the data-index attribute
      const nextInput = document.querySelector(`[data-m-index="${index + 1}"]`) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
        nextInput.select(); // Select text for quick overwriting
      }
    }
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-muted last:border-0 group hover:bg-muted/30 px-2 transition-colors">
      <Label className="text-sm font-medium text-muted-foreground group-hover:text-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          step="0.1"
          data-m-index={index}
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="0"
          className="h-9 w-24 text-right font-bold focus:ring-primary"
        />
        <span className="text-[10px] text-muted-foreground w-4">in</span>
      </div>
    </div>
  );
};

export default function Measurements() {
  const { orderItemId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const isNewCustomerMeasurement = orderItemId === "new";
  const urlCustomerId = searchParams.get("customerId");

  const { data: config, isLoading: isLoadingConfig } = useMeasurementConfig();
  const { data: existingMeasurement, isLoading: isLoadingExisting } = useMeasurementSet(
    isNewCustomerMeasurement ? undefined : orderItemId
  );
  const { data: orderItemDetails, isLoading: isLoadingItem } = useOrderItem(
    isNewCustomerMeasurement ? undefined : orderItemId
  );
  const { data: customerDetails, isLoading: isLoadingCustomer } = useCustomer(urlCustomerId);

  const effectiveCustomerId = !isNewCustomerMeasurement ? orderItemDetails?.customer?.id : urlCustomerId;
  const customerName = !isNewCustomerMeasurement ? orderItemDetails?.customer?.name : customerDetails?.name;

  const { data: latestMeasurement } = useLatestCustomerMeasurement(effectiveCustomerId);
  const createMeasurement = useCreateMeasurementSet();
  const updateMeasurement = useUpdateMeasurementSet();

  const [formData, setFormData] = useState<Record<string, any>>({
    fit_type: "regular" as FitType,
    body_posture: "",
    design_notes: "",
  });

  useEffect(() => {
    if (existingMeasurement) {
      setFormData((prev) => ({
        ...prev,
        ...existingMeasurement,
        fit_type: existingMeasurement.fit_type || "regular",
        body_posture: existingMeasurement.body_posture || "",
        design_notes: existingMeasurement.design_notes || "",
      }));
    }
  }, [existingMeasurement]);

  const handleCopyPrevious = () => {
    if (!latestMeasurement) {
      toast.error("No previous measurements found for this customer.");
      return;
    }

    // DESTRUCTURE to pull out what we DON'T want
    const {
      id,
      created_at,
      updated_at,
      order_item_id, // We want the NEW order_item_id, not the old one
      customer_id,   // Usually same, but safer to exclude
      ...actualMeasurements
    } = latestMeasurement;

    // Now spread only the 'actualMeasurements'
    setFormData((prev) => ({
      ...prev,
      ...actualMeasurements,
      // Keep the delivery date if the user already typed one in the current session
      delivery_date: prev.delivery_date || ""
    }));

    toast.success("Measurements copied from previous profile!");
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // const handleSave = async () => {
  //   if (isNewCustomerMeasurement && !urlCustomerId) {
  //     toast.error("Missing customer association.");
  //     return;
  //   }

  //   const processedData = Object.fromEntries(
  //     Object.entries(formData).map(([k, v]) => {
  //       if (["fit_type", "body_posture", "design_notes"].includes(k)) return [k, v];
  //       return [k, v === "" ? null : parseFloat(v)];
  //     })
  //   );

  //   const payload = {
  //     order_item_id: isNewCustomerMeasurement ? null : orderItemId,
  //     customer_id: effectiveCustomerId,
  //     ...processedData,
  //   };

  //   try {
  //     if (existingMeasurement && !isNewCustomerMeasurement) {
  //       await updateMeasurement.mutateAsync({ id: existingMeasurement.id, ...payload } as any);
  //     } else {
  //       await createMeasurement.mutateAsync(payload as any);
  //     }
  //     navigate(-1);
  //   } catch (error) {
  //     console.error("Save failed:", error);
  //   }
  // };

  const handleSave = async () => {
    if (isNewCustomerMeasurement && !urlCustomerId) {
      toast.error("Missing customer association.");
      return;
    }

    // 1. CLEAN THE DATA
    // We filter out 'id' and 'created_at' so Supabase doesn't get confused 
    // by the "previous profile" data we copied.
    const processedData = Object.fromEntries(
      Object.entries(formData)
        .filter(([k]) => k !== "id" && k !== "created_at" && k !== "updated_at")
        .map(([k, v]) => {
          // String fields
          if (["fit_type", "body_posture", "design_notes", "delivery_date"].includes(k)) {
            return [k, v];
          }
          // Numeric measurement fields
          return [k, v === "" ? null : parseFloat(v)];
        })
    );

    try {
      // 2. CONSTRUCT THE MEASUREMENT PAYLOAD
      const measurementPayload = {
        order_item_id: isNewCustomerMeasurement ? null : orderItemId,
        customer_id: effectiveCustomerId,
        ...processedData,
      };

      // Remove delivery_date from the measurement_sets table payload 
      // because it belongs in the 'orders' table instead.
      const { delivery_date, ...onlyMeasurements } = measurementPayload;

      if (existingMeasurement && !isNewCustomerMeasurement) {
        await updateMeasurement.mutateAsync({ id: existingMeasurement.id, ...onlyMeasurements } as any);
      } else {
        await createMeasurement.mutateAsync(onlyMeasurements as any);
      }

      // 3. UPDATE THE DELIVERY DATE IN THE ORDERS TABLE
      // This is the logic we added earlier to sync the date with the Quotation/Order
      const orderId = orderItemDetails?.order_id;
      if (orderId && formData.delivery_date) {
        const { error: orderError } = await supabase
          .from("orders")
          .update({ delivery_date: formData.delivery_date })
          .eq("id", orderId);

        if (orderError) {
          console.error("Order update error:", orderError);
          toast.error("Measurements saved, but failed to update delivery date.");
        }
      }

      toast.success("Measurements saved successfully!");
      navigate(-1);
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error("Save failed: " + (error.message || "Unknown error"));
    }
  };

  if (isLoadingExisting || isLoadingItem || isLoadingCustomer || isLoadingConfig) {
    return (
      <AppLayout title="Measurements" subtitle="Syncing settings...">
        <div className="flex justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </AppLayout>
    );
  }

  const upperBodyFields = config?.filter(f => f.category === 'upper_body') || [];
  const lowerBodyFields = config?.filter(f => f.category === 'lower_body') || [];

  return (
    <AppLayout title="Measurements" subtitle={`Tailoring Profile: ${customerName || 'Customer'}`}>
      <div className="max-w-5xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">

        {/* Top Header Actions */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)} className="hover:bg-muted">
            <ArrowLeft className="h-4 w-4 mr-2" />Back
          </Button>

          {latestMeasurement && (
            <Button variant="outline" className="border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 transition-all" onClick={handleCopyPrevious}>
              <Copy className="h-4 w-4 mr-2" /> Copy Previous Profile
            </Button>
          )}
        </div>

        {/* Vertical Two-Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

          {/* Column 1: Upper Body */}
          <Card className="shadow-sm border-primary/10 overflow-hidden">
            <CardHeader className="bg-primary/5 py-3 border-b">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <Ruler className="h-4 w-4" /> Upper Body
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="flex flex-col">
                {upperBodyFields.map((field, idx) => (
                  <MeasurementInput
                    key={field.name}
                    label={field.label}
                    field={field.name}
                    value={formData[field.name]?.toString() || ""}
                    onChange={handleInputChange}
                    index={idx} // Starts from 0
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Column 2: Lower Body & Notes */}
          <div className="space-y-6">
            <Card className="shadow-sm border-primary/10 overflow-hidden">
              <CardHeader className="bg-primary/5 py-3 border-b">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                  <Ruler className="h-4 w-4" /> Lower Body
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="flex flex-col">
                  {lowerBodyFields.map((field, idx) => (
                    <MeasurementInput
                      key={field.name}
                      label={field.label}
                      field={field.name}
                      value={formData[field.name]?.toString() || ""}
                      onChange={handleInputChange}
                      // Continue indexing from where upper body left off
                      index={upperBodyFields.length + idx}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-primary/10">
              <CardHeader className="py-3 border-b bg-muted/30">
                <CardTitle className="text-sm font-bold uppercase tracking-widest">Fit & Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Fit Type</Label>
                    <Select value={formData.fit_type} onValueChange={(v) => handleInputChange("fit_type", v)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="regular">Regular</SelectItem>
                        <SelectItem value="slim">Slim</SelectItem>
                        <SelectItem value="comfort">Comfort</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Body Posture</Label>
                    <Input
                      data-m-index={upperBodyFields.length + lowerBodyFields.length}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          document.getElementById('design-notes-area')?.focus();
                        }
                      }}
                      value={formData.body_posture}
                      onChange={(e) => handleInputChange("body_posture", e.target.value)}
                      placeholder="e.g. Erect"
                      className="h-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Design Notes</Label>
                  <Textarea
                    id="design-notes-area"
                    value={formData.design_notes}
                    onChange={(e) => handleInputChange("design_notes", e.target.value)}
                    rows={4}
                    className="resize-none"
                    placeholder="Add specific tailoring details..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button variant="outline" onClick={() => navigate(-1)} className="px-8">Cancel</Button>
          <Button onClick={handleSave} disabled={createMeasurement.isPending || updateMeasurement.isPending} className="px-8 shadow-md">
            {(createMeasurement.isPending || updateMeasurement.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />Save Profile
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}