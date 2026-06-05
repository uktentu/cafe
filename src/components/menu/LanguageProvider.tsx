'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { Translation, LocaleCode } from '@/types/database'
import { getConfig } from '@/lib/config'

type EntityType = 'item' | 'category' | 'business'

interface LanguageContextValue {
  primaryLocale: string
  secondaryLocale: string | null
  activeLocale: string
  setActiveLocale: (locale: string) => void
  t: (entityType: EntityType, entityId: string, field: string, fallback: string) => string
  tUi: (key: string, fallback: string) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

const UI_DICT: Record<string, Record<string, string>> = {
  'Bestsellers': { hi: 'बेस्टसेलर्स', es: 'Los más vendidos', ar: 'الأكثر مبيعاً', fr: 'Meilleures ventes' },
  'Sold Out': { hi: 'बिक गया', es: 'Agotado', ar: 'ننفذ', fr: 'Épuisé' },
  'Contains:': { hi: 'शामिल है:', es: 'Contiene:', ar: 'يحتوي على:', fr: 'Contient:' },
  'Order on WhatsApp': { hi: 'WhatsApp पर ऑर्डर करें', es: 'Pedir por WhatsApp', ar: 'اطلب عبر الواتساب', fr: 'Commander sur WhatsApp' },
  'No items found': { hi: 'कोई आइटम नहीं मिला', es: 'No se encontraron artículos', ar: 'لا توجد عناصر', fr: 'Aucun article trouvé' },
  'Try changing the dietary filter.': { hi: 'आहार फ़िल्टर बदलने का प्रयास करें।', es: 'Intenta cambiar el filtro.', ar: 'حاول تغيير الفلتر.', fr: 'Essayez de modifier le filtre.' },
  'All': { hi: 'सभी', es: 'Todos', ar: 'الكل', fr: 'Tout' },
  'Veg': { hi: 'शाकाहारी', es: 'Vegetariano', ar: 'نباتي', fr: 'Végétarien' },
  'Non-Veg': { hi: 'मांसाहारी', es: 'No Vegetariano', ar: 'غير نباتي', fr: 'Non végétarien' },
  'Vegan': { hi: 'वीगन', es: 'Vegano', ar: 'نباتي صرف', fr: 'Végane' },
  'Egg': { hi: 'अंडा', es: 'Huevo', ar: 'بيض', fr: 'Œuf' },
  'Opening Hours': { hi: 'खुलने का समय', es: 'Horario', ar: 'ساعات العمل', fr: 'Heures d\'ouverture' },
  'Closed': { hi: 'बंद', es: 'Cerrado', ar: 'مغلق', fr: 'Fermé' },
  'mon': { hi: 'सोम', es: 'Lun', ar: 'الاثنين', fr: 'Lun' },
  'tue': { hi: 'मंगल', es: 'Mar', ar: 'الثلاثاء', fr: 'Mar' },
  'wed': { hi: 'बुध', es: 'Mié', ar: 'الأربعاء', fr: 'Mer' },
  'thu': { hi: 'गुरु', es: 'Jue', ar: 'الخميس', fr: 'Jeu' },
  'fri': { hi: 'शुक्र', es: 'Vie', ar: 'الجمعة', fr: 'Ven' },
  'sat': { hi: 'शनि', es: 'Sáb', ar: 'السبت', fr: 'Sam' },
  'sun': { hi: 'रवि', es: 'Dom', ar: 'الأحد', fr: 'Dim' },
}

export function LanguageProvider({
  translations,
  children,
}: {
  translations: Translation[]
  children: React.ReactNode
}) {
  const primaryLocale = 'en'
  
  // Look for the special translation that defines the secondary locale.
  // We use entity_type = 'business' and field = '_system_secondary_locale'.
  const secondaryLocaleSetting = translations.find(
    (tr) => tr.entity_type === 'business' && tr.field === '_system_secondary_locale'
  )
  const { features, secondaryLocale: envLocale } = getConfig()
  // Force HMR to pick up the import correctly

  
  // Only enable secondary locale if the bilingual feature is active
  const secondaryLocale = features.bilingual 
    ? (secondaryLocaleSetting ? (secondaryLocaleSetting.value || null) : envLocale) 
    : null

  const [activeLocale, setActiveLocaleState] = useState<string>(primaryLocale)

  // Try to load preferred locale from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('menuos_locale')
      if (stored && (stored === primaryLocale || stored === secondaryLocale)) {
        setActiveLocaleState(stored as LocaleCode)
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [primaryLocale, secondaryLocale])

  const setActiveLocale = useCallback((locale: string) => {
    setActiveLocaleState(locale)
    try {
      localStorage.setItem('menuos_locale', locale)
      // Update HTML dir attribute for RTL support
      const dir = locale === 'ar' ? 'rtl' : 'ltr'
      document.documentElement.dir = dir
    } catch {
      // Ignore
    }
  }, [])

  // The translation helper function
  const t = useCallback(
    (entityType: EntityType, entityId: string, field: string, fallback: string) => {
      if (activeLocale === primaryLocale) return fallback

      const translation = translations.find(
        (tr) =>
          tr.entity_type === entityType &&
          tr.entity_id === entityId &&
          tr.field === field &&
          tr.locale === activeLocale
      )
      
      return translation?.value || fallback
    },
    [activeLocale, primaryLocale, translations]
  )

  const tUi = useCallback(
    (key: string, fallback: string) => {
      if (activeLocale === primaryLocale) return fallback
      return UI_DICT[fallback]?.[activeLocale] || fallback
    },
    [activeLocale, primaryLocale]
  )

  const value = {
    primaryLocale,
    secondaryLocale,
    activeLocale,
    setActiveLocale,
    t,
    tUi,
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return ctx
}
