import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Camera,
  UploadCloud,
  Image as ImageIcon,
  MoreVertical,
  Trash2,
  ExternalLink,
  ZoomIn,
  Loader2,
  AlertCircle,
  Settings,
  Sparkles,
  Info,
} from "lucide-react";
import {
  useOrderPhotos,
  useAddOrderPhoto,
  useDeleteOrderPhoto,
  OrderPhoto,
  PhotoCategory,
} from "@/hooks/useOrderPhotos";
import { isGoogleDriveConfigured } from "@/lib/googleDriveService";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface OrderPhotoGalleryProps {
  orderId: string;
  orderNumber: string;
}

const categoryConfig: Record<PhotoCategory, { label: string; className: string }> = {
  reference: { label: "Design Reference", className: "bg-blue-50 text-blue-700 border-blue-200" },
  fabric: { label: "Fabric Swatch", className: "bg-purple-50 text-purple-700 border-purple-200" },
  sample: { label: "Customer Sample", className: "bg-amber-50 text-amber-700 border-amber-200" },
  finished: { label: "Finished Garment", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  other: { label: "Other", className: "bg-slate-50 text-slate-700 border-slate-200" },
};

export function OrderPhotoGallery({ orderId, orderNumber }: OrderPhotoGalleryProps) {
  const isDriveReady = isGoogleDriveConfigured();
  const { data: photos = [], isLoading } = useOrderPhotos(orderId);
  const addPhotoMutation = useAddOrderPhoto();
  const deletePhotoMutation = useDeleteOrderPhoto();

  // Dialog & Active states
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<PhotoCategory>("reference");
  const [notes, setNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("all");

  // Lightbox & Delete confirmation
  const [lightboxPhoto, setLightboxPhoto] = useState<OrderPhoto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OrderPhoto | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setFilePreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setIsUploadOpen(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;

    try {
      await addPhotoMutation.mutateAsync({
        orderId,
        orderNumber,
        file: selectedFile,
        category: selectedCategory,
        notes: notes.trim() || undefined,
      });

      // Reset
      setIsUploadOpen(false);
      setSelectedFile(null);
      setFilePreview(null);
      setNotes("");
      setSelectedCategory("reference");
    } catch (error) {
      // Error is notified via toast in hook
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    await deletePhotoMutation.mutateAsync({
      photoId: deleteTarget.id,
      driveFileId: deleteTarget.drive_file_id,
      orderId,
    });

    setDeleteTarget(null);
  };

  const filteredPhotos = photos.filter((p) => {
    if (activeTab === "all") return true;
    return p.category === activeTab;
  });

  return (
    <Card className="shadow-sm border-muted/60 overflow-hidden">
      <CardHeader className="p-4 sm:p-5 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <ImageIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">Order Photos & Attachments</CardTitle>
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                {photos.length}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Securely stored in Google Drive
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Hidden File Inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
            }}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
            }}
          />

          <Button
            size="sm"
            variant="outline"
            className="h-9 gap-1.5"
            onClick={() => cameraInputRef.current?.click()}
          >
            <Camera className="h-4 w-4 text-primary" />
            <span className="hidden sm:inline">Camera</span>
          </Button>

          <Button
            size="sm"
            className="h-9 gap-1.5 shadow-sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud className="h-4 w-4" />
            <span>Upload Photo</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Setup Notice if Google Drive is not configured */}
        {!isDriveReady && (
          <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/70 text-amber-900 flex items-start justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Google Drive Bridge not connected yet</p>
                <p className="text-amber-800/80 mt-0.5">
                  Paste your Google Apps Script Web App URL in Settings to enable direct Google Drive storage.
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="h-7 text-xs border-amber-300 hover:bg-amber-100" asChild>
              <Link to="/settings">
                <Settings className="h-3 w-3 mr-1" />
                Configure
              </Link>
            </Button>
          </div>
        )}

        {/* Category Filter Tabs */}
        {photos.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setActiveTab("all")}
              className={cn(
                "px-3 py-1 rounded-full font-medium transition-colors whitespace-nowrap",
                activeTab === "all"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              All ({photos.length})
            </button>
            {(["reference", "fabric", "sample", "finished"] as PhotoCategory[]).map((cat) => {
              const count = photos.filter((p) => p.category === cat).length;
              if (count === 0 && activeTab !== cat) return null;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveTab(cat)}
                  className={cn(
                    "px-3 py-1 rounded-full font-medium transition-colors whitespace-nowrap",
                    activeTab === cat
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {categoryConfig[cat].label} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-xs">Loading photos...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && photos.length === 0 && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-8 text-center hover:border-primary/40 hover:bg-primary/[0.02] transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
              <UploadCloud className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-foreground">No photos attached yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Drag and drop design reference photos, customer fabric samples, or click to browse.
            </p>
            <div className="flex items-center justify-center gap-3 mt-4">
              <Button size="sm" variant="outline" className="text-xs h-8">
                <UploadCloud className="h-3.5 w-3.5 mr-1.5" />
                Select File
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="text-xs h-8"
                onClick={(e) => {
                  e.stopPropagation();
                  cameraInputRef.current?.click();
                }}
              >
                <Camera className="h-3.5 w-3.5 mr-1.5" />
                Snap Photo
              </Button>
            </div>
          </div>
        )}

        {/* Photos Grid */}
        {!isLoading && photos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
            {filteredPhotos.map((photo) => {
              const catInfo = categoryConfig[photo.category] || categoryConfig.other;
              return (
                <div
                  key={photo.id}
                  className="group relative rounded-xl border border-muted/80 bg-card overflow-hidden shadow-2xs hover:shadow-md hover:border-primary/30 transition-all flex flex-col"
                >
                  {/* Thumbnail Container */}
                  <div
                    className="relative aspect-4/3 bg-muted cursor-pointer overflow-hidden"
                    onClick={() => setLightboxPhoto(photo)}
                  >
                    <img
                      src={photo.thumbnail_url}
                      alt={photo.file_name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        // Fallback to direct view url if thumbnail fails
                        const target = e.target as HTMLImageElement;
                        if (target.src !== photo.view_url) {
                          target.src = photo.view_url;
                        }
                      }}
                    />

                    {/* Hover Zoom Overlay */}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <ZoomIn className="h-6 w-6 drop-shadow-md" />
                    </div>

                    {/* Category Badge */}
                    <div className="absolute top-2 left-2">
                      <Badge
                        className={cn(
                          "text-[10px] px-1.5 py-0.2 font-medium border shadow-2xs backdrop-blur-xs",
                          catInfo.className
                        )}
                      >
                        {catInfo.label}
                      </Badge>
                    </div>

                    {/* Dropdown Menu Trigger */}
                    <div className="absolute top-2 right-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-6 w-6 rounded-full bg-white/90 dark:bg-black/80 hover:bg-white text-foreground shadow-2xs opacity-90 group-hover:opacity-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 text-xs">
                          <DropdownMenuItem onClick={() => setLightboxPhoto(photo)}>
                            <ZoomIn className="h-3.5 w-3.5 mr-2" />
                            View Full Size
                          </DropdownMenuItem>
                          {photo.direct_url && (
                            <DropdownMenuItem asChild>
                              <a href={photo.direct_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3.5 w-3.5 mr-2" />
                                Open in Google Drive
                              </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteTarget(photo)}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            Delete Photo
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Caption & Metadata Footer */}
                  <div className="p-2.5 space-y-1 flex-1 flex flex-col justify-between">
                    {photo.notes ? (
                      <p className="text-xs font-medium text-foreground line-clamp-2">{photo.notes}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground truncate">{photo.file_name}</p>
                    )}
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-muted/50">
                      <span>{format(new Date(photo.created_at), "dd MMM yyyy")}</span>
                      {photo.file_size_kb && (
                        <span className="font-mono text-[9px] bg-muted px-1 rounded">
                          {photo.file_size_kb} KB
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* ==================================================================== */}
      {/* UPLOAD & METADATA DIALOG */}
      {/* ==================================================================== */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <UploadCloud className="h-5 w-5 text-primary" />
              Upload Order Photo
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Preview */}
            {filePreview && (
              <div className="relative rounded-lg overflow-hidden border border-muted aspect-16/9 bg-muted">
                <img src={filePreview} alt="Upload preview" className="w-full h-full object-contain" />
              </div>
            )}

            {/* Category Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Photo Category</Label>
              <Select
                value={selectedCategory}
                onValueChange={(val) => setSelectedCategory(val as PhotoCategory)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reference">Design Reference (Inspiration / Pattern)</SelectItem>
                  <SelectItem value="fabric">Fabric Swatch / Material Sample</SelectItem>
                  <SelectItem value="sample">Customer Sample Garment</SelectItem>
                  <SelectItem value="finished">Finished Garment</SelectItem>
                  <SelectItem value="other">Other Attachment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes / Description */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Notes / Stitching Instructions (Optional)</Label>
              <Textarea
                rows={2}
                placeholder="e.g. Specific neckline piping, border placement..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="resize-none text-xs"
              />
            </div>

            {/* Auto Compression Info */}
            <div className="flex items-center gap-2 p-2.5 rounded-md bg-primary/5 text-primary text-xs">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span>Smart optimization will compress photo by ~95% before saving to Google Drive.</span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsUploadOpen(false)}
              disabled={addPhotoMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleUploadSubmit}
              disabled={addPhotoMutation.isPending || !selectedFile}
              className="gap-1.5"
            >
              {addPhotoMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Optimizing & Uploading...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" />
                  <span>Save to Google Drive</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================================================================== */}
      {/* FULL-SCREEN LIGHTBOX DIALOG */}
      {/* ==================================================================== */}
      <Dialog open={Boolean(lightboxPhoto)} onOpenChange={(open) => !open && setLightboxPhoto(null)}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden bg-black/95 border-neutral-800 text-white">
          <div className="relative flex flex-col max-h-[90vh]">
            {/* Header bar */}
            <div className="p-3 bg-neutral-900/90 flex items-center justify-between border-b border-neutral-800">
              <div className="flex items-center gap-2">
                {lightboxPhoto && (
                  <Badge
                    className={cn(
                      "text-xs px-2 py-0.5",
                      categoryConfig[lightboxPhoto.category]?.className
                    )}
                  >
                    {categoryConfig[lightboxPhoto.category]?.label}
                  </Badge>
                )}
                <span className="text-xs text-neutral-300 truncate max-w-xs sm:max-w-md">
                  {lightboxPhoto?.file_name}
                </span>
              </div>
              {lightboxPhoto?.direct_url && (
                <Button size="sm" variant="ghost" className="h-8 text-xs text-neutral-300 hover:text-white" asChild>
                  <a href={lightboxPhoto.direct_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                    Open in Drive
                  </a>
                </Button>
              )}
            </div>

            {/* High Res Image */}
            <div className="flex-1 flex items-center justify-center p-4 bg-neutral-950 overflow-auto min-h-[300px] max-h-[65vh]">
              {lightboxPhoto && (
                <img
                  src={lightboxPhoto.view_url}
                  alt={lightboxPhoto.file_name}
                  className="max-h-[60vh] w-auto max-w-full object-contain rounded"
                />
              )}
            </div>

            {/* Footer bar */}
            {lightboxPhoto?.notes && (
              <div className="p-3.5 bg-neutral-900 border-t border-neutral-800 flex items-start gap-2 text-xs text-neutral-200">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="leading-relaxed">{lightboxPhoto.notes}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ==================================================================== */}
      {/* DELETE CONFIRMATION DIALOG */}
      {/* ==================================================================== */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Delete Photo
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Are you sure you want to delete this photo? It will be removed from this order and moved to your Google Drive trash.
          </p>
          <DialogFooter className="gap-2 sm:gap-0 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              disabled={deletePhotoMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteConfirm}
              disabled={deletePhotoMutation.isPending}
            >
              {deletePhotoMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes, Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
