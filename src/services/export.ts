import * as XLSX from 'xlsx';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { LocalNotifications } from '@capacitor/local-notifications';
import { FileOpener } from '@capacitor-community/file-opener';
import { Lead } from '../types/lead';

const EXCEL_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const EXPORT_CHANNEL_ID = 'offline_crm_exports';

/**
 * Initialize Notification Channel & Action Types on Native Android / iOS
 */
const initNotificationChannel = async () => {
  if (!Capacitor.isNativePlatform()) return;
  try {
    // 1. Register Action Buttons for Notifications (Open & Share)
    await LocalNotifications.registerActionTypes({
      types: [
        {
          id: 'EXCEL_EXPORT_ACTIONS',
          actions: [
            {
              id: 'open_file',
              title: 'Open',
              foreground: true,
            },
            {
              id: 'share_file',
              title: 'Share',
              foreground: true,
            },
          ],
        },
      ],
    });

    // 2. Create Notification Channel for Offline CRM Exports
    await LocalNotifications.createChannel({
      id: EXPORT_CHANNEL_ID,
      name: 'Offline CRM - Exports',
      description: 'Notifications for exported CRM lead spreadsheets',
      importance: 4, // High importance (Heads-up banner + alert sound)
      visibility: 1, // Public on lockscreen
    });
  } catch (e) {
    console.warn('Could not initialize notification channel or actions:', e);
  }
};

// Run channel initialization on native platforms
initNotificationChannel();

// Initialize notification action listener on native mobile platforms
if (Capacitor.isNativePlatform()) {
  LocalNotifications.addListener(
    'localNotificationActionPerformed',
    async (action) => {
      const extra = action.notification.extra;
      const actionId = action.actionId;

      if (!extra || !extra.filePath) return;

      if (actionId === 'share_file') {
        // Trigger native share sheet if 'Share' action button clicked
        try {
          await Share.share({
            title: 'Export CRM Leads',
            text: `Exported ${extra.filename || 'CRM Leads'}`,
            url: extra.filePath,
            dialogTitle: 'Share Excel File',
          });
        } catch (err) {
          console.error('Error sharing file via notification action:', err);
        }
      } else {
        // Default tap or 'Open' action -> Launch FileOpener directly
        try {
          await FileOpener.open({
            filePath: extra.filePath,
            contentType: extra.mimeType || EXCEL_MIME_TYPE,
          });
        } catch (err) {
          console.error('Error opening file via FileOpener on tap:', err);
        }
      }
    }
  );
}

/**
 * Robust web file downloader using SheetJS native XLSX.writeFile with anchor fallback.
 */
const triggerWebDownload = (workbook: XLSX.WorkBook, filename: string): void => {
  try {
    XLSX.writeFile(workbook, filename);
  } catch (err) {
    console.error('XLSX.writeFile error, using anchor blob fallback:', err);
    const arrayBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    const blob = new Blob([arrayBuffer], { type: EXCEL_MIME_TYPE });
    const blobUrl = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.setAttribute('download', filename);
    anchor.style.display = 'none';

    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 2000);
  }
};

export const exportLeadsToExcel = async (leads: Lead[]): Promise<void> => {
  if (leads.length === 0) return;

  // Format leads into spreadsheet row objects
  const dataToExport = leads.map((lead) => ({
    Name: lead.name,
    Phone: `${(lead.country_code || '').trim()} ${lead.phone}`.trim(),
    'Home Type': lead.home_type,
    Email: lead.email || 'N/A',
    Notes: lead.notes || 'N/A',
    'Created Date': new Date(lead.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');

  // Format filename: CRM_YYYY_MM_DD.xlsx
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const filename = `CRM_${year}_${month}_${day}.xlsx`;

  if (Capacitor.isNativePlatform()) {
    try {
      // 1. Generate Base64 representation of Excel workbook
      const base64Data = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'base64',
      });

      // 2. Save file to device local Cache directory for direct FileOpener URI access
      const savedFile = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache,
        recursive: true,
      });

      // 3. Request local notification permissions if not granted
      try {
        const permStatus = await LocalNotifications.checkPermissions();
        if (permStatus.display !== 'granted') {
          await LocalNotifications.requestPermissions();
        }
      } catch (e) {
        console.warn('Could not check/request notification permissions:', e);
      }

      // 4. Schedule OS Export Notification with App Icon, Actions, and Channel
      const notifId = Math.floor(Math.random() * 100000) + 1;
      await LocalNotifications.schedule({
        notifications: [
          {
            id: notifId,
            title: 'Excel Export Complete',
            body: `${filename} has been saved. Tap to open in Excel or Google Sheets.`,
            smallIcon: 'ic_launcher',
            iconColor: '#09090B',
            channelId: EXPORT_CHANNEL_ID,
            actionTypeId: 'EXCEL_EXPORT_ACTIONS',
            extra: {
              filePath: savedFile.uri,
              filename: filename,
              mimeType: EXCEL_MIME_TYPE,
            },
          },
        ],
      });

      // 5. Open Native Share sheet so user can save or share directly
      await Share.share({
        title: 'Export CRM Leads',
        text: `Exported ${filename}`,
        url: savedFile.uri,
        dialogTitle: 'Share or Save Excel File',
      });
    } catch (err) {
      console.error('Error exporting file on mobile platform, falling back to web trigger:', err);
      triggerWebDownload(workbook, filename);
    }
  } else {
    // Web Browser platform trigger
    triggerWebDownload(workbook, filename);
  }
};
