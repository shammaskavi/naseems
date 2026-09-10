import { compressImage } from "./imageCompression";

const STORAGE_KEY = "silaitrack_google_drive_script_url";

/**
 * Retrieves the configured Google Apps Script Web App URL.
 * Checks localStorage first, then environment variable.
 */
export function getGoogleScriptUrl(): string {
  const storedUrl = localStorage.getItem(STORAGE_KEY);
  if (storedUrl && storedUrl.trim().length > 0) {
    return storedUrl.trim();
  }

  const envUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.trim().length > 0) {
    return envUrl.trim();
  }

  return "";
}

/**
 * Saves the Google Apps Script Web App URL to localStorage.
 */
export function setGoogleScriptUrl(url: string): void {
  if (url && url.trim().length > 0) {
    localStorage.setItem(STORAGE_KEY, url.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Checks if the Google Drive Web App is configured.
 */
export function isGoogleDriveConfigured(): boolean {
  const url = getGoogleScriptUrl();
  return Boolean(url && url.startsWith("https://script.google.com/macros/s/"));
}

export interface UploadDriveResponse {
  fileId: string;
  viewUrl: string;
  thumbnailUrl: string;
  directUrl: string;
  fileName: string;
  fileSizeKb: number;
}

/**
 * Tests connection to the Google Apps Script Web App.
 */
export async function testGoogleDriveConnection(customUrl?: string): Promise<{ success: boolean; message: string }> {
  const scriptUrl = customUrl || getGoogleScriptUrl();

  if (!scriptUrl) {
    return {
      success: false,
      message: "No Google Apps Script Web App URL provided.",
    };
  }

  try {
    const payload = {
      action: "ping",
    };

    const response = await fetch(scriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return {
        success: false,
        message: `HTTP error ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    if (data.success) {
      return {
        success: true,
        message: data.message || "Connected to Google Drive successfully!",
      };
    } else {
      return {
        success: false,
        message: data.error || "Google Apps Script returned an error.",
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to reach Google Apps Script URL. Please verify deployment settings.",
    };
  }
}

/**
 * Compresses an image client-side and uploads it to Google Drive via Apps Script.
 */
export async function uploadToGoogleDrive(params: {
  file: File;
  orderNumber?: string;
  quality?: number;
}): Promise<UploadDriveResponse> {
  const scriptUrl = getGoogleScriptUrl();

  if (!scriptUrl) {
    throw new Error(
      "Google Drive Webhook URL is not configured. Please add your Web App URL in Settings."
    );
  }

  // 1. Client-Side Image Compression
  const compressed = await compressImage(params.file, {
    maxWidth: 1600,
    maxHeight: 1600,
    quality: params.quality || 0.8,
    preferredMimeType: "image/webp",
  });

  // 2. Prepare payload
  const payload = {
    action: "upload",
    orderNumber: params.orderNumber || "General",
    fileName: compressed.fileName,
    mimeType: compressed.mimeType,
    base64Data: compressed.base64,
  };

  // 3. Send to Google Apps Script
  const response = await fetch(scriptUrl, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Upload failed with HTTP status ${response.status}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || "Google Drive upload failed");
  }

  return {
    fileId: data.fileId,
    viewUrl: data.viewUrl,
    thumbnailUrl: data.thumbnailUrl,
    directUrl: data.directUrl,
    fileName: data.fileName || compressed.fileName,
    fileSizeKb: compressed.compressedSizeKb,
  };
}

/**
 * Deletes a file from Google Drive via the Apps Script Web App.
 */
export async function deleteFromGoogleDrive(fileId: string): Promise<boolean> {
  const scriptUrl = getGoogleScriptUrl();
  if (!scriptUrl || !fileId) return false;

  try {
    const payload = {
      action: "delete",
      fileId,
    };

    const response = await fetch(scriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return Boolean(data.success);
  } catch (error) {
    console.warn("Failed to delete file from Google Drive:", error);
    return false;
  }
}
