import { useState, useEffect, useCallback, useMemo } from 'react';
import { Lead, LeadFormInput } from '../types/lead';
import { databaseService } from '../services/database';

export type DateFilter = 'all' | 'today' | 'yesterday' | 'week' | 'month';

export const useLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');

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

      // 2. Date Filter
      if (dateFilter !== 'all') {
        const leadDate = new Date(lead.created_at);
        const now = new Date();
        const startOfToday = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );

        if (dateFilter === 'today') {
          if (leadDate < startOfToday) return false;
        } else if (dateFilter === 'yesterday') {
          const startOfYesterday = new Date(startOfToday);
          startOfYesterday.setDate(startOfYesterday.getDate() - 1);
          if (leadDate < startOfYesterday || leadDate >= startOfToday)
            return false;
        } else if (dateFilter === 'week') {
          const startOfWeek = new Date(startOfToday);
          startOfWeek.setDate(startOfWeek.getDate() - 7);
          if (leadDate < startOfWeek) return false;
        } else if (dateFilter === 'month') {
          const startOfMonth = new Date(
            now.getFullYear(),
            now.getMonth(),
            1
          );
          if (leadDate < startOfMonth) return false;
        }
      }

      return true;
    });
  }, [leads, searchQuery, dateFilter]);

  return {
    leads,
    filteredLeads,
    loading,
    searchQuery,
    setSearchQuery,
    dateFilter,
    setDateFilter,
    fetchLeads,
    addLead,
    updateLead,
    deleteLead,
    deleteLeads,
  };
};
