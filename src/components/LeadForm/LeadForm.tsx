import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IonIcon } from '@ionic/react';
import { documentTextOutline, arrowForwardOutline, chevronDownOutline, checkmarkOutline } from 'ionicons/icons';
import { leadFormSchema, LeadFormInput, HOME_TYPES } from '../../types/lead';
import './LeadForm.css';

interface LeadFormProps {
  onSubmit: (data: LeadFormInput) => void;
}

const LeadForm: React.FC<LeadFormProps> = ({ onSubmit }) => {
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
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

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSelectOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelectOption = (type: string) => {
    setValue('home_type', type, { shouldValidate: true, shouldTouch: true });
    setIsSelectOpen(false);
  };

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

            {/* Home Type (Custom Dropdown) */}
            <div className="form-field-group" ref={dropdownRef}>
              <label htmlFor="home_type_trigger" className="field-label">
                Home Type <span className="required-asterisk">*</span>
              </label>
              <div
                id="home_type_trigger"
                tabIndex={0}
                role="button"
                aria-haspopup="listbox"
                aria-expanded={isSelectOpen}
                className={`custom-dropdown-trigger ${isSelectOpen ? 'focused' : ''} ${
                  errors.home_type ? 'input-error' : ''
                }`}
                onClick={() => setIsSelectOpen(!isSelectOpen)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsSelectOpen(!isSelectOpen);
                  }
                }}
              >
                {homeTypeValue ? (
                  <span className="dropdown-value">{homeTypeValue}</span>
                ) : (
                  <span className="dropdown-placeholder">Select home type</span>
                )}
                <IonIcon
                  icon={chevronDownOutline}
                  className={`select-chevron ${isSelectOpen ? 'open' : ''}`}
                />
              </div>

              {/* Custom Dropdown Menu Options */}
              {isSelectOpen && (
                <div className="custom-dropdown-menu" role="listbox">
                  {HOME_TYPES.map((type) => {
                    const isSelected = homeTypeValue === type;
                    return (
                      <div
                        key={type}
                        role="option"
                        aria-selected={isSelected}
                        className={`dropdown-option ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSelectOption(type)}
                      >
                        <span>{type}</span>
                        {isSelected && (
                          <IonIcon icon={checkmarkOutline} className="option-check" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

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
