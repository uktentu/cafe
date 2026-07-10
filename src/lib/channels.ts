// Shared presentation for order channels — Swiggy/Zomato brand colours, labels.
import type { OrderChannel } from '@/types/database'

export const CHANNEL_META: Record<OrderChannel, { label: string; color: string; short: string }> = {
  direct: { label: 'Direct', color: '#6B7280', short: 'Direct' },
  swiggy: { label: 'Swiggy', color: '#FC8019', short: 'Swiggy' },
  zomato: { label: 'Zomato', color: '#E23744', short: 'Zomato' },
  phone: { label: 'Phone', color: '#3B82F6', short: 'Phone' },
}

export const CHANNEL_COLOR: Record<OrderChannel, string> = {
  direct: CHANNEL_META.direct.color,
  swiggy: CHANNEL_META.swiggy.color,
  zomato: CHANNEL_META.zomato.color,
  phone: CHANNEL_META.phone.color,
}
