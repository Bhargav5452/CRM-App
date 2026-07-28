import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IonIcon } from '@ionic/react';
import { documentTextOutline, arrowForwardOutline, chevronDownOutline, checkmarkOutline, searchOutline } from 'ionicons/icons';
import {
  leadFormSchema,
  LeadFormInput,
  HOME_TYPES,
  COUNTRY_CODES,
  DEFAULT_COUNTRY_CODE,
  CountryCode,
  getCountryByCode,
} from '../../types/lead';
import './LeadForm.css';

interface LeadFormProps {
  onSubmit: (data: LeadFormInput) => void;
}

const LeadForm: React.FC<LeadFormProps> = ({ onSubmit }) => {
  const [isHomeTypeOpen, setIsHomeTypeOpen] = useState(false);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  const homeTypeRef = useRef<HTMLDivElement>(null);
  const countryPickerRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors, isValid },
  } = useForm<LeadFormInput>({
    resolver: zodResolver(leadFormSchema),
    mode: 'onTouched',
    defaultValues: {
      name: '',
      country_code: DEFAULT_COUNTRY_CODE.code,
      phone: '',
      home_type: '',
      email: '',
      notes: '',
    },
  });

  const notesValue = watch('notes') || '';
  const homeTypeValue = watch('home_type') || '';
  const selectedCountryCode = watch('country_code') || DEFAULT_COUNTRY_CODE.code;
  const phoneValue = watch('phone') || '';

  const activeCountry: CountryCode = getCountryByCode(selectedCountryCode);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (homeTypeRef.current && !homeTypeRef.current.contains(event.target as Node)) {
        setIsHomeTypeOpen(false);
      }
      if (countryPickerRef.current && !countryPickerRef.current.contains(event.target as Node)) {
        setIsCountryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelectHomeType = (type: string) => {
    setValue('home_type', type, { shouldValidate: true, shouldTouch: true });
    setIsHomeTypeOpen(false);
  };

  const handleSelectCountry = (country: CountryCode) => {
    setValue('country_code', country.code, { shouldValidate: true, shouldTouch: true });
    // Truncate phone number if longer than new country's digit limit
    if (phoneValue.length > country.digits) {
      setValue('phone', phoneValue.slice(0, country.digits), { shouldValidate: true, shouldTouch: true });
    } else if (phoneValue.length > 0) {
      trigger('phone');
    }
    setIsCountryOpen(false);
    setCountrySearch('');
  };

  const filteredCountries = COUNTRY_CODES.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.code.includes(countrySearch) ||
      c.iso.toLowerCase().includes(countrySearch.toLowerCase())
  );

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

            {/* Phone Number with Country Code Selector */}
            <div className="form-field-group" ref={countryPickerRef}>
              <label htmlFor="phone" className="field-label">
                Phone Number <span className="required-asterisk">*</span>
              </label>
              <div
                className={`phone-input-container ${
                  errors.phone || errors.country_code ? 'input-error' : ''
                }`}
              >
                {/* Country Code Trigger */}
                <div
                  className="country-picker-trigger"
                  onClick={() => setIsCountryOpen(!isCountryOpen)}
                  title={`Selected: ${activeCountry.name} (${activeCountry.code})`}
                >
                  <span className="country-flag">{activeCountry.flag}</span>
                  <span className="country-dial-code">{activeCountry.code}</span>
                  <IonIcon
                    icon={chevronDownOutline}
                    style={{ fontSize: 12, color: '#71717A' }}
                  />
                </div>

                {/* Phone Input */}
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={activeCountry.digits}
                  placeholder={`Enter ${activeCountry.digits}-digit number`}
                  className="phone-number-input"
                  {...register('phone')}
                />
              </div>

              {/* Country Code Dropdown */}
              {isCountryOpen && (
                <div className="country-dropdown-menu">
                  <div className="country-dropdown-search">
                    <input
                      type="text"
                      placeholder="Search country..."
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      className="country-search-input"
                      autoFocus
                    />
                  </div>
                  {filteredCountries.map((country) => {
                    const isSelected = selectedCountryCode === country.code;
                    return (
                      <div
                        key={`${country.iso}-${country.code}`}
                        className={`country-option ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSelectCountry(country)}
                      >
                        <div className="country-option-left">
                          <span className="country-flag">{country.flag}</span>
                          <span className="country-option-name">{country.name}</span>
                        </div>
                        <span className="country-option-code">{country.code}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {errors.phone && (
                <span className="error-message">
                  {errors.phone.message || `Must be ${activeCountry.digits} digits for ${activeCountry.name}`}
                </span>
              )}
            </div>

            {/* Home Type (Custom Dropdown) */}
            <div className="form-field-group" ref={homeTypeRef}>
              <label htmlFor="home_type_trigger" className="field-label">
                Home Type <span className="required-asterisk">*</span>
              </label>
              <div
                id="home_type_trigger"
                tabIndex={0}
                role="button"
                aria-haspopup="listbox"
                aria-expanded={isHomeTypeOpen}
                className={`custom-dropdown-trigger ${isHomeTypeOpen ? 'focused' : ''} ${
                  errors.home_type ? 'input-error' : ''
                }`}
                onClick={() => setIsHomeTypeOpen(!isHomeTypeOpen)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsHomeTypeOpen(!isHomeTypeOpen);
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
                  className={`select-chevron ${isHomeTypeOpen ? 'open' : ''}`}
                />
              </div>

              {/* Custom Dropdown Menu Options */}
              {isHomeTypeOpen && (
                <div className="custom-dropdown-menu" role="listbox">
                  {HOME_TYPES.map((type) => {
                    const isSelected = homeTypeValue === type;
                    return (
                      <div
                        key={type}
                        role="option"
                        aria-selected={isSelected}
                        className={`dropdown-option ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSelectHomeType(type)}
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
