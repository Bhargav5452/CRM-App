import React, { useState } from 'react';
import { IonContent, IonPage, IonIcon, useIonViewWillEnter } from '@ionic/react';
import { Capacitor } from '@capacitor/core';
import { checkmarkCircleOutline } from 'ionicons/icons';
import LeadForm from '../../components/LeadForm/LeadForm';
import ReviewSheet from '../../components/ReviewSheet/ReviewSheet';
import { LeadFormInput } from '../../types/lead';
import { authService } from '../../services/auth';
import './Home.css';

const Home: React.FC = () => {
  const [reviewData, setReviewData] = useState<LeadFormInput | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [formKey, setFormKey] = useState(0);

  // Automatically lock CRM whenever user leaves CRM and switches back to Home
  useIonViewWillEnter(() => {
    if (!Capacitor.isNativePlatform() && !(typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window)) {
      authService.signOut().catch(() => {});
    }
  });

  const handleFormSubmit = (data: LeadFormInput) => {
    setReviewData(data);
    setIsReviewOpen(true);
  };

  const handleEdit = () => {
    setIsReviewOpen(false);
  };

  const [toastMessage, setToastMessage] = useState('Lead Saved');

  const handleSaveSuccess = (message?: string) => {
    setIsReviewOpen(false);
    setReviewData(null);
    setFormKey((prev) => prev + 1);
    setToastMessage(message || 'Lead Saved');
    setShowSuccessToast(true);

    setTimeout(() => {
      setShowSuccessToast(false);
    }, 5000);
  };

  return (
    <IonPage>
      <IonContent fullscreen className="home-content">
        {/* Glassmorphic Success Banner Toast */}
        {showSuccessToast && (
          <div className="toast-success-banner">
            <div className="toast-content">
              <div className="toast-left">
                <IonIcon icon={checkmarkCircleOutline} style={{ fontSize: 20, color: '#16A34A' }} />
                <span>{toastMessage}</span>
              </div>
            </div>
          </div>
        )}

        {/* Lead Form */}
        <LeadForm key={formKey} onSubmit={handleFormSubmit} />

        {/* Review & Save Bottom Sheet */}
        <ReviewSheet
          data={reviewData}
          isOpen={isReviewOpen}
          onEdit={handleEdit}
          onSaveSuccess={handleSaveSuccess}
        />
      </IonContent>
    </IonPage>
  );
};

export default Home;
