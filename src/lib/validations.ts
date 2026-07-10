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

export const orderItemInputSchema = z.object({
  item_id: z.string().uuid(),
  qty: z.number().int().min(1, 'Quantity must be at least 1').max(20, 'Quantity exceeds maximum allowed'),
  note: z.string().max(200, 'Note is too long').optional().nullable(),
  selected_add_on_ids: z.array(z.string()).max(10).optional(),
})

export const orderSchema = z.object({
  business_id: z.string().uuid(),
  // The table's random qr_token (migration 011) — never the guessable
  // friendly code, so a tampered ?t= can't attach orders to another table.
  table_token: z.string().uuid().optional().nullable(),
  branch_id: z.string().uuid().optional().nullable(),
  order_type: z.enum(['dine_in', 'takeaway', 'counter']).default('dine_in'),
  customer_name: z.string().max(100).optional().nullable(),
  customer_phone: z.string().max(20).optional().nullable(),
  items: z.array(orderItemInputSchema).min(1, 'Add at least one item').max(50, 'Too many items in one order'),
  turnstileToken: z.string().optional(),
})

export const analyticsEventSchema = z.object({
  business_id: z.string().uuid(),
  event_type: z.enum(['page_view', 'item_click', 'category_click', 'reservation_click']),
  item_id: z.string().uuid().optional().nullable(),
  session_id: z.string().max(100).optional().nullable(),
})
