// Safari 9 TypedArray & ArrayBuffer .slice() Polyfills
if (typeof Uint8Array !== 'undefined' && !Uint8Array.prototype.slice) {
  Uint8Array.prototype.slice = function (start?: number, end?: number) {
    return new (this.constructor as any)(this.subarray(start, end));
  };
}
if (typeof ArrayBuffer !== 'undefined' && !ArrayBuffer.prototype.slice) {
  ArrayBuffer.prototype.slice = function (start?: number, end?: number) {
    const src = new Uint8Array(this).subarray(start, end);
    const dst = new Uint8Array(src.byteLength);
    dst.set(src);
    return dst.buffer;
  };
}

import * as XLSX from 'xlsx';
import { Lead } from '../types/legacyValidation';

export interface ExportDiagLog {
  (step: string, isError?: boolean): void;
}

const getSafeArray = (arr: any): Lead[] => {
  if (Array.isArray(arr)) return arr;
  if (!arr) return [];
  if (arr.filteredLeads && Array.isArray(arr.filteredLeads)) return arr.filteredLeads;
  if (arr.leads && Array.isArray(arr.leads)) return arr.leads;
  try {
    return Array.prototype.slice.call(arr);
  } catch (e) {
    return [];
  }
};

export const generateXlsxBase64 = (leads: Lead[], log?: ExportDiagLog): { base64: string; filename: string } => {
  if (log) log('EXPORT: XLSX loaded');

  const safeLeads = getSafeArray(leads);
  const chronologicalLeads = safeLeads.slice().reverse();
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
  if (log) log('EXPORT: binary type = Base64 (' + (base64Data ? base64Data.length : 0) + ' chars)');

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = 'CRM_' + dateStr + '.xlsx';

  return { base64: base64Data, filename };
};

export const exportLeadsToExcel = (leads: Lead[], log?: ExportDiagLog): { success: boolean; filename?: string; error?: string } => {
  try {
    if (log) log('EXPORT: clicked');

    const { base64, filename } = generateXlsxBase64(leads, log);

    if (log) log('EXPORT: Blob created');

    // Method 1: Trigger HTTP Attachment Download via serverless endpoint
    // This sends 'Content-Disposition: attachment; filename="CRM_..."' which forces iOS Safari to show "Open in Excel / Numbers" prompt
    try {
      if (typeof document !== 'undefined') {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/api/download';
        form.target = '_blank';

        const base64Input = document.createElement('input');
        base64Input.type = 'hidden';
        base64Input.name = 'base64';
        base64Input.value = base64;
        form.appendChild(base64Input);

        const filenameInput = document.createElement('input');
        filenameInput.type = 'hidden';
        filenameInput.name = 'filename';
        filenameInput.value = filename;
        form.appendChild(filenameInput);

        document.body.appendChild(form);
        form.submit();
        setTimeout(() => {
          try { document.body.removeChild(form); } catch (e) {}
        }, 1500);

        if (log) log('EXPORT: download started (Server attachment)');
        return { success: true, filename };
      }
    } catch (serverErr) {
      if (log) log('EXPORT: server fallback to local DataURI');
    }

    // Method 2: Offline Client Fallback
    const mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const dataUri = 'data:' + mimeType + ';base64,' + base64;
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
      window.location.href = dataUri;
      if (log) log('EXPORT: download started (iOS DataURI)');
    }

    return { success: true, filename };
  } catch (err: any) {
    const msg = err && (err.message || err.toString()) ? (err.message || err.toString()) : 'Unknown error';
    if (log) log('EXPORT ERROR: ' + msg, true);
    return { success: false, error: msg };
  }
};
