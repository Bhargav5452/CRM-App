import React, { useState, useEffect } from 'react';
import { LeadFormInput, getCountryByCode } from '../types/legacyValidation';
import { databaseService } from '../../src/services/database';

interface ReviewSheetProps {
  data: LeadFormInput | null;
  isOpen: boolean;
  onEdit: () => void;
  onSaveSuccess: () => void;
}

const LegacyReviewSheet: React.FC<ReviewSheetProps> = ({ data, isOpen, onEdit, onSaveSuccess }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onEdit(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onEdit]);

  if (!isOpen || !data) return null;

  const country = getCountryByCode(data.country_code);
  const fullPhone = country.flag + ' ' + data.country_code + ' ' + data.phone;

  const handleConfirmSave = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    const result = await databaseService.saveLead(data);
    setIsSaving(false);
    if (result.success) {
      window.dispatchEvent(new CustomEvent('crm-lead-added'));
      onSaveSuccess();
    } else {
      setErrorMessage(result.error || 'Failed to save lead.');
    }
  };

  return (
    <div className="review-sheet-backdrop" onClick={onEdit}>
      <div className="review-sheet-container" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle-bar" />

        <div className="sheet-header">
          <h2 className="sheet-title">Review Lead Details</h2>
          <p className="sheet-subtitle">Please verify the Lead information before saving.</p>
        </div>

        {errorMessage && (
          <div className="review-error-banner">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

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
            <span className={"review-value" + (!data.email ? ' empty-value' : '')}>{data.email || 'Not provided'}</span>
          </div>
          <div className="review-item">
            <span className="review-label">Notes</span>
            <span className={"review-value" + (!data.notes ? ' empty-value' : '')}>{data.notes || 'No notes added'}</span>
          </div>
        </div>

        <div className="sheet-actions">
          <button type="button" className="btn-confirm" onClick={handleConfirmSave} disabled={isSaving}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span>{isSaving ? 'Saving...' : 'Confirm & Save'}</span>
          </button>

          <button type="button" className="btn-edit" onClick={onEdit} disabled={isSaving}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            <span>Edit Details</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(LegacyReviewSheet);
