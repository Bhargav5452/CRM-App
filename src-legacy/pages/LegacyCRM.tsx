import React, { useState, useEffect } from 'react';
import LegacyLeadCard from '../components/LegacyLeadCard';
import LegacyLeadForm from '../components/LegacyLeadForm';
import LegacyFilterSheet from '../components/LegacyFilterSheet';
import { Lead, LeadFormInput, FilterState, DEFAULT_FILTER_STATE } from '../types/legacyValidation';
import { useLegacyLeads } from '../hooks/useLegacyLeads';
import '../../src/pages/CRM/CRM.css';

const getActiveFilterLabel = (filter: FilterState): string | null => {
  if (filter.time === 'all') return null;
  if (filter.time === 'today') return 'Today';
  if (filter.time === 'yesterday') return 'Yesterday';
  if (filter.time === 'week') return 'This Week';
  if (filter.time === 'month') return 'This Month';
  if (filter.time === 'lastMonth') return 'Last Month';
  if (filter.time === 'custom') {
    if (filter.customFrom && filter.customTo) {
      const fmt = (dateStr: string) => {
        const parts = dateStr.split('-').map(Number);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return (months[parts[1] - 1] || '') + ' ' + parts[2];
      };
      return 'From ' + fmt(filter.customFrom) + ' to ' + fmt(filter.customTo);
    }
    return 'Custom Range';
  }
  return null;
};

