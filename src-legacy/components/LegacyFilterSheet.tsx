import React, { useState, useEffect } from 'react';
import { FilterState, DateFilterOption, DEFAULT_FILTER_STATE } from '../../src/types/lead';

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

const getTodayStr = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
};

const formatToDDMMYY = (dateStr?: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const y = parts[0]; const m = parts[1]; const d = parts[2];
  const yy = y.slice(-2);
  return d.padStart(2,'0') + '/' + m.padStart(2,'0') + '/' + yy;
};

const LegacyFilterSheet: React.FC<FilterSheetProps> = ({ isOpen, onClose, filterState, onApply, onReset }) => {
  const [draftState, setDraftState] = useState<FilterState>(filterState);
  const todayStr = getTodayStr();

  useEffect(() => {
    if (isOpen) setDraftState(filterState);
  }, [isOpen, filterState]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isCustom = draftState.time === 'custom';
  const isCustomIncomplete = isCustom && (!draftState.customFrom || !draftState.customTo);
  const isCustomInvalid = isCustom && Boolean(
    (draftState.customFrom && draftState.customFrom > todayStr) ||
    (draftState.customTo && draftState.customTo > todayStr) ||
    (draftState.customFrom && draftState.customTo && draftState.customFrom > draftState.customTo)
  );
  const canApply = !isCustomIncomplete && !isCustomInvalid;

  const handleSelectTime = (timeOption: DateFilterOption) => {
    setDraftState((prev) => {
      const nextState = Object.assign({}, prev, { time: timeOption });
      if (timeOption === 'custom' && (!prev.customFrom || !prev.customTo)) {
        nextState.customFrom = todayStr;
        nextState.customTo = todayStr;
      }
      return nextState;
    });
  };

  const handleFromChange = (newFrom: string) => {
    let validFrom = newFrom;
    if (validFrom > todayStr) validFrom = todayStr;
    setDraftState((prev) => {
      let validTo = prev.customTo || '';
      if (validFrom === todayStr) validTo = todayStr;
      else if (!validTo || validTo < validFrom || validTo > todayStr) validTo = validFrom;
      return Object.assign({}, prev, { customFrom: validFrom, customTo: validTo });
    });
  };

  const handleToChange = (newTo: string) => {
    let validTo = newTo;
    if (validTo > todayStr) validTo = todayStr;
    if (draftState.customFrom && validTo < draftState.customFrom) validTo = draftState.customFrom;
    setDraftState((prev) => Object.assign({}, prev, { customTo: validTo }));
  };

  const handleApply = () => { if (!canApply) return; onApply(draftState); onClose(); };
  const handleReset = () => { onReset(); setDraftState(DEFAULT_FILTER_STATE); onClose(); };

  return (
    <div className="filter-sheet-backdrop" onClick={onClose}>
      <div className="filter-sheet-container" onClick={(e) => e.stopPropagation()}>
        <div className="filter-handle-bar" />
        <div className="filter-sheet-header">
          <h2 className="filter-sheet-title">Filters</h2>
          <button type="button" className="btn-close-filter" onClick={onClose} title="Close filters">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="filter-sheet-body">
          <div className="filter-section">
            <h3 className="filter-section-title">Time</h3>
            <div className="radio-options-grid" role="radiogroup">
              {TIME_OPTIONS.map((opt) => {
                const isSelected = draftState.time === opt.id;
                return (
                  <div
                    key={opt.id}
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={0}
                    className={"radio-option-card" + (opt.id === 'custom' ? ' full-width' : '') + (isSelected ? ' selected' : '')}
                    onClick={() => handleSelectTime(opt.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelectTime(opt.id); } }}
                  >
                    <div className="radio-circle">{isSelected && <div className="radio-inner-dot" />}</div>
                    <span className="radio-label">{opt.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {isCustom && (
            <div className="custom-date-box">
              <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:600, color:'#09090B' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span>Select Custom Range</span>
              </div>
              <div className="date-pickers-row">
                <div className="date-field">
                  <label htmlFor="legacy_custom_from" className="date-label">From</label>
                  <div className="date-input-wrapper">
                    <input id="legacy_custom_from" type="date" lang="en-GB" className="date-input-native"
                      max={todayStr} value={draftState.customFrom || ''}
                      onChange={(e) => handleFromChange(e.target.value)} />
                    <div className="date-input-display">
                      <span>{draftState.customFrom ? formatToDDMMYY(draftState.customFrom) : 'DD/MM/YY'}</span>
                    </div>
                  </div>
                </div>
                <div className="date-field">
                  <label htmlFor="legacy_custom_to" className="date-label">To</label>
                  <div className="date-input-wrapper">
                    <input id="legacy_custom_to" type="date" lang="en-GB" className="date-input-native"
                      min={draftState.customFrom || undefined} max={todayStr} value={draftState.customTo || ''}
                      onChange={(e) => handleToChange(e.target.value)} />
                    <div className="date-input-display">
                      <span>{draftState.customTo ? formatToDDMMYY(draftState.customTo) : 'DD/MM/YY'}</span>
                    </div>
                  </div>
                </div>
              </div>
              {isCustomIncomplete && <span className="date-error-text">Please select both From and To dates to apply.</span>}
              {isCustomInvalid && <span className="date-error-text">Invalid range. Future dates and reverse ranges are not allowed.</span>}
            </div>
          )}
        </div>

        <div className="filter-sheet-actions">
          <button type="button" className="btn-filter-reset" onClick={handleReset}>Reset</button>
          <button type="button" className="btn-filter-apply" onClick={handleApply} disabled={!canApply}>Apply</button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(LegacyFilterSheet);
