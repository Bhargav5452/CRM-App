import { Lead, LeadFormInput } from '../types/legacyValidation';

var SUPABASE_URL = 'https://jncnsxumaqzipherjtnc.supabase.co';
var SUPABASE_ANON_KEY = 'sb_publishable_pIAjrJ8BR8PLIT2O_Qa2Yg_giQyeAIm';
var LOCAL_STORAGE_KEY = 'offline_crm_leads_v1';

// In-memory token storage (persists during page session, cleared on reload or explicit signout)
var inMemoryAccessToken: string | null = null;

export interface DiagnosticLog {
  id: number;
  time: string;
  type: 'REQ' | 'RES' | 'ERR';
  text: string;
}

var diagnosticLogs: DiagnosticLog[] = [];
var diagnosticListeners: Array<(logs: DiagnosticLog[]) => void> = [];

export function addDiagnosticLog(type: 'REQ' | 'RES' | 'ERR', text: string): void {
  var d = new Date();
  var timeStr = d.toTimeString().split(' ')[0] + '.' + ('00' + d.getMilliseconds()).slice(-3);
  var logItem: DiagnosticLog = {
    id: Date.now() + Math.random(),
    time: timeStr,
    type: type,
    text: text,
  };
  diagnosticLogs.unshift(logItem);
  if (diagnosticLogs.length > 20) {
    diagnosticLogs.pop();
  }
  for (var i = 0; i < diagnosticListeners.length; i++) {
    try {
      diagnosticListeners[i](diagnosticLogs.slice(0));
    } catch (e) {}
  }
}

export function subscribeDiagnostics(listener: (logs: DiagnosticLog[]) => void): () => void {
  diagnosticListeners.push(listener);
  listener(diagnosticLogs.slice(0));
  return function () {
    var idx = diagnosticListeners.indexOf(listener);
    if (idx !== -1) diagnosticListeners.splice(idx, 1);
  };
}

interface XhrResponse<T = any> {
  status: number;
  data: T;
  error?: string;
}

function sendXhr<T = any>(
  method: string,
  path: string,
  body?: any,
  useAuthToken?: boolean
): Promise<XhrResponse<T>> {
  return new Promise(function (resolve) {
    try {
      var xhr = new XMLHttpRequest();
      var url = SUPABASE_URL + path;

      addDiagnosticLog(
        'REQ',
        'SUPABASE REQUEST:\nMETHOD: ' + method + '\nURL: ' + url + (useAuthToken ? '\nAUTH: Bearer (Admin Token Attached)' : '\nAUTH: apikey (anon)')
      );

      xhr.open(method, url, true);
      xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY);
      xhr.setRequestHeader('Content-Type', 'application/json');

      if (useAuthToken && inMemoryAccessToken) {
        xhr.setRequestHeader('Authorization', 'Bearer ' + inMemoryAccessToken);
      } else {
        xhr.setRequestHeader('Authorization', 'Bearer ' + SUPABASE_ANON_KEY);
      }

      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          var responseData: any = null;
          if (xhr.responseText) {
            try {
              responseData = JSON.parse(xhr.responseText);
            } catch (e) {
              responseData = xhr.responseText;
            }
          }

          if (xhr.status >= 200 && xhr.status < 300) {
            var resSummary = xhr.responseText ? (xhr.responseText.length > 120 ? xhr.responseText.substring(0, 120) + '...' : xhr.responseText) : '(empty 201/204)';
            addDiagnosticLog(
              'RES',
              'SUPABASE RESPONSE:\nHTTP STATUS: ' + xhr.status + '\nRESPONSE BODY: ' + resSummary
            );
            resolve({ status: xhr.status, data: responseData });
          } else {
            var errSummary = xhr.responseText || xhr.statusText || 'Network failure / CORS blocked';
            addDiagnosticLog(
              'ERR',
              'SUPABASE ERROR:\nHTTP STATUS: ' + xhr.status + '\nERROR BODY: ' + errSummary
            );

            var errMessage = 'Request failed with status ' + xhr.status;
            if (responseData && typeof responseData === 'object') {
              if (responseData.message) errMessage = responseData.message;
              else if (responseData.error_description) errMessage = responseData.error_description;
              else if (responseData.msg) errMessage = responseData.msg;
            }
            resolve({
              status: xhr.status,
              data: responseData,
              error: errMessage,
            });
          }
        }
      };

      if (body !== undefined && body !== null) {
        xhr.send(JSON.stringify(body));
      } else {
        xhr.send();
      }
    } catch (err: any) {
      addDiagnosticLog(
        'ERR',
        'SUPABASE ERROR:\nHTTP STATUS: 0\nERROR BODY: ' + (err && err.message ? err.message : 'Unknown exception')
      );
      resolve({
        status: 0,
        data: null as any,
        error: err && err.message ? err.message : 'Unknown XHR error',
      });
    }
  });
}

