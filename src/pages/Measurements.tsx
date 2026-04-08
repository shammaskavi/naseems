import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, ArrowLeft, Copy, Ruler, Users } from "lucide-react";
import {
  useMeasurementSet,
  useCreateMeasurementSet,
  useUpdateMeasurementSet,
  useLatestCustomerMeasurement,
  useMeasurementConfig
} from "@/hooks/useMeasurements";
import { useOrderItem } from "@/hooks/useOrders";
import { useCustomer } from "@/hooks/useCustomers";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

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
      const nextInput = document.querySelector(`[data-m-index="${index + 1}"]`) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
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

  const [activeGender, setActiveGender] = useState<"male" | "female">("male");
  const [formData, setFormData] = useState<Record<string, any>>({
    fit_type: "regular" as FitType,
    body_posture: "",
    design_notes: "",
  });

  // Auto-detect gender from garment type
  useEffect(() => {
    if (orderItemDetails?.garment_type) {
      const type = orderItemDetails.garment_type.toLowerCase();
      const femaleKeywords = ['blouse', 'lehenga', 'saree', 'kurti', 'ghagra', 'chudidar', 'salwar'];
      if (femaleKeywords.some(kw => type.includes(kw))) {
        setActiveGender('female');
      }
    }
  }, [orderItemDetails]);

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
      toast.error("No previous measurements found.");
      return;
    }
    const { id, created_at, updated_at, order_item_id, customer_id, ...actualMeasurements } = latestMeasurement;
    setFormData((prev) => ({ ...prev, ...actualMeasurements, delivery_date: prev.delivery_date || "" }));
    toast.success("Measurements copied!");
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (isNewCustomerMeasurement && !urlCustomerId) {
      toast.error("Missing customer association.");
      return;
    }

    const processedData = Object.fromEntries(
      Object.entries(formData)
        .filter(([k]) => k !== "id" && k !== "created_at" && k !== "updated_at")
        .map(([k, v]) => {
          if (["fit_type", "body_posture", "design_notes", "delivery_date"].includes(k)) return [k, v];
          return [k, v === "" ? null : parseFloat(v as string)];
        })
    );

    try {
      const measurementPayload = {
        order_item_id: isNewCustomerMeasurement ? null : orderItemId,
        customer_id: effectiveCustomerId,
        ...processedData,
      };

      const { delivery_date, ...onlyMeasurements } = measurementPayload;

      if (existingMeasurement && !isNewCustomerMeasurement) {
        await updateMeasurement.mutateAsync({ id: existingMeasurement.id, ...onlyMeasurements } as any);
      } else {
        await createMeasurement.mutateAsync(onlyMeasurements as any);
      }

      const orderId = orderItemDetails?.order_id;
      if (orderId && formData.delivery_date) {
        await supabase.from("orders").update({ delivery_date: formData.delivery_date }).eq("id", orderId);
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

  // Filter based on the Active Gender selected
  const genderFilteredConfig = config?.filter(f => (f.gender || 'male') === activeGender) || [];
  const upperBodyFields = genderFilteredConfig.filter(f => f.category === 'upper_body');
  const lowerBodyFields = genderFilteredConfig.filter(f => f.category === 'lower_body');

  return (
    <AppLayout title="Measurements" subtitle={`Tailoring Profile: ${customerName || 'Customer'}`}>
      <div className="max-w-5xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">

        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)} className="hover:bg-muted">
            <ArrowLeft className="h-4 w-4 mr-2" />Back
          </Button>

          <div className="flex items-center gap-4">
            {/* Simple Gender Switcher */}
            <div className="flex bg-muted p-1 rounded-lg border shadow-sm">
              <Button
                variant={activeGender === 'male' ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveGender('male')}
                className="h-8 text-xs px-4 flex items-center gap-2"
              >
                <Users className="h-3 w-3" /> Male
              </Button>
              <Button
                variant={activeGender === 'female' ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveGender('female')}
                className="h-8 text-xs px-4 flex items-center gap-2"
              >
                <Users className="h-3 w-3" /> Female
              </Button>
            </div>

            {latestMeasurement && (
              <Button variant="outline" className="border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 transition-all" onClick={handleCopyPrevious}>
                <Copy className="h-4 w-4 mr-2" /> Copy Previous
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Upper Body Column */}
          <Card className="shadow-sm border-primary/10 overflow-hidden">
            <CardHeader className={cn("py-3 border-b", activeGender === 'female' ? "bg-pink-50/50" : "bg-primary/5")}>
              <CardTitle className={cn("text-sm font-bold uppercase tracking-widest flex items-center gap-2", activeGender === 'female' ? "text-pink-700" : "text-primary")}>
                <Ruler className="h-4 w-4" /> Upper Torso ({activeGender})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="flex flex-col">
                {upperBodyFields.length > 0 ? (
                  upperBodyFields.map((field, idx) => (
                    <MeasurementInput
                      key={field.name}
                      label={field.label}
                      field={field.name}
                      value={formData[field.name]?.toString() || ""}
                      onChange={handleInputChange}
                      index={idx}
                    />
                  ))
                ) : (
                  <p className="p-4 text-center text-xs text-muted-foreground italic">No upper body fields defined.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lower Body & Notes Column */}
          <div className="space-y-6">
            <Card className="shadow-sm border-primary/10 overflow-hidden">
              <CardHeader className={cn("py-3 border-b", activeGender === 'female' ? "bg-pink-50/50" : "bg-primary/5")}>
                <CardTitle className={cn("text-sm font-bold uppercase tracking-widest flex items-center gap-2", activeGender === 'female' ? "text-pink-700" : "text-primary")}>
                  <Ruler className="h-4 w-4" /> Lower Torso ({activeGender})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="flex flex-col">
                  {lowerBodyFields.length > 0 ? (
                    lowerBodyFields.map((field, idx) => (
                      <MeasurementInput
                        key={field.name}
                        label={field.label}
                        field={field.name}
                        value={formData[field.name]?.toString() || ""}
                        onChange={handleInputChange}
                        index={upperBodyFields.length + idx}
                      />
                    ))
                  ) : (
                    <p className="p-4 text-center text-xs text-muted-foreground italic">No lower body fields defined.</p>
                  )}
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