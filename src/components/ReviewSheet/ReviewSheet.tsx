import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { checkmarkCircleOutline, createOutline, alertCircleOutline } from 'ionicons/icons';
import { LeadFormInput, getCountryByCode } from '../../types/lead';
import { databaseService } from '../../services/database';
import './ReviewSheet.css';

interface ReviewSheetProps {
  data: LeadFormInput | null;
  isOpen: boolean;
  onEdit: () => void;
  onSaveSuccess: () => void;
}

const ReviewSheet: React.FC<ReviewSheetProps> = ({
  data,
  isOpen,
  onEdit,
  onSaveSuccess,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !data) return null;

  const country = getCountryByCode(data.country_code);
  const fullPhone = `${country.flag} ${data.country_code} ${data.phone}`;

  const handleConfirmSave = async () => {
    setIsSaving(true);
    setErrorMessage(null);

    const result = await databaseService.saveLead(data);

    setIsSaving(false);

    if (result.success) {
      onSaveSuccess();
    } else {
      setErrorMessage(result.error || 'Failed to save lead.');
    }
  };

  return (
    <div className="review-sheet-backdrop" onClick={onEdit}>
      <div
        className="review-sheet-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-handle-bar" />

        {/* Header */}
        <div className="sheet-header">
          <h2 className="sheet-title">Review Lead Details</h2>
          <p className="sheet-subtitle">
            Please verify the customer information before saving.
          </p>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="review-error-banner">
            <IonIcon icon={alertCircleOutline} style={{ fontSize: 18 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Summary Card */}
        <div className="review-summary-card">
          <div className="review-item">
            <span className="review-label">Full Name</span>
            <span className="review-value">{data.name}</span>
          </div>

          <div className="review-item">
            <span className="review-label">Phone Number</span>
            <span className="review-value">{fullPhone}</span>
          </div>

          <div className="review-item">
            <span className="review-label">Home Type</span>
            <span className="review-value">{data.home_type}</span>
          </div>

          <div className="review-item">
            <span className="review-label">Email</span>
            <span
              className={`review-value ${!data.email ? 'empty-value' : ''}`}
            >
              {data.email || 'Not provided'}
            </span>
          </div>

          <div className="review-item">
            <span className="review-label">Notes</span>
            <span
              className={`review-value ${!data.notes ? 'empty-value' : ''}`}
            >
              {data.notes || 'No notes added'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="sheet-actions">
          <button
            type="button"
            className="btn-confirm"
            onClick={handleConfirmSave}
            disabled={isSaving}
          >
            <IonIcon icon={checkmarkCircleOutline} style={{ fontSize: 18 }} />
            <span>{isSaving ? 'Saving...' : 'Confirm & Save'}</span>
          </button>

          <button
            type="button"
            className="btn-edit"
            onClick={onEdit}
            disabled={isSaving}
          >
            <IonIcon icon={createOutline} style={{ fontSize: 18 }} />
            <span>Edit Details</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewSheet;
