import React, { useState, useEffect } from 'react';
import { IonIcon, IonDatetime, IonModal, IonButton } from '@ionic/react';
import { closeOutline, calendarOutline, checkmarkOutline } from 'ionicons/icons';
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
 * Returns today's date formatted as YYYY-MM-DD
 */
const getTodayStr = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Formats YYYY-MM-DD string into a clean readable date string: "Jul 28, 2026"
 */
const formatDisplayDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const FilterSheet: React.FC<FilterSheetProps> = ({
  isOpen,
  onClose,
  filterState,
  onApply,
  onReset,
}) => {
  const [draftState, setDraftState] = useState<FilterState>(filterState);
  const [activePicker, setActivePicker] = useState<'from' | 'to' | null>(null);

  const todayStr = getTodayStr();

  // Sync draft state with incoming filterState when sheet opens
  useEffect(() => {
    if (isOpen) {
      setDraftState(filterState);
      setActivePicker(null);
    }
  }, [isOpen, filterState]);

  // Escape key & body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activePicker) {
          setActivePicker(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, activePicker, onClose]);

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
      if (timeOption === 'custom' && (!prev.customFrom || !prev.customTo)) {
        nextState.customFrom = todayStr;
        nextState.customTo = todayStr;
      }
      return nextState;
    });
  };

  const handleFromChange = (newFromIso: string) => {
    // IonDatetime returns ISO string (e.g. "2026-07-28T00:00:00") or YYYY-MM-DD
    const rawStr = newFromIso.split('T')[0];
    let validFrom = rawStr;
    if (validFrom > todayStr) {
      validFrom = todayStr;
    }

    setDraftState((prev) => {
      let validTo = prev.customTo || '';
      if (validFrom === todayStr) {
        validTo = todayStr;
      } else if (!validTo || validTo < validFrom || validTo > todayStr) {
        validTo = validFrom;
      }

      return {
        ...prev,
        customFrom: validFrom,
        customTo: validTo,
      };
    });
    setActivePicker(null);
  };

  const handleToChange = (newToIso: string) => {
    const rawStr = newToIso.split('T')[0];
    let validTo = rawStr;
    if (validTo > todayStr) {
      validTo = todayStr;
    }
    if (draftState.customFrom && validTo < draftState.customFrom) {
      validTo = draftState.customFrom;
    }

    setDraftState((prev) => ({
      ...prev,
      customTo: validTo,
    }));
    setActivePicker(null);
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

          {/* Sub-Section: Custom Date Range Trigger Buttons */}
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
                  <span className="date-label">From</span>
                  <button
                    type="button"
                    className="date-trigger-btn"
                    onClick={() => setActivePicker('from')}
                  >
                    <span className="date-trigger-text">
                      {formatDisplayDate(draftState.customFrom) || 'Select From Date'}
                    </span>
                    <IonIcon icon={calendarOutline} style={{ fontSize: 16, color: '#71717A' }} />
                  </button>
                </div>

                <div className="date-field">
                  <span className="date-label">To</span>
                  <button
                    type="button"
                    className="date-trigger-btn"
                    onClick={() => setActivePicker('to')}
                  >
                    <span className="date-trigger-text">
                      {formatDisplayDate(draftState.customTo) || 'Select To Date'}
                    </span>
                    <IonIcon icon={calendarOutline} style={{ fontSize: 16, color: '#71717A' }} />
                  </button>
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

      {/* Cross-Platform Ionic IonDatetime Picker Modal */}
      <IonModal
        isOpen={Boolean(activePicker)}
        onDidDismiss={() => setActivePicker(null)}
        className="ion-datetime-custom-modal"
      >
        <div className="ion-datetime-modal-container">
          <div className="ion-datetime-modal-header">
            <h3 className="ion-datetime-modal-title">
              {activePicker === 'from' ? 'Select From Date' : 'Select To Date'}
            </h3>
            <button
              type="button"
              className="btn-close-filter"
              onClick={() => setActivePicker(null)}
            >
              <IonIcon icon={closeOutline} />
            </button>
          </div>

          <div className="ion-datetime-modal-body">
            <IonDatetime
              presentation="date"
              preferWheel={false}
              max={todayStr}
              min={activePicker === 'to' ? draftState.customFrom : undefined}
              value={
                activePicker === 'from'
                  ? draftState.customFrom || todayStr
                  : draftState.customTo || todayStr
              }
              onIonChange={(e) => {
                const val = e.detail.value;
                if (!val) return;
                const strVal = Array.isArray(val) ? val[0] : val;
                if (activePicker === 'from') {
                  handleFromChange(strVal);
                } else if (activePicker === 'to') {
                  handleToChange(strVal);
                }
              }}
            />
          </div>
        </div>
      </IonModal>
    </div>
  );
};

export default FilterSheet;
