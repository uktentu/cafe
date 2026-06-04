// Zustand store for ephemeral CMS UI state (not server data — that's TanStack
// Query). Branch switching, drag state, mobile drawer, toasts.
import { create } from 'zustand'

export interface Toast {
  id: string
  message: string
  variant: 'success' | 'error' | 'info'
}

interface CmsState {
  activeBranchId: string | null
  setActiveBranch: (id: string | null) => void

  isDragging: boolean
  setDragging: (v: boolean) => void

  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebar: (v: boolean) => void

  toasts: Toast[]
  pushToast: (message: string, variant?: Toast['variant']) => void
  dismissToast: (id: string) => void
}

export const useCmsStore = create<CmsState>((set) => ({
  activeBranchId: null,
  setActiveBranch: (id) => set({ activeBranchId: id }),

  isDragging: false,
  setDragging: (v) => set({ isDragging: v }),

  sidebarOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebar: (v) => set({ sidebarOpen: v }),

  toasts: [],
  pushToast: (message, variant = 'success') => {
    const id = Math.random().toString(36).slice(2)
    set((s) => ({ toasts: [...s.toasts, { id, message, variant }] }))
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
      }, 3500)
    }
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
