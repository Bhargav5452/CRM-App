import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import LeadForm from '../../components/LeadForm/LeadForm';
import { LeadFormInput } from '../../types/lead';
import './Home.css';

const Home: React.FC = () => {
  const handleFormSubmit = (data: LeadFormInput) => {
    // Phase 3 will open the ReviewSheet bottom sheet here.
    console.log('Form data ready for review:', data);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>New Lead</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">New Lead</IonTitle>
          </IonToolbar>
        </IonHeader>
        <LeadForm onSubmit={handleFormSubmit} />
      </IonContent>
    </IonPage>
  );
};

export default Home;
