import React, { useEffect, useState } from 'react';
import { IonContent, IonPage, IonSpinner } from '@ionic/react';
import { Session } from '@supabase/supabase-js';
import { authService } from '../../services/auth';
import { formConfigService } from '../../services/formConfigService';
import {
  FormConfig,
  FormFieldConfig,
  DEFAULT_FORM_CONFIG,
} from '../../types/formConfig';
import { AdminAuthGate } from './AdminAuthGate';
import { FieldEditorModal } from './components/FieldEditorModal';
import { VersionHistoryModal } from './components/VersionHistoryModal';
import './AdminDashboard.css';

type AdminTab = 'overview' | 'builder' | 'dropdowns' | 'appearance' | 'preview';

const AdminDashboard: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [draft, setDraft] = useState<FormConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('builder');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [editingField, setEditingField] = useState<FormFieldConfig | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const [toast, setToast] = useState<{ show: boolean; message: string; isError: boolean }>({
    show: false,
    message: '',
    isError: false,
  });

  const showToast = (message: string, isError = false) => {
    setToast({ show: true, message, isError });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  useEffect(() => {
    authService.getSession().then((s) => {
      setSession(s);
      setAuthLoading(false);
    });

    const { data: listener } = authService.onAuthStateChange((newSession) => {
      setSession(newSession);
      setAuthLoading(false);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const loadDraft = async () => {
    setLoadingConfig(true);
    try {
      const config = await formConfigService.getDraftConfig();
      setDraft(config);
      setHasUnsavedChanges(false);
    } catch {
      setDraft(DEFAULT_FORM_CONFIG);
    } finally {
      setLoadingConfig(false);
    }
  };

  useEffect(() => {
    if (session) {
      loadDraft();
    }
  }, [session]);

  const handleSaveDraft = async () => {
    if (!draft || !draft.id) return;
    setIsSaving(true);
    const res = await formConfigService.saveDraft(draft.id, draft);
    setIsSaving(false);

    if (res.success) {
      setHasUnsavedChanges(false);
      showToast('Draft configuration saved successfully.');
    } else {
      showToast(res.error || 'Failed to save draft.', true);
    }
  };

  const handlePublish = async () => {
    if (!draft || !draft.id) return;

    if (
      !window.confirm(
        `Publish Version ${draft.version} to the public website? The active form will update immediately.`
      )
    ) {
      return;
    }

    setIsPublishing(true);
    // Ensure draft is saved first
    await formConfigService.saveDraft(draft.id, draft);
    const res = await formConfigService.publishConfig(draft.id);
    setIsPublishing(false);

    if (res.success && res.publishedConfig) {
      setHasUnsavedChanges(false);
      showToast(`Version ${res.publishedConfig.version} published successfully!`);
      // Re-load to prepare next draft
      loadDraft();
    } else {
      showToast(res.error || 'Failed to publish configuration.', true);
    }
  };

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    if (!draft) return;
    const fields = [...draft.fields];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= fields.length) return;

    const temp = fields[index];
    fields[index] = fields[targetIdx];
    fields[targetIdx] = temp;

    // Update explicit order indices
    const updated = fields.map((f, i) => ({ ...f, order: i }));
    setDraft({ ...draft, fields: updated });
    setHasUnsavedChanges(true);
  };

  const handleToggleFieldVisibility = (fieldId: string) => {
    if (!draft) return;
    const updated = draft.fields.map((f) => {
      if (f.id === fieldId) {
        if (f.key === 'name' || f.key === 'phone') return f; // core identity required
        return { ...f, is_visible: !f.is_visible };
      }
      return f;
    });
    setDraft({ ...draft, fields: updated });
    setHasUnsavedChanges(true);
  };

  const handleDeleteField = (fieldId: string) => {
    if (!draft) return;
    const target = draft.fields.find((f) => f.id === fieldId);
    if (target?.is_core) {
      alert('Core CRM fields cannot be deleted. You can hide them instead.');
      return;
    }

    if (!window.confirm(`Delete custom field "${target?.label}"?`)) return;

    const updated = draft.fields
      .filter((f) => f.id !== fieldId)
      .map((f, i) => ({ ...f, order: i }));

    setDraft({ ...draft, fields: updated });
    setHasUnsavedChanges(true);
  };

  const handleSaveFieldConfig = (updatedField: FormFieldConfig) => {
    if (!draft) return;
    const exists = draft.fields.some((f) => f.id === updatedField.id);
    let fields: FormFieldConfig[];

    if (exists) {
      fields = draft.fields.map((f) => (f.id === updatedField.id ? updatedField : f));
    } else {
      fields = [...draft.fields, { ...updatedField, order: draft.fields.length }];
    }

    setDraft({ ...draft, fields });
    setHasUnsavedChanges(true);
    setEditingField(null);
  };

  const handleAddNewCustomField = () => {
    const newId = 'custom_' + Date.now();
    const newKey = 'field_' + Math.random().toString(36).substring(2, 8);
    setEditingField({
      id: newId,
      key: newKey,
      type: 'text',
      label: 'New Custom Field',
      placeholder: '',
      description: '',
      required: false,
      is_core: false,
      is_visible: true,
      order: draft?.fields.length || 0,
    });
  };

  if (authLoading) {
    return (
      <IonPage>
        <IonContent fullscreen>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
            <IonSpinner name="crescent" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent fullscreen className="home-content">
        <AdminAuthGate session={session} onAuthenticated={(s) => setSession(s)}>
          <div className="admin-page-container">
            {/* Notification Toast */}
            {toast.show && (
              <div
                className="toast-success-banner"
                style={{
                  backgroundColor: toast.isError ? '#FEF2F2' : '#F0FDF4',
                  borderColor: toast.isError ? '#FECACA' : '#DCFCE7',
                  color: toast.isError ? '#DC2626' : '#15803D',
                  zIndex: 4000,
                }}
              >
                <span>{toast.message}</span>
              </div>
            )}

            {/* Dashboard Header */}
            <header className="admin-dashboard-header">
              <div className="admin-header-title-group">
                <h1 className="admin-header-title">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  Admin Form Builder
                </h1>
                <p className="admin-header-subtitle">
                  Configure dynamic public lead fields, customize copy, and publish updates live.
                </p>
              </div>

              <div className="admin-header-actions">
                <span
                  className={`admin-pill ${
                    hasUnsavedChanges ? 'admin-pill-unsaved' : 'admin-pill-saved'
                  }`}
                >
                  {hasUnsavedChanges
                    ? `● Draft v${draft?.version || 1} (Unsaved)`
                    : `✓ Draft v${draft?.version || 1} (Saved)`}
                </span>

                <button
                  type="button"
                  className="btn-field-action"
                  disabled={isSaving || !hasUnsavedChanges}
                  onClick={handleSaveDraft}
                >
                  {isSaving ? 'Saving...' : 'Save Draft'}
                </button>

                <button
                  type="button"
                  className="btn-submit"
                  style={{ height: 40, minHeight: 40, padding: '0 18px', fontSize: 13.5 }}
                  disabled={isPublishing}
                  onClick={handlePublish}
                >
                  {isPublishing ? 'Publishing...' : 'Publish Live'}
                </button>

                <button
                  type="button"
                  className="btn-field-action"
                  onClick={() => authService.signOut().then(() => window.location.reload())}
                  title="Sign out of Admin Dashboard"
                >
                  Sign Out
                </button>
              </div>
            </header>

            {/* Sub-Tabs Bar */}
            <nav className="admin-tabs-bar" role="tablist">
              <button
                type="button"
                className={`admin-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                📊 Overview
              </button>
              <button
                type="button"
                className={`admin-tab-btn ${activeTab === 'builder' ? 'active' : ''}`}
                onClick={() => setActiveTab('builder')}
              >
                🛠️ Form Builder
              </button>
              <button
                type="button"
                className={`admin-tab-btn ${activeTab === 'dropdowns' ? 'active' : ''}`}
                onClick={() => setActiveTab('dropdowns')}
              >
                📑 Dropdown Options
              </button>
              <button
                type="button"
                className={`admin-tab-btn ${activeTab === 'appearance' ? 'active' : ''}`}
                onClick={() => setActiveTab('appearance')}
              >
                🎨 Appearance & Copy
              </button>
              <button
                type="button"
                className={`admin-tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
                onClick={() => setActiveTab('preview')}
              >
                👁️ Live Preview & History
              </button>
            </nav>

            {loadingConfig || !draft ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#71717A' }}>
                <IonSpinner name="crescent" />
                <p>Loading form configuration...</p>
              </div>
            ) : (
              <>
                {/* 1. OVERVIEW TAB */}
                {activeTab === 'overview' && (
                  <div className="admin-card">
                    <div className="admin-card-header">
                      <div>
                        <h2 className="admin-card-title">Configuration Status</h2>
                        <p className="admin-card-desc">
                          Overview of active published form and current working draft.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn-field-action"
                        onClick={() => setIsHistoryOpen(true)}
                      >
                        View Version History
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                      <div className="preview-diff-card">
                        <div className="preview-diff-title">Working Draft</div>
                        <div className="preview-diff-item">
                          Version: <strong>v{draft.version}</strong>
                        </div>
                        <div className="preview-diff-item">
                          Total Configured Fields: <strong>{draft.fields.length}</strong>
                        </div>
                        <div className="preview-diff-item">
                          Visible on Public Form: <strong>{draft.fields.filter((f) => f.is_visible).length}</strong>
                        </div>
                      </div>

                      <div className="preview-diff-card">
                        <div className="preview-diff-title">Custom Extensibility</div>
                        <div className="preview-diff-item">
                          Core CRM Fields: <strong>{draft.fields.filter((f) => f.is_core).length}</strong>
                        </div>
                        <div className="preview-diff-item">
                          Custom Fields: <strong>{draft.fields.filter((f) => !f.is_core).length}</strong>
                        </div>
                        <div className="preview-diff-item">
                          Dropdowns Configured: <strong>{draft.fields.filter((f) => f.type === 'dropdown').length}</strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                      <button
                        type="button"
                        className="btn-submit"
                        style={{ height: 44, minHeight: 44, width: 'auto', padding: '0 20px' }}
                        onClick={() => setActiveTab('builder')}
                      >
                        Open Form Builder
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. FORM BUILDER TAB */}
                {activeTab === 'builder' && (
                  <div className="admin-card">
                    <div className="admin-card-header">
                      <div>
                        <h2 className="admin-card-title">Form Field Management</h2>
                        <p className="admin-card-desc">
                          Reorder fields, customize labels, adjust visibility, and create custom input fields.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="admin-submit-btn"
                        style={{ width: 'auto', padding: '0 18px', height: 40 }}
                        onClick={handleAddNewCustomField}
                      >
                        + Add Custom Field
                      </button>
                    </div>

                    <div className="fields-list-container">
                      {draft.fields.map((field, idx) => (
                        <div
                          key={field.id}
                          className={`field-config-item ${!field.is_visible ? 'hidden-field' : ''}`}
                        >
                          <div className="field-left-col">
                            <div className="reorder-btns-col">
                              <button
                                type="button"
                                className="btn-arrow"
                                disabled={idx === 0}
                                onClick={() => handleMoveField(idx, 'up')}
                                title="Move field up"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                className="btn-arrow"
                                disabled={idx === draft.fields.length - 1}
                                onClick={() => handleMoveField(idx, 'down')}
                                title="Move field down"
                              >
                                ▼
                              </button>
                            </div>

                            <div className="field-meta-info">
                              <div className="field-main-label">
                                {field.label}
                                <span className={`badge-tag ${field.is_core ? 'badge-core' : 'badge-custom'}`}>
                                  {field.is_core ? 'Core' : 'Custom'}
                                </span>
                                <span className={`badge-tag ${field.required ? 'badge-required' : 'badge-optional'}`}>
                                  {field.required ? 'Required' : 'Optional'}
                                </span>
                                <span className="badge-tag badge-optional">
                                  {field.type}
                                </span>
                                {!field.is_visible && (
                                  <span className="badge-tag" style={{ background: '#E4E4E7', color: '#52525B' }}>
                                    Hidden
                                  </span>
                                )}
                              </div>
                              <span className="field-sub-key">
                                key: {field.key} {field.placeholder && `• placeholder: "${field.placeholder}"`}
                              </span>
                            </div>
                          </div>

                          <div className="field-actions-col">
                            <button
                              type="button"
                              className="btn-field-action"
                              onClick={() => setEditingField(field)}
                            >
                              Configure
                            </button>

                            {!(field.key === 'name' || field.key === 'phone') && (
                              <button
                                type="button"
                                className="btn-field-action"
                                onClick={() => handleToggleFieldVisibility(field.id)}
                              >
                                {field.is_visible ? 'Hide' : 'Show'}
                              </button>
                            )}

                            {!field.is_core && (
                              <button
                                type="button"
                                className="btn-field-action btn-field-delete"
                                onClick={() => handleDeleteField(field.id)}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. DROPDOWN OPTIONS TAB */}
                {activeTab === 'dropdowns' && (
                  <div className="admin-card">
                    <div className="admin-card-header">
                      <div>
                        <h2 className="admin-card-title">Dropdown Choices Manager</h2>
                        <p className="admin-card-desc">
                          Add or remove selectable choices for Home Type and custom dropdowns.
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                      {draft.fields
                        .filter((f) => f.type === 'dropdown')
                        .map((field) => (
                          <div key={field.id} className="preview-diff-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#09090B' }}>
                                {field.label} ({field.key})
                              </h3>
                              <button
                                type="button"
                                className="btn-field-action"
                                onClick={() => setEditingField(field)}
                              >
                                Edit Choices
                              </button>
                            </div>

                            <div className="options-chip-container">
                              {(field.options || []).map((opt, i) => (
                                <span key={i} className="option-chip">
                                  {opt}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* 4. APPEARANCE & COPY TAB */}
                {activeTab === 'appearance' && (
                  <div className="admin-card">
                    <div className="admin-card-header">
                      <div>
                        <h2 className="admin-card-title">Copy & Appearance Settings</h2>
                        <p className="admin-card-desc">
                          Customize header titles, action button text, and toast confirmations.
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                      <div className="form-field-group">
                        <label className="field-label">Form Title</label>
                        <input
                          type="text"
                          className="custom-input"
                          value={draft.title}
                          onChange={(e) => {
                            setDraft({ ...draft, title: e.target.value });
                            setHasUnsavedChanges(true);
                          }}
                        />
                      </div>

                      <div className="form-field-group">
                        <label className="field-label">Form Subtitle</label>
                        <input
                          type="text"
                          className="custom-input"
                          value={draft.subtitle}
                          onChange={(e) => {
                            setDraft({ ...draft, subtitle: e.target.value });
                            setHasUnsavedChanges(true);
                          }}
                        />
                      </div>

                      <div className="form-field-group">
                        <label className="field-label">Submit Button Label</label>
                        <input
                          type="text"
                          className="custom-input"
                          value={draft.submit_button_text}
                          onChange={(e) => {
                            setDraft({ ...draft, submit_button_text: e.target.value });
                            setHasUnsavedChanges(true);
                          }}
                        />
                      </div>

                      <div className="form-field-group">
                        <label className="field-label">Success Confirmation Message</label>
                        <input
                          type="text"
                          className="custom-input"
                          value={draft.success_message}
                          onChange={(e) => {
                            setDraft({ ...draft, success_message: e.target.value });
                            setHasUnsavedChanges(true);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. LIVE PREVIEW & VERSION HISTORY TAB */}
                {activeTab === 'preview' && (
                  <div className="admin-card">
                    <div className="admin-card-header">
                      <div>
                        <h2 className="admin-card-title">Draft Preview & Publishing</h2>
                        <p className="admin-card-desc">
                          Inspect the exact layout public visitors will see before publishing.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn-field-action"
                        onClick={() => setIsHistoryOpen(true)}
                      >
                        Version History & Rollback
                      </button>
                    </div>

                    <div className="preview-split-grid">
                      <div className="preview-sidebar">
                        <div className="preview-diff-card">
                          <div className="preview-diff-title">Publish Summary</div>
                          <div className="preview-diff-item">
                            Target Version: <strong>v{draft.version}</strong>
                          </div>
                          <div className="preview-diff-item">
                            Active Fields: <strong>{draft.fields.filter((f) => f.is_visible).length} visible</strong>
                          </div>
                          <div className="preview-diff-item">
                            Custom Answers: Stored safely in <code>custom_data</code> JSONB.
                          </div>

                          <div style={{ marginTop: 20 }}>
                            <button
                              type="button"
                              className="btn-submit"
                              style={{ width: '100%', height: 48 }}
                              disabled={isPublishing}
                              onClick={handlePublish}
                            >
                              {isPublishing ? 'Publishing...' : 'Publish to Live Public Site'}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="preview-viewport">
                        <div className="lead-form-card" style={{ maxWidth: '100%' }}>
                          <div className="card-header">
                            <h1 className="card-title">{draft.title}</h1>
                            <p className="card-subtitle">{draft.subtitle}</p>
                          </div>

                          <div className="form-grid">
                            {draft.fields
                              .filter((f) => f.is_visible)
                              .map((f) => (
                                <div key={f.id} className="form-field-group">
                                  <label className="field-label">
                                    {f.label} {f.required && <span className="required-asterisk">*</span>}
                                  </label>

                                  {f.type === 'dropdown' ? (
                                    <select className="custom-input" disabled>
                                      <option>{f.placeholder || `Select ${f.label}`}</option>
                                      {(f.options || []).map((opt, i) => (
                                        <option key={i}>{opt}</option>
                                      ))}
                                    </select>
                                  ) : f.type === 'textarea' ? (
                                    <textarea
                                      className="custom-textarea"
                                      placeholder={f.placeholder}
                                      disabled
                                      style={{ height: 80 }}
                                    />
                                  ) : f.type === 'checkbox' ? (
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                                      <input type="checkbox" disabled />
                                      <span>{f.placeholder || f.label}</span>
                                    </label>
                                  ) : (
                                    <input
                                      type={f.type === 'number' ? 'number' : f.type === 'email' ? 'email' : 'text'}
                                      className="custom-input"
                                      placeholder={f.placeholder}
                                      disabled
                                    />
                                  )}

                                  {f.description && (
                                    <span style={{ fontSize: 12, color: '#71717A' }}>{f.description}</span>
                                  )}
                                </div>
                              ))}
                          </div>

                          <div className="form-actions" style={{ marginTop: 20 }}>
                            <button type="button" className="btn-submit" disabled>
                              <span>{draft.submit_button_text}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Field Editor Modal */}
            {editingField && (
              <FieldEditorModal
                field={editingField}
                isOpen={Boolean(editingField)}
                onSave={handleSaveFieldConfig}
                onClose={() => setEditingField(null)}
              />
            )}

            {/* Version History & Rollback Modal */}
            {isHistoryOpen && draft?.id && (
              <VersionHistoryModal
                currentDraftId={draft.id}
                isOpen={isHistoryOpen}
                onRestoreSuccess={() => {
                  showToast('Version restored to draft successfully.');
                  loadDraft();
                }}
                onClose={() => setIsHistoryOpen(false)}
              />
            )}
          </div>
        </AdminAuthGate>
      </IonContent>
    </IonPage>
  );
};

export default AdminDashboard;
