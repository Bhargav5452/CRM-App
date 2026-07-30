import React, { useState, useEffect } from 'react';
import { IonIcon } from '@ionic/react';
import { closeOutline, calendarOutline } from 'ionicons/icons';
import {
  FilterState,
  DateFilterOption,
  DEFAULT_FILTER_STATE,
} from '../../types/lead';
import './FilterSheet.css';

interface FilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filterState: FilterState;
  onApply: (state: FilterState) => void;
  onReset: () => void;
}

const TIME_OPTIONS: { id: DateFilterOption; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'lastMonth', label: 'Last Month' },
  { id: 'all', label: 'All Time' },
  { id: 'custom', label: 'Custom Date Range' },
];

/**
 * Formats YYYY-MM-DD string to DD/MM/YY
 */
const formatToDDMMYY = (dateStr?: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  const yy = y.slice(-2);
  return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${yy}`;
};

/**
 * Returns today's date formatted as YYYY-MM-DD
 */
const getTodayStr = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const FilterSheet: React.FC<FilterSheetProps> = ({
  isOpen,
  onClose,
  filterState,
  onApply,
  onReset,
}) => {
  const [draftState, setDraftState] = useState<FilterState>(filterState);

  const todayStr = getTodayStr();

  // Sync draft state with incoming filterState when sheet opens
  useEffect(() => {
    if (isOpen) {
      setDraftState(filterState);
    }
  }, [isOpen, filterState]);

  // Escape key & body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isCustom = draftState.time === 'custom';

  // Strict Date Range Validation Rules:
  // 1. From Date <= Today Date
  // 2. To Date <= Today Date
  // 3. From Date <= To Date
  const isCustomIncomplete =
    isCustom && (!draftState.customFrom || !draftState.customTo);
  const isCustomInvalid =
    isCustom &&
    Boolean(
      (draftState.customFrom && draftState.customFrom > todayStr) ||
      (draftState.customTo && draftState.customTo > todayStr) ||
      (draftState.customFrom &&
        draftState.customTo &&
        draftState.customFrom > draftState.customTo)
    );

  const canApply = !isCustomIncomplete && !isCustomInvalid;

  const handleSelectTime = (timeOption: DateFilterOption) => {
    setDraftState((prev) => {
      const nextState = { ...prev, time: timeOption };
      // If user switches to custom for the first time without values, default to today
      if (timeOption === 'custom' && (!prev.customFrom || !prev.customTo)) {
        nextState.customFrom = todayStr;
        nextState.customTo = todayStr;
      }
      return nextState;
    });
  };

  const handleFromChange = (newFrom: string) => {
    let validFrom = newFrom;
    // Rule: Future dates must never be selectable
    if (validFrom > todayStr) {
      validFrom = todayStr;
    }

    setDraftState((prev) => {
      let validTo = prev.customTo || '';

      // Rule: If From Date = Today's date, To Date automatically becomes Today
      if (validFrom === todayStr) {
        validTo = todayStr;
      } else if (!validTo || validTo < validFrom || validTo > todayStr) {
        // Auto-update To Date if current value is invalid for the new From Date
        validTo = validFrom;
      }

      return {
        ...prev,
        customFrom: validFrom,
        customTo: validTo,
      };
    });
  };

  const handleToChange = (newTo: string) => {
    let validTo = newTo;
    // Rule: Maximum selectable date = Today's date
    if (validTo > todayStr) {
      validTo = todayStr;
    }
    // Rule: Minimum selectable date = selected From Date
    if (draftState.customFrom && validTo < draftState.customFrom) {
      validTo = draftState.customFrom;
    }

    setDraftState((prev) => ({
      ...prev,
      customTo: validTo,
    }));
  };

  const handleApply = () => {
    if (!canApply) return;
    onApply(draftState);
    onClose();
  };

  const handleReset = () => {
    onReset();
    setDraftState(DEFAULT_FILTER_STATE);
    onClose();
  };

  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    if ('showPicker' in e.currentTarget && typeof e.currentTarget.showPicker === 'function') {
      try {
        e.currentTarget.showPicker();
      } catch {
        // Fallback for native browser behavior
      }
    }
  };

  return (
    <div className="filter-sheet-backdrop" onClick={onClose}>
      <div
        className="filter-sheet-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="filter-handle-bar" />

        {/* Header */}
        <div className="filter-sheet-header">
          <h2 className="filter-sheet-title">Filters</h2>
          <button
            type="button"
            className="btn-close-filter"
            onClick={onClose}
            title="Close filters"
          >
            <IonIcon icon={closeOutline} />
          </button>
        </div>

        {/* Body */}
        <div className="filter-sheet-body">
          {/* Section: Time (2-Column Responsive Radio Grid) */}
          <div className="filter-section">
            <h3 className="filter-section-title">Time</h3>
            <div className="radio-options-grid" role="radiogroup">
              {TIME_OPTIONS.map((opt) => {
                const isSelected = draftState.time === opt.id;
                const isFullWidth = opt.id === 'custom';
                return (
                  <div
                    key={opt.id}
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={0}
                    className={`radio-option-card ${
                      isFullWidth ? 'full-width' : ''
                    } ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectTime(opt.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelectTime(opt.id);
                      }
                    }}
                  >
                    <div className="radio-circle">
                      {isSelected && <div className="radio-inner-dot" />}
                    </div>
                    <span className="radio-label">{opt.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sub-Section: Custom Date Range */}
          {isCustom && (
            <div className="custom-date-box">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#09090B',
                }}
              >
                <IonIcon icon={calendarOutline} style={{ fontSize: 15 }} />
                <span>Select Custom Range</span>
              </div>

              <div className="date-pickers-row">
                <div className="date-field">
                  <label htmlFor="custom_from" className="date-label">
                    From
                  </label>
                  <div className="date-input-wrapper">
                    <input
                      id="custom_from"
                      type="date"
                      lang="en-GB"
                      className="date-input-native"
                      max={todayStr}
                      value={draftState.customFrom || ''}
                      onClick={handleInputClick}
                      onChange={(e) => handleFromChange(e.target.value)}
                    />
                    <div className="date-input-display">
                      <span>
                        {draftState.customFrom
                          ? formatToDDMMYY(draftState.customFrom)
                          : 'DD/MM/YY'}
                      </span>
                      <IonIcon
                        icon={calendarOutline}
                        style={{ fontSize: 14, color: '#71717A' }}
                      />
                    </div>
                  </div>
                </div>

                <div className="date-field">
                  <label htmlFor="custom_to" className="date-label">
                    To
                  </label>
                  <div className="date-input-wrapper">
                    <input
                      id="custom_to"
                      type="date"
                      lang="en-GB"
                      className="date-input-native"
                      min={draftState.customFrom || undefined}
                      max={todayStr}
                      value={draftState.customTo || ''}
                      onClick={handleInputClick}
                      onChange={(e) => handleToChange(e.target.value)}
                    />
                    <div className="date-input-display">
                      <span>
                        {draftState.customTo
                          ? formatToDDMMYY(draftState.customTo)
                          : 'DD/MM/YY'}
                      </span>
                      <IonIcon
                        icon={calendarOutline}
                        style={{ fontSize: 14, color: '#71717A' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {isCustomIncomplete && (
                <span className="date-error-text">
                  Please select both From and To dates to apply.
                </span>
              )}

              {isCustomInvalid && (
                <span className="date-error-text">
                  Invalid range selected. Future dates and reverse ranges are not allowed.
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="filter-sheet-actions">
          <button
            type="button"
            className="btn-filter-reset"
            onClick={handleReset}
          >
            Reset
          </button>
          <button
            type="button"
            className="btn-filter-apply"
            onClick={handleApply}
            disabled={!canApply}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterSheet;