const LegacyCRM: React.FC = () => {
  const {
    filteredLeads, loading, searchQuery, setSearchQuery,
    filterState, setFilterState, fetchLeads, updateLead, deleteLeads,
  } = useLegacyLeads();

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 640 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const isSelectionMode = selectedIds.length > 0;

  useEffect(() => {
    const modalActive = Boolean(editingLead || showBulkDeleteModal || isFilterSheetOpen);
    document.body.style.overflow = modalActive ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [editingLead, showBulkDeleteModal, isFilterSheetOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFilterSheetOpen) setIsFilterSheetOpen(false);
        else if (showBulkDeleteModal) setShowBulkDeleteModal(false);
        else if (editingLead) setEditingLead(null);
        else if (isSelectionMode) setSelectedIds([]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingLead, showBulkDeleteModal, isSelectionMode, isFilterSheetOpen]);

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) => prev.indexOf(id) !== -1 ? prev.filter((item) => item !== id) : prev.concat([id]));
  };

  const handleLongPress = (id: number) => {
    if (selectedIds.indexOf(id) === -1) setSelectedIds((prev) => prev.concat([id]));
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredLeads.map((l) => l.id);
    if (selectedIds.length === allFilteredIds.length) setSelectedIds([]);
    else setSelectedIds(allFilteredIds);
  };

  const handleEditSingleSelected = () => {
    if (selectedIds.length !== 1) return;
    const targetLead = filteredLeads.find((l) => l.id === selectedIds[0]);
    if (targetLead) setEditingLead(targetLead);
  };

  const handleConfirmBulkDelete = async () => {
    setShowBulkDeleteModal(false);
    await deleteLeads(selectedIds);
    setSelectedIds([]);
  };

  const handleSaveEditedLead = async (input: LeadFormInput) => {
    if (!editingLead) return;
    const res = await updateLead(editingLead.id, input);
    if (res.success) { setEditingLead(null); setSelectedIds([]); }
    else { alert(res.error || 'Failed to update lead'); }
  };

  const activeFilterLabel = getActiveFilterLabel(filterState);
  const isFilterActive = filterState.time !== 'all';

  return (
    <div className="home-content legacy-page-content">
      <div className="crm-page-wrapper">
        {/* Header */}
        <div className="crm-header-row">
          {isSelectionMode ? (
            <>
              <div className="crm-title-group">
                <span className="selection-count-title tabular-nums">{selectedIds.length} Selected</span>
              </div>
              <div className="selection-toolbar-actions">
                <button type="button" className="btn-toolbar-action" onClick={handleSelectAll}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/><polyline points="20 6 9 17 4 12"/></svg>
                  <span className="action-label">{selectedIds.length === filteredLeads.length ? 'Deselect All' : 'Select All'}</span>
                </button>
                {selectedIds.length === 1 && (
                  <button type="button" className="btn-toolbar-action" onClick={handleEditSingleSelected}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    <span className="action-label">Edit</span>
                  </button>
                )}
                <button type="button" className="btn-toolbar-action danger-btn" onClick={() => setShowBulkDeleteModal(true)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                  <span className="action-label">Delete</span>
                </button>
                <button type="button" className="btn-toolbar-action" onClick={() => setSelectedIds([])}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  <span className="action-label">Cancel</span>
                </button>
              </div>
            </>
          ) : (
            <div className="crm-title-group">
              <h1 className="crm-page-title">CRM Dashboard</h1>
              <span className="crm-count-badge tabular-nums">{filteredLeads.length} {filteredLeads.length === 1 ? 'Lead' : 'Leads'}</span>
            </div>
          )}
        </div>

        {/* Search + Export + Filter */}
        <div className="crm-controls-section">
          <div className="search-export-row">
            <div className="crm-search-bar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon" style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'#A1A1AA',pointerEvents:'none'}}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input type="text" placeholder={isMobile ? 'Search...' : 'Search name, phone, email, notes...'}
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="crm-search-input" />
              {searchQuery.length > 0 && (
                <button type="button" className="search-clear-btn" onClick={() => setSearchQuery('')} title="Clear search">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
            <div className="crm-action-buttons-group">
              <button type="button" className={"btn-filter-inline" + (isFilterActive ? ' active' : '')}
                onClick={() => setIsFilterSheetOpen(true)} title="Open filter options">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                </svg>
                <span className="action-btn-text">Filter</span>
                {isFilterActive && <span className="filter-active-dot" />}
              </button>
            </div>
          </div>

          {activeFilterLabel && (
            <div className="active-filter-indicator-row">
              <div className="active-filter-badge" onClick={() => setIsFilterSheetOpen(true)} title="Click to change filter">
                <span>{activeFilterLabel}</span>
                <button type="button" className="btn-clear-active-filter"
                  onClick={(e) => { e.stopPropagation(); setFilterState(DEFAULT_FILTER_STATE); }} title="Reset to All Time">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Leads Grid */}
        {loading ? (
          <div className="empty-leads-card">
            <div className="legacy-spinner" role="status" aria-label="Loading" />
            <p className="empty-text">Loading leads...</p>
          </div>
        ) : (
          <div className="leads-grid legacy-leads-flex">
            {filteredLeads.length > 0 ? (
              filteredLeads.map((lead) => (
                <LegacyLeadCard key={lead.id} lead={lead}
                  isSelected={selectedIds.indexOf(lead.id) !== -1}
                  isSelectionMode={isSelectionMode}
                  onSelectToggle={handleToggleSelect}
                  onLongPress={handleLongPress} />
              ))
            ) : (
              <div className="empty-leads-card">
                <div className="empty-icon-badge">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <h3 className="empty-title">No leads found</h3>
                <p className="empty-text">{searchQuery || isFilterActive ? 'No Lead records match your current search or filter.' : 'No Lead records entered yet. Start by creating a new lead.'}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter Sheet */}
      <LegacyFilterSheet isOpen={isFilterSheetOpen} onClose={() => setIsFilterSheetOpen(false)}
        filterState={filterState} onApply={(s) => setFilterState(s)} onReset={() => setFilterState(DEFAULT_FILTER_STATE)} />

      {/* Delete Confirm Modal */}
      {showBulkDeleteModal && (
        <div className="edit-modal-backdrop" onClick={() => setShowBulkDeleteModal(false)}>
          <div className="delete-modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="delete-modal-title">{selectedIds.length === 1 ? 'Delete Lead' : 'Delete ' + selectedIds.length + ' Leads'}</h3>
            <p className="delete-modal-desc">Are you sure you want to delete {selectedIds.length === 1 ? 'this lead' : 'these ' + selectedIds.length + ' selected leads'}?</p>
            <span className="delete-modal-warning">This action cannot be undone.</span>
            <div className="delete-modal-actions">
              <button type="button" className="btn-modal-cancel" onClick={() => setShowBulkDeleteModal(false)}>Cancel</button>
              <button type="button" className="btn-modal-delete" onClick={handleConfirmBulkDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Lead Modal */}
      {editingLead && (
        <div className="edit-modal-backdrop" onClick={() => setEditingLead(null)}>
          <div className="edit-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="edit-modal-header">
              <div className="edit-modal-header-text">
                <h2 className="edit-modal-title">Edit Lead</h2>
                <p className="edit-modal-subtitle">Update Lead details</p>
              </div>
              <button type="button" className="btn-close-modal" onClick={() => setEditingLead(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="edit-modal-body">
              <LegacyLeadForm
                defaultValues={{ name: editingLead.name, phone: editingLead.phone, country_code: editingLead.country_code, home_type: editingLead.home_type, email: editingLead.email, notes: editingLead.notes }}
                hideHeader submitButtonText="Save Changes" onSubmit={handleSaveEditedLead} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LegacyCRM;
