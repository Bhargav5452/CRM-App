import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IonIcon } from '@ionic/react';
import { documentTextOutline, arrowForwardOutline, chevronDownOutline } from 'ionicons/icons';
import { leadFormSchema, LeadFormInput, HOME_TYPES } from '../../types/lead';
import './LeadForm.css';

interface LeadFormProps {
  onSubmit: (data: LeadFormInput) => void;
}

const LeadForm: React.FC<LeadFormProps> = ({ onSubmit }) => {
  const {
    register,
    handleSubmit,
    watch,
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

  const notesValue = watch('notes') || '';
  const homeTypeValue = watch('home_type') || '';

  return (
    <div className="lead-form-wrapper">
      <div className="lead-form-card">
        {/* Card Header */}
        <div className="card-header">
          <div className="header-text">
            <h1 className="card-title">New Lead</h1>
            <p className="card-subtitle">Enter the details of your customer</p>
          </div>
          <div className="header-icon-badge">
            <IonIcon icon={documentTextOutline} />
          </div>
        </div>

        {/* Form Grid */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-grid">
            {/* Full Name */}
            <div className="form-field-group">
              <label htmlFor="name" className="field-label">
                Full Name <span className="required-asterisk">*</span>
              </label>
              <input
                id="name"
                type="text"
                placeholder="Enter full name"
                className={`custom-input ${errors.name ? 'input-error' : ''}`}
                {...register('name')}
              />
              {errors.name && (
                <span className="error-message">{errors.name.message}</span>
              )}
            </div>

            {/* Phone Number */}
            <div className="form-field-group">
              <label htmlFor="phone" className="field-label">
                Phone Number <span className="required-asterisk">*</span>
              </label>
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="Enter 10-digit number"
                className={`custom-input ${errors.phone ? 'input-error' : ''}`}
                {...register('phone')}
              />
              {errors.phone && (
                <span className="error-message">{errors.phone.message}</span>
              )}
            </div>

            {/* Home Type */}
            <div className="form-field-group">
              <label htmlFor="home_type" className="field-label">
                Home Type <span className="required-asterisk">*</span>
              </label>
              <div className="custom-select-wrapper">
                <select
                  id="home_type"
                  data-placeholder={!homeTypeValue}
                  className={`custom-select ${errors.home_type ? 'input-error' : ''}`}
                  {...register('home_type')}
                >
                  <option value="" disabled hidden>
                    Select home type
                  </option>
                  {HOME_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <IonIcon icon={chevronDownOutline} className="select-chevron" />
              </div>
              {errors.home_type && (
                <span className="error-message">{errors.home_type.message}</span>
              )}
            </div>

            {/* Email */}
            <div className="form-field-group">
              <label htmlFor="email" className="field-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter email (optional)"
                className={`custom-input ${errors.email ? 'input-error' : ''}`}
                {...register('email')}
              />
              {errors.email && (
                <span className="error-message">{errors.email.message}</span>
              )}
            </div>

            {/* Notes */}
            <div className="form-field-group form-field-full">
              <label htmlFor="notes" className="field-label">
                Notes
              </label>
              <div className="textarea-container">
                <textarea
                  id="notes"
                  maxLength={300}
                  placeholder="Add notes (optional)"
                  className={`custom-textarea ${errors.notes ? 'input-error' : ''}`}
                  {...register('notes')}
                />
                <span className="char-counter">{notesValue.length}/300</span>
              </div>
              {errors.notes && (
                <span className="error-message">{errors.notes.message}</span>
              )}
            </div>
          </div>

          {/* Form Action */}
          <div className="form-actions">
            <button type="submit" disabled={!isValid} className="btn-submit">
              <span>Review & Save</span>
              <IonIcon icon={arrowForwardOutline} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeadForm;
