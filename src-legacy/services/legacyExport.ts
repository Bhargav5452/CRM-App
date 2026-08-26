import * as XLSX from 'xlsx';
import { Lead } from '../types/legacyValidation';

export interface ExportDiagLog {
  (step: string, isError?: boolean): void;
}

export const generateXlsxBase64 = (leads: Lead[], log?: ExportDiagLog): { base64: string; filename: string } => {
  if (log) log('EXPORT: XLSX loaded');

  const chronologicalLeads = leads.slice().reverse();
  const dataRows = chronologicalLeads.map((lead, index) => {
    const code = lead.country_code ? lead.country_code.trim() : '';
    const phone = lead.phone ? lead.phone.trim() : '';
    const formattedPhone = code ? (code + ' ' + phone) : phone;

    const d = new Date(lead.created_at);
    let dateFormatted = lead.created_at;
    if (!isNaN(d.getTime())) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      dateFormatted = months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
    }

    return {
      'S.No': index + 1,
      Name: lead.name || '',
      'Phone Number (with code)': formattedPhone,
      'Phone Number': phone,
      'Home Type': lead.home_type || '',
      Email: lead.email || '',
      Notes: lead.notes || '',
      'Created Date': dateFormatted,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(dataRows);
  const columnWidths = [
    { wch: 6 },
    { wch: 22 },
    { wch: 24 },
    { wch: 16 },
    { wch: 14 },
    { wch: 26 },
    { wch: 32 },
    { wch: 22 },
  ];
  worksheet['!cols'] = columnWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');
  if (log) log('EXPORT: workbook created');

  const base64Data = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
  if (log) log('EXPORT: binary generated');

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = 'CRM_' + dateStr + '.xlsx';

  return { base64: base64Data, filename };
};

export const exportLeadsToExcel = (leads: Lead[], log?: ExportDiagLog): { success: boolean; filename?: string; error?: string } => {
  try {
    if (log) log('EXPORT: clicked');

    const { base64, filename } = generateXlsxBase64(leads, log);

    // Safari 9 Data URI with XLSX MIME type
    const mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const dataUri = 'data:' + mimeType + ';base64,' + base64;

    if (log) log('EXPORT: Blob/DataURI created');

    // Attempt 1: anchor download
    const isDownloadSupported = typeof document !== 'undefined' && 'download' in document.createElement('a');
    if (isDownloadSupported) {
      const link = document.createElement('a');
      link.href = dataUri;
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        try { document.body.removeChild(link); } catch (e) {}
      }, 1000);
      if (log) log('EXPORT: download started (a.download)');
    } else {
      // Safari 9 / iOS 9: navigate to data URI directly
      const win = window.open(dataUri, '_blank');
      if (!win) {
        window.location.href = dataUri;
      }
      if (log) log('EXPORT: download started (iOS DataURI)');
    }

    return { success: true, filename };
  } catch (err: any) {
    const msg = err && (err.message || err.toString()) ? (err.message || err.toString()) : 'Unknown error';
    if (log) log('EXPORT ERROR: ' + msg, true);
    return { success: false, error: msg };
  }
};
