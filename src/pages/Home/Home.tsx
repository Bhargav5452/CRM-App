import React, { useState } from 'react';
import { IonContent, IonPage, IonHeader, IonIcon } from '@ionic/react';
import { checkmarkCircleOutline } from 'ionicons/icons';
import Navigation from '../../components/Navigation/Navigation';
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
    }, 4000);
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <Navigation />
      </IonHeader>

      <IonContent fullscreen className="home-content">
        {/* Success Banner */}
        {showSuccessToast && (
          <div className="toast-success-banner">
            <div className="toast-content">
              <IonIcon icon={checkmarkCircleOutline} style={{ fontSize: 20, color: '#16A34A' }} />
              <span>Lead saved successfully!</span>
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
