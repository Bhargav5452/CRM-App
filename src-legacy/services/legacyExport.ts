import { Lead } from '../../src/types/lead';

export const exportLeadsToExcel = async (leads: Lead[]): Promise<{ success: boolean; filename?: string; error?: string }> => {
  try {
    const XLSX = await import('xlsx');
    const exportData = leads.map((lead) => ({
      'Full Name': lead.name,
      'Phone Number': lead.country_code + ' ' + lead.phone,
      'Home Type': lead.home_type,
      Email: lead.email || '',
      Notes: lead.notes || '',
      'Created Date': new Date(lead.created_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      }),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = 'leads_export_' + dateStr + '.xlsx';

    XLSX.writeFile(workbook, filename);
    return { success: true, filename };
  } catch (err: any) {
    console.error('Export failed:', err);
    return { success: false, error: err?.message || 'Export failed' };
  }
};
