import { useState, useEffect, useCallback, useMemo } from 'react';
import { Lead, LeadFormInput, FilterState, DEFAULT_FILTER_STATE } from '../types/legacyValidation';
import { databaseService } from '../../src/services/database';

export const useLegacyLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState<FilterState>(DEFAULT_FILTER_STATE);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const data = await databaseService.getLeads();
    setLeads(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLeads();
    window.addEventListener('crm-lead-added', fetchLeads);
    return () => window.removeEventListener('crm-lead-added', fetchLeads);
  }, [fetchLeads]);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // 1. Search Query Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = lead.name.toLowerCase().includes(query);
        const matchesPhone = lead.phone.includes(query);
        const matchesEmail = lead.email ? lead.email.toLowerCase().includes(query) : false;
        const matchesNotes = lead.notes ? lead.notes.toLowerCase().includes(query) : false;
        const matchesHomeType = lead.home_type.toLowerCase().includes(query);

        if (!matchesName && !matchesPhone && !matchesEmail && !matchesNotes && !matchesHomeType) {
          return false;
        }
      }

      // 2. Date Filter
      if (filterState.time === 'all') return true;

      const leadDate = new Date(lead.created_at);
      const now = new Date();

      const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

      const todayStart = startOfDay(now);
      const todayEnd = endOfDay(now);

      switch (filterState.time) {
        case 'today':
          return leadDate >= todayStart && leadDate <= todayEnd;

        case 'yesterday': {
          const yesterday = new Date(now);
          yesterday.setDate(now.getDate() - 1);
          return leadDate >= startOfDay(yesterday) && leadDate <= endOfDay(yesterday);
        }

        case 'week': {
          const dayOfWeek = now.getDay();
          const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          const monday = new Date(now);
          monday.setDate(now.getDate() - diffToMonday);
          return leadDate >= startOfDay(monday) && leadDate <= todayEnd;
        }

        case 'month': {
          const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          return leadDate >= startOfDay(firstOfMonth) && leadDate <= todayEnd;
        }

        case 'lastMonth': {
          const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
          return leadDate >= startOfDay(firstOfLastMonth) && leadDate <= endOfDay(lastOfLastMonth);
        }

        case 'custom': {
          if (!filterState.customFrom || !filterState.customTo) return true;
          const fromParts = filterState.customFrom.split('-').map(Number);
          const toParts = filterState.customTo.split('-').map(Number);
          const fromDate = new Date(fromParts[0], fromParts[1] - 1, fromParts[2]);
          const toDate = new Date(toParts[0], toParts[1] - 1, toParts[2]);
          return leadDate >= startOfDay(fromDate) && leadDate <= endOfDay(toDate);
        }

        default:
          return true;
      }
    });
  }, [leads, searchQuery, filterState]);

  const addLead = async (input: LeadFormInput) => {
    const result = await databaseService.saveLead(input);
    if (result.success) {
      await fetchLeads();
      window.dispatchEvent(new CustomEvent('crm-lead-added'));
    }
    return result;
  };

  const updateLead = async (id: number, input: LeadFormInput) => {
    const result = await databaseService.updateLead(id, input);
    if (result.success) {
      await fetchLeads();
    }
    return result;
  };

  const deleteLeads = async (ids: number[]) => {
    const result = await databaseService.deleteLeads(ids);
    if (result.success) {
      await fetchLeads();
    }
    return result;
  };

  return {
    leads,
    filteredLeads,
    loading,
    searchQuery,
    setSearchQuery,
    filterState,
    setFilterState,
    fetchLeads,
    addLead,
    updateLead,
    deleteLeads,
  };
};
