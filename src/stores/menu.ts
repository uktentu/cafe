// Public-menu UI state (client). Holds the open item, the global dietary
// filter, the active category, and a "jump" channel so the thumb dock can
// drive any template's category navigation (scroll OR tab) generically.
import { create } from 'zustand'
import type { Item, DietaryPreference } from '@/types/database'

export type DietaryFilter = 'all' | DietaryPreference

interface MenuState {
  // Detail modal
  selectedItem: Item | null
  openItem: (item: Item) => void
  closeItem: () => void

  // Global dietary filter (applied centrally in MenuContent)
  dietary: DietaryFilter
  setDietary: (d: DietaryFilter) => void

  // Active category (written by layouts' scroll-spy / tab clicks; read by dock)
  activeCategoryId: string | null
  setActiveCategoryId: (id: string | null) => void

  // Jump channel — dock requests a category; the active layout reacts
  // (scroll layouts scrollIntoView, tab layouts switch tab). Nonce forces
  // re-fire even when the same id is requested twice.
  jumpTarget: { id: string; nonce: number } | null
  requestJump: (id: string) => void
}

let _nonce = 0

export const useMenuStore = create<MenuState>((set) => ({
  selectedItem: null,
  openItem: (item) => set({ selectedItem: item }),
  closeItem: () => set({ selectedItem: null }),

  dietary: 'all',
  setDietary: (d) => set({ dietary: d }),

  activeCategoryId: null,
  setActiveCategoryId: (id) => set({ activeCategoryId: id }),

  jumpTarget: null,
  requestJump: (id) => set({ jumpTarget: { id, nonce: ++_nonce } }),
}))
