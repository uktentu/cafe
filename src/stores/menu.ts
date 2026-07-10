// Public-menu UI state (client). Holds the open item, the global dietary
// filter, the active category, cart, and a "jump" channel so the thumb dock
// can drive any template's category navigation generically.
import { create } from 'zustand'
import type { Item, DietaryPreference, AddOn } from '@/types/database'

export type DietaryFilter = 'all' | DietaryPreference

export interface CartItem {
  item: Item
  qty: number
  selectedAddOns: AddOn[]
  note: string
}

interface MenuState {
  // Detail modal
  selectedItem: Item | null
  openItem: (item: Item) => void
  closeItem: () => void

  // Reservation modal
  reservationModalOpen: boolean
  setReservationModal: (open: boolean) => void

  // Global dietary filter (applied centrally in MenuContent)
  dietary: DietaryFilter
  setDietary: (d: DietaryFilter) => void

  // Branch Selection
  selectedBranchId: string | null
  setSelectedBranchId: (id: string | null) => void

  // Active category (written by layouts' scroll-spy / tab clicks; read by dock)
  activeCategoryId: string | null
  setActiveCategoryId: (id: string | null) => void

  // Jump channel — dock requests a category; the active layout reacts
  jumpTarget: { id: string; nonce: number } | null
  requestJump: (id: string) => void

  // Cart
  cart: CartItem[]
  cartOpen: boolean
  setCartOpen: (open: boolean) => void
  addToCart: (item: Item, addOns?: AddOn[], note?: string) => void
  removeFromCart: (itemId: string) => void
  updateQty: (itemId: string, qty: number) => void
  clearCart: () => void
  cartTotal: () => number
  cartCount: () => number

  // Active in-app POS order (set after placing an order from the themed cart).
  // Shared so CartButton can flip to a "track order" state and CartDrawer can
  // show the live status view. Hydrated from localStorage by MenuLayoutClient.
  activeOrder: { orderId: string; token: string } | null
  setActiveOrder: (o: { orderId: string; token: string } | null) => void
}

let _nonce = 0

export const useMenuStore = create<MenuState>((set, get) => ({
  selectedItem: null,
  openItem: (item) => set({ selectedItem: item }),
  closeItem: () => set({ selectedItem: null }),

  reservationModalOpen: false,
  setReservationModal: (open) => set({ reservationModalOpen: open }),

  dietary: 'all',
  setDietary: (d) => set({ dietary: d }),

  selectedBranchId: null,
  setSelectedBranchId: (id) => set({ selectedBranchId: id }),

  activeCategoryId: null,
  setActiveCategoryId: (id) => set({ activeCategoryId: id }),

  jumpTarget: null,
  requestJump: (id) => set({ jumpTarget: { id, nonce: ++_nonce } }),

  cart: [],
  cartOpen: false,
  setCartOpen: (open) => set({ cartOpen: open }),

  addToCart: (item, addOns = [], note = '') => {
    set((s) => {
      const existing = s.cart.find((c) => c.item.id === item.id)
      if (existing) {
        if (existing.qty >= 20) return s
        return {
          cart: s.cart.map((c) =>
            c.item.id === item.id ? { ...c, qty: c.qty + 1 } : c
          ),
        }
      }
      return { cart: [...s.cart, { item, qty: 1, selectedAddOns: addOns, note }] }
    })
  },

  removeFromCart: (itemId) =>
    set((s) => ({ cart: s.cart.filter((c) => c.item.id !== itemId) })),

  updateQty: (itemId, qty) =>
    set((s) => ({
      cart: qty <= 0
        ? s.cart.filter((c) => c.item.id !== itemId)
        : s.cart.map((c) => (c.item.id === itemId ? { ...c, qty: Math.min(qty, 20) } : c)),
    })),

  clearCart: () => set({ cart: [] }),

  activeOrder: null,
  setActiveOrder: (o) => set({ activeOrder: o }),

  cartTotal: () => {
    const { cart } = get()
    return cart.reduce((sum, c) => {
      const addOnTotal = c.selectedAddOns.reduce((a, ao) => a + ao.price, 0)
      return sum + (c.item.price + addOnTotal) * c.qty
    }, 0)
  },

  cartCount: () => get().cart.reduce((sum, c) => sum + c.qty, 0),
}))
