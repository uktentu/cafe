import { z } from 'zod'

export const reservationSchema = z.object({
  business_id: z.string().uuid(),
  branch_id: z.string().uuid().optional().nullable(),
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  phone: z.string().min(5, 'Phone is required').max(20, 'Phone is too long'),
  email: z.string().email('Invalid email').max(150, 'Email is too long').optional().nullable().or(z.literal('')),
  party_size: z.number().int().min(1, 'Minimum party size is 1').max(50, 'Party size exceeds maximum allowed'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  notes: z.string().max(500, 'Notes must be under 500 characters').optional().nullable(),
  turnstileToken: z.string().min(1, 'Turnstile token is required'),
})

export const analyticsEventSchema = z.object({
  business_id: z.string().uuid(),
  event_type: z.enum(['page_view', 'item_click', 'category_click', 'reservation_click']),
  item_id: z.string().uuid().optional().nullable(),
  session_id: z.string().max(100).optional().nullable(),
})
