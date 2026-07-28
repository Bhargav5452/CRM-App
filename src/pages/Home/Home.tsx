import React from 'react';
import { IonContent, IonPage } from '@ionic/react';
import LeadForm from '../../components/LeadForm/LeadForm';
import { LeadFormInput } from '../../types/lead';
import './Home.css';

const Home: React.FC = () => {
  const handleFormSubmit = (data: LeadFormInput) => {
    console.log('Form submitted for review:', data);
  };

  return (
    <IonPage>
      <IonContent fullscreen className="home-content">
        <LeadForm onSubmit={handleFormSubmit} />
      </IonContent>
    </IonPage>
  );
};

export default Home;
