import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  IonList,
  IonItem,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonButton,
  IonNote,
} from '@ionic/react';
import { leadFormSchema, LeadFormInput, HOME_TYPES } from '../../types/lead';
import './LeadForm.css';

interface LeadFormProps {
  onSubmit: (data: LeadFormInput) => void;
}

const LeadForm: React.FC<LeadFormProps> = ({ onSubmit }) => {
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LeadFormInput>({
    resolver: zodResolver(leadFormSchema),
    mode: 'onTouched',
    defaultValues: {
      name: '',
      phone: '',
      home_type: '',
      email: '',
      notes: '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <IonList className="lead-form-list">
        {/* Name */}
        <IonItem className={errors.name ? 'ion-invalid' : 'ion-valid'}>
          <Controller
            name="name"
            control={control}
            render={({ field: { onChange, onBlur, value } }) => (
              <IonInput
                label="Name"
                labelPlacement="stacked"
                placeholder="Enter full name"
                type="text"
                value={value}
                onIonInput={(e) => onChange(e.detail.value ?? '')}
                onIonBlur={onBlur}
              />
            )}
          />
          {errors.name && (
            <IonNote slot="error">{errors.name.message}</IonNote>
          )}
        </IonItem>

        {/* Phone */}
        <IonItem className={errors.phone ? 'ion-invalid' : 'ion-valid'}>
          <Controller
            name="phone"
            control={control}
            render={({ field: { onChange, onBlur, value } }) => (
              <IonInput
                label="Phone"
                labelPlacement="stacked"
                placeholder="10-digit phone number"
                type="tel"
                inputmode="numeric"
                maxlength={10}
                value={value}
                onIonInput={(e) => onChange(e.detail.value ?? '')}
                onIonBlur={onBlur}
              />
            )}
          />
          {errors.phone && (
            <IonNote slot="error">{errors.phone.message}</IonNote>
          )}
        </IonItem>

        {/* Home Type */}
        <IonItem className={errors.home_type ? 'ion-invalid' : 'ion-valid'}>
          <Controller
            name="home_type"
            control={control}
            render={({ field: { onChange, onBlur, value } }) => (
              <IonSelect
                label="Home Type"
                labelPlacement="stacked"
                placeholder="Select home type"
                interface="action-sheet"
                value={value}
                onIonChange={(e) => onChange(e.detail.value ?? '')}
                onIonBlur={onBlur}
              >
                {HOME_TYPES.map((type) => (
                  <IonSelectOption key={type} value={type}>
                    {type}
                  </IonSelectOption>
                ))}
              </IonSelect>
            )}
          />
          {errors.home_type && (
            <IonNote slot="error">{errors.home_type.message}</IonNote>
          )}
        </IonItem>


        {/* Email (Optional) */}
        <IonItem className={errors.email ? 'ion-invalid' : 'ion-valid'}>
          <Controller
            name="email"
            control={control}
            render={({ field: { onChange, onBlur, value } }) => (
              <IonInput
                label="Email"
                labelPlacement="stacked"
                placeholder="Optional"
                type="email"
                value={value}
                onIonInput={(e) => onChange(e.detail.value ?? '')}
                onIonBlur={onBlur}
              />
            )}
          />
          {errors.email && (
            <IonNote slot="error">{errors.email.message}</IonNote>
          )}
        </IonItem>

        {/* Notes (Optional) */}
        <IonItem className={errors.notes ? 'ion-invalid' : 'ion-valid'}>
          <Controller
            name="notes"
            control={control}
            render={({ field: { onChange, onBlur, value } }) => (
              <IonTextarea
                label="Notes"
                labelPlacement="stacked"
                placeholder="Optional"
                rows={3}
                maxlength={500}
                value={value}
                onIonInput={(e) => onChange(e.detail.value ?? '')}
                onIonBlur={onBlur}
              />
            )}
          />
          {errors.notes && (
            <IonNote slot="error">{errors.notes.message}</IonNote>
          )}
        </IonItem>
      </IonList>

      <div className="lead-form-actions">
        <IonButton
          type="submit"
          expand="block"
          size="large"
          disabled={!isValid}
          className="review-save-button"
        >
          Review & Save
        </IonButton>
      </div>
    </form>
  );
};

export default LeadForm;
