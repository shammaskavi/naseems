import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, User, Building2, Ruler, Plus, GripVertical, Pencil, FolderSync, CheckCircle2, AlertCircle, Copy, Check, ExternalLink } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { useMeasurementConfig } from "@/hooks/useMeasurements";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  getGoogleScriptUrl,
  setGoogleScriptUrl,
  testGoogleDriveConnection,
  isGoogleDriveConfigured,
} from "@/lib/googleDriveService";

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

  // Google Drive configuration state
  const [googleScriptUrl, setLocalGoogleScriptUrl] = useState(getGoogleScriptUrl());
  const [isTestingDrive, setIsTestingDrive] = useState(false);
  const [driveTestResult, setDriveTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);

  const [localConfig, setLocalConfig] = useState<any[]>([]);
  const [activeGender, setActiveGender] = useState<"male" | "female">("male");
  const [newField, setNewField] = useState({ name: "", label: "", category: "upper_body" });
  const [editingField, setEditingField] = useState<any | null>(null);

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

  const handleTestGoogleDrive = async () => {
    if (!googleScriptUrl.trim()) {
      toast.error("Please enter a Google Apps Script Web App URL first");
      return;
    }
    setIsTestingDrive(true);
    setDriveTestResult(null);
    try {
      const result = await testGoogleDriveConnection(googleScriptUrl.trim());
      setDriveTestResult(result);
      if (result.success) {
        toast.success(result.message);
        setGoogleScriptUrl(googleScriptUrl.trim());
      } else {
        toast.error(result.message);
      }
    } catch (err: any) {
      setDriveTestResult({ success: false, message: err.message });
      toast.error(err.message);
    } finally {
      setIsTestingDrive(false);
    }
  };

  const handleCopyAppsScript = () => {
    const scriptCode = `/**
 * SilaiTrack Google Drive Photo Bridge
 * Deploy as: Web App (Execute as: Me, Who has access: Anyone)
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (data.action === "ping") {
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Google Drive connected successfully!" })).setMimeType(ContentService.MimeType.JSON);
    }
    if (data.action === "delete" && data.fileId) {
      DriveApp.getFileById(data.fileId).setTrashed(true);
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "File moved to trash" })).setMimeType(ContentService.MimeType.JSON);
    }
    var rootFolders = DriveApp.getFoldersByName("SilaiTrack Orders");
    var rootFolder = rootFolders.hasNext() ? rootFolders.next() : DriveApp.createFolder("SilaiTrack Orders");
    var orderNum = (data.orderNumber || "General").replace(/[/\\\\?%*:|"<>]/g, "-");
    var orderFolders = rootFolder.getFoldersByName(orderNum);
    var targetFolder = orderFolders.hasNext() ? orderFolders.next() : rootFolder.createFolder(orderNum);
    var base64Clean = data.base64Data.replace(/^data:image\\/\\w+;base64,/, "");
    var blob = Utilities.newBlob(Utilities.base64Decode(base64Clean), data.mimeType || "image/jpeg", data.fileName || "photo.jpg");
    var createdFile = targetFolder.createFile(blob);
    createdFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    var fileId = createdFile.getId();
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      fileId: fileId,
      viewUrl: "https://drive.google.com/uc?id=" + fileId + "&export=view",
      thumbnailUrl: "https://lh3.googleusercontent.com/d/" + fileId + "=s400",
      directUrl: "https://drive.google.com/file/d/" + fileId + "/view",
      fileName: createdFile.getName()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}`;
    navigator.clipboard.writeText(scriptCode);
    setCopiedScript(true);
    toast.success("Google Apps Script copied to clipboard!");
    setTimeout(() => setCopiedScript(false), 3000);
  };

  const handleSaveAll = async () => {
    try {
      await updateSettings.mutateAsync(formData);

      // Save Google Script URL
      setGoogleScriptUrl(googleScriptUrl);

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

        {/* GOOGLE DRIVE STORAGE CONFIGURATION */}
        <Card className="border-primary/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-primary">
                <FolderSync className="h-5 w-5" /> Google Drive Photo Storage
              </CardTitle>
              <CardDescription>
                Store order photos directly in your Google Drive with 0 KB Supabase storage usage.
              </CardDescription>
            </div>
            {isGoogleDriveConfigured() ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                <CheckCircle2 className="h-3.5 w-3.5" /> Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                <AlertCircle className="h-3.5 w-3.5" /> Not Configured
              </span>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="script-url" className="text-xs font-medium">Google Apps Script Web App URL</Label>
              <div className="flex gap-2">
                <Input
                  id="script-url"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={googleScriptUrl}
                  onChange={(e) => {
                    setLocalGoogleScriptUrl(e.target.value);
                    setDriveTestResult(null);
                  }}
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestGoogleDrive}
                  disabled={isTestingDrive || !googleScriptUrl.trim()}
                  className="shrink-0"
                >
                  {isTestingDrive ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      Testing...
                    </>
                  ) : (
                    "Test Connection"
                  )}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Deploy your Google Apps Script as a Web App (Access: Anyone) and paste the <code className="bg-muted px-1 rounded">/exec</code> URL here.
              </p>
            </div>

            {driveTestResult && (
              <div
                className={cn(
                  "p-3 rounded-lg text-xs flex items-center gap-2 border",
                  driveTestResult.success
                    ? "bg-green-50 border-green-200 text-green-800"
                    : "bg-red-50 border-red-200 text-red-800"
                )}
              >
                {driveTestResult.success ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                )}
                <span>{driveTestResult.message}</span>
              </div>
            )}

            {/* Quick Setup Box */}
            <div className="p-3.5 rounded-lg bg-muted/40 border text-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">Need to set up your Google Apps Script?</span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[11px] gap-1"
                    onClick={handleCopyAppsScript}
                  >
                    {copiedScript ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                    {copiedScript ? "Copied!" : "Copy Script Code"}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-[11px] gap-1" asChild>
                    <a href="https://script.google.com" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3" />
                      Open script.google.com
                    </a>
                  </Button>
                </div>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground leading-relaxed pl-1">
                <li>Go to <strong>script.google.com</strong> and click <strong>+ New project</strong>.</li>
                <li>Click <strong>Copy Script Code</strong> above and paste it into the editor.</li>
                <li>Click <strong>Deploy &rarr; New deployment &rarr; Web app</strong>.</li>
                <li>Set <em>Execute as: Me</em> and <em>Who has access: Anyone</em>, then click <strong>Deploy</strong>.</li>
                <li>Copy the resulting Web App URL and paste it into the field above!</li>
              </ol>
            </div>
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

                              <div className="col-span-3 flex justify-end items-center gap-3 pr-2">
                                <Button variant="ghost" size="sm" onClick={() => setEditingField(field)} className="h-8 w-8 p-0" title="Edit Field">
                                  <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                </Button>
                                <Switch checked={field.is_active} onCheckedChange={() => handleLocalToggle(field.id)} title={field.is_active ? "Deactivate" : "Activate"} />
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

      {/* Edit Measurement Dialog */}
      <Dialog open={!!editingField} onOpenChange={(open) => !open && setEditingField(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Measurement Field</DialogTitle>
          </DialogHeader>
          {editingField && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Display Label</Label>
                <Input
                  value={editingField.label}
                  onChange={(e) => setEditingField({ ...editingField, label: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={editingField.category}
                  onValueChange={(v) => setEditingField({ ...editingField, category: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upper_body">Upper Body</SelectItem>
                    <SelectItem value="lower_body">Lower Body</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 pt-2">
                <Label className="flex justify-between items-center text-muted-foreground">
                  Internal Name
                  <span className="text-[10px] text-destructive uppercase">Locked</span>
                </Label>
                <Input
                  value={editingField.name}
                  disabled
                  className="bg-muted/50 cursor-not-allowed"
                />
                <p className="text-[10px] text-muted-foreground">The internal name cannot be changed to prevent data loss on existing customer records.</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingField(null)}>Cancel</Button>
            <Button onClick={() => {
              setLocalConfig(prev => prev.map(f => f.id === editingField.id ? editingField : f));
              setEditingField(null);
            }}>
              Update Field
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}