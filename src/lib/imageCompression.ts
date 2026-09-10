/**
 * Client-Side Image Compression Utility
 * Resizes large smartphone camera photos (5MB - 15MB) to ~150KB - 250KB WebP/JPEG
 * in the browser before upload, saving 95%+ bandwidth and Google Drive storage.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  preferredMimeType?: "image/webp" | "image/jpeg";
}

export interface CompressedImageResult {
  base64: string;
  originalSizeKb: number;
  compressedSizeKb: number;
  width: number;
  height: number;
  mimeType: string;
  fileName: string;
}

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressedImageResult> {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.8,
    preferredMimeType = "image/webp",
  } = options;

  const originalSizeKb = Math.round(file.size / 1024);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        let { width, height } = img;

        // Calculate scaled dimensions keeping aspect ratio
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return reject(new Error("Unable to create canvas 2D context"));
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Draw white background in case of transparent PNG converted to JPEG
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);

        ctx.drawImage(img, 0, 0, width, height);

        // Determine output MIME type
        let targetMime = preferredMimeType;
        let base64 = canvas.toDataURL(targetMime, quality);

        // Fallback to JPEG if browser doesn't support WebP export
        if (!base64.startsWith(`data:${targetMime}`) && targetMime === "image/webp") {
          targetMime = "image/jpeg";
          base64 = canvas.toDataURL("image/jpeg", quality);
        }

        // Calculate compressed size in KB from base64 length
        const base64Length = base64.length - (base64.indexOf(",") + 1);
        const compressedSizeKb = Math.round((base64Length * 3) / 4 / 1024);

        // Sanitize file name extension
        const baseName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
        const extension = targetMime === "image/webp" ? ".webp" : ".jpg";
        const fileName = `${baseName}${extension}`;

        resolve({
          base64,
          originalSizeKb,
          compressedSizeKb,
          width,
          height,
          mimeType: targetMime,
          fileName,
        });
      };

      img.onerror = (err) => reject(new Error(`Image loading failed: ${err}`));
    };

    reader.onerror = (err) => reject(new Error(`File reading failed: ${err}`));
  });
}