function getLocalCache(): Lead[] {
  try {
    var data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalCache(leads: Lead[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(leads));
  } catch (e) {}
}

export var legacySupabase = {
  /**
   * Check if user is currently authenticated in memory
   */
  isAuthenticated: function (): boolean {
    return inMemoryAccessToken !== null && inMemoryAccessToken.length > 0;
  },

  /**
   * Sign in using password against default admin account
   */
  signInWithPassword: function (password: string): Promise<{ success: boolean; error?: string }> {
    if (!password) {
      return Promise.resolve({ success: false, error: 'Please enter the admin password.' });
    }

    return sendXhr(
      'POST',
      '/auth/v1/token?grant_type=password',
      {
        email: 'admin@crm.local',
        password: password,
      },
      false
    ).then(function (res) {
      if (res.status === 200 && res.data && res.data.access_token) {
        inMemoryAccessToken = res.data.access_token;
        return { success: true };
      }

      var msg = 'Incorrect password. Please try again.';
      if (res.error && res.error.indexOf('Network') !== -1) {
        msg = res.error;
      }
      return { success: false, error: msg };
    });
  },

  /**
   * Explicit sign out: clears in-memory token
   */
  signOut: function (): void {
    inMemoryAccessToken = null;
  },

  /**
   * Public lead submission from Lead Form
   */
  createLead: function (
    input: LeadFormInput
  ): Promise<{ success: boolean; id?: number; error?: string }> {
    var now = new Date().toISOString();
    var payload = {
      name: input.name.trim(),
      phone: input.phone.trim(),
      country_code: input.country_code.trim(),
      home_type: input.home_type,
      email: input.email ? input.email.trim() : '',
      notes: input.notes ? input.notes.trim() : '',
      created_at: now,
      updated_at: now,
    };

    var isAuth = legacySupabase.isAuthenticated();

    return sendXhr(
      'POST',
      '/rest/v1/leads',
      payload,
      isAuth
    ).then(function (res) {
      if (res.status === 201 || res.status === 200 || res.status === 204) {
        var local = getLocalCache();
        var newLead: Lead = {
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
        local.unshift(newLead);
        saveLocalCache(local);

        return { success: true, id: newLead.id };
      }

      if (res.status === 409 || (res.error && (res.error.indexOf('duplicate') !== -1 || res.error.indexOf('unique') !== -1 || res.error.indexOf('23505') !== -1))) {
        return {
          success: false,
          error: 'A lead with ' + input.country_code + ' ' + input.phone + ' already exists.',
        };
      }

      return {
        success: false,
        error: res.error || 'Failed to save lead to database.',
      };
    });
  },

  /**
   * Fetch all central leads from Supabase
   */
  getLeads: function (): Promise<Lead[]> {
    if (!legacySupabase.isAuthenticated()) {
      return Promise.resolve(getLocalCache());
    }

    return sendXhr<any[]>(
      'GET',
      '/rest/v1/leads?select=*&order=created_at.desc',
      null,
      true
    ).then(function (res) {
      if (res.status === 200 && Array.isArray(res.data)) {
        var leads: Lead[] = res.data.map(function (item: any) {
          return {
            id: Number(item.id),
            name: item.name || '',
            phone: item.phone || '',
            country_code: item.country_code || '+91',
            home_type: item.home_type || '2BHK',
            email: item.email || '',
            notes: item.notes || '',
            created_at: item.created_at || new Date().toISOString(),
            updated_at: item.updated_at || new Date().toISOString(),
          };
        });

        saveLocalCache(leads);
        return leads;
      }

      return getLocalCache();
    });
  },

  /**
   * Update lead in central Supabase database
   */
  updateLead: function (
    id: number,
    input: LeadFormInput
  ): Promise<{ success: boolean; error?: string }> {
    if (!legacySupabase.isAuthenticated()) {
      return Promise.resolve({ success: false, error: 'Please unlock CRM to update leads.' });
    }

    var now = new Date().toISOString();
    var payload = {
      name: input.name.trim(),
      phone: input.phone.trim(),
      country_code: input.country_code.trim(),
      home_type: input.home_type,
      email: input.email ? input.email.trim() : '',
      notes: input.notes ? input.notes.trim() : '',
      updated_at: now,
    };

    return sendXhr(
      'PATCH',
      '/rest/v1/leads?id=eq.' + id,
      payload,
      true
    ).then(function (res) {
      if (res.status === 204 || res.status === 200) {
        var leads = getLocalCache();
        var idx = -1;
        for (var i = 0; i < leads.length; i++) {
          if (leads[i].id === id) {
            idx = i;
            break;
          }
        }
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
          saveLocalCache(leads);
        }
        return { success: true };
      }

      if (res.status === 409 || (res.error && (res.error.indexOf('duplicate') !== -1 || res.error.indexOf('unique') !== -1))) {
        return {
          success: false,
          error: 'Another lead with ' + input.country_code + ' ' + input.phone + ' already exists.',
        };
      }

      return { success: false, error: res.error || 'Failed to update lead.' };
    });
  },

  /**
   * Delete leads in central Supabase database
   */
  deleteLeads: function (
    ids: number[]
  ): Promise<{ success: boolean; error?: string }> {
    if (ids.length === 0) return Promise.resolve({ success: true });
    if (!legacySupabase.isAuthenticated()) {
      return Promise.resolve({ success: false, error: 'Please unlock CRM to delete leads.' });
    }

    var idList = ids.join(',');
    return sendXhr(
      'DELETE',
      '/rest/v1/leads?id=in.(' + idList + ')',
      null,
      true
    ).then(function (res) {
      if (res.status === 204 || res.status === 200) {
        var leads = getLocalCache();
        var idMap: Record<number, boolean> = {};
        for (var i = 0; i < ids.length; i++) {
          idMap[ids[i]] = true;
        }
        var filtered = leads.filter(function (l) {
          return !idMap[l.id];
        });
        saveLocalCache(filtered);
        return { success: true };
      }

      return { success: false, error: res.error || 'Failed to delete leads.' };
    });
  },

  /**
   * Safe migration of legacy localStorage leads to Supabase
   */
  migrateLocalLeadsToSupabase: function (): Promise<{
    total: number;
    inserted: number;
    skipped: number;
    backupKey?: string;
  }> {
    var localLeads = getLocalCache();
    if (localLeads.length === 0) {
      return Promise.resolve({ total: 0, inserted: 0, skipped: 0 });
    }

    // 1. Save timestamped backup
    var backupKey = 'offline_crm_leads_backup_' + Date.now();
    try {
      localStorage.setItem(backupKey, JSON.stringify(localLeads));
    } catch (e) {}

    var inserted = 0;
    var skipped = 0;

    var promise = Promise.resolve();

    localLeads.forEach(function (lead) {
      promise = promise.then(function () {
        var payload = {
          name: lead.name,
          phone: lead.phone,
          country_code: lead.country_code || '+91',
          home_type: lead.home_type,
          email: lead.email || '',
          notes: lead.notes || '',
          created_at: lead.created_at || new Date().toISOString(),
        };

        return sendXhr('POST', '/rest/v1/leads', payload, true).then(function (res) {
          if (res.status === 201 || res.status === 200 || res.status === 204) {
            inserted++;
          } else {
            skipped++;
          }
        });
      });
    });

    return promise.then(function () {
      return {
        total: localLeads.length,
        inserted: inserted,
        skipped: skipped,
        backupKey: backupKey,
      };
    });
  },

  getLocalCache: getLocalCache,
  saveLocalCache: saveLocalCache,
};
