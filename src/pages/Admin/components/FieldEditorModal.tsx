import React, { useState } from 'react';
import { FormFieldConfig, FormFieldType } from '../../../types/formConfig';

interface FieldEditorModalProps {
  field: FormFieldConfig;
  isOpen: boolean;
  onSave: (updatedField: FormFieldConfig) => void;
  onClose: () => void;
}

export const FieldEditorModal: React.FC<FieldEditorModalProps> = ({
  field,
  isOpen,
  onSave,
  onClose,
}) => {
  const [label, setLabel] = useState(field.label);
  const [type, setType] = useState<FormFieldType>(field.type);
  const [placeholder, setPlaceholder] = useState(field.placeholder || '');
  const [description, setDescription] = useState(field.description || '');
  const [required, setRequired] = useState(field.required);
  const [isVisible, setIsVisible] = useState(field.is_visible);
  const [options, setOptions] = useState<string[]>(field.options || []);
  const [newOption, setNewOption] = useState('');

  if (!isOpen) return null;

  const handleAddOption = () => {
    const val = newOption.trim();
    if (val && !options.includes(val)) {
      setOptions([...options, val]);
      setNewOption('');
    }
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...field,
      label: label.trim() || field.label,
      type: field.is_core ? field.type : type,
      placeholder: placeholder.trim(),
      description: description.trim(),
      required: field.key === 'name' || field.key === 'phone' ? true : required,
      is_visible: field.key === 'name' || field.key === 'phone' ? true : isVisible,
      options: type === 'dropdown' ? options : undefined,
    });
    onClose();
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div>
            <h3 className="admin-modal-title">
              {field.is_core ? `Configure Core Field: ${field.label}` : 'Edit Custom Field'}
            </h3>
            <p className="admin-modal-subtitle">
              Internal Key: <code>{field.key}</code>
            </p>
          </div>
          <button type="button" className="admin-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="admin-modal-form">
          <div className="form-field-group">
            <label className="field-label">Field Label *</label>
            <input
              type="text"
              className="custom-input"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
            />
          </div>

          {!field.is_core && (
            <div className="form-field-group">
              <label className="field-label">Field Type</label>
              <select
                className="custom-input"
                value={type}
                onChange={(e) => setType(e.target.value as FormFieldType)}
              >
                <option value="text">Short Text</option>
                <option value="textarea">Long Text (Textarea)</option>
                <option value="number">Number</option>
                <option value="email">Email</option>
                <option value="dropdown">Dropdown Selection</option>
                <option value="checkbox">Checkbox (Yes/No)</option>
              </select>
            </div>
          )}

          {type !== 'checkbox' && (
            <div className="form-field-group">
              <label className="field-label">Placeholder Text</label>
              <input
                type="text"
                className="custom-input"
                value={placeholder}
                onChange={(e) => setPlaceholder(e.target.value)}
                placeholder="e.g. Enter details..."
              />
            </div>
          )}

          <div className="form-field-group">
            <label className="field-label">Help Description (Optional)</label>
            <input
              type="text"
              className="custom-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Appears below the field"
            />
          </div>

          {type === 'dropdown' && (
            <div className="form-field-group">
              <label className="field-label">Dropdown Choices</label>
              <div className="options-input-group">
                <input
                  type="text"
                  className="custom-input"
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  placeholder="Add option..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddOption();
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn-add-option"
                  onClick={handleAddOption}
                >
                  Add
                </button>
              </div>

              <div className="options-chip-container">
                {options.map((opt, i) => (
                  <span key={i} className="option-chip">
                    {opt}
                    <button
                      type="button"
                      className="chip-remove-btn"
                      onClick={() => handleRemoveOption(i)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="admin-toggle-row">
            <label className="admin-checkbox-label">
              <input
                type="checkbox"
                checked={required}
                disabled={field.key === 'name' || field.key === 'phone'}
                onChange={(e) => setRequired(e.target.checked)}
              />
              <span>Mark as Required field</span>
            </label>

            <label className="admin-checkbox-label">
              <input
                type="checkbox"
                checked={isVisible}
                disabled={field.key === 'name' || field.key === 'phone'}
                onChange={(e) => setIsVisible(e.target.checked)}
              />
              <span>Visible on Public Form</span>
            </label>
          </div>

          <div className="admin-modal-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="admin-submit-btn" style={{ width: 'auto', padding: '0 24px' }}>
              Save Field Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
