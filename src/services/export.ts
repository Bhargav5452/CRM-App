import * as XLSX from 'xlsx';
import { Lead } from '../types/lead';

export const exportLeadsToExcel = (leads: Lead[]): void => {
  if (leads.length === 0) return;

  const dataToExport = leads.map((lead) => ({
    Name: lead.name,
    Phone: `${lead.country_code || ''} ${lead.phone}`,
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

  XLSX.writeFile(workbook, filename);
};
