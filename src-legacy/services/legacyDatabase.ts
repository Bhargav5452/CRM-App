import { Lead, LeadFormInput } from '../types/legacyValidation';

const LOCAL_STORAGE_KEY = 'offline_crm_leads_v1';

class LegacyDatabaseService {
  private isInitialized: boolean = false;

  public async initialize(): Promise<void> {
    this.isInitialized = true;
    return Promise.resolve();
  }

  public async saveLead(
    input: LeadFormInput
  ): Promise<{ success: boolean; id?: number; error?: string }> {
    try {
      const leads = this.getWebLeads();
      const duplicate = leads.find(
        (l) => l.country_code === input.country_code && l.phone === input.phone
      );

      if (duplicate) {
        return {
          success: false,
          error:
            'A lead with this phone number (' +
            input.country_code +
            ' ' +
            input.phone +
            ') already exists (' +
            duplicate.name +
            ').',
        };
      }

      const now = new Date().toISOString();
      const nextId =
        leads.length > 0
          ? Math.max.apply(
              null,
              leads.map((l) => l.id)
            ) + 1
          : 1;

      const newLead: Lead = {
        id: nextId,
        name: input.name,
        phone: input.phone,
        country_code: input.country_code,
        home_type: input.home_type,
        email: input.email || '',
        notes: input.notes || '',
        created_at: now,
        updated_at: now,
      };

      leads.unshift(newLead);
      this.saveWebLeads(leads);
      return { success: true, id: nextId };
    } catch (err: unknown) {
      console.error('Error saving lead:', err);
      const message =
        err instanceof Error ? err.message : 'Failed to save lead in database.';
      return { success: false, error: message };
    }
  }

  public async updateLead(
    id: number,
    input: LeadFormInput
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const leads = this.getWebLeads();
      const exists = leads.find(
        (l) =>
          l.country_code === input.country_code &&
          l.phone === input.phone &&
          l.id !== id
      );

      if (exists) {
        return {
          success: false,
          error:
            'Another lead with ' +
            input.country_code +
            ' ' +
            input.phone +
            ' already exists.',
        };
      }

      const now = new Date().toISOString();
      const idx = leads.findIndex((l) => l.id === id);

      if (idx !== -1) {
        leads[idx] = {
          id: leads[idx].id,
          name: input.name,
          phone: input.phone,
          country_code: input.country_code,
          home_type: input.home_type,
          email: input.email || '',
          notes: input.notes || '',
          created_at: leads[idx].created_at,
          updated_at: now,
        };
        this.saveWebLeads(leads);
      }

      return { success: true };
    } catch (err: unknown) {
      console.error('Error updating lead:', err);
      const message =
        err instanceof Error ? err.message : 'Failed to update lead in database.';
      return { success: false, error: message };
    }
  }

  public async deleteLead(
    id: number
  ): Promise<{ success: boolean; error?: string }> {
    return this.deleteLeads([id]);
  }

  public async deleteLeads(
    ids: number[]
  ): Promise<{ success: boolean; error?: string }> {
    if (ids.length === 0) return { success: true };

    try {
      const leads = this.getWebLeads();
      const idMap: Record<number, boolean> = {};
      for (let i = 0; i < ids.length; i++) {
        idMap[ids[i]] = true;
      }
      const filtered = leads.filter((l) => !idMap[l.id]);
      this.saveWebLeads(filtered);
      return { success: true };
    } catch (err: unknown) {
      console.error('Error deleting leads:', err);
      const message =
        err instanceof Error ? err.message : 'Failed to delete leads from database.';
      return { success: false, error: message };
    }
  }

  public async getLeads(): Promise<Lead[]> {
    return Promise.resolve(this.getWebLeads());
  }

  private getWebLeads(): Lead[] {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveWebLeads(leads: Lead[]): void {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(leads));
  }
}

export const databaseService = new LegacyDatabaseService();
