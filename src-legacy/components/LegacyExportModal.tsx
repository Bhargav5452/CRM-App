import React, { useState } from 'react';
import { Lead } from '../types/legacyValidation';
import { exportLeadsToExcel, generateXlsxBase64 } from '../services/legacyExport';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
}

const LegacyExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, leads }) => {
  const [copied, setCopied] = useState(false);
  const [diagLogs, setDiagLogs] = useState<{ text: string; isError?: boolean }[]>([]);

  if (!isOpen) return null;

  const addDiag = (step: string, isError?: boolean) => {
    setDiagLogs((prev) => prev.concat([{ text: step, isError }]));
  };

  const handleExportExcel = () => {
    setDiagLogs([]);
    exportLeadsToExcel(leads, addDiag);
  };

  const headers = ['S.No', 'Name', 'Phone Number (with code)', 'Phone Number', 'Home Type', 'Email', 'Notes', 'Created Date'];
  const chronologicalLeads = leads.slice().reverse();
  const rows = chronologicalLeads.map((lead, index) => {
    const code = lead.country_code ? lead.country_code.trim() : '';
    const phone = lead.phone ? lead.phone.trim() : '';
    const fullPhone = code ? (code + ' ' + phone) : phone;
    const name = (lead.name || '').replace(/"/g, '""');
    const homeType = (lead.home_type || '').replace(/"/g, '""');
    const email = (lead.email || '').replace(/"/g, '""');
    const notes = (lead.notes || '').replace(/"/g, '""');
    const date = (lead.created_at || '').replace(/"/g, '""');
    return [index + 1, '"' + name + '"', '"' + fullPhone + '"', '"' + phone + '"', '"' + homeType + '"', '"' + email + '"', '"' + notes + '"', '"' + date + '"'].join(',');
  });

  const csvText = headers.join(',') + '\r\n' + rows.join('\r\n');

  const handleCopy = () => {
    try {
      const textarea = document.getElementById('legacy_export_textarea') as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
        textarea.select();
        textarea.setSelectionRange(0, textarea.value.length);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(csvText);
      } else {
        document.execCommand('copy');
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleEmail = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    const subject = encodeURIComponent('Leads Export - ' + dateStr);
    const body = encodeURIComponent('Leads Data Export (' + leads.length + ' leads):\n\n' + csvText);
    window.location.href = 'mailto:?subject=' + subject + '&body=' + body;
  };

  return (
    <div className="review-sheet-backdrop" onClick={onClose}>
      <div className="review-sheet-container" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 className="sheet-title" style={{ margin: 0 }}>Export Leads (.xlsx)</h2>
            <p className="sheet-subtitle" style={{ marginTop: 4 }}>
              {leads.length} {leads.length === 1 ? 'lead' : 'leads'} (Chronological order)
            </p>
          </div>
          <button
            type="button"
            className="btn-close-filter"
            onClick={onClose}
            title="Close"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {diagLogs.length > 0 && (
          <div style={{ backgroundColor: '#18181B', borderRadius: 10, padding: '10px 12px', marginBottom: 16, fontFamily: 'monospace', fontSize: 11 }}>
            {diagLogs.map((log, idx) => (
              <div key={idx} style={{ color: log.isError ? '#F87171' : '#4ADE80', margin: '2px 0' }}>
                {log.text}
              </div>
            ))}
          </div>
        )}

        <div className="sheet-actions">
          <button
            type="button"
            className="btn-confirm"
            onClick={handleExportExcel}
            style={{ backgroundColor: '#16A34A' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Download Excel (.xlsx)</span>
          </button>

          <button
            type="button"
            className="btn-edit"
            onClick={handleCopy}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            <span>{copied ? 'Copied to Clipboard!' : 'Copy to Clipboard (CSV)'}</span>
          </button>

          <button
            type="button"
            className="btn-edit"
            onClick={handleEmail}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            <span>Send via Email</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(LegacyExportModal);
