import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IonIcon } from '@ionic/react';
import { arrowForwardOutline, chevronDownOutline, checkmarkOutline, closeOutline } from 'ionicons/icons';
import {
  leadFormSchema,
  LeadFormInput,
  HOME_TYPES,
  COUNTRY_CODES,
  DEFAULT_COUNTRY_CODE,
  CountryCode,
  getCountryByCode,
} from '../../types/lead';
import { FormConfig } from '../../types/formConfig';
import { formConfigService } from '../../services/formConfigService';
import './LeadForm.css';

interface LeadFormProps {
  onSubmit: (data: LeadFormInput) => void;
  defaultValues?: Partial<LeadFormInput>;
  submitButtonText?: string;
  hideHeader?: boolean;
  config?: FormConfig;
}

const LeadForm: React.FC<LeadFormProps> = ({
  onSubmit,
  defaultValues,
  submitButtonText,
  hideHeader = false,
  config,
}) => {
  const [formConfig, setFormConfig] = useState<FormConfig>(
    () => config || formConfigService.getCachedConfig()
  );
  const [customValues, setCustomValues] = useState<Record<string, unknown>>(
    () => (defaultValues?.custom_data as Record<string, unknown>) || {}
  );

  useEffect(() => {
    if (config) {
      setFormConfig(config);
    } else {
      formConfigService.getPublishedConfig().then((c) => {
        setFormConfig(c);
      });
    }
  }, [config]);

  const nameConfig = formConfig.fields.find((f) => f.key === 'name');
  const phoneConfig = formConfig.fields.find((f) => f.key === 'phone');
  const homeTypeConfig = formConfig.fields.find((f) => f.key === 'home_type');
  const emailConfig = formConfig.fields.find((f) => f.key === 'email');
  const notesConfig = formConfig.fields.find((f) => f.key === 'notes');
  const customFields = formConfig.fields.filter((f) => !f.is_core && f.is_visible);
  const availableHomeTypes =
    homeTypeConfig?.options && homeTypeConfig.options.length > 0
      ? homeTypeConfig.options
      : HOME_TYPES;
  const [isHomeTypeOpen, setIsHomeTypeOpen] = useState(false);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [keyFocusedIdx, setKeyFocusedIdx] = useState(-1);

  const homeTypeRef = useRef<HTMLDivElement>(null);
  const countryPickerRef = useRef<HTMLDivElement>(null);
  const selectedCountryRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedCountryObj, setSelectedCountryObj] = useState<CountryCode>(() =>
    getCountryByCode(defaultValues?.country_code || DEFAULT_COUNTRY_CODE.code)
  );

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
      name: defaultValues?.name || '',
      country_code: defaultValues?.country_code || DEFAULT_COUNTRY_CODE.code,
      phone: defaultValues?.phone || '',
      home_type: defaultValues?.home_type || '',
      email: defaultValues?.email || '',
      notes: defaultValues?.notes || '',
    },
  });

  const { ref: nameRegisterRef, ...nameRegisterRest } = register('name');

  const notesValue = watch('notes') || '';
  const homeTypeValue = watch('home_type') || '';
  const phoneValue = watch('phone') || '';

  const activeCountry: CountryCode = selectedCountryObj;

  // Focus Name input on mount/reset
  useEffect(() => {
    if (!defaultValues && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [defaultValues]);

  // Lock body scroll when country popover is open
  useEffect(() => {
    if (isCountryOpen) {
      document.body.style.overflow = 'hidden';
      setKeyFocusedIdx(-1);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCountryOpen]);

  // Close dropdowns on outside click & Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (homeTypeRef.current && !homeTypeRef.current.contains(event.target as Node)) {
        setIsHomeTypeOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsHomeTypeOpen(false);
        setIsCountryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSelectHomeType = (type: string) => {
    setValue('home_type', type, { shouldValidate: true });
    setIsHomeTypeOpen(false);
  };

  const handleSelectCountry = (country: CountryCode) => {
    setSelectedCountryObj(country);
    setValue('country_code', country.code, { shouldValidate: true });
    setIsCountryOpen(false);
    setCountrySearch('');
    // Trigger revalidation on phone when country changes
    if (phoneValue) {
      trigger('phone');
    }
  };

  const searchLower = countrySearch.toLowerCase().trim();

  // Pinned countries in priority order: India, US, Canada, UK, Australia, UAE, Singapore
  const PINNED_ISOS = ['IN', 'US', 'CA', 'GB', 'AU', 'AE', 'SG'];

  const filteredPinned = PINNED_ISOS.map((iso) => COUNTRY_CODES.find((c) => c.iso === iso))
    .filter((c): c is CountryCode => Boolean(c))
    .filter(
      (c) =>
        c.name.toLowerCase().includes(searchLower) ||
        c.code.includes(searchLower) ||
        c.iso.toLowerCase().includes(searchLower)
    );

  // Alphabetical list excluding pinned countries
  const filteredOthers = COUNTRY_CODES.filter(
    (c) =>
      !PINNED_ISOS.includes(c.iso) &&
      (c.name.toLowerCase().includes(searchLower) ||
        c.code.includes(searchLower) ||
        c.iso.toLowerCase().includes(searchLower))
  );

  // Flattened array for index-based keyboard navigation
  const allFilteredCountries = [...filteredPinned, ...filteredOthers];

  const handleCountrySearchKeyDown = (e: React.KeyboardEvent) => {
    if (allFilteredCountries.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setKeyFocusedIdx((prev) => (prev + 1) % allFilteredCountries.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setKeyFocusedIdx(
        (prev) => (prev - 1 + allFilteredCountries.length) % allFilteredCountries.length
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allFilteredCountries[keyFocusedIdx]) {
        handleSelectCountry(allFilteredCountries[keyFocusedIdx]);
      }
    }
  };

  const handleCustomChange = (key: string, val: unknown) => {
    setCustomValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleInternalSubmit = (data: LeadFormInput) => {
    const finalData: LeadFormInput = {
      ...data,
      form_config_id: formConfig.id || null,
      custom_data: customValues,
    };
    onSubmit(finalData);
  };

  const formContent = (
    <form
      onSubmit={handleSubmit(handleInternalSubmit)}
      className="lead-form-grid"
      autoComplete="off"
      action="javascript:void(0);"
      data-lpignore="true"
      data-form-type="other"
    >
      {/* Full Name */}
      <div className="form-field-group">
        <label htmlFor="lead_full_name" className="field-label">
          {nameConfig?.label || 'Full Name'} <span className="required-asterisk">*</span>
        </label>
        <input
          id="lead_full_name"
          type="text"
          placeholder={nameConfig?.placeholder || 'Enter full name'}
          className={`custom-input ${errors.name ? 'input-error' : ''}`}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="words"
          spellCheck={false}
          data-lpignore="true"
          data-form-type="other"
          {...nameRegisterRest}
          ref={(e) => {
            nameRegisterRef(e);
            nameInputRef.current = e;
          }}
        />
        {errors.name && (
          <span className="error-message">{errors.name.message}</span>
        )}
      </div>

      {/* Phone Number with Country Code Selector */}
      <div className="form-field-group" ref={countryPickerRef}>
        <label htmlFor="lead_phone" className="field-label">
          {phoneConfig?.label || 'Phone Number'} <span className="required-asterisk">*</span>
        </label>
        <div
          className={`phone-input-container ${errors.phone || errors.country_code ? 'input-error' : ''
            }`}
        >
          <div
            className="country-picker-trigger"
            onClick={() => setIsCountryOpen(true)}
            title={`Selected: ${activeCountry.name} (${activeCountry.code})`}
          >
            <span className="country-flag">{activeCountry.flag}</span>
            <span className="country-dial-code">{activeCountry.code}</span>
            <IonIcon
              icon={chevronDownOutline}
              className="country-trigger-chevron"
            />
          </div>

          <input
            id="lead_phone"
            type="tel"
            inputMode="numeric"
            maxLength={activeCountry.digits}
            placeholder={phoneConfig?.placeholder || `Enter ${activeCountry.digits}-digit number`}
            className="phone-number-input"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            data-lpignore="true"
            data-form-type="other"
            {...register('phone')}
          />
        </div>

        {errors.phone && (
          <span className="error-message">
            {errors.phone.message || `Must be ${activeCountry.digits} digits for ${activeCountry.name}`}
          </span>
        )}
      </div>

      {/* Home Type */}
      {homeTypeConfig?.is_visible !== false && (
        <div className="form-field-group" ref={homeTypeRef}>
          <label htmlFor="home_type_trigger" className="field-label">
            {homeTypeConfig?.label || 'Home Type'} {homeTypeConfig?.required && <span className="required-asterisk">*</span>}
          </label>
          <div
            id="home_type_trigger"
            tabIndex={0}
            role="button"
            aria-haspopup="listbox"
            aria-expanded={isHomeTypeOpen}
            className={`custom-dropdown-trigger ${isHomeTypeOpen ? 'focused' : ''} ${errors.home_type ? 'input-error' : ''
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
              <span className="dropdown-placeholder">{homeTypeConfig?.placeholder || 'Select home type'}</span>
            )}
            <IonIcon
              icon={chevronDownOutline}
              className={`select-chevron ${isHomeTypeOpen ? 'open' : ''}`}
            />
          </div>

          {isHomeTypeOpen && (
            <div className="custom-dropdown-menu" role="listbox">
              {availableHomeTypes.map((type) => {
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
      )}

      {/* Email */}
      {emailConfig?.is_visible !== false && (
        <div className="form-field-group">
          <label htmlFor="lead_email" className="field-label">
            {emailConfig?.label || 'Email'} {emailConfig?.required && <span className="required-asterisk">*</span>}
          </label>
          <input
            id="lead_email"
            type="email"
            placeholder={emailConfig?.placeholder || 'Enter email (optional)'}
            className={`custom-input ${errors.email ? 'input-error' : ''}`}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            data-lpignore="true"
            data-form-type="other"
            {...register('email')}
          />
          {errors.email && (
            <span className="error-message">{errors.email.message}</span>
          )}
        </div>
      )}

      {/* Notes */}
      {notesConfig?.is_visible !== false && (
        <div className="form-field-group form-field-full">
          <label htmlFor="lead_notes" className="field-label">
            {notesConfig?.label || 'Notes'} {notesConfig?.required && <span className="required-asterisk">*</span>}
          </label>
          <div className="textarea-container">
            <textarea
              id="lead_notes"
              maxLength={300}
              placeholder={notesConfig?.placeholder || 'Add notes (optional)'}
              className={`custom-textarea ${errors.notes ? 'input-error' : ''}`}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              data-lpignore="true"
              data-form-type="other"
              {...register('notes')}
            />
            <div className="textarea-footer">
              <span
                className={`char-counter ${notesValue.length === 300 ? 'max-reached' : ''
                  }`}
              >
                {notesValue.length}/300
              </span>
            </div>
          </div>
          {errors.notes && (
            <span className="error-message">{errors.notes.message}</span>
          )}
        </div>
      )}

      {/* Dynamic Custom Fields */}
      {customFields.map((cf) => (
        <div
          key={cf.id}
          className={`form-field-group ${cf.type === 'textarea' ? 'form-field-full' : ''}`}
        >
          <label htmlFor={`custom_${cf.key}`} className="field-label">
            {cf.label} {cf.required && <span className="required-asterisk">*</span>}
          </label>
          {cf.type === 'textarea' ? (
            <textarea
              id={`custom_${cf.key}`}
              className="custom-textarea"
              placeholder={cf.placeholder || `Enter ${cf.label}`}
              value={String(customValues[cf.key] || '')}
              onChange={(e) => handleCustomChange(cf.key, e.target.value)}
            />
          ) : cf.type === 'dropdown' ? (
            <select
              id={`custom_${cf.key}`}
              className="custom-input"
              value={String(customValues[cf.key] || '')}
              onChange={(e) => handleCustomChange(cf.key, e.target.value)}
              style={{ appearance: 'auto' }}
            >
              <option value="">{cf.placeholder || `Select ${cf.label}`}</option>
              {(cf.options || []).map((opt, i) => (
                <option key={i} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : cf.type === 'checkbox' ? (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, fontSize: 14.5, cursor: 'pointer' }}>
              <input
                id={`custom_${cf.key}`}
                type="checkbox"
                checked={Boolean(customValues[cf.key])}
                onChange={(e) => handleCustomChange(cf.key, e.target.checked)}
              />
              <span>{cf.placeholder || cf.label}</span>
            </label>
          ) : (
            <input
              id={`custom_${cf.key}`}
              type={cf.type === 'number' ? 'number' : cf.type === 'email' ? 'email' : 'text'}
              className="custom-input"
              placeholder={cf.placeholder || `Enter ${cf.label}`}
              value={String(customValues[cf.key] || '')}
              onChange={(e) => handleCustomChange(cf.key, e.target.value)}
            />
          )}
          {cf.description && (
            <span style={{ fontSize: 12, color: '#71717A' }}>{cf.description}</span>
          )}
        </div>
      ))}

      {/* Form Action */}
      <div className="form-actions">
        <button
          type="submit"
          disabled={!isValid}
          className="btn-submit"
          title={!isValid ? 'Fill required fields (*)' : undefined}
        >
          <span>{submitButtonText || formConfig.submit_button_text || 'Review Details'}</span>
          <IonIcon icon={arrowForwardOutline} />
        </button>
      </div>
    </form>
  );

  return (
    <>
      {hideHeader ? (
        <div className="lead-form-clean">{formContent}</div>
      ) : (
        <div className="lead-form-wrapper">
          <div className="lead-form-card">
            {/* Card Header */}
            <div className="card-header">
              <div className="header-text">
                <h1 className="card-title">
                  {defaultValues ? 'Edit client details' : formConfig.title}
                </h1>
                <p className="card-subtitle">
                  {defaultValues
                    ? 'Update details below'
                    : formConfig.subtitle}
                </p>
              </div>
            </div>
            {formContent}
          </div>
        </div>
      )}

      {/* Country Popover Modal Backdrop */}
      {isCountryOpen && (
        <div
          className="country-popover-backdrop"
          onClick={() => setIsCountryOpen(false)}
        >
          <div
            className="country-popover-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="country-popover-header">
              <div className="country-popover-title-row">
                <span className="country-popover-title">Select Country</span>
                <button
                  type="button"
                  className="country-close-btn"
                  onClick={() => setIsCountryOpen(false)}
                  title="Close country selector"
                >
                  <IonIcon icon={closeOutline} />
                </button>
              </div>

              {/* Live Search Filter Input */}
              <div className="country-search-wrapper">
                <input
                  id="crm_country_search"
                  name="crm_country_search"
                  type="text"
                  className="country-search-input"
                  placeholder="Search country or code..."
                  value={countrySearch}
                  onChange={(e) => {
                    setCountrySearch(e.target.value);
                    setKeyFocusedIdx(0);
                  }}
                  onKeyDown={handleCountrySearchKeyDown}
                  autoFocus
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  data-lpignore="true"
                />
              </div>
            </div>

            <div className="country-list-scroll">
              {filteredPinned.length > 0 && !searchLower && (
                <div className="country-section-label">Popular Countries</div>
              )}
              {filteredPinned.map((country) => {
                const isSelected = selectedCountryObj.iso === country.iso;
                const flatIndex = allFilteredCountries.findIndex(
                  (c) => c.iso === country.iso
                );
                const isKeyFocused = keyFocusedIdx === flatIndex;
                return (
                  <div
                    key={`pinned-${country.iso}`}
                    ref={isSelected ? selectedCountryRef : null}
                    className={`country-list-item ${isSelected ? 'selected' : ''
                      } ${isKeyFocused ? 'key-focused' : ''}`}
                    onClick={() => handleSelectCountry(country)}
                  >
                    <span className="country-item-iso">{country.iso}</span>
                    <span className="country-item-name">{country.name}</span>
                    <span className="country-item-code">{country.code}</span>
                    <span className="country-item-check">
                      {isSelected && (
                        <IonIcon
                          icon={checkmarkOutline}
                          className="country-check-icon"
                        />
                      )}
                    </span>
                  </div>
                );
              })}

              {filteredOthers.length > 0 && (
                <>
                  {!searchLower && (
                    <div className="country-section-label">All Countries</div>
                  )}
                  {filteredOthers.map((country) => {
                    const isSelected = selectedCountryObj.iso === country.iso;
                    const flatIndex = allFilteredCountries.findIndex(
                      (c) => c.iso === country.iso
                    );
                    const isKeyFocused = keyFocusedIdx === flatIndex;
                    return (
                      <div
                        key={country.iso}
                        ref={isSelected ? selectedCountryRef : null}
                        className={`country-list-item ${isSelected ? 'selected' : ''
                          } ${isKeyFocused ? 'key-focused' : ''}`}
                        onClick={() => handleSelectCountry(country)}
                      >
                        <span className="country-item-iso">{country.iso}</span>
                        <span className="country-item-name">
                          {country.name}
                        </span>
                        <span className="country-item-code">
                          {country.code}
                        </span>
                        <span className="country-item-check">
                          {isSelected && (
                            <IonIcon
                              icon={checkmarkOutline}
                              className="country-check-icon"
                            />
                          )}
                        </span>
                      </div>
                    );
                  })}
                </>
              )}

              {allFilteredCountries.length === 0 && (
                <div className="no-countries-found">
                  No countries found matching "{countrySearch}"
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LeadForm;
