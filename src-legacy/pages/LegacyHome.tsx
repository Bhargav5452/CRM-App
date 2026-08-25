import React, { useState } from 'react';
import LegacyLeadForm from '../components/LegacyLeadForm';
import LegacyReviewSheet from '../components/LegacyReviewSheet';
import { LeadFormInput } from '../types/legacyValidation';
import '../../src/pages/Home/Home.css';

const LegacyHome: React.FC = () => {
  const [reviewData, setReviewData] = useState<LeadFormInput | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const handleFormSubmit = (data: LeadFormInput) => {
    setReviewData(data);
    setIsReviewOpen(true);
  };

  const handleEdit = () => setIsReviewOpen(false);

  const handleSaveSuccess = () => {
    setIsReviewOpen(false);
    setReviewData(null);
    setFormKey((prev) => prev + 1);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 5000);
  };

  return (
    <div className="home-content legacy-page-content">
      {showSuccessToast && (
        <div className="toast-success-banner">
          <div className="toast-content">
            <div className="toast-left">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <span>Lead Saved</span>
            </div>
          </div>
        </div>
      )}
      <LegacyLeadForm key={formKey} onSubmit={handleFormSubmit} />
      <LegacyReviewSheet data={reviewData} isOpen={isReviewOpen} onEdit={handleEdit} onSaveSuccess={handleSaveSuccess} />
    </div>
  );
};

export default LegacyHome;
