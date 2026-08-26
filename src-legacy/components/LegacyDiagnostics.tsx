import React, { useState, useEffect } from 'react';
import { DiagnosticLog, subscribeDiagnostics, addDiagnosticLog } from '../services/legacySupabase';

const LegacyDiagnostics: React.FC = () => {
  const [logs, setLogs] = useState<DiagnosticLog[]>([]);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeDiagnostics((newLogs) => {
      setLogs(newLogs);
    });
    return unsubscribe;
  }, []);

  const handleClear = () => {
    setLogs([]);
  };

  const handleTestPing = () => {
    addDiagnosticLog('REQ', 'MANUAL TEST: Checking Supabase connectivity...');
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://jncnsxumaqzipherjtnc.supabase.co/rest/v1/', true);
    xhr.setRequestHeader('apikey', 'sb_publishable_pIAjrJ8BR8PLIT2O_Qa2Yg_giQyeAIm');
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 400) {
          addDiagnosticLog('RES', 'SUPABASE PING SUCCESS: HTTP ' + xhr.status);
        } else {
          addDiagnosticLog('ERR', 'SUPABASE PING FAILED: HTTP ' + xhr.status + ' (' + (xhr.responseText || 'No response / CORS') + ')');
        }
      }
    };
    xhr.send();
  };

  if (!isOpen) {
    return (
      <div style={{ position: 'fixed', bottom: 12, right: 12, zIndex: 99999 }}>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          style={{
            backgroundColor: '#09090B',
            color: '#FFFFFF',
            border: '1px solid #27272A',
            borderRadius: 20,
            padding: '6px 14px',
            fontSize: 12,
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            cursor: 'pointer',
          }}
        >
          🔍 Supabase Diagnostics ({logs.length})
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        maxHeight: '260px',
        backgroundColor: '#18181B',
        color: '#FAFAFA',
        borderTop: '2px solid #27272A',
        zIndex: 99999,
        fontFamily: 'monospace, -apple-system, sans-serif',
        fontSize: 11,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.4)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 12px',
          backgroundColor: '#09090B',
          borderBottom: '1px solid #27272A',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', color: '#10B981', marginRight: 8 }}>
            ● Supabase Live XHR Monitor
          </span>
          <span style={{ color: '#A1A1AA' }}>({logs.length} events)</span>
        </div>
        <div style={{ display: 'flex' }}>
          <button
            type="button"
            onClick={handleTestPing}
            style={{
              background: '#27272A',
              color: '#38BDF8',
              border: 'none',
              borderRadius: 4,
              padding: '3px 8px',
              fontSize: 10,
              cursor: 'pointer',
              marginRight: 6,
            }}
          >
            Test Ping
          </button>
          <button
            type="button"
            onClick={handleClear}
            style={{
              background: '#27272A',
              color: '#D4D4D8',
              border: 'none',
              borderRadius: 4,
              padding: '3px 8px',
              fontSize: 10,
              cursor: 'pointer',
              marginRight: 6,
            }}
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            style={{
              background: '#EF4444',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 4,
              padding: '3px 8px',
              fontSize: 10,
              cursor: 'pointer',
            }}
          >
            Hide
          </button>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 12px',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {logs.length === 0 ? (
          <div style={{ color: '#71717A', fontStyle: 'italic', padding: 8 }}>
            No Supabase requests captured yet. Submit a lead or unlock CRM to see traffic.
          </div>
        ) : (
          logs.map((log) => {
            var color = '#38BDF8';
            var bg = 'rgba(56, 189, 248, 0.08)';
            if (log.type === 'RES') {
              color = '#4ADE80';
              bg = 'rgba(74, 222, 128, 0.08)';
            } else if (log.type === 'ERR') {
              color = '#F87171';
              bg = 'rgba(248, 113, 113, 0.15)';
            }

            return (
              <div
                key={log.id}
                style={{
                  marginBottom: 6,
                  padding: '6px 8px',
                  borderRadius: 4,
                  backgroundColor: bg,
                  borderLeft: '3px solid ' + color,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', color: color, fontWeight: 'bold', marginBottom: 2 }}>
                  <span>[{log.type}] {log.time}</span>
                </div>
                <div style={{ color: '#E4E4E7' }}>{log.text}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default React.memo(LegacyDiagnostics);
