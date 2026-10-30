export type FormFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'dropdown'
  | 'checkbox'
  | 'tel';

export interface FormFieldConfig {
  id: string;
  key: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  description?: string;
  options?: string[];
  required: boolean;
  is_core: boolean;
  is_visible: boolean;
  order: number;
}

export interface FormAppearance {
  accentColor?: string;
  density?: 'compact' | 'comfortable';
}

export interface FormConfig {
  id?: number;
  version: number;
  status: 'draft' | 'published' | 'archived';
  is_active: boolean;
  title: string;
  subtitle: string;
  submit_button_text: string;
  success_message: string;
  fields: FormFieldConfig[];
  appearance: FormAppearance;
  created_at?: string;
  published_at?: string | null;
}

export const DEFAULT_FORM_FIELDS: FormFieldConfig[] = [
  {
    id: 'core_name',
    key: 'name',
    type: 'text',
    label: 'Full Name',
    placeholder: 'Enter full name',
    description: '',
    required: true,
    is_core: true,
    is_visible: true,
    order: 0,
  },
  {
    id: 'core_phone',
    key: 'phone',
    type: 'tel',
    label: 'Phone Number',
    placeholder: 'Enter phone number',
    description: '',
    required: true,
    is_core: true,
    is_visible: true,
    order: 1,
  },
  {
    id: 'core_home_type',
    key: 'home_type',
    type: 'dropdown',
    label: 'Home Type',
    placeholder: 'Select home type',
    options: [
      '2BHK',
      '3BHK',
      // '4BHK',
      // 'Villa',
      // 'Open Land',
      // 'Commercial Properties',
    ],
    required: true,
    is_core: true,
    is_visible: true,
    order: 2,
  },
  {
    id: 'core_email',
    key: 'email',
    type: 'email',
    label: 'Email',
    placeholder: 'Enter email (optional)',
    description: '',
    required: false,
    is_core: true,
    is_visible: true,
    order: 3,
  },
  {
    id: 'core_notes',
    key: 'notes',
    type: 'textarea',
    label: 'Notes',
    placeholder: 'Add notes (optional)',
    description: '',
    required: false,
    is_core: true,
    is_visible: true,
    order: 4,
  },
];

export const DEFAULT_FORM_CONFIG: FormConfig = {
  version: 1,
  status: 'published',
  is_active: true,
  title: 'Fill your details to get project info',
  subtitle: 'Enter your details below',
  submit_button_text: 'Review Details',
  success_message: 'Lead Saved',
  fields: DEFAULT_FORM_FIELDS,
  appearance: {
    accentColor: '#16A34A',
    density: 'comfortable',
  },
};
