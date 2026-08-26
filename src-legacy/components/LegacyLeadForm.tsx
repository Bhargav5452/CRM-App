import React, { useState, useRef, useEffect } from 'react';
import {
  LeadFormInput, HOME_TYPES, COUNTRY_CODES,
  DEFAULT_COUNTRY_CODE, CountryCode, getCountryByCode,
  validateLegacyLeadForm
} from '../types/legacyValidation';
import '../../src/components/LeadForm/LeadForm.css';

interface LeadFormProps {
  onSubmit: (data: LeadFormInput) => void;
  defaultValues?: Partial<LeadFormInput>;
  submitButtonText?: string;
  hideHeader?: boolean;
}

const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);
const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const LegacyLeadForm: React.FC<LeadFormProps> = ({
  onSubmit, defaultValues, submitButtonText = 'Review Details', hideHeader = false,
}) => {
  const [formData, setFormData] = useState<LeadFormInput>({
    name: (defaultValues && defaultValues.name) || '',
    country_code: (defaultValues && defaultValues.country_code) || DEFAULT_COUNTRY_CODE.code,
    phone: (defaultValues && defaultValues.phone) || '',
    home_type: (defaultValues && defaultValues.home_type) || '',
    email: (defaultValues && defaultValues.email) || '',
    notes: (defaultValues && defaultValues.notes) || '',
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isHomeTypeOpen, setIsHomeTypeOpen] = useState(false);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [keyFocusedIdx, setKeyFocusedIdx] = useState(-1);

  const homeTypeRef = useRef<HTMLDivElement>(null);
  const countryPickerRef = useRef<HTMLDivElement>(null);
  const selectedCountryRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedCountryObj, setSelectedCountryObj] = useState<CountryCode>(() =>
    getCountryByCode((defaultValues && defaultValues.country_code) || DEFAULT_COUNTRY_CODE.code)
  );

  const validationResult = validateLegacyLeadForm(formData);
  const errors = validationResult.errors;
  const isValid = validationResult.isValid;

  const activeCountry: CountryCode = selectedCountryObj;

  useEffect(() => {
    if (!defaultValues && nameInputRef.current) nameInputRef.current.focus();
  }, [defaultValues]);

  useEffect(() => {
    if (isCountryOpen) {
      document.body.style.overflow = 'hidden';
      setKeyFocusedIdx(-1);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isCountryOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (homeTypeRef.current && !homeTypeRef.current.contains(event.target as Node)) setIsHomeTypeOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setIsHomeTypeOpen(false); setIsCountryOpen(false); }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => { document.removeEventListener('mousedown', handleClickOutside); window.removeEventListener('keydown', handleKeyDown); };
  }, []);

  useEffect(() => {
    if (isCountryOpen && selectedCountryRef.current) {
      try {
        selectedCountryRef.current.scrollIntoView({ block: 'nearest' });
      } catch {
        // ignore scroll error
      }
    }
  }, [isCountryOpen]);

  const handleChange = (field: keyof LeadFormInput, value: string) => {
    setFormData((prev) => {
      const next: LeadFormInput = Object.assign({}, prev);
      if (field === 'name') next.name = value;
      else if (field === 'phone') next.phone = value;
      else if (field === 'country_code') next.country_code = value;
      else if (field === 'home_type') next.home_type = value;
      else if (field === 'email') next.email = value;
      else if (field === 'notes') next.notes = value;
      return next;
    });
  };

  const handleBlur = (field: keyof LeadFormInput) => {
    setTouched((prev) => {
      const next: Record<string, boolean> = Object.assign({}, prev);
      next[field] = true;
      return next;
    });
  };

  const handleSelectHomeType = (type: string) => {
    handleChange('home_type', type);
    setTouched((prev) => Object.assign({}, prev, { home_type: true }));
    setIsHomeTypeOpen(false);
  };

  const handleSelectCountry = (country: CountryCode) => {
    setSelectedCountryObj(country);
    handleChange('country_code', country.code);
    setIsCountryOpen(false);
    setCountrySearch('');
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      onSubmit(formData);
    } else {
      setTouched({ name: true, country_code: true, phone: true, home_type: true, email: true, notes: true });
    }
  };

  // Popular Countries: India, US, Canada, UK, Australia, UAE
  const PINNED_ISOS = ['IN', 'US', 'CA', 'GB', 'AU', 'AE'];
  const searchLower = countrySearch.toLowerCase().trim();

  const filteredPinned = COUNTRY_CODES.filter(
    (c) => PINNED_ISOS.indexOf(c.iso) !== -1 &&
      (c.name.toLowerCase().indexOf(searchLower) !== -1 || c.code.indexOf(searchLower) !== -1 || c.iso.toLowerCase().indexOf(searchLower) !== -1)
  );
  const filteredOthers = COUNTRY_CODES.filter(
    (c) => PINNED_ISOS.indexOf(c.iso) === -1 &&
      (c.name.toLowerCase().indexOf(searchLower) !== -1 || c.code.indexOf(searchLower) !== -1 || c.iso.toLowerCase().indexOf(searchLower) !== -1)
  );
  const allFilteredCountries = filteredPinned.concat(filteredOthers);

  const handleCountrySearchKeyDown = (e: React.KeyboardEvent) => {
    if (allFilteredCountries.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setKeyFocusedIdx((prev) => (prev + 1) % allFilteredCountries.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setKeyFocusedIdx((prev) => (prev - 1 + allFilteredCountries.length) % allFilteredCountries.length); }
    else if (e.key === 'Enter') { e.preventDefault(); if (allFilteredCountries[keyFocusedIdx]) handleSelectCountry(allFilteredCountries[keyFocusedIdx]); }
  };

  const formContent = (
    <form
      onSubmit={handleSubmitForm}
      noValidate
      autoComplete="off"
      action="javascript:void(0);"
      data-lpignore="true"
      data-form-type="other"
    >
      <div className="form-grid">
        {/* Full Name */}
        <div className="form-field-group">
          <label htmlFor="crm_client_name" className="field-label">Full Name <span className="required-asterisk">*</span></label>
          <input
            id="crm_client_name"
            name="crm_client_name_val"
            type="text"
            placeholder="Enter full name"
            className={"custom-input" + (touched.name && errors.name ? ' input-error' : '')}
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            onBlur={() => handleBlur('name')}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="words"
            spellCheck={false}
            data-lpignore="true"
            data-form-type="other"
            ref={nameInputRef}
          />
          {touched.name && errors.name && <span className="error-message">{errors.name}</span>}
        </div>

        {/* Phone Number */}
        <div className="form-field-group" ref={countryPickerRef}>
          <label htmlFor="crm_client_phone" className="field-label">Phone Number <span className="required-asterisk">*</span></label>
          <div className={"phone-input-container" + (touched.phone && (errors.phone || errors.country_code) ? ' input-error' : '')}>
            <div className="country-picker-trigger" onClick={() => setIsCountryOpen(true)}
              title={"Selected: " + activeCountry.name + " (" + activeCountry.code + ")"}>
              <span className="country-flag">{activeCountry.flag}</span>
              <span className="country-dial-code">{activeCountry.code}</span>
              <span className="country-trigger-chevron"><ChevronDownIcon /></span>
            </div>
            <input
              id="crm_client_phone"
              name="crm_client_phone_val"
              type="tel"
              inputMode="numeric"
              maxLength={activeCountry.digits}
              placeholder={"Enter " + activeCountry.digits + "-digit number"}
              className="phone-number-input"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              onBlur={() => handleBlur('phone')}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              data-lpignore="true"
              data-form-type="other"
            />
          </div>
          {touched.phone && errors.phone && <span className="error-message">{errors.phone}</span>}
        </div>

        {/* Home Type */}
        <div className="form-field-group" ref={homeTypeRef}>
          <label htmlFor="legacy_home_type_trigger" className="field-label">Home Type <span className="required-asterisk">*</span></label>
          <div id="legacy_home_type_trigger" tabIndex={0} role="button" aria-haspopup="listbox" aria-expanded={isHomeTypeOpen}
            className={"custom-dropdown-trigger" + (isHomeTypeOpen ? ' focused' : '') + (touched.home_type && errors.home_type ? ' input-error' : '')}
            onClick={() => setIsHomeTypeOpen(!isHomeTypeOpen)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsHomeTypeOpen(!isHomeTypeOpen); } }}>
            {formData.home_type ? <span className="dropdown-value">{formData.home_type}</span> : <span className="dropdown-placeholder">Select home type</span>}
            <span className={"select-chevron" + (isHomeTypeOpen ? ' open' : '')}><ChevronDownIcon /></span>
          </div>
          {isHomeTypeOpen && (
            <div className="custom-dropdown-menu" role="listbox">
              {HOME_TYPES.map((type) => {
                const isSelected = formData.home_type === type;
                return (
                  <div key={type} role="option" aria-selected={isSelected}
                    className={"dropdown-option" + (isSelected ? ' selected' : '')}
                    onClick={() => handleSelectHomeType(type)}>
                    <span>{type}</span>
                    {isSelected && <span className="option-check"><CheckIcon /></span>}
                  </div>
                );
              })}
            </div>
          )}
          {touched.home_type && errors.home_type && <span className="error-message">{errors.home_type}</span>}
        </div>

        {/* Email */}
        <div className="form-field-group">
          <label htmlFor="crm_client_email" className="field-label">Email</label>
          <input
            id="crm_client_email"
            name="crm_client_email_val"
            type="text"
            inputMode="email"
            placeholder="Enter email (optional)"
            className={"custom-input" + (touched.email && errors.email ? ' input-error' : '')}
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            data-lpignore="true"
            data-form-type="other"
          />
          {touched.email && errors.email && <span className="error-message">{errors.email}</span>}
        </div>

        {/* Notes */}
        <div className="form-field-group form-field-full">
          <label htmlFor="crm_client_notes" className="field-label">Notes</label>
          <div className="textarea-container">
            <textarea
              id="crm_client_notes"
              name="crm_client_notes_val"
              maxLength={300}
              placeholder="Add notes (optional)"
              className={"custom-textarea" + (touched.notes && errors.notes ? ' input-error' : '')}
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              onBlur={() => handleBlur('notes')}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              data-lpignore="true"
              data-form-type="other"
            />
            <div className="textarea-footer">
              <span className={"char-counter" + (formData.notes.length === 300 ? ' max-reached' : '')}>{formData.notes.length}/300</span>
            </div>
          </div>
          {touched.notes && errors.notes && <span className="error-message">{errors.notes}</span>}
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" disabled={!isValid} className="btn-submit" title={!isValid ? 'Fill required fields (*)' : undefined}>
          <span>{submitButtonText}</span>
          <ArrowRightIcon />
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
            <div className="card-header">
              <div className="header-text">
                <h1 className="card-title">{defaultValues ? 'Edit Client' : 'Client Info'}</h1>
                <p className="card-subtitle">{defaultValues ? 'Update client details below' : 'Enter the details of your client'}</p>
              </div>
            </div>
            {formContent}
          </div>
        </div>
      )}

      {/* Safari 9 Country Picker Modal */}
      {isCountryOpen && (
        <div className="legacy-country-backdrop" onClick={() => setIsCountryOpen(false)}>
          <div className="legacy-country-card" onClick={(e) => e.stopPropagation()}>
            <div className="legacy-country-header">
              <div className="legacy-country-title-row">
                <span className="legacy-country-title">Select Country</span>
                <button type="button" className="legacy-country-close-btn" onClick={() => setIsCountryOpen(false)}>
                  <CloseIcon />
                </button>
              </div>
              <input
                id="crm_country_search_val"
                name="crm_country_search_val"
                type="text"
                placeholder="Search country or code..."
                value={countrySearch}
                onChange={(e) => { setCountrySearch(e.target.value); setKeyFocusedIdx(0); }}
                onKeyDown={handleCountrySearchKeyDown}
                className="legacy-country-search-input"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                data-lpignore="true"
                autoFocus
              />
            </div>
            <div className="legacy-country-list" role="listbox">
              {allFilteredCountries.length > 0 ? (
                <>
                  {/* Popular Countries Section */}
                  {filteredPinned.length > 0 && !searchLower && (
                    <div className="legacy-country-section-header">Popular Countries</div>
                  )}
                  {filteredPinned.map((country) => {
                    const globalIdx = allFilteredCountries.findIndex((c) => c.iso === country.iso);
                    const isSelected = activeCountry.iso === country.iso;
                    const isKeyFocused = keyFocusedIdx !== -1 && globalIdx === keyFocusedIdx;
                    return (
                      <div
                        key={"pinned-" + country.iso}
                        ref={isSelected ? selectedCountryRef : null}
                        role="option"
                        aria-selected={isSelected}
                        className={"legacy-country-row" + (isSelected ? ' selected' : '') + (isKeyFocused ? ' focused' : '')}
                        onClick={() => handleSelectCountry(country)}
                      >
                        <span className="legacy-country-iso">{country.iso}</span>
                        <span className="legacy-country-name">{country.name}</span>
                        <span className="legacy-country-code">{country.code}</span>
                        <span className="legacy-country-check">{isSelected ? '✓' : ''}</span>
                      </div>
                    );
                  })}

                  {/* All Countries Section */}
                  {filteredOthers.length > 0 && (
                    <>
                      {filteredPinned.length > 0 && !searchLower && (
                        <div className="legacy-country-section-header">All Countries</div>
                      )}
                      {filteredOthers.map((country) => {
                        const globalIdx = allFilteredCountries.findIndex((c) => c.iso === country.iso);
                        const isSelected = activeCountry.iso === country.iso;
                        const isKeyFocused = keyFocusedIdx !== -1 && globalIdx === keyFocusedIdx;
                        return (
                          <div
                            key={"other-" + country.iso}
                            ref={isSelected ? selectedCountryRef : null}
                            role="option"
                            aria-selected={isSelected}
                            className={"legacy-country-row" + (isSelected ? ' selected' : '') + (isKeyFocused ? ' focused' : '')}
                            onClick={() => handleSelectCountry(country)}
                          >
                            <span className="legacy-country-iso">{country.iso}</span>
                            <span className="legacy-country-name">{country.name}</span>
                            <span className="legacy-country-code">{country.code}</span>
                            <span className="legacy-country-check">{isSelected ? '✓' : ''}</span>
                          </div>
                        );
                      })}
                    </>
                  )}
                </>
              ) : (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: '#71717A', fontSize: 13.5 }}>
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

export default LegacyLeadForm;
