import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { IonContent, IonPage, IonIcon } from '@ionic/react';
import { checkmarkCircleOutline, arrowForwardOutline } from 'ionicons/icons';
import LeadForm from '../../components/LeadForm/LeadForm';
import ReviewSheet from '../../components/ReviewSheet/ReviewSheet';
import { LeadFormInput } from '../../types/lead';
import './Home.css';

const Home: React.FC = () => {
  const [reviewData, setReviewData] = useState<LeadFormInput | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const handleFormSubmit = (data: LeadFormInput) => {
    setReviewData(data);
    setIsReviewOpen(true);
  };

  const handleEdit = () => {
    setIsReviewOpen(false);
  };

  const handleSaveSuccess = () => {
    setIsReviewOpen(false);
    setReviewData(null);
    setFormKey((prev) => prev + 1);
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
                <span>Lead saved successfully!</span>
              </div>
              <Link to="/crm" className="toast-link-btn">
                <span>View in CRM</span>
                <IonIcon icon={arrowForwardOutline} style={{ fontSize: 13 }} />
              </Link>
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
