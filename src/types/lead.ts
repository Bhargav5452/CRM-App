import { z } from 'zod';

export interface Lead {
  id: number;
  name: string;
  phone: string;
  country_code: string;
  home_type: string;
  email: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface CountryCode {
  code: string;
  name: string;
  flag: string;
  iso: string;
  digits: number;
}

const RAW_COUNTRY_CODES: CountryCode[] = [
  { code: '+91', name: 'India', flag: '🇮🇳', iso: 'IN', digits: 10 },
  { code: '+1', name: 'United States', flag: '🇺🇸', iso: 'US', digits: 10 },
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧', iso: 'GB', digits: 10 },
  { code: '+971', name: 'United Arab Emirates', flag: '🇦🇪', iso: 'AE', digits: 9 },
  { code: '+65', name: 'Singapore', flag: '🇸🇬', iso: 'SG', digits: 8 },
  { code: '+1', name: 'Canada', flag: '🇨🇦', iso: 'CA', digits: 10 },
  { code: '+61', name: 'Australia', flag: '🇦🇺', iso: 'AU', digits: 9 },
  { code: '+49', name: 'Germany', flag: '🇩🇪', iso: 'DE', digits: 10 },
  { code: '+33', name: 'France', flag: '🇫🇷', iso: 'FR', digits: 9 },
  { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦', iso: 'SA', digits: 9 },
  { code: '+974', name: 'Qatar', flag: '🇶🇦', iso: 'QA', digits: 8 },
  { code: '+965', name: 'Kuwait', flag: '🇰🇼', iso: 'KW', digits: 8 },
  { code: '+968', name: 'Oman', flag: '🇴🇲', iso: 'OM', digits: 8 },
  { code: '+973', name: 'Bahrain', flag: '🇧🇭', iso: 'BH', digits: 8 },
  { code: '+60', name: 'Malaysia', flag: '🇲🇾', iso: 'MY', digits: 10 },
  { code: '+977', name: 'Nepal', flag: '🇳🇵', iso: 'NP', digits: 10 },
  { code: '+94', name: 'Sri Lanka', flag: '🇱🇰', iso: 'LK', digits: 9 },
  { code: '+880', name: 'Bangladesh', flag: '🇧🇩', iso: 'BD', digits: 10 },
  { code: '+92', name: 'Pakistan', flag: '🇵🇰', iso: 'PK', digits: 10 },
  { code: '+81', name: 'Japan', flag: '🇯🇵', iso: 'JP', digits: 10 },
  { code: '+86', name: 'China', flag: '🇨🇳', iso: 'CN', digits: 11 },
  { code: '+82', name: 'South Korea', flag: '🇰🇷', iso: 'KR', digits: 10 },
  { code: '+39', name: 'Italy', flag: '🇮🇹', iso: 'IT', digits: 10 },
  { code: '+34', name: 'Spain', flag: '🇪🇸', iso: 'ES', digits: 9 },
  { code: '+31', name: 'Netherlands', flag: '🇳🇱', iso: 'NL', digits: 9 },
  { code: '+41', name: 'Switzerland', flag: '🇨🇭', iso: 'CH', digits: 9 },
  { code: '+46', name: 'Sweden', flag: '🇸🇪', iso: 'SE', digits: 9 },
  { code: '+64', name: 'New Zealand', flag: '🇳🇿', iso: 'NZ', digits: 9 },
  { code: '+27', name: 'South Africa', flag: '🇿🇦', iso: 'ZA', digits: 9 },
  { code: '+55', name: 'Brazil', flag: '🇧🇷', iso: 'BR', digits: 11 },
  { code: '+52', name: 'Mexico', flag: '🇲🇽', iso: 'MX', digits: 10 },
  { code: '+7', name: 'Russia', flag: '🇷🇺', iso: 'RU', digits: 10 },
  { code: '+62', name: 'Indonesia', flag: '🇮🇩', iso: 'ID', digits: 11 },
  { code: '+63', name: 'Philippines', flag: '🇵🇭', iso: 'PH', digits: 10 },
  { code: '+84', name: 'Vietnam', flag: '🇻🇳', iso: 'VN', digits: 9 },
  { code: '+66', name: 'Thailand', flag: '🇹🇭', iso: 'TH', digits: 9 },
  { code: '+20', name: 'Egypt', flag: '🇪🇬', iso: 'EG', digits: 10 },
  { code: '+234', name: 'Nigeria', flag: '🇳🇬', iso: 'NG', digits: 10 },
  { code: '+254', name: 'Kenya', flag: '🇰🇪', iso: 'KE', digits: 9 },
];

// Sort alphabetically by country name
export const COUNTRY_CODES: CountryCode[] = [...RAW_COUNTRY_CODES].sort((a, b) =>
  a.name.localeCompare(b.name)
);

export const DEFAULT_COUNTRY_CODE: CountryCode =
  COUNTRY_CODES.find((c) => c.iso === 'IN') || COUNTRY_CODES[0];

export const getCountryByCode = (code: string): CountryCode => {
  if (code === '+1') {
    return COUNTRY_CODES.find((c) => c.iso === 'US') || DEFAULT_COUNTRY_CODE;
  }
  return COUNTRY_CODES.find((c) => c.code === code) || DEFAULT_COUNTRY_CODE;
};

export const HOME_TYPES = [
  '2BHK',
  '3BHK',
  '4BHK',
  'Villa',
  'Open Land',
  'Commercial Properties',
] as const;

export const leadFormSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name must be under 100 characters'),
    country_code: z.string().min(1, 'Country code is required'),
    phone: z
      .string()
      .min(1, 'Phone is required')
      .regex(/^[0-9]+$/, 'Phone must contain only numbers'),
    home_type: z.string().min(1, 'Home type is required'),
    email: z.string().email('Enter a valid email').or(z.literal('')),
    notes: z.string().max(300, 'Notes must be under 300 characters'),
  })
  .refine(
    (data) => {
      const country = getCountryByCode(data.country_code);
      const reqDigits = country ? country.digits : 10;
      return data.phone.length === reqDigits;
    },
    {
      message: 'Enter a valid phone number',
      path: ['phone'],
    }
  );

export type LeadFormInput = z.infer<typeof leadFormSchema>;

// ─────────────────────────────────────────────────────────────
// Advanced Filter System Types
// ─────────────────────────────────────────────────────────────

export type DateFilterOption =
  | 'all'
  | 'today'
  | 'yesterday'
  | 'week'
  | 'month'
  | 'lastMonth'
  | 'custom';

export interface FilterState {
  time: DateFilterOption;
  customFrom?: string; // YYYY-MM-DD
  customTo?: string;   // YYYY-MM-DD
}

export const DEFAULT_FILTER_STATE: FilterState = {
  time: 'today',
  customFrom: '',
  customTo: '',
};
