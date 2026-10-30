import React, { useEffect, useState } from 'react';
import { formConfigService } from '../../../services/formConfigService';

interface VersionHistoryModalProps {
  currentDraftId: number;
  isOpen: boolean;
  onRestoreSuccess: () => void;
  onClose: () => void;
}

interface VersionItem {
  id: number;
  version: number;
  status: string;
  is_active: boolean;
  title: string;
  subtitle: string;
  published_at: string | null;
  created_at: string;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  currentDraftId,
  isOpen,
  onRestoreSuccess,
  onClose,
}) => {
  const [history, setHistory] = useState<VersionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      formConfigService.getVersionHistory().then((data) => {
        setHistory(data);
        setLoading(false);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRestore = async (versionId: number) => {
    if (
      !window.confirm(
        'Restore this published version into your current working draft? Any unsaved draft changes will be replaced.'
      )
    ) {
      return;
    }

    setRestoringId(versionId);
    const res = await formConfigService.restoreVersionToDraft(
      versionId,
      currentDraftId
    );
    setRestoringId(null);

    if (res.success) {
      onRestoreSuccess();
      onClose();
    } else {
      alert(res.error || 'Failed to restore version.');
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not published';
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-card" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div>
            <h3 className="admin-modal-title">Form Version History & Rollback</h3>
            <p className="admin-modal-subtitle">
              Inspect past published configurations and restore any version into your working draft.
            </p>
          </div>
          <button type="button" className="admin-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="version-history-list">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#71717A' }}>
              Loading version history...
            </div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#71717A' }}>
              No version history found.
            </div>
          ) : (
            history.map((ver) => (
              <div key={ver.id} className="version-item-card">
                <div className="version-item-info">
                  <div className="version-item-top">
                    <span className="version-badge">Version {ver.version}</span>
                    {ver.is_active && (
                      <span className="active-published-badge">Currently Active</span>
                    )}
                    <span className="status-badge status-{ver.status}">{ver.status}</span>
                  </div>
                  <h4 className="version-title">{ver.title}</h4>
                  <p className="version-meta">
                    Published: <strong>{formatDate(ver.published_at)}</strong>
                  </p>
                </div>

                <div className="version-item-actions">
                  <button
                    type="button"
                    className="btn-restore"
                    disabled={restoringId !== null || ver.id === currentDraftId}
                    onClick={() => handleRestore(ver.id)}
                  >
                    {restoringId === ver.id ? 'Restoring...' : 'Restore to Draft'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="admin-modal-actions">
          <button type="button" className="btn-cancel" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
