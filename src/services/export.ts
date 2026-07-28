import * as XLSX from 'xlsx';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { LocalNotifications } from '@capacitor/local-notifications';
import { FileOpener } from '@capacitor-community/file-opener';
import { Lead } from '../types/lead';

const EXCEL_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// Initialize notification action listener on native platforms
if (Capacitor.isNativePlatform()) {
  LocalNotifications.addListener('localNotificationActionPerformed', async (action) => {
    const extra = action.notification.extra;
    if (extra && extra.filePath) {
      try {
        await FileOpener.open({
          filePath: extra.filePath,
          contentType: extra.mimeType || EXCEL_MIME_TYPE,
        });
      } catch (err) {
        console.error('Error opening file via FileOpener:', err);
      }
    }
  });
}

export const exportLeadsToExcel = async (leads: Lead[]): Promise<void> => {
  if (leads.length === 0) return;

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

  // Generate filename CRM_YYYY_MM_DD.xlsx
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const filename = `CRM_${year}_${month}_${day}.xlsx`;

  if (Capacitor.isNativePlatform()) {
    try {
      // Generate Base64 representation of Excel file
      const base64Data = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });

      // Save file to local device Cache directory so FileOpener has direct URI access
      const savedFile = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache,
        recursive: true,
      });

      // Request notification permissions if needed
      try {
        const permStatus = await LocalNotifications.checkPermissions();
        if (permStatus.display !== 'granted') {
          await LocalNotifications.requestPermissions();
        }
      } catch (e) {
        console.warn('Could not check/request notification permissions:', e);
      }

      // Schedule Download Notification using app launcher icon
      const notifId = Math.floor(Math.random() * 100000) + 1;
      await LocalNotifications.schedule({
        notifications: [
          {
            id: notifId,
            title: 'Download Complete 📄',
            body: `${filename} downloaded.`,
            smallIcon: 'ic_launcher',
            iconColor: '#09090B',
            extra: {
              filePath: savedFile.uri,
              mimeType: EXCEL_MIME_TYPE,
            },
          },
        ],
      });

      // Trigger Native Share sheet so user can also share directly
      await Share.share({
        title: 'Export CRM Leads',
        text: `Exported ${filename}`,
        url: savedFile.uri,
        dialogTitle: 'Share Excel File',
      });
    } catch (err) {
      console.error('Error exporting file on mobile platform:', err);
      XLSX.writeFile(workbook, filename);
    }
  } else {
    // Web Browser fallback
    XLSX.writeFile(workbook, filename);
  }
};
