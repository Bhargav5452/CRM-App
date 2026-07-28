import React, { useState, useEffect } from 'react';
import { IonContent, IonPage, IonIcon, IonSpinner, useIonViewWillEnter } from '@ionic/react';
import {
  searchOutline,
  downloadOutline,
  peopleOutline,
  closeOutline,
  checkmarkDoneOutline,
  createOutline,
  trashOutline,
} from 'ionicons/icons';
import LeadCard from '../../components/LeadCard/LeadCard';
import LeadForm from '../../components/LeadForm/LeadForm';
import { Lead, LeadFormInput } from '../../types/lead';
import { useLeads } from '../../hooks/useLeads';
import { exportLeadsToExcel } from '../../services/export';
import './CRM.css';

const CRM: React.FC = () => {
  const {
    filteredLeads,
    loading,
    searchQuery,
    setSearchQuery,
    dateFilter,
    setDateFilter,
    fetchLeads,
    updateLead,
    deleteLead,
    deleteLeads,
  } = useLeads();

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  const isSelectionMode = selectedIds.length > 0;

  // Set 'today' as default filter & refresh leads on entry
  useIonViewWillEnter(() => {
    setDateFilter('today');
    setSelectedIds([]);
    fetchLeads();
  });

  // Body scroll lock when any modal is open
  useEffect(() => {
    const modalActive = Boolean(editingLead || showBulkDeleteModal);
    document.body.style.overflow = modalActive ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [editingLead, showBulkDeleteModal]);

  // Keyboard Escape listener to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showBulkDeleteModal) {
          setShowBulkDeleteModal(false);
        } else if (editingLead) {
          setEditingLead(null);
        } else if (isSelectionMode) {
          setSelectedIds([]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingLead, showBulkDeleteModal, isSelectionMode]);

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleLongPress = (id: number) => {
    if (!selectedIds.includes(id)) {
      setSelectedIds((prev) => [...prev, id]);
    }
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredLeads.map((l) => l.id);
    if (selectedIds.length === allFilteredIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allFilteredIds);
    }
  };

  const handleEditSingleSelected = () => {
    if (selectedIds.length !== 1) return;
    const targetLead = filteredLeads.find((l) => l.id === selectedIds[0]);
    if (targetLead) {
      setEditingLead(targetLead);
    }
  };

  const handleConfirmBulkDelete = async () => {
    setShowBulkDeleteModal(false);
    await deleteLeads(selectedIds);
    setSelectedIds([]);
  };

  const handleExport = () => {
    exportLeadsToExcel(filteredLeads);
  };

  const handleSaveEditedLead = async (input: LeadFormInput) => {
    if (!editingLead) return;
    const res = await updateLead(editingLead.id, input);
    if (res.success) {
      setEditingLead(null);
      setSelectedIds([]);
    } else {
      alert(res.error || 'Failed to update lead');
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="home-content">
        <div className="crm-page-wrapper">
          {/* Header Row: Swaps in-place during selection mode (Google Photos / Gmail pattern - zero layout jump!) */}
          <div className="crm-header-row">
            {isSelectionMode ? (
              <>
                <div className="crm-title-group">
                  <span className="selection-count-title tabular-nums">
                    {selectedIds.length} Selected
                  </span>
                </div>

                <div className="selection-toolbar-actions">
                  <button
                    type="button"
                    className="btn-toolbar-action"
                    onClick={handleSelectAll}
                  >
                    <IonIcon icon={checkmarkDoneOutline} />
                    <span className="action-label">
                      {selectedIds.length === filteredLeads.length
                        ? 'Deselect All'
                        : 'Select All'}
                    </span>
                  </button>

                  {/* Single Selection Action: Edit */}
                  {selectedIds.length === 1 && (
                    <button
                      type="button"
                      className="btn-toolbar-action"
                      onClick={handleEditSingleSelected}
                    >
                      <IonIcon icon={createOutline} />
                      <span className="action-label">Edit</span>
                    </button>
                  )}

                  {/* Delete Action */}
                  <button
                    type="button"
                    className="btn-toolbar-action danger-btn"
                    onClick={() => setShowBulkDeleteModal(true)}
                  >
                    <IonIcon icon={trashOutline} />
                    <span className="action-label">Delete</span>
                  </button>

                  <button
                    type="button"
                    className="btn-toolbar-action"
                    onClick={() => setSelectedIds([])}
                  >
                    <IonIcon icon={closeOutline} />
                    <span className="action-label">Cancel</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="crm-title-group">
                <h1 className="crm-page-title">CRM Dashboard</h1>
                <span className="crm-count-badge tabular-nums">
                  {filteredLeads.length}{' '}
                  {filteredLeads.length === 1 ? 'Lead' : 'Leads'}
                </span>
              </div>
            )}
          </div>

          {/* Controls Section: Inlined Search + Export */}
          <div className="crm-controls-section">
            <div className="search-export-row">
              {/* Search Bar */}
              <div className="crm-search-bar">
                <IonIcon icon={searchOutline} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search name, phone, email, notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="crm-search-input"
                />
                {searchQuery.length > 0 && (
                  <button
                    type="button"
                    className="search-clear-btn"
                    onClick={() => setSearchQuery('')}
                    title="Clear search"
                  >
                    <IonIcon icon={closeOutline} />
                  </button>
                )}
              </div>

              {/* Inlined Export Button */}
              <button
                type="button"
                className="btn-export-inline"
                onClick={handleExport}
                disabled={filteredLeads.length === 0}
                title="Export filtered leads to Excel"
              >
                <IonIcon icon={downloadOutline} style={{ fontSize: 18 }} />
                <span className="export-btn-text">Export</span>
              </button>
            </div>

            {/* Time Filters Only */}
            <div className="filter-pills-row">
              <button
                type="button"
                className={`filter-pill ${dateFilter === 'today' ? 'active' : ''}`}
                onClick={() => setDateFilter('today')}
              >
                Today
              </button>
              <button
                type="button"
                className={`filter-pill ${
                  dateFilter === 'yesterday' ? 'active' : ''
                }`}
                onClick={() => setDateFilter('yesterday')}
              >
                Yesterday
              </button>
              <button
                type="button"
                className={`filter-pill ${dateFilter === 'week' ? 'active' : ''}`}
                onClick={() => setDateFilter('week')}
              >
                This Week
              </button>
              <button
                type="button"
                className={`filter-pill ${
                  dateFilter === 'month' ? 'active' : ''
                }`}
                onClick={() => setDateFilter('month')}
              >
                This Month
              </button>
              <button
                type="button"
                className={`filter-pill ${dateFilter === 'all' ? 'active' : ''}`}
                onClick={() => setDateFilter('all')}
              >
                All Time
              </button>
            </div>
          </div>

          {/* Leads Grid */}
          {loading ? (
            <div className="empty-leads-card">
              <IonSpinner name="crescent" />
              <p className="empty-text">Loading leads...</p>
            </div>
          ) : (
            <div className="leads-grid">
              {filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    isSelected={selectedIds.includes(lead.id)}
                    isSelectionMode={isSelectionMode}
                    onSelectToggle={handleToggleSelect}
                    onLongPress={handleLongPress}
                  />
                ))
              ) : (
                <div className="empty-leads-card">
                  <div className="empty-icon-badge">
                    <IonIcon icon={peopleOutline} />
                  </div>
                  <h3 className="empty-title">No leads found</h3>
                  <p className="empty-text">
                    {searchQuery || dateFilter !== 'today'
                      ? 'No customer records match your current search or filter criteria.'
                      : 'No leads entered today. Start by creating a new lead from the entry form.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        {showBulkDeleteModal && (
          <div
            className="edit-modal-backdrop"
            onClick={() => setShowBulkDeleteModal(false)}
          >
            <div
              className="delete-modal-card"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="delete-modal-title">
                {selectedIds.length === 1 ? 'Delete Lead' : `Delete ${selectedIds.length} Leads`}
              </h3>
              <p className="delete-modal-desc">
                Are you sure you want to delete {selectedIds.length === 1 ? 'this lead' : `these ${selectedIds.length} selected leads`}?
              </p>
              <span className="delete-modal-warning">This action cannot be undone.</span>
              
              <div className="delete-modal-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setShowBulkDeleteModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-modal-delete"
                  onClick={handleConfirmBulkDelete}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Lead Modal */}
        {editingLead && (
          <div
            className="edit-modal-backdrop"
            onClick={() => setEditingLead(null)}
          >
            <div
              className="edit-modal-card"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="edit-modal-header">
                <div className="edit-modal-header-text">
                  <h2 className="edit-modal-title">Edit Lead</h2>
                  <p className="edit-modal-subtitle">Update customer details</p>
                </div>
                <button
                  type="button"
                  className="btn-close-modal"
                  onClick={() => setEditingLead(null)}
                >
                  <IonIcon icon={closeOutline} />
                </button>
              </div>

              {/* Body */}
              <div className="edit-modal-body">
                <LeadForm
                  defaultValues={{
                    name: editingLead.name,
                    phone: editingLead.phone,
                    country_code: editingLead.country_code,
                    home_type: editingLead.home_type,
                    email: editingLead.email,
                    notes: editingLead.notes,
                  }}
                  hideHeader
                  submitButtonText="Save Changes"
                  onSubmit={handleSaveEditedLead}
                />
              </div>
            </div>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default CRM;
