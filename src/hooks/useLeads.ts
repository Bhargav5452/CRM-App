import { useState, useEffect, useCallback, useMemo } from 'react';
import { Lead, LeadFormInput, FilterState, DEFAULT_FILTER_STATE } from '../types/lead';
import { databaseService } from '../services/database';

export const useLeads = () => {
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
    return () => {
      window.removeEventListener('crm-lead-added', fetchLeads);
    };
  }, [fetchLeads]);

  const addLead = useCallback(async (input: LeadFormInput) => {
    const result = await databaseService.saveLead(input);
    if (result.success) {
      await fetchLeads();
      window.dispatchEvent(new CustomEvent('crm-lead-added'));
    }
    return result;
  }, [fetchLeads]);

  const updateLead = useCallback(async (id: number, input: LeadFormInput) => {
    const result = await databaseService.updateLead(id, input);
    if (result.success) {
      await fetchLeads();
      window.dispatchEvent(new CustomEvent('crm-lead-added'));
    }
    return result;
  }, [fetchLeads]);

  const deleteLead = useCallback(async (id: number) => {
    const result = await databaseService.deleteLead(id);
    if (result.success) {
      await fetchLeads();
      window.dispatchEvent(new CustomEvent('crm-lead-added'));
    }
    return result;
  }, [fetchLeads]);

  const deleteLeads = useCallback(async (ids: number[]) => {
    const result = await databaseService.deleteLeads(ids);
    if (result.success) {
      await fetchLeads();
      window.dispatchEvent(new CustomEvent('crm-lead-added'));
    }
    return result;
  }, [fetchLeads]);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // 1. Search Query Filter (Matches Name, Phone with/without dial code, Email, Notes)
      const query = searchQuery.trim().toLowerCase();
      if (query) {
        const matchName = lead.name.toLowerCase().includes(query);
        const fullPhoneWithSpace = `${lead.country_code || ''} ${lead.phone}`.toLowerCase();
        const fullPhoneNoSpace = `${lead.country_code || ''}${lead.phone}`.toLowerCase();
        const matchPhone =
          lead.phone.includes(query) ||
          (lead.country_code && lead.country_code.includes(query)) ||
          fullPhoneWithSpace.includes(query) ||
          fullPhoneNoSpace.includes(query);
        const matchEmail = (lead.email || '').toLowerCase().includes(query);
        const matchNotes = (lead.notes || '').toLowerCase().includes(query);

        if (!matchName && !matchPhone && !matchEmail && !matchNotes) {
          return false;
        }
      }

      // 2. Time Filter (Strict evaluation across all devices - Desktop, Web, iOS, Android)
      if (filterState.time !== 'all') {
        const leadDate = new Date(lead.created_at);
        const now = new Date();
        const startOfToday = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );

        if (filterState.time === 'today') {
          if (leadDate < startOfToday) return false;
        } else if (filterState.time === 'yesterday') {
          const startOfYesterday = new Date(startOfToday);
          startOfYesterday.setDate(startOfYesterday.getDate() - 1);
          if (leadDate < startOfYesterday || leadDate >= startOfToday)
            return false;
        } else if (filterState.time === 'week') {
          const startOfWeek = new Date(startOfToday);
          startOfWeek.setDate(startOfWeek.getDate() - 7);
          if (leadDate < startOfWeek) return false;
        } else if (filterState.time === 'month') {
          const startOfMonth = new Date(
            now.getFullYear(),
            now.getMonth(),
            1
          );
          if (leadDate < startOfMonth) return false;
        } else if (filterState.time === 'lastMonth') {
          const startOfThisMonth = new Date(
            now.getFullYear(),
            now.getMonth(),
            1
          );
          const startOfLastMonth = new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            1
          );
          if (leadDate < startOfLastMonth || leadDate >= startOfThisMonth)
            return false;
        } else if (filterState.time === 'custom') {
          // Strict Date Range Filter across all platforms
          if (filterState.customFrom) {
            const [fromY, fromM, fromD] = filterState.customFrom.split('-').map(Number);
            const fromDate = new Date(fromY, fromM - 1, fromD, 0, 0, 0, 0);
            if (leadDate < fromDate) return false;
          }

          if (filterState.customTo) {
            const [toY, toM, toD] = filterState.customTo.split('-').map(Number);
            const toDate = new Date(toY, toM - 1, toD, 23, 59, 59, 999);
            if (leadDate > toDate) return false;
          }
        }
      }

      return true;
    });
  }, [leads, searchQuery, filterState]);

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
    deleteLead,
    deleteLeads,
  };
};
