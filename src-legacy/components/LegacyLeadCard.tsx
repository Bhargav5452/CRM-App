import React from 'react';
import { Lead, getCountryByCode } from '../types/legacyValidation';
import '../../src/components/LeadCard/LeadCard.css';

interface LeadCardProps {
  lead: Lead;
  isSelected: boolean;
  isSelectionMode: boolean;
  onSelectToggle: (leadId: number) => void;
  onLongPress: (leadId: number) => void;
  onEdit?: (lead: Lead) => void;
  onDelete?: (lead: Lead) => void;
}

const formatDateSafe = (isoStr: string): string => {
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  } catch (e) {
    return isoStr;
  }
};

const LegacyLeadCard: React.FC<LeadCardProps> = ({
  lead,
  isSelected,
  isSelectionMode,
  onSelectToggle,
  onLongPress,
  onEdit,
  onDelete,
}) => {
  const country = getCountryByCode(lead.country_code);
  const formattedPhone = country.flag + ' ' + lead.country_code + ' ' + lead.phone;
  const formattedDate = formatDateSafe(lead.created_at);

  const handleCardClick = () => {
    onSelectToggle(lead.id);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) onEdit(lead);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) onDelete(lead);
  };

  return (
    <div
      className={"lead-card" + (isSelected ? " selected-card" : "")}
      onClick={handleCardClick}
      style={{ cursor: 'pointer' }}
    >
      <div className="lead-card-header">
        <div className="lead-card-name-group">
          <div className="lead-name-row" style={{ display: 'flex', alignItems: 'center' }}>
            <div
              className={"selection-check-badge" + (isSelected ? " checked" : "")}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 20,
                height: 20,
                borderRadius: '50%',
                border: isSelected ? '2px solid #16A34A' : '2px solid #D4D4D8',
                backgroundColor: isSelected ? '#16A34A' : '#FFFFFF',
                marginRight: 8,
                flexShrink: 0,
              }}
            >
              {isSelected && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </div>
            <h3 className="lead-card-name" style={{ margin: 0 }}>{lead.name}</h3>
          </div>
          <span className="lead-card-date tabular-nums" style={{ marginTop: 4, display: 'block' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="date-icon" style={{display:'inline-block',verticalAlign:'middle',marginRight:4}}>
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            {formattedDate}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span className="home-type-badge">{lead.home_type}</span>
          {onEdit && (
            <button
              type="button"
              onClick={handleEditClick}
              title="Edit lead"
              style={{
                marginLeft: 8,
                background: '#F4F4F5',
                border: 'none',
                borderRadius: 8,
                width: 32,
                height: 32,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#52525B',
                cursor: 'pointer',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={handleDeleteClick}
              title="Delete lead"
              style={{
                marginLeft: 6,
                background: '#FEF2F2',
                border: 'none',
                borderRadius: 8,
                width: 32,
                height: 32,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#DC2626',
                cursor: 'pointer',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="lead-card-body">
        <div className="lead-info-row tabular-nums">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="info-icon" style={{flexShrink:0}}>
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.4 2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
          <span>{formattedPhone}</span>
        </div>

        {lead.email && (
          <div className="lead-info-row">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="info-icon" style={{flexShrink:0}}>
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            <span>{lead.email}</span>
          </div>
        )}

        {lead.notes && <div className="lead-notes-box">{lead.notes}</div>}
      </div>
    </div>
  );
};

export default React.memo(LegacyLeadCard);
