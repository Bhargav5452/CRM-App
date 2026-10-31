import React, { useState } from 'react';
import { legacySupabase } from '../services/legacySupabase';
import { Lead } from '../types/legacyValidation';

const LOCAL_STORAGE_KEY = 'offline_crm_leads_v1';

function readLocalLeads(): Lead[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

const ADMIN_PASSWORD_KEY = '_debug_unlocked';

const LegacyDebug: React.FC = () => {
  const [unlocked, setUnlocked] = useState(
    legacySupabase.isAuthenticated()
  );
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [leads, setLeads] = useState<Lead[]>(() => readLocalLeads());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const handleLogin = function (e: React.FormEvent) {
    e.preventDefault();
    if (!password) {
      setLoginError('Please enter the admin password.');
      return;
    }
    setIsLoggingIn(true);
    setLoginError('');
    legacySupabase.signInWithPassword(password).then(function (res) {
      setIsLoggingIn(false);
      if (res.success) {
        setUnlocked(true);
        setLeads(readLocalLeads());
      } else {
        setLoginError(res.error || 'Incorrect password.');
      }
    });
  };

  const handleSync = function () {
    setIsSyncing(true);
    setSyncResult(null);
    legacySupabase.syncPendingLeads().then(function (result) {
      setIsSyncing(false);
      setLeads(readLocalLeads());
      if (result.total === 0) {
        setSyncResult('No pending leads to sync — all leads are already synced.');
      } else {
        setSyncResult(
          'Sync complete: ' + result.synced + ' of ' + result.total + ' pending lead(s) uploaded to Supabase.'
        );
      }
    }).catch(function () {
      setIsSyncing(false);
      setSyncResult('Sync failed. Check internet connection and try again.');
    });
  };

  const handleRefresh = function () {
    setLeads(readLocalLeads());
    setSyncResult(null);
  };

  const pendingLeads = leads.filter(function (l) { return l.sync_status === 'pending_sync'; });
  const syncedLeads = leads.filter(function (l) { return l.sync_status !== 'pending_sync'; });

  /* ── Login Gate ─────────────────────────────────── */
  if (!unlocked) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.title}>🔒 Debug Access</h1>
          <p style={styles.subtitle}>Enter the admin password to view local storage data.</p>
          <form onSubmit={handleLogin} style={{ width: '100%' }}>
            <input
              type="password"
              value={password}
              onChange={function (e) { setPassword(e.target.value); }}
              placeholder="Admin password"
              style={styles.input}
              autoComplete="current-password"
            />
            {loginError ? <p style={styles.error}>{loginError}</p> : null}
            <button type="submit" disabled={isLoggingIn} style={styles.btn}>
              {isLoggingIn ? 'Checking...' : 'Unlock Debug'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* ── Main Debug View ─────────────────────────────── */
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>📦 Local Storage Debug</h1>
        <p style={styles.subtitle}>
          Showing leads stored on <strong>this device</strong> in localStorage.
        </p>

        {/* Summary Row */}
        <div style={styles.summaryRow}>
          <div style={styles.badge('total')}>
            Total: <strong>{leads.length}</strong>
          </div>
          <div style={styles.badge('pending')}>
            Pending sync: <strong>{pendingLeads.length}</strong>
          </div>
          <div style={styles.badge('synced')}>
            Synced: <strong>{syncedLeads.length}</strong>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={styles.btnRow}>
          <button
            onClick={handleSync}
            disabled={isSyncing || pendingLeads.length === 0}
            style={pendingLeads.length === 0 ? styles.btnDisabled : styles.btn}
          >
            {isSyncing ? 'Syncing...' : 'Force Sync Now (' + pendingLeads.length + ' pending)'}
          </button>
          <button onClick={handleRefresh} style={styles.btnSecondary}>
            Refresh List
          </button>
        </div>

        {/* Sync Result Message */}
        {syncResult ? (
          <div style={syncResult.indexOf('failed') !== -1 ? styles.errorBox : styles.successBox}>
            {syncResult}
          </div>
        ) : null}

        {/* No data at all */}
        {leads.length === 0 ? (
          <div style={styles.emptyBox}>
            ⚠️ No leads found in localStorage on this device.
            <br />
            This means they were either never saved here, or have already
            been synced and the cache was overwritten.
          </div>
        ) : null}

        {/* Pending Leads Section */}
        {pendingLeads.length > 0 ? (
          <div>
            <h2 style={styles.sectionTitle}>⏳ Pending Sync ({pendingLeads.length})</h2>
            <p style={styles.sectionNote}>
              These leads are saved on this iPad but NOT yet in the central database.
              Press "Force Sync Now" to upload them.
            </p>
            {pendingLeads.map(function (lead) {
              return <LeadRow key={lead.id} lead={lead} status="pending" />;
            })}
          </div>
        ) : null}

        {/* Synced Leads Section */}
        {syncedLeads.length > 0 ? (
          <div>
            <h2 style={styles.sectionTitle}>✅ Synced ({syncedLeads.length})</h2>
            {syncedLeads.map(function (lead) {
              return <LeadRow key={lead.id} lead={lead} status="synced" />;
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
};

/* ── Lead Row Component ──────────────────────────────── */
const LeadRow: React.FC<{ lead: Lead; status: 'pending' | 'synced' }> = function ({ lead, status }) {
  const date = lead.created_at
    ? new Date(lead.created_at).toLocaleString()
    : '—';

  return (
    <div style={status === 'pending' ? styles.leadRowPending : styles.leadRowSynced}>
      <div style={styles.leadName}>{lead.name}</div>
      <div style={styles.leadDetail}>
        {lead.country_code} {lead.phone}
        {lead.home_type ? ' · ' + lead.home_type : ''}
        {lead.email ? ' · ' + lead.email : ''}
      </div>
      <div style={styles.leadMeta}>Saved: {date}</div>
      {lead.notes ? <div style={styles.leadNotes}>Notes: {lead.notes}</div> : null}
    </div>
  );
};

/* ── Inline Styles (no CSS file needed) ─────────────── */
const styles: Record<string, any> = {
  page: {
    minHeight: '100vh',
    background: '#FAFAFA',
    padding: '16px',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    maxWidth: 680,
    margin: '0 auto',
    background: '#FFFFFF',
    borderRadius: 12,
    padding: '24px 20px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    margin: '0 0 6px 0',
    color: '#09090B',
  },
  subtitle: {
    fontSize: 14,
    color: '#52525B',
    margin: '0 0 20px 0',
  },
  summaryRow: {
    display: 'flex',
    gap: 10,
    marginBottom: 16,
    flexWrap: 'wrap' as const,
  },
  badge: function (type: string) {
    const colors: Record<string, string> = {
      total: '#F4F4F5',
      pending: '#FEF3C7',
      synced: '#DCFCE7',
    };
    return {
      background: colors[type] || '#F4F4F5',
      borderRadius: 8,
      padding: '6px 12px',
      fontSize: 13,
      color: '#09090B',
    };
  },
  btnRow: {
    display: 'flex',
    gap: 10,
    marginBottom: 16,
    flexWrap: 'wrap' as const,
  },
  btn: {
    background: '#09090B',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 8,
    padding: '10px 18px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
    marginBottom: 8,
  },
  btnSecondary: {
    background: '#F4F4F5',
    color: '#09090B',
    border: 'none',
    borderRadius: 8,
    padding: '10px 18px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnDisabled: {
    background: '#D4D4D8',
    color: '#A1A1AA',
    border: 'none',
    borderRadius: 8,
    padding: '10px 18px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'not-allowed',
    width: '100%',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    fontSize: 15,
    border: '1.5px solid rgba(0,0,0,0.15)',
    borderRadius: 8,
    marginBottom: 10,
    boxSizing: 'border-box' as const,
    color: '#09090B',
    background: '#FFFFFF',
  },
  error: {
    color: '#EF4444',
    fontSize: 13,
    margin: '0 0 10px 0',
  },
  errorBox: {
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: 8,
    padding: '10px 14px',
    color: '#B91C1C',
    fontSize: 13,
    marginBottom: 16,
  },
  successBox: {
    background: '#F0FDF4',
    border: '1px solid #BBF7D0',
    borderRadius: 8,
    padding: '10px 14px',
    color: '#15803D',
    fontSize: 13,
    marginBottom: 16,
  },
  emptyBox: {
    background: '#FFFBEB',
    border: '1px solid #FDE68A',
    borderRadius: 8,
    padding: '14px',
    color: '#92400E',
    fontSize: 14,
    lineHeight: 1.6,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#09090B',
    margin: '20px 0 4px 0',
    borderTop: '1px solid rgba(0,0,0,0.08)',
    paddingTop: 16,
  },
  sectionNote: {
    fontSize: 13,
    color: '#71717A',
    margin: '0 0 12px 0',
  },
  leadRowPending: {
    background: '#FFFBEB',
    border: '1px solid #FDE68A',
    borderRadius: 8,
    padding: '12px 14px',
    marginBottom: 8,
  },
  leadRowSynced: {
    background: '#F9FAFB',
    border: '1px solid rgba(0,0,0,0.07)',
    borderRadius: 8,
    padding: '12px 14px',
    marginBottom: 8,
  },
  leadName: {
    fontWeight: 700,
    fontSize: 15,
    color: '#09090B',
    marginBottom: 2,
  },
  leadDetail: {
    fontSize: 13,
    color: '#3F3F46',
    marginBottom: 2,
  },
  leadMeta: {
    fontSize: 12,
    color: '#A1A1AA',
  },
  leadNotes: {
    fontSize: 12,
    color: '#71717A',
    marginTop: 4,
    fontStyle: 'italic',
  },
};

export default LegacyDebug;

