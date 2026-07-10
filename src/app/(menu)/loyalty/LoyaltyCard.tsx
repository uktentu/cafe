'use client'

import { useState, useEffect } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { Star, Gift, Share2 } from 'lucide-react'

interface Props {
  businessId: string
  businessName: string
  whatsapp: string
  themeColor: string
  stampsNeeded: number
  reward: string
}

const STORAGE_KEY = (bizId: string) => `loyalty_${bizId}`

export function LoyaltyCard({ businessId, businessName, whatsapp, themeColor, stampsNeeded, reward }: Props) {
  const [stamps, setStamps] = useState(0)
  const [earned, setEarned] = useState(false)
  const [justStamped, setJustStamped] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY(businessId))
      if (stored) {
        const { count, earnedAt } = JSON.parse(stored)
        if (earnedAt) { setEarned(true); setStamps(stampsNeeded) }
        else setStamps(Math.min(count ?? 0, stampsNeeded))
      }
    } catch { /* ignore */ }
  }, [businessId, stampsNeeded])

  function requestStamp() {
    if (earned) return
    setShowPinModal(true)
    setPinInput('')
    setPinError(false)
  }

  function verifyPin(pin: string) {
    const expectedPin = process.env.NEXT_PUBLIC_LOYALTY_PIN || '1234'
    if (pin === expectedPin) {
      setShowPinModal(false)
      addStamp()
    } else {
      setPinError(true)
      setPinInput('')
    }
  }

  function addStamp() {
    if (earned) return
    const next = stamps + 1
    const nowEarned = next >= stampsNeeded
    setStamps(nowEarned ? stampsNeeded : next)
    setJustStamped(true)
    setTimeout(() => setJustStamped(false), 800)
    try {
      localStorage.setItem(STORAGE_KEY(businessId), JSON.stringify({
        count: next,
        earnedAt: nowEarned ? new Date().toISOString() : null,
      }))
    } catch { /* ignore */ }
    if (nowEarned) setTimeout(() => setEarned(true), 400)
  }

  function resetCard() {
    setStamps(0)
    setEarned(false)
    try { localStorage.removeItem(STORAGE_KEY(businessId)) } catch { /* ignore */ }
  }

  function claimReward() {
    const msg = `Hi ${businessName}! I've collected ${stampsNeeded} stamps on my loyalty card and I'd like to claim my free reward.`
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener')
  }

  function shareCard() {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({ title: `${businessName} Loyalty Card`, url }).catch(() => {})
    } else {
      navigator.clipboard?.writeText(url)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start px-4 pt-10 pb-20"
      style={{ background: `linear-gradient(135deg, ${themeColor}18 0%, transparent 60%)` }}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div
          className="inline-flex items-center justify-center h-16 w-16 rounded-2xl mb-4 shadow-lg"
          style={{ background: themeColor }}
        >
          <Gift className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{businessName}</h1>
        <p className="text-sm text-neutral-500 mt-1">Loyalty Rewards Card</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl overflow-hidden">
        {/* Progress header */}
        <div className="px-6 pt-6 pb-4" style={{ borderBottom: '1px solid var(--bdr, #e5e7eb)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              {earned ? '🎉 Reward earned!' : `${stamps} / ${stampsNeeded} stamps`}
            </span>
            <span className="text-xs text-neutral-400">
              {earned ? 'Claim on your next visit' : `${stampsNeeded - stamps} more to go`}
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
            <m.div
              className="h-full rounded-full"
              style={{ background: themeColor }}
              initial={{ width: 0 }}
              animate={{ width: `${(stamps / stampsNeeded) * 100}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
          </div>
        </div>

        {/* Stamp grid */}
        <div className="px-6 py-5">
          <div className="grid grid-cols-5 gap-3">
            {Array.from({ length: stampsNeeded }).map((_, i) => {
              const filled = i < stamps
              return (
                <m.div
                  key={i}
                  className="aspect-square rounded-xl flex items-center justify-center border-2 relative overflow-hidden"
                  style={{
                    borderColor: filled ? themeColor : '#E5E7EB',
                    background: filled ? `${themeColor}18` : 'transparent',
                  }}
                  animate={justStamped && i === stamps - 1 ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.4 }}
                >
                  {filled && (
                    <m.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    >
                      <Star className="h-5 w-5" style={{ color: themeColor, fill: themeColor }} />
                    </m.div>
                  )}
                  {!filled && (
                    <span className="text-xs font-bold text-neutral-300">{i + 1}</span>
                  )}
                </m.div>
              )
            })}
          </div>

          <p className="mt-4 text-center text-xs text-neutral-400">
            Collect {stampsNeeded} stamps to earn <strong>{reward}</strong>
          </p>
        </div>

        {/* Action */}
        <div className="px-6 pb-6 space-y-2">
          <AnimatePresence mode="wait">
            {earned ? (
              <m.button
                key="claim"
                onClick={claimReward}
                className="w-full rounded-2xl py-3.5 font-bold text-white text-sm"
                style={{ background: '#25D366' }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileTap={{ scale: 0.97 }}
              >
                🎁 Claim Reward on WhatsApp
              </m.button>
            ) : (
              <m.button
                key="stamp"
                onClick={requestStamp}
                className="w-full rounded-2xl py-3.5 font-bold text-white text-sm"
                style={{ background: themeColor }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileTap={{ scale: 0.97 }}
              >
                {justStamped ? '✓ Stamp added!' : 'Add Stamp — Tap after each visit'}
              </m.button>
            )}
          </AnimatePresence>

          <div className="flex gap-2">
            <button
              onClick={shareCard}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-medium border"
              style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
            >
              <Share2 className="h-3.5 w-3.5" />
              Share card
            </button>
            {earned && (
              <button
                onClick={resetCard}
                className="flex-1 rounded-xl py-2.5 text-xs font-medium border"
                style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
              >
                Start new card
              </button>
            )}
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-neutral-400 max-w-xs">
        Your stamps are saved on this device. Show your card at checkout on your next visit.
      </p>

      {/* Staff Verification PIN Modal */}
      <AnimatePresence>
        {showPinModal && (
          <m.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <m.div
              className="bg-white dark:bg-neutral-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Staff Verification</h3>
                <p className="text-sm text-neutral-500 mt-1">Please hand your device to the staff to authorize this stamp.</p>
              </div>
              
              <div className="flex justify-center gap-3 mb-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-12 h-14 rounded-xl border-2 flex items-center justify-center text-xl font-bold ${
                      pinInput.length > i 
                        ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white' 
                        : pinError ? 'border-red-500 text-red-500' : 'border-neutral-200 dark:border-neutral-700 text-transparent'
                    }`}
                    style={{ borderColor: pinInput.length > i ? themeColor : undefined }}
                  >
                    {pinInput.length > i ? '•' : ''}
                  </div>
                ))}
              </div>

              {pinError && <p className="text-center text-red-500 text-sm mb-4">Incorrect PIN. Please try again.</p>}

              <div className="grid grid-cols-3 gap-2 mb-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    onClick={() => {
                      setPinError(false)
                      if (pinInput.length < 4) {
                        const newPin = pinInput + num
                        setPinInput(newPin)
                        if (newPin.length === 4) verifyPin(newPin)
                      }
                    }}
                    className="aspect-square rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xl font-medium active:scale-95 transition-transform text-neutral-900 dark:text-white"
                  >
                    {num}
                  </button>
                ))}
                <div />
                <button
                  onClick={() => {
                    setPinError(false)
                    if (pinInput.length < 4) {
                      const newPin = pinInput + '0'
                      setPinInput(newPin)
                      if (newPin.length === 4) verifyPin(newPin)
                    }
                  }}
                  className="aspect-square rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xl font-medium active:scale-95 transition-transform text-neutral-900 dark:text-white"
                >
                  0
                </button>
                <button
                  onClick={() => setPinInput(prev => prev.slice(0, -1))}
                  className="aspect-square rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xl font-medium active:scale-95 transition-transform text-neutral-900 dark:text-white"
                >
                  ⌫
                </button>
              </div>

              <button
                onClick={() => setShowPinModal(false)}
                className="w-full py-3 text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}
