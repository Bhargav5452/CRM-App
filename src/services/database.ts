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

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      if (this.isNative) {
        this.sqlite = new SQLiteConnection(CapacitorSQLite);
        const ret = await this.sqlite.checkConnectionsConsistency();
        const isConn = (await this.sqlite.isConnection(DB_NAME, false)).result;

        if (ret.result && isConn) {
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

        const createTableQuery = `
          CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT NOT NULL UNIQUE,
            country_code TEXT NOT NULL DEFAULT '+91',
            home_type TEXT NOT NULL,
            email TEXT,
            notes TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );
        `;
        await this.db.execute(createTableQuery);
      } else {
        // Web Fallback (localStorage)
        if (!localStorage.getItem(LOCAL_STORAGE_KEY)) {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));
        }
      }
      this.isInitialized = true;
    } catch (err) {
      console.error('Database initialization error:', err);
      // Fallback to web storage if native fails
      if (!localStorage.getItem(LOCAL_STORAGE_KEY)) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));
      }
      this.isInitialized = true;
    }
  }

  public async checkPhoneExists(phone: string, excludeId?: number): Promise<boolean> {
    await this.initialize();

    if (this.isNative && this.db) {
      const query = excludeId
        ? 'SELECT COUNT(*) as count FROM leads WHERE phone = ? AND id != ?;'
        : 'SELECT COUNT(*) as count FROM leads WHERE phone = ?;';
      const params = excludeId ? [phone, excludeId] : [phone];
      const res = await this.db.query(query, params);
      const count = res.values && res.values[0] ? res.values[0].count : 0;
      return count > 0;
    } else {
      const leads = this.getWebLeads();
      return leads.some(
        (lead) => lead.phone === phone && (excludeId ? lead.id !== excludeId : true)
      );
    }
  }

  public async saveLead(
    input: LeadFormInput
  ): Promise<{ success: boolean; lead?: Lead; error?: string }> {
    await this.initialize();

    try {
      const exists = await this.checkPhoneExists(input.phone);
      if (exists) {
        return { success: false, error: 'This lead already exists.' };
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
    } catch (err: any) {
      console.error('Error saving lead:', err);
      return {
        success: false,
        error: err.message || 'Failed to save lead to database.',
      };
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
