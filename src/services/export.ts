import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { LocalNotifications } from '@capacitor/local-notifications';
import { FileOpener } from '@capacitor-community/file-opener';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import {
  sendNotification,
  isPermissionGranted as isTauriNotifGranted,
  requestPermission as requestTauriNotifPerm,
} from '@tauri-apps/plugin-notification';
import { openPath } from '@tauri-apps/plugin-opener';
import { Lead } from '../types/lead';

const EXCEL_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const EXPORT_CHANNEL_ID = 'offline_crm_exports';

let isChannelInitialized = false;

const isTauriPlatform = (): boolean =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

/**
 * Determine MIME type dynamically based on file extension
 */
export const getMimeTypeForFile = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'xlsx':
    case 'xls':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'csv':
      return 'text/csv';
    case 'pdf':
      return 'application/pdf';
    default:
      return EXCEL_MIME_TYPE;
  }
};

/**
 * Open an exported document in external viewer or Android app chooser
 */
export const openExportedFile = async (filePath: string, filename: string) => {
  if (isTauriPlatform()) {
    try {
      await openPath(filePath);
      return;
    } catch (e) {
      console.warn('Tauri file opener error:', e);
      return;
    }
  }

  const mimeType = getMimeTypeForFile(filename);
  try {
    // Show Android app chooser (Google Sheets, Excel, PDF viewer, etc.)
    await FileOpener.open({
      filePath: filePath,
      contentType: mimeType,
      openWithDefault: false,
    });
  } catch (err) {
    console.warn('FileOpener with app chooser failed, trying default app:', err);
    try {
      await FileOpener.open({
        filePath: filePath,
        contentType: mimeType,
        openWithDefault: true,
      });
    } catch (fallbackErr) {
      console.error('Error opening file from notification:', fallbackErr);
    }
  }
};

/**
 * Initialize Notification Channel & Action Types on Native Android / iOS
 */
const initNotificationChannel = async () => {
  if (!Capacitor.isNativePlatform() || isChannelInitialized) return;
  try {
    // 1. Check and request Local Notifications permissions on Android 13+ (API 33+) & iOS
    const permStatus = await LocalNotifications.checkPermissions();
    if (permStatus.display !== 'granted') {
      await LocalNotifications.requestPermissions();
    }

    // 2. Register Action Buttons for Notifications (Open & Share)
    // foreground: false ensures Lead CRM is NOT reopened when notification actions are tapped
    await LocalNotifications.registerActionTypes({
      types: [
        {
          id: 'EXPORT_ACTIONS',
          actions: [
            {
              id: 'open_file',
              title: 'Open',
              foreground: false,
            },
            {
              id: 'share_file',
              title: 'Share',
              foreground: false,
            },
          ],
        },
      ],
    });

    // 3. Create Notification Channel for Lead CRM Exports
    await LocalNotifications.createChannel({
      id: EXPORT_CHANNEL_ID,
      name: 'Lead CRM - Exports',
      description: 'Notifications for exported CRM lead spreadsheets',
      importance: 4, // High importance (Heads-up banner + alert sound)
      visibility: 1, // Public on lockscreen
    });
    isChannelInitialized = true;
  } catch (e) {
    console.warn('Could not initialize notification channel or permissions:', e);
  }
};

// Initialize notification action listener on native mobile platforms
if (Capacitor.isNativePlatform()) {
  LocalNotifications.addListener(
    'localNotificationActionPerformed',
    async (action) => {
      const extra = action.notification.extra;
      const actionId = action.actionId;

      if (!extra || !extra.filePath) return;

      if (actionId === 'share_file') {
        try {
          await Share.share({
            title: 'Share Exported File',
            text: `CRM Export: ${extra.filename}`,
            url: extra.filePath,
            dialogTitle: 'Share Lead File',
          });
        } catch (err) {
          console.warn('User dismissed or error sharing from notification:', err);
        }
      } else if (actionId === 'open_file' || actionId === 'tap') {
        // Triggered when user taps 'Open' button OR notification card body ('tap')
        await openExportedFile(extra.filePath, extra.filename || extra.filePath);
      }
    }
  );
}

/**
 * Format timestamp for clean filenames: YYYY_MM_DD
 */
const getFormattedDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}_${month}_${day}`;
};

/**
 * Exports an array of leads to an Excel spreadsheet (.xlsx)
 * Dynamic lazy import of XLSX library ensures 1.5MB library is NEVER loaded on startup.
 */
export const exportLeadsToExcel = async (
  leads: Lead[]
): Promise<{ success: boolean; filename?: string; error?: string }> => {
  try {
    // Dynamically load XLSX library only when user clicks Export
    const XLSX = await import('xlsx');

    // Ensure notification channel and permissions are configured
    await initNotificationChannel();

    // 1. Prepare raw row data for Excel worksheet (Chronological order: oldest -> newest)
    const chronologicalLeads = [...leads].reverse();
    const dataRows = chronologicalLeads.map((lead, index) => {
      const code = lead.country_code ? lead.country_code.trim() : '';
      const phone = lead.phone ? lead.phone.trim() : '';
      const formattedPhone = code ? `${code} ${phone}` : phone;

      return {
        'S.No': index + 1,
        Name: lead.name,
        'Phone Number (with code)': formattedPhone,
        'Phone Number': phone,
        'Home Type': lead.home_type,
        Email: lead.email || '',
        Notes: lead.notes || '',
        'Created Date': new Date(lead.created_at).toLocaleString(),
      };
    });

    // 2. Create worksheet and workbook
    const worksheet = XLSX.utils.json_to_sheet(dataRows);

    // Auto-fit column widths
    const columnWidths = [
      { wch: 6 },  // S.No
      { wch: 22 }, // Name
      { wch: 24 }, // Phone Number (with code)
      { wch: 16 }, // Phone Number
      { wch: 14 }, // Home Type
      { wch: 26 }, // Email
      { wch: 32 }, // Notes
      { wch: 22 }, // Created Date
    ];
    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');

    // 3. Generate binary array buffer
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    const filename = `CRM_${getFormattedDateString()}.xlsx`;

    // 4. Save to device filesystem (Tauri Desktop vs Capacitor Native vs Web)
    if (isTauriPlatform()) {
      const savePath = await save({
        defaultPath: filename,
        filters: [{ name: 'Excel Spreadsheet', extensions: ['xlsx'] }],
      });

      if (!savePath) {
        return { success: false, error: 'Export cancelled.' };
      }

      const uint8Array = new Uint8Array(excelBuffer);
      await writeFile(savePath, uint8Array);

      try {
        let hasPerm = await isTauriNotifGranted();
        if (!hasPerm) {
          const perm = await requestTauriNotifPerm();
          hasPerm = perm === 'granted';
        }
        if (hasPerm) {
          sendNotification({
            title: 'Export Complete',
            body: filename,
          });
        }
      } catch (notifErr) {
        console.warn('Tauri notification error:', notifErr);
      }

      return { success: true, filename };
    } else if (Capacitor.isNativePlatform()) {
      // Chunked conversion of Uint8Array to Base64 to prevent call stack / memory overflow on physical devices
      const uint8Array = new Uint8Array(excelBuffer);
      let binaryString = '';
      const chunkSize = 8192;
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, i + chunkSize);
        binaryString += String.fromCharCode.apply(null, Array.from(chunk));
      }
      const base64Data = btoa(binaryString);

      // Write file to Cache directory
      const writeResult = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache,
      });

      // Get canonical file URI for device compatibility
      const fileUriResult = await Filesystem.getUri({
        path: filename,
        directory: Directory.Cache,
      });
      const filePath = fileUriResult.uri || writeResult.uri;

      // Send Android notification: title "Export Complete", body filename, Open & Share action buttons
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              title: 'Export Complete',
              body: filename,
              id: Date.now() % 100000,
              sound: undefined,
              actionTypeId: 'EXPORT_ACTIONS',
              extra: {
                filePath,
                filename,
              },
              smallIcon: 'ic_stat_lead_crm',
              iconColor: '#09090B',
            },
          ],
        });
      } catch (notifErr) {
        console.warn('Could not schedule export notification:', notifErr);
      }

      return { success: true, filename };
    } else {
      // Web Download Fallback
      const blob = new Blob([excelBuffer], { type: EXCEL_MIME_TYPE });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return { success: true, filename };
    }
  } catch (err: unknown) {
    console.error('Failed to export leads:', err);
    const message =
      err instanceof Error ? err.message : 'Export failed due to an unknown error.';
    return { success: false, error: message };
  }
};
