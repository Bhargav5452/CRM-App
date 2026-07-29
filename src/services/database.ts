import { Capacitor } from '@capacitor/core';
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from '@capacitor-community/sqlite';
import { Lead, LeadFormInput } from '../types/lead';

const DB_NAME = 'offline_crm_db';
const LOCAL_STORAGE_KEY = 'offline_crm_leads_v1';

class DatabaseService {
  private sqlite: SQLiteConnection | null = null;
  private db: SQLiteDBConnection | null = null;
  private isNative: boolean = false;
  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        if (this.isNative) {
          this.sqlite = new SQLiteConnection(CapacitorSQLite);
          const isConn = (await this.sqlite.isConnection(DB_NAME, false)).result;

          if (isConn) {
            this.db = await this.sqlite.retrieveConnection(DB_NAME, false);
          } else {
            this.db = await this.sqlite.createConnection(
              DB_NAME,
              false,
              'no-encryption',
              1,
              false
            );
          }

          await this.db.open();

          // ─────────────────────────────────────────────────────────────
          // Database Schema & Migration Path (v1 -> v2)
          // Migration: UNIQUE(phone) -> UNIQUE(country_code, phone)
          // ─────────────────────────────────────────────────────────────
          const getVersionResult = await this.db.query('PRAGMA user_version;');
          const currentVersion =
            getVersionResult.values && getVersionResult.values[0]
              ? (getVersionResult.values[0].user_version as number)
              : 0;

          if (currentVersion < 1) {
            const tableCheck = await this.db.query(
              "SELECT name FROM sqlite_master WHERE type='table' AND name='leads';"
            );
            const tableExists = tableCheck.values && tableCheck.values.length > 0;

            if (!tableExists) {
              // Fresh installation
              await this.db.execute(`
                CREATE TABLE leads (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name TEXT NOT NULL,
                  phone TEXT NOT NULL,
                  country_code TEXT NOT NULL DEFAULT '+91',
                  home_type TEXT NOT NULL,
                  email TEXT,
                  notes TEXT,
                  created_at TEXT NOT NULL,
                  updated_at TEXT NOT NULL,
                  UNIQUE(country_code, phone)
                );
              `);
            } else {
              // Existing installation: Migrate UNIQUE(phone) to UNIQUE(country_code, phone)
              await this.db.execute(`
                BEGIN TRANSACTION;
                CREATE TABLE leads_new (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name TEXT NOT NULL,
                  phone TEXT NOT NULL,
                  country_code TEXT NOT NULL DEFAULT '+91',
                  home_type TEXT NOT NULL,
                  email TEXT,
                  notes TEXT,
                  created_at TEXT NOT NULL,
                  updated_at TEXT NOT NULL,
                  UNIQUE(country_code, phone)
                );
                INSERT INTO leads_new (id, name, phone, country_code, home_type, email, notes, created_at, updated_at)
                SELECT id, name, phone, country_code, home_type, email, notes, created_at, updated_at FROM leads;
                DROP TABLE leads;
                ALTER TABLE leads_new RENAME TO leads;
                COMMIT;
              `);
            }
            await this.db.execute('PRAGMA user_version = 1;');
          }
        } else {
          // Web Fallback (localStorage)
          if (!localStorage.getItem(LOCAL_STORAGE_KEY)) {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));
          }
        }
        this.isInitialized = true;
      } catch (err) {
        console.error('Database initialization error:', err);
        if (!localStorage.getItem(LOCAL_STORAGE_KEY)) {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));
        }
        this.isInitialized = true;
      }
    })();

    return this.initPromise;
  }

  /**
   * Checks if a lead with the given country_code & phone already exists.
   * If excludeId is provided (e.g. during edit), ignores that specific lead ID.
   */
  public async checkPhoneExists(
    country_code: string,
    phone: string,
    excludeId?: number
  ): Promise<boolean> {
    await this.initialize();

    const normalizedCode = country_code.trim();
    const normalizedPhone = phone.trim();

    if (this.isNative && this.db) {
      const query = excludeId
        ? 'SELECT COUNT(*) as count FROM leads WHERE country_code = ? AND phone = ? AND id != ?;'
        : 'SELECT COUNT(*) as count FROM leads WHERE country_code = ? AND phone = ?;';
      const params = excludeId
        ? [normalizedCode, normalizedPhone, excludeId]
        : [normalizedCode, normalizedPhone];
      const res = await this.db.query(query, params);
      const count = res.values && res.values[0] ? res.values[0].count : 0;
      return count > 0;
    } else {
      const leads = this.getWebLeads();
      return leads.some(
        (lead) =>
          lead.country_code === normalizedCode &&
          lead.phone === normalizedPhone &&
          (excludeId ? lead.id !== excludeId : true)
      );
    }
  }

  public async saveLead(
    input: LeadFormInput
  ): Promise<{ success: boolean; lead?: Lead; error?: string }> {
    await this.initialize();

    try {
      const exists = await this.checkPhoneExists(input.country_code, input.phone);
      if (exists) {
        return {
          success: false,
          error: `A lead with ${input.country_code} ${input.phone} already exists.`,
        };
      }

      const now = new Date().toISOString();

      if (this.isNative && this.db) {
        const query = `
          INSERT INTO leads (name, phone, country_code, home_type, email, notes, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        `;
        const res = await this.db.run(query, [
          input.name,
          input.phone,
          input.country_code,
          input.home_type,
          input.email || '',
          input.notes || '',
          now,
          now,
        ]);

        const newId = res.changes?.lastId || Date.now();
        const newLead: Lead = {
          id: newId,
          name: input.name,
          phone: input.phone,
          country_code: input.country_code,
          home_type: input.home_type,
          email: input.email || '',
          notes: input.notes || '',
          created_at: now,
          updated_at: now,
        };
        return { success: true, lead: newLead };
      } else {
        const leads = this.getWebLeads();
        const newLead: Lead = {
          id: Date.now(),
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
        return { success: true, lead: newLead };
      }
    } catch (err: unknown) {
      console.error('Error saving lead:', err);
      const message =
        err instanceof Error ? err.message : 'Failed to save lead to database.';
      return { success: false, error: message };
    }
  }

  public async updateLead(
    id: number,
    input: LeadFormInput
  ): Promise<{ success: boolean; error?: string }> {
    await this.initialize();

    try {
      // Excludes current lead ID from duplicate check so editing without changing phone succeeds
      const exists = await this.checkPhoneExists(
        input.country_code,
        input.phone,
        id
      );
      if (exists) {
        return {
          success: false,
          error: `Another lead with ${input.country_code} ${input.phone} already exists.`,
        };
      }

      const now = new Date().toISOString();

      if (this.isNative && this.db) {
        const query = `
          UPDATE leads
          SET name = ?, phone = ?, country_code = ?, home_type = ?, email = ?, notes = ?, updated_at = ?
          WHERE id = ?;
        `;
        await this.db.run(query, [
          input.name,
          input.phone,
          input.country_code,
          input.home_type,
          input.email || '',
          input.notes || '',
          now,
          id,
        ]);
        return { success: true };
      } else {
        const leads = this.getWebLeads();
        const idx = leads.findIndex((l) => l.id === id);
        if (idx !== -1) {
          leads[idx] = {
            ...leads[idx],
            name: input.name,
            phone: input.phone,
            country_code: input.country_code,
            home_type: input.home_type,
            email: input.email || '',
            notes: input.notes || '',
            updated_at: now,
          };
          this.saveWebLeads(leads);
        }
        return { success: true };
      }
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
    await this.initialize();

    try {
      if (this.isNative && this.db) {
        const placeholders = ids.map(() => '?').join(',');
        const query = `DELETE FROM leads WHERE id IN (${placeholders});`;
        await this.db.run(query, ids);
        return { success: true };
      } else {
        const leads = this.getWebLeads();
        const idSet = new Set(ids);
        const filtered = leads.filter((l) => !idSet.has(l.id));
        this.saveWebLeads(filtered);
        return { success: true };
      }
    } catch (err: unknown) {
      console.error('Error deleting leads:', err);
      const message =
        err instanceof Error ? err.message : 'Failed to delete leads from database.';
      return { success: false, error: message };
    }
  }

  public async getLeads(): Promise<Lead[]> {
    await this.initialize();

    if (this.isNative && this.db) {
      const res = await this.db.query(
        'SELECT * FROM leads ORDER BY created_at DESC;'
      );
      return (res.values as Lead[]) || [];
    } else {
      return this.getWebLeads();
    }
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

export const databaseService = new DatabaseService();
