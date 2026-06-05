'use client'

import React from 'react'
import type { Branch, Theme } from '@/types/database'
import { MapPin } from 'lucide-react'
import { useMenuStore } from '@/stores/menu'

export function BranchSelector({ branches, theme = 'mercado' }: { branches: Branch[], theme?: Theme }) {
  const selectedBranchId = useMenuStore(s => s.selectedBranchId)
  const setSelectedBranchId = useMenuStore(s => s.setSelectedBranchId)

  if (!branches || branches.length <= 1) return null

  const isArcade = theme === 'arcade'
  const isOnyx = theme === 'onyx'
  const isSakura = theme === 'sakura'
  const isProvenance = theme === 'provenance'

  const radiusClass = (isArcade || isOnyx || isProvenance) ? 'rounded-none' : isSakura ? 'rounded-[32px]' : 'rounded-full'

  return (
    <div className="px-4 py-2 mt-4 flex items-center justify-center">
      <div 
        className={`flex items-center gap-2 px-4 py-2 border shadow-sm ${radiusClass} ${isArcade ? 'arcade-font uppercase border-2' : ''}`}
        style={{ 
          background: 'var(--glass)', 
          borderColor: isArcade ? 'var(--txt)' : 'var(--border)', 
          color: 'var(--txt)',
          backdropFilter: 'blur(12px)',
          fontFamily: isArcade ? undefined : 'var(--font-body)'
        }}
      >
        <MapPin className="w-4 h-4 opacity-70" />
        <select 
          className={`bg-transparent font-medium outline-none cursor-pointer appearance-none pr-4 ${isArcade ? 'text-[9px]' : 'text-sm'}`}
          style={{ color: 'var(--txt)' }}
          value={selectedBranchId || ''}
          onChange={(e) => setSelectedBranchId(e.target.value)}
        >
          <option value="">Select a branch...</option>
          {branches.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
