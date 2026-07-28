import { z } from 'zod';

export interface Lead {
  id: number;
  name: string;
  phone: string;
  home_type: string;
  email: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export const HOME_TYPES = [
  '2BHK',
  '3BHK',
  '4BHK',
  'Villa',
] as const;

export const leadFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be under 100 characters'),
  phone: z
    .string()
    .min(1, 'Phone is required')
    .regex(/^[0-9]{10}$/, 'Phone must be a 10-digit number'),
  home_type: z
    .string()
    .min(1, 'Home type is required'),
  email: z
    .string()
    .email('Enter a valid email')
    .or(z.literal('')),
  notes: z
    .string()
    .max(500, 'Notes must be under 500 characters'),
});

export type LeadFormInput = z.infer<typeof leadFormSchema>;
