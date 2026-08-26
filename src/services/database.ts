import { Capacitor } from '@capacitor/core';
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from '@capacitor-community/sqlite';
import Database from '@tauri-apps/plugin-sql';
import { supabase } from './supabase';
import { Lead, LeadFormInput } from '../types/lead';

const DB_NAME = 'offline_crm_db';
const LOCAL_STORAGE_KEY = 'offline_crm_leads_v1';

class DatabaseService {
  private sqlite: SQLiteConnection | null = null;
  private db: SQLiteDBConnection | null = null;
  private tauriDb: Database | null = null;
  private isNative: boolean = false;
  private isTauri: boolean = false;
  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
    this.isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        if (this.isTauri) {
          this.tauriDb = await Database.load('sqlite:offline_crm.db');
          await this.tauriDb.execute(`
            CREATE TABLE IF NOT EXISTS leads (
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
        } else if (this.isNative) {
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
          if (!localStorage.getItem(LOCAL_STORAGE_KEY)) {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));
          }
          // Set up automatic background sync when returning online or focusing tab
          if (typeof window !== 'undefined') {
            window.addEventListener('online', () => {
              this.syncPendingLeads().catch(() => {});
            });
            window.addEventListener('focus', () => {
              this.syncPendingLeads().catch(() => {});
            });
            // Initial sync attempt
            this.syncPendingLeads().catch(() => {});
          }
        }
        this.isInitialized = true;
      } catch (err) {
        console.error('Database initialization error:', err);
        this.initPromise = null;
        if (!this.isTauri && !this.isNative) {
          if (!localStorage.getItem(LOCAL_STORAGE_KEY)) {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));
          }
          this.isInitialized = true;
        }
      }
    })();

    return this.initPromise;
  }

  public async checkPhoneExists(
    country_code: string,
    phone: string,
    excludeId?: number
  ): Promise<boolean> {
    await this.initialize();

    const normalizedCode = country_code.trim();
    const normalizedPhone = phone.trim();

    if (this.isTauri && this.tauriDb) {
      const query = excludeId
        ? 'SELECT COUNT(*) as count FROM leads WHERE country_code = $1 AND phone = $2 AND id != $3;'
        : 'SELECT COUNT(*) as count FROM leads WHERE country_code = $1 AND phone = $2;';
      const params = excludeId
        ? [normalizedCode, normalizedPhone, excludeId]
        : [normalizedCode, normalizedPhone];
      const res = await this.tauriDb.select<{ count: number }[]>(query, params);
      return res && res.length > 0 ? res[0].count > 0 : false;
    } else if (this.isNative && this.db) {
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
      try {
        let query = supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .eq('country_code', normalizedCode)
          .eq('phone', normalizedPhone);

        if (excludeId) {
          query = query.neq('id', excludeId);
        }

        const { count, error } = await query;
        if (!error && count !== null) {
          return count > 0;
        }
      } catch (e) {
        console.warn('Supabase checkPhoneExists fallback to localStorage:', e);
      }

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
  ): Promise<{ success: boolean; lead?: Lead; offline?: boolean; message?: string; error?: string }> {
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

      if (this.isTauri && this.tauriDb) {
        const query = `
          INSERT INTO leads (name, phone, country_code, home_type, email, notes, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
        `;
        const res = await this.tauriDb.execute(query, [
          input.name,
          input.phone,
          input.country_code,
          input.home_type,
          input.email || '',
          input.notes || '',
          now,
          now,
        ]);

        const newId = res.lastInsertId || Date.now();
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
      } else if (this.isNative && this.db) {
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
        // Modern Web: Offline-First save
        const newLead: Lead = {
          id: Date.now(),
          name: input.name.trim(),
          phone: input.phone.trim(),
          country_code: input.country_code.trim(),
          home_type: input.home_type,
          email: input.email ? input.email.trim() : '',
          notes: input.notes ? input.notes.trim() : '',
          created_at: now,
          updated_at: now,
          sync_status: 'pending_sync',
        };

        // 1. Save locally FIRST
        const local = this.getWebLeads();
        local.unshift(newLead);
        this.saveWebLeads(local);

        // 2. Attempt background upload to Supabase if online
        this.syncSingleLead(newLead).catch(() => {});

        const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
        return {
          success: true,
          lead: newLead,
          offline: isOffline,
          message: isOffline ? 'Saved offline — will sync when internet is available.' : undefined,
        };
      }
    } catch (err: unknown) {
      console.error('Error saving lead:', err);
      const message =
        err instanceof Error ? err.message : 'Failed to save lead to database.';
      return { success: false, error: message };
    }
  }

  /**
   * Sync a single lead to Supabase
   */
  private async syncSingleLead(lead: Lead): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('leads')
        .insert({
          name: lead.name,
          phone: lead.phone,
          country_code: lead.country_code || '+91',
          home_type: lead.home_type,
          email: lead.email || '',
          notes: lead.notes || '',
          created_at: lead.created_at,
          updated_at: lead.updated_at,
        });

      if (!error || error.code === '23505' || error.message.includes('unique') || error.message.includes('duplicate')) {
        // Mark synced in local store
        const leads = this.getWebLeads();
        const target = leads.find((l) => l.country_code === lead.country_code && l.phone === lead.phone);
        if (target) {
          target.sync_status = 'synced';
          this.saveWebLeads(leads);
        }
        return true;
      }
    } catch {
      // offline or upload failed
    }
    return false;
  }

  /**
   * Sync all pending offline leads to Supabase
   */
  public async syncPendingLeads(): Promise<{ total: number; synced: number }> {
    if (this.isNative || this.isTauri) return { total: 0, synced: 0 };
    const leads = this.getWebLeads();
    const pending = leads.filter((l) => l.sync_status === 'pending_sync');
    if (pending.length === 0) return { total: 0, synced: 0 };

    let count = 0;
    for (const lead of pending) {
      const success = await this.syncSingleLead(lead);
      if (success) count++;
    }
    return { total: pending.length, synced: count };
  }

  public async updateLead(
    id: number,
    input: LeadFormInput
  ): Promise<{ success: boolean; error?: string }> {
    await this.initialize();

    try {
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

      if (this.isTauri && this.tauriDb) {
        const query = `
          UPDATE leads
          SET name = $1, phone = $2, country_code = $3, home_type = $4, email = $5, notes = $6, updated_at = $7
          WHERE id = $8;
        `;
        await this.tauriDb.execute(query, [
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
      } else if (this.isNative && this.db) {
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
        // Modern Web: Update in Supabase
        const { error } = await supabase
          .from('leads')
          .update({
            name: input.name.trim(),
            phone: input.phone.trim(),
            country_code: input.country_code.trim(),
            home_type: input.home_type,
            email: input.email ? input.email.trim() : '',
            notes: input.notes ? input.notes.trim() : '',
            updated_at: now,
          })
          .eq('id', id);

        if (error) {
          if (
            error.code === '23505' ||
            error.message.includes('unique') ||
            error.message.includes('duplicate')
          ) {
            return {
              success: false,
              error: `Another lead with ${input.country_code} ${input.phone} already exists.`,
            };
          }
          console.error('Supabase updateLead error:', error);
          return { success: false, error: error.message };
        }

        // Update local cache
        const leads = this.getWebLeads();
        const index = leads.findIndex((l) => l.id === id);
        if (index !== -1) {
          leads[index] = {
            id,
            name: input.name,
            phone: input.phone,
            country_code: input.country_code,
            home_type: input.home_type,
            email: input.email || '',
            notes: input.notes || '',
            created_at: leads[index].created_at,
            updated_at: now,
          };
          this.saveWebLeads(leads);
        }

        return { success: true };
      }
    } catch (err: unknown) {
      console.error('Error updating lead:', err);
      const message =
        err instanceof Error ? err.message : 'Failed to update lead.';
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
      if (this.isTauri && this.tauriDb) {
        const placeholders = ids.map(() => '?').join(',');
        const query = `DELETE FROM leads WHERE id IN (${placeholders});`;
        await this.tauriDb.execute(query, ids);
        return { success: true };
      } else if (this.isNative && this.db) {
        const placeholders = ids.map(() => '?').join(',');
        const query = `DELETE FROM leads WHERE id IN (${placeholders});`;
        await this.db.run(query, ids);
        return { success: true };
      } else {
        // Modern Web: Delete in Supabase
        const { error } = await supabase
          .from('leads')
          .delete()
          .in('id', ids);

        if (error) {
          console.error('Supabase deleteLeads error:', error);
          return { success: false, error: error.message };
        }

        // Update local cache
        const leads = this.getWebLeads();
        const idSet = new Set(ids);
        const filtered = leads.filter((l) => !idSet.has(l.id));
        this.saveWebLeads(filtered);

        return { success: true };
      }
    } catch (err: unknown) {
      console.error('Error deleting leads:', err);
      const message =
        err instanceof Error ? err.message : 'Failed to delete leads.';
      return { success: false, error: message };
    }
  }

  public async getLeads(): Promise<Lead[]> {
    await this.initialize();

    if (this.isTauri && this.tauriDb) {
      const query = 'SELECT * FROM leads ORDER BY created_at DESC;';
      const result = await this.tauriDb.select<Lead[]>(query);
      return result.map((item) => ({
        ...item,
        country_code: item.country_code || '+91',
        email: item.email || '',
        notes: item.notes || '',
      }));
    } else if (this.isNative && this.db) {
      const query = 'SELECT * FROM leads ORDER BY created_at DESC;';
      const result = await this.db.query(query);
      const leads = (result.values || []) as Lead[];
      return leads.map((item) => ({
        ...item,
        country_code: item.country_code || '+91',
        email: item.email || '',
        notes: item.notes || '',
      }));
    } else {
      // Modern Web: Fetch directly from Supabase (Requires Authenticated CRM Session)
      try {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('Error fetching leads from Supabase, falling back to local cache:', error);
          return this.getWebLeads();
        }

        if (data) {
          const leads: Lead[] = (data as Record<string, unknown>[]).map((item) => ({
            id: Number(item.id),
            name: String(item.name || ''),
            phone: String(item.phone || ''),
            country_code: String(item.country_code || '+91'),
            home_type: String(item.home_type || '2BHK'),
            email: String(item.email || ''),
            notes: String(item.notes || ''),
            created_at: String(item.created_at || new Date().toISOString()),
            updated_at: String(item.updated_at || new Date().toISOString()),
            sync_status: 'synced',
          }));

          this.saveWebLeads(leads);
          return leads;
        }
      } catch (err) {
        console.warn('Network error fetching from Supabase, using local cache:', err);
      }

      return this.getWebLeads();
    }
  }

  /**
   * Migrate existing leads from localStorage to Supabase (idempotent, skips existing, preserves local backup)
   */
  public async migrateLocalLeadsToSupabase(): Promise<{
    total: number;
    inserted: number;
    skipped: number;
    backupKey?: string;
  }> {
    if (this.isNative || this.isTauri) return { total: 0, inserted: 0, skipped: 0 };
    const localLeads = this.getWebLeads();
    if (localLeads.length === 0) return { total: 0, inserted: 0, skipped: 0 };

    // 1. Keep a local backup until migration is confirmed
    const backupKey = `offline_crm_leads_backup_${Date.now()}`;
    try {
      localStorage.setItem(backupKey, JSON.stringify(localLeads));
    } catch (e) {
      console.warn('Could not save localStorage backup:', e);
    }

    let inserted = 0;
    let skipped = 0;

    for (const lead of localLeads) {
      try {
        const { error } = await supabase
          .from('leads')
          .insert({
            name: lead.name,
            phone: lead.phone,
            country_code: lead.country_code || '+91',
            home_type: lead.home_type,
            email: lead.email || '',
            notes: lead.notes || '',
            created_at: lead.created_at || new Date().toISOString(),
          })
          .select()
          .single();

        if (!error) {
          inserted++;
        } else {
          skipped++;
        }
      } catch {
        skipped++;
      }
    }

    console.log(
      `[Migration] Found: ${localLeads.length}, Inserted: ${inserted}, Skipped/Duplicate: ${skipped}. Backup preserved at ${backupKey}`
    );

    return {
      total: localLeads.length,
      inserted,
      skipped,
      backupKey,
    };
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

