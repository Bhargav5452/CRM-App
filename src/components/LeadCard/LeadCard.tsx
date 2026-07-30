import React, { useRef } from 'react';
import { IonIcon } from '@ionic/react';
import { callOutline, checkmarkOutline, mailOutline, timeOutline } from 'ionicons/icons';
import { Lead, getCountryByIso } from '../../types/lead';
import './LeadCard.css';

interface LeadCardProps {
  lead: Lead;
  isSelected: boolean;
  isSelectionMode: boolean;
  onSelectToggle: (leadId: number) => void;
  onLongPress: (leadId: number) => void;
}

const LeadCardComponent: React.FC<LeadCardProps> = ({
  lead,
  isSelected,
  isSelectionMode,
  onSelectToggle,
  onLongPress,
}) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);

  const country = getCountryByIso(lead.country_iso, lead.country_code);
  const formattedPhone = `${country.flag} ${lead.country_code} ${lead.phone}`;
  const formattedDate = new Date(lead.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const startPressTimer = () => {
    isLongPressRef.current = false;
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      onLongPress(lead.id);
    }, 500);
  };

  const clearPressTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isLongPressRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (isSelectionMode) {
      onSelectToggle(lead.id);
    }
  };

  return (
    <div
      className={`lead-card ${isSelected ? 'selected-card' : ''}`}
      onClick={handleClick}
      onTouchStart={startPressTimer}
      onTouchEnd={clearPressTimer}
      onTouchMove={clearPressTimer}
      onMouseDown={startPressTimer}
      onMouseUp={clearPressTimer}
      onMouseLeave={clearPressTimer}
    >
      {/* Header: Name & Badge */}
      <div className="lead-card-header">
        <div className="lead-card-name-group">
          <div className="lead-name-row">
            {isSelectionMode && (
              <div className="selection-check-badge">
                {isSelected && <IonIcon icon={checkmarkOutline} />}
              </div>
            )}
            <h3 className="lead-card-name">{lead.name}</h3>
          </div>
          <span className="lead-card-date tabular-nums">
            <IonIcon icon={timeOutline} className="date-icon" />
            {formattedDate}
          </span>
        </div>
        <span className="home-type-badge">{lead.home_type}</span>
      </div>

      {/* Body: Info Rows */}
      <div className="lead-card-body">
        <div className="lead-info-row tabular-nums">
          <IonIcon icon={callOutline} className="info-icon" />
          <span>{formattedPhone}</span>
        </div>

        {lead.email && (
          <div className="lead-info-row">
            <IonIcon icon={mailOutline} className="info-icon" />
            <span>{lead.email}</span>
          </div>
        )}

        {lead.notes && <div className="lead-notes-box">{lead.notes}</div>}
      </div>
    </div>
  );
};

export const LeadCard = React.memo(LeadCardComponent);
export default LeadCard;
