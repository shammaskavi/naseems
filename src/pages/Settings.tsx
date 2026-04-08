import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, User, Building2, Ruler, Plus, GripVertical } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { useMeasurementConfig } from "@/hooks/useMeasurements";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function Settings() {
  const queryClient = useQueryClient();
  const { settings, isLoading, updateSettings } = useSettings();
  const { data: remoteConfig, isLoading: configLoading } = useMeasurementConfig(false);

  const [formData, setFormData] = useState({
    full_name: "",
    business_name: "",
    business_phone: "",
    business_address: "",
    gstin: "",
  });

  const [localConfig, setLocalConfig] = useState<any[]>([]);
  const [activeGender, setActiveGender] = useState<"male" | "female">("male");
  const [newField, setNewField] = useState({ name: "", label: "", category: "upper_body" });

  useEffect(() => {
    if (settings) {
      setFormData({
        full_name: settings.full_name || "",
        business_name: settings.business_name || "",
        business_phone: settings.business_phone || "",
        business_address: settings.business_address || "",
        gstin: settings.gstin || "",
      });
    }
    if (remoteConfig) {
      setLocalConfig(remoteConfig);
    }
  }, [settings, remoteConfig]);

  // Filter config based on active gender for display and reordering
  const filteredConfig = localConfig.filter(f => (f.gender || 'male') === activeGender);

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    // Work with the full config but only update the subset being viewed
    const items = Array.from(localConfig);
    const movingItem = filteredConfig[result.source.index];
    const targetItem = filteredConfig[result.destination.index];

    const globalSourceIndex = items.findIndex(i => i.id === movingItem.id);
    const globalDestIndex = items.findIndex(i => i.id === targetItem.id);

    const [reorderedItem] = items.splice(globalSourceIndex, 1);
    items.splice(globalDestIndex, 0, reorderedItem);

    const updatedItems = items.map((item, idx) => ({
      ...item,
      sort_order: idx + 1,
    }));

    setLocalConfig(updatedItems);
  };

  const handleLocalToggle = (id: string) => {
    setLocalConfig(prev => prev.map(f =>
      f.id === id ? { ...f, is_active: !f.is_active } : f
    ));
  };

  const handleSaveAll = async () => {
    try {
      await updateSettings.mutateAsync(formData);

      const existingConfigs: any[] = [];
      const newConfigs: any[] = [];

      localConfig.forEach((item) => {
        const { created_at, updated_at, ...rest } = item;
        const isNew = !rest.id || (typeof rest.id === 'string' && rest.id.includes('temp'));

        if (isNew) {
          const { id, ...cleanData } = rest;
          newConfigs.push(cleanData);
        } else {
          existingConfigs.push(rest);
        }
      });

      if (existingConfigs.length > 0) {
        const { error: updateError } = await supabase
          .from("measurement_configs")
          .upsert(existingConfigs, { onConflict: 'name' });
        if (updateError) throw updateError;
      }

      if (newConfigs.length > 0) {
        const { error: insertError } = await supabase
          .from("measurement_configs")
          .insert(newConfigs);
        if (insertError) throw insertError;
      }

      toast.success("Settings updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["measurement_config"] });
    } catch (err: any) {
      console.error("Save Error:", err);
      toast.error("Failed to save: " + err.message);
    }
  };

  const handleAddNewField = () => {
    if (!newField.name || !newField.label) return toast.error("Fill all fields");
    const internalName = newField.name.toLowerCase().replace(/\s+/g, '_');

    if (localConfig.some(f => f.name === internalName)) {
      return toast.error("This internal name already exists.");
    }

    const entry = {
      id: `field-temp-${crypto.randomUUID()}`,
      name: internalName,
      label: newField.label,
      category: newField.category,
      gender: activeGender, // Automatically inherits the active view's gender
      is_active: true,
      sort_order: localConfig.length + 1
    };

    setLocalConfig([...localConfig, entry]);
    setNewField({ name: "", label: "", category: "upper_body" });
  };

  if (isLoading || configLoading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></div>;

  return (
    <AppLayout title="Settings" subtitle="Manage account and shop details">
      <div className="max-w-4xl space-y-6 pb-24">

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Profile</CardTitle></CardHeader>
          <CardContent>
            <Input value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />Shop Details</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Shop Name</Label><Input value={formData.business_name} onChange={(e) => setFormData({ ...formData, business_name: e.target.value })} /></div>
            <div className="space-y-2"><Label>GSTIN</Label><Input value={formData.gstin} onChange={(e) => setFormData({ ...formData, gstin: e.target.value })} /></div>
            <div className="sm:col-span-2 space-y-2"><Label>Shop Address</Label><Input value={formData.business_address} onChange={(e) => setFormData({ ...formData, business_address: e.target.value })} /></div>
          </CardContent>
        </Card>

        {/* SIMPLIFIED MEASUREMENT SECTION */}
        <Card className="border-primary/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-primary"><Ruler className="h-5 w-5" /> Measurement Workflow</CardTitle>
              <CardDescription>Select gender to manage specific fields.</CardDescription>
            </div>
            {/* Simple Gender Toggle */}
            <div className="flex bg-muted p-1 rounded-lg">
              <Button
                variant={activeGender === 'male' ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveGender('male')}
                className="h-8 text-xs px-4"
              >
                Male
              </Button>
              <Button
                variant={activeGender === 'female' ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveGender('female')}
                className="h-8 text-xs px-4"
              >
                Female
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-3 p-4 bg-muted/30 rounded-lg border border-dashed">
              <Input placeholder="Internal Name" value={newField.name} onChange={e => setNewField({ ...newField, name: e.target.value })} />
              <Input placeholder="Label (e.g. Bust Point)" value={newField.label} onChange={e => setNewField({ ...newField, label: e.target.value })} />
              <Select value={newField.category} onValueChange={v => setNewField({ ...newField, category: v })}>
                <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="upper_body">Upper Body</SelectItem>
                  <SelectItem value="lower_body">Lower Body</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="secondary" onClick={handleAddNewField}><Plus className="h-4 w-4 mr-2" /> Add to {activeGender}</Button>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="measurements">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="border rounded-md divide-y overflow-hidden bg-white"
                  >
                    {filteredConfig.length === 0 ? (
                      <p className="p-8 text-center text-muted-foreground text-sm italic">No {activeGender} fields added yet.</p>
                    ) : (
                      filteredConfig.map((field, index) => (
                        <Draggable key={field.id} draggableId={field.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={cn(
                                "grid grid-cols-12 items-center p-3 transition-all",
                                !field.is_active ? "bg-muted/40 grayscale opacity-70" : "bg-white",
                                snapshot.isDragging ? "shadow-lg ring-1 ring-primary/20 z-50 bg-white" : ""
                              )}
                            >
                              <div className="col-span-1 flex justify-center" {...provided.dragHandleProps}>
                                <GripVertical className="h-5 w-5 text-muted-foreground/50 hover:text-primary cursor-grab" />
                              </div>

                              <div className="col-span-8 px-2">
                                <p className="text-sm font-bold">{field.label}</p>
                                <p className="text-[10px] text-muted-foreground uppercase">{field.category.replace('_', ' ')}</p>
                              </div>

                              <div className="col-span-3 flex justify-end pr-4">
                                <Switch checked={field.is_active} onCheckedChange={() => handleLocalToggle(field.id)} />
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button size="lg" onClick={handleSaveAll} className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-all">
            Save All Changes
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}