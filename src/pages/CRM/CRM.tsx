import React, { useState, useEffect, useMemo } from 'react';
import { IonContent, IonPage, IonHeader, IonIcon } from '@ionic/react';
import {
  searchOutline,
  downloadOutline,
  peopleOutline,
  closeOutline,
} from 'ionicons/icons';
import Navigation from '../../components/Navigation/Navigation';
import LeadCard from '../../components/LeadCard/LeadCard';
import LeadForm from '../../components/LeadForm/LeadForm';
import { Lead, LeadFormInput } from '../../types/lead';
import { databaseService } from '../../services/database';
import { exportLeadsToExcel } from '../../services/export';
import './CRM.css';

type DateFilter = 'all' | 'today' | 'yesterday' | 'week' | 'month';

const CRM: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [homeTypeFilter, setHomeTypeFilter] = useState<string>('all');
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const loadLeadsData = async () => {
    setLoading(true);
    const data = await databaseService.getLeads();
    setLeads(data);
    setLoading(false);
  };

  useEffect(() => {
    loadLeadsData();
  }, []);

  const handleDeleteLead = async (id: number) => {
    if (await CapacitorNativeOrWebDelete(id)) {
      await loadLeadsData();
    }
  };

  const CapacitorNativeOrWebDelete = async (id: number) => {
    try {
      const allLeads = await databaseService.getLeads();
      const updated = allLeads.filter((l) => l.id !== id);
      localStorage.setItem('offline_crm_leads_v1', JSON.stringify(updated));
      await loadLeadsData();
      return true;
    } catch {
      return false;
    }
  };

  // Filtered Leads Calculation
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // 1. Search Query Filter
      const query = searchQuery.trim().toLowerCase();
      if (query) {
        const matchName = lead.name.toLowerCase().includes(query);
        const matchPhone = lead.phone.includes(query) || (lead.country_code && lead.country_code.includes(query));
        const matchEmail = (lead.email || '').toLowerCase().includes(query);
        const matchNotes = (lead.notes || '').toLowerCase().includes(query);

        if (!matchName && !matchPhone && !matchEmail && !matchNotes) {
          return false;
        }
      }

      // 2. Home Type Filter
      if (homeTypeFilter !== 'all' && lead.home_type !== homeTypeFilter) {
        return false;
      }

      // 3. Date Filter
      if (dateFilter !== 'all') {
        const leadDate = new Date(lead.created_at);
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (dateFilter === 'today') {
          if (leadDate < startOfToday) return false;
        } else if (dateFilter === 'yesterday') {
          const startOfYesterday = new Date(startOfToday);
          startOfYesterday.setDate(startOfYesterday.getDate() - 1);
          if (leadDate < startOfYesterday || leadDate >= startOfToday) return false;
        } else if (dateFilter === 'week') {
          const startOfWeek = new Date(startOfToday);
          startOfWeek.setDate(startOfWeek.getDate() - 7);
          if (leadDate < startOfWeek) return false;
        } else if (dateFilter === 'month') {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          if (leadDate < startOfMonth) return false;
        }
      }

      return true;
    });
  }, [leads, searchQuery, dateFilter, homeTypeFilter]);

  const handleExport = () => {
    exportLeadsToExcel(filteredLeads);
  };

  const handleSaveEditedLead = async (input: LeadFormInput) => {
    if (!editingLead) return;
    try {
      const allLeads = await databaseService.getLeads();
      const idx = allLeads.findIndex((l) => l.id === editingLead.id);
      if (idx !== -1) {
        allLeads[idx] = {
          ...allLeads[idx],
          name: input.name,
          phone: input.phone,
          country_code: input.country_code,
          home_type: input.home_type,
          email: input.email || '',
          notes: input.notes || '',
          updated_at: new Date().toISOString(),
        };
        localStorage.setItem('offline_crm_leads_v1', JSON.stringify(allLeads));
      }
      setEditingLead(null);
      await loadLeadsData();
    } catch (err) {
      console.error('Error editing lead:', err);
    }
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <Navigation />
      </IonHeader>

      <IonContent fullscreen className="home-content">
        <div className="crm-page-wrapper">
          {/* Header Row */}
          <div className="crm-header-row">
            <div className="crm-title-group">
              <h1 className="crm-page-title">CRM Dashboard</h1>
              <span className="crm-count-badge">
                {filteredLeads.length} {filteredLeads.length === 1 ? 'Lead' : 'Leads'}
              </span>
            </div>

            <button
              type="button"
              className="btn-export-excel"
              onClick={handleExport}
              disabled={filteredLeads.length === 0}
            >
              <IonIcon icon={downloadOutline} style={{ fontSize: 18 }} />
              <span>Export Excel</span>
            </button>
          </div>

          {/* Controls Section: Search & Filters */}
          <div className="crm-controls-section">
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
            </div>

            {/* Date Filters */}
            <div className="filter-pills-row">
              <button
                type="button"
                className={`filter-pill ${dateFilter === 'all' ? 'active' : ''}`}
                onClick={() => setDateFilter('all')}
              >
                All Time
              </button>
              <button
                type="button"
                className={`filter-pill ${dateFilter === 'today' ? 'active' : ''}`}
                onClick={() => setDateFilter('today')}
              >
                Today
              </button>
              <button
                type="button"
                className={`filter-pill ${dateFilter === 'yesterday' ? 'active' : ''}`}
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
                className={`filter-pill ${dateFilter === 'month' ? 'active' : ''}`}
                onClick={() => setDateFilter('month')}
              >
                This Month
              </button>
            </div>

            {/* Home Type Filters */}
            <div className="filter-pills-row">
              <button
                type="button"
                className={`filter-pill ${homeTypeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setHomeTypeFilter('all')}
              >
                All Types
              </button>
              {['2BHK', '3BHK', '4BHK', 'Villa'].map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`filter-pill ${homeTypeFilter === type ? 'active' : ''}`}
                  onClick={() => setHomeTypeFilter(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Leads Grid */}
          <div className="leads-grid">
            {filteredLeads.length > 0 ? (
              filteredLeads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onEdit={(l) => setEditingLead(l)}
                  onDelete={handleDeleteLead}
                />
              ))
            ) : (
              <div className="empty-leads-card">
                <div className="empty-icon-badge">
                  <IonIcon icon={peopleOutline} />
                </div>
                <h3 className="empty-title">No leads found</h3>
                <p className="empty-text">
                  {searchQuery || dateFilter !== 'all' || homeTypeFilter !== 'all'
                    ? 'No customer records match your current search or filter criteria.'
                    : 'Start by creating a new lead from the entry form.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Edit Lead Modal */}
        {editingLead && (
          <div className="edit-modal-backdrop" onClick={() => setEditingLead(null)}>
            <div className="edit-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="edit-modal-header">
                <h2 className="edit-modal-title">Edit Lead</h2>
                <button
                  type="button"
                  className="btn-close-modal"
                  onClick={() => setEditingLead(null)}
                >
                  <IonIcon icon={closeOutline} />
                </button>
              </div>
              <LeadForm
                onSubmit={handleSaveEditedLead}
              />
            </div>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default CRM;
