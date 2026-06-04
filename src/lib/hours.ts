// Open/closed computation from businesses.opening_hours, evaluated in IST
// (our customers + restaurants are in India) regardless of server timezone.
import type { OpeningHours } from '@/types/database'

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

export interface OpenState {
  open: boolean
  /** Human label, e.g. "Open · closes 22:00" or "Closed · opens 09:00". */
  label: string
}

function nowInIST(): { dayIndex: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date())

  const wd = parts.find((p) => p.type === 'weekday')?.value ?? 'Sun'
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0') % 24
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0')
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  return { dayIndex: map[wd] ?? 0, minutes: hour * 60 + minute }
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

export function isOpenNow(hours: OpeningHours | null | undefined): OpenState {
  if (!hours) return { open: false, label: '' }
  const { dayIndex, minutes } = nowInIST()
  const today = hours[DAY_KEYS[dayIndex]]
  if (!today || today.closed) return { open: false, label: 'Closed today' }

  const open = toMinutes(today.open)
  let close = toMinutes(today.close)
  // Past-midnight close (e.g. 23:00 → 02:00) → extend the window.
  const overnight = close <= open
  if (overnight) close += 24 * 60

  const nowAdj = minutes < open && overnight ? minutes + 24 * 60 : minutes
  const isOpen = nowAdj >= open && nowAdj < close

  return {
    open: isOpen,
    label: isOpen ? `Open · closes ${today.close}` : `Closed · opens ${today.open}`,
  }
}
