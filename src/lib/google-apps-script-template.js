/**
 * ====================================================================
 * SILAITRACK - GOOGLE DRIVE PHOTO BRIDGE (APPS SCRIPT)
 * ====================================================================
 * 
 * INSTRUCTIONS TO DEPLOY:
 * 1. Go to https://script.google.com and click "+ New project".
 * 2. Name project: "SilaiTrack Photo Bridge".
 * 3. Delete existing code and PASTE THIS ENTIRE FILE.
 * 4. Click "Deploy" (top right) -> "New deployment".
 * 5. Click the gear icon (⚙️) -> select "Web app".
 * 6. Set "Description": "SilaiTrack Photos".
 * 7. Set "Execute as": "Me (your-email@gmail.com)".
 * 8. Set "Who has access": "Anyone" (allows upload without prompt to login).
 * 9. Click "Deploy" -> Authorize access.
 * 10. Copy the Web App URL and paste it in SilaiTrack Settings page.
 * ====================================================================
 */

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ success: false, error: "Empty request payload" });
    }

    var data = JSON.parse(e.postData.contents);

    // 1. HANDLE TEST / PING ACTION
    if (data.action === "ping") {
      return createJsonResponse({
        success: true,
        message: "Google Drive Photo Bridge is active and connected!",
        timestamp: new Date().toISOString()
      });
    }

    // 2. HANDLE DELETE ACTION
    if (data.action === "delete" && data.fileId) {
      try {
        var fileToDelete = DriveApp.getFileById(data.fileId);
        fileToDelete.setTrashed(true);
        return createJsonResponse({
          success: true,
          deleted: true,
          message: "File moved to trash"
        });
      } catch (delError) {
        return createJsonResponse({
          success: false,
          error: "Failed to delete file: " + delError.toString()
        });
      }
    }

    // 3. HANDLE UPLOAD ACTION
    if (!data.base64Data) {
      return createJsonResponse({ success: false, error: "Missing base64Data in payload" });
    }

    // Root folder: "SilaiTrack Orders"
    var rootFolderName = "SilaiTrack Orders";
    var rootFolders = DriveApp.getFoldersByName(rootFolderName);
    var rootFolder = rootFolders.hasNext() ? rootFolders.next() : DriveApp.createFolder(rootFolderName);

    // Subfolder per order number (e.g., "ORD-1001" or "General")
    var orderNumber = (data.orderNumber || "General").replace(/[/\\?%*:|"<>]/g, "-");
    var orderFolders = rootFolder.getFoldersByName(orderNumber);
    var targetFolder = orderFolders.hasNext() ? orderFolders.next() : rootFolder.createFolder(orderNumber);

    // Clean base64 and decode bytes
    var base64Clean = data.base64Data.replace(/^data:image\/\w+;base64,/, "");
    var decodedBytes = Utilities.base64Decode(base64Clean);
    var blob = Utilities.newBlob(
      decodedBytes,
      data.mimeType || "image/jpeg",
      data.fileName || ("photo_" + Date.now() + ".jpg")
    );

    // Save file in Google Drive
    var createdFile = targetFolder.createFile(blob);
    createdFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var fileId = createdFile.getId();

    return createJsonResponse({
      success: true,
      fileId: fileId,
      viewUrl: "https://drive.google.com/uc?id=" + fileId + "&export=view",
      thumbnailUrl: "https://lh3.googleusercontent.com/d/" + fileId + "=s400",
      directUrl: "https://drive.google.com/file/d/" + fileId + "/view",
      fileName: createdFile.getName()
    });

  } catch (error) {
    return createJsonResponse({
      success: false,
      error: error.toString()
    });
  }
}

function doGet(e) {
  return createJsonResponse({
    status: "ok",
    message: "SilaiTrack Google Drive Webhook is active. Use POST to upload images."
  });
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
