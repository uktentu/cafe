// Resolves a category's Lucide icon name (stored in categories.icon) to a
// component. A small curated map keeps the first-load bundle lean vs. importing
// all of lucide. Falls back to UtensilsCrossed. Used as the left anchor in
// text-only cards.
import {
  Soup, UtensilsCrossed, CupSoda, Coffee, Pizza, Salad,
  type LucideIcon,
} from 'lucide-react'

const ICONS: Record<string, LucideIcon> = {
  Soup, UtensilsCrossed, CupSoda, Coffee, Pizza, Salad,
}

export function getCategoryIcon(name: string | null | undefined): LucideIcon {
  if (name && ICONS[name]) return ICONS[name]
  return UtensilsCrossed
}

/** Icon names available in the CMS category picker. */
export const CATEGORY_ICON_NAMES = Object.keys(ICONS)
