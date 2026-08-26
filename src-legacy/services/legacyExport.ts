import { Lead } from '../types/legacyValidation';
import '../../src/components/ReviewSheet/ReviewSheet.css';

export const exportLeadsToExcel = async (leads: Lead[]): Promise<{ success: boolean; filename?: string; error?: string }> => {
  try {
    const headers = ['Full Name', 'Phone Number', 'Home Type', 'Email', 'Notes', 'Created Date'];
    const rows = leads.map((lead) => {
      const countryCode = lead.country_code || '+91';
      const phone = lead.phone || '';
      const name = (lead.name || '').replace(/"/g, '""');
      const fullPhone = (countryCode + ' ' + phone).replace(/"/g, '""');
      const homeType = (lead.home_type || '').replace(/"/g, '""');
      const email = (lead.email || '').replace(/"/g, '""');
      const notes = (lead.notes || '').replace(/"/g, '""');
      const date = (lead.created_at || '').replace(/"/g, '""');
      return ['"' + name + '"', '"' + fullPhone + '"', '"' + homeType + '"', '"' + email + '"', '"' + notes + '"', '"' + date + '"'].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(',')].concat(rows).join('\r\n');
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = 'leads_export_' + dateStr + '.csv';

    const isDownloadSupported = typeof document !== 'undefined' && 'download' in document.createElement('a');

    if (isDownloadSupported && typeof Blob !== 'undefined' && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        try {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } catch (e) {}
      }, 1500);
    } else {
      // iOS 9 Safari fallback: Data URI navigation
      const encodedUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
      const win = window.open(encodedUri, '_blank');
      if (!win) {
        window.location.href = encodedUri;
      }
    }

    return { success: true, filename };
  } catch (err: any) {
    console.error('Export failed:', err);
    return { success: false, error: err && err.message ? err.message : 'Export failed' };
  }
};
