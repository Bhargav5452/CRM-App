import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
  callOutline,
  createOutline,
  trashOutline,
  mailOutline,
  timeOutline,
} from 'ionicons/icons';
import { Lead, getCountryByCode } from '../../types/lead';
import './LeadCard.css';

interface LeadCardProps {
  lead: Lead;
  onEdit: (lead: Lead) => void;
  onDelete: (leadId: number) => void;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, onEdit, onDelete }) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const country = getCountryByCode(lead.country_code);
  const formattedPhone = `${country.flag} ${lead.country_code} ${lead.phone}`;
  const rawPhoneCall = `${lead.country_code}${lead.phone}`.replace(/\+/g, '');

  const formattedDate = new Date(lead.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleDeleteClick = () => {
    if (showConfirmDelete) {
      onDelete(lead.id);
    } else {
      setShowConfirmDelete(true);
      setTimeout(() => setShowConfirmDelete(false), 3000); // Auto revert after 3s
    }
  };

  return (
    <div className="lead-card">
      {/* Header: Name & Badge */}
      <div className="lead-card-header">
        <div className="lead-card-name-group">
          <h3 className="lead-card-name">{lead.name}</h3>
          <span className="lead-card-date">
            <IonIcon icon={timeOutline} style={{ marginRight: 4 }} />
            {formattedDate}
          </span>
        </div>
        <span className="home-type-badge">{lead.home_type}</span>
      </div>

      {/* Body: Info Rows */}
      <div className="lead-card-body">
        <div className="lead-info-row">
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

      {/* Footer Actions */}
      <div className="lead-card-footer">
        <a href={`tel:${rawPhoneCall}`} className="btn-card-action">
          <IonIcon icon={callOutline} />
          <span>Call</span>
        </a>

        <div className="card-actions-group">
          <button
            type="button"
            className="btn-card-action"
            onClick={() => onEdit(lead)}
          >
            <IonIcon icon={createOutline} />
            <span>Edit</span>
          </button>

          <button
            type="button"
            className={`btn-card-action danger`}
            onClick={handleDeleteClick}
          >
            <IonIcon icon={trashOutline} />
            <span>{showConfirmDelete ? 'Confirm?' : 'Delete'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeadCard;
