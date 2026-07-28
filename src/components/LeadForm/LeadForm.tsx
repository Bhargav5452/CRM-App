import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { leadFormSchema, LeadFormInput, HOME_TYPES } from '../../types/lead';
import './LeadForm.css';

interface LeadFormProps {
  onSubmit: (data: LeadFormInput) => void;
}

const LeadForm: React.FC<LeadFormProps> = ({ onSubmit }) => {
  const {
    register,
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
    <div className="lead-form-container">
      <div className="form-header">
        <h1 className="form-title">New Lead</h1>
        <p className="form-subtitle">Start by entering the customer's details.</p>
      </div>

      <hr className="form-divider" />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="form-fields">
        {/* Full Name */}
        <div className="form-field-group">
          <label htmlFor="name" className="field-label">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            placeholder="John Doe"
            className={`custom-input ${errors.name ? 'input-error' : ''}`}
            {...register('name')}
          />
          {errors.name && <span className="error-message">{errors.name.message}</span>}
        </div>

        {/* Phone Number */}
        <div className="form-field-group">
          <label htmlFor="phone" className="field-label">
            Phone Number
          </label>
          <input
            id="phone"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            placeholder="9876543210"
            className={`custom-input ${errors.phone ? 'input-error' : ''}`}
            {...register('phone')}
          />
          {errors.phone && <span className="error-message">{errors.phone.message}</span>}
        </div>

        {/* Home Type */}
        <div className="form-field-group">
          <label htmlFor="home_type" className="field-label">
            Home Type
          </label>
          <div className="custom-select-wrapper">
            <select
              id="home_type"
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
            <span className="select-arrow">▼</span>
          </div>
          {errors.home_type && (
            <span className="error-message">{errors.home_type.message}</span>
          )}
        </div>

        {/* Email */}
        <div className="form-field-group">
          <label htmlFor="email" className="field-label">
            Email <span className="optional-tag">(Optional)</span>
          </label>
          <input
            id="email"
            type="email"
            placeholder="john@example.com"
            className={`custom-input ${errors.email ? 'input-error' : ''}`}
            {...register('email')}
          />
          {errors.email && <span className="error-message">{errors.email.message}</span>}
        </div>

        {/* Notes */}
        <div className="form-field-group">
          <label htmlFor="notes" className="field-label">
            Notes <span className="optional-tag">(Optional)</span>
          </label>
          <textarea
            id="notes"
            placeholder="Additional requirements or details..."
            className={`custom-textarea ${errors.notes ? 'input-error' : ''}`}
            {...register('notes')}
          />
          {errors.notes && <span className="error-message">{errors.notes.message}</span>}
        </div>

        {/* Action Button */}
        <div className="form-actions">
          <button type="submit" disabled={!isValid} className="btn-primary">
            Review & Save
          </button>
        </div>
      </form>
    </div>
  );
};

export default LeadForm;
