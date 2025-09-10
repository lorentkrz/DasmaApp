"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Locale, Dictionary, getDictionary, translate, defaultLocale, isValidLocale } from '@/lib/i18n'

interface I18nContextType {
  locale: Locale
  dictionary: Dictionary
  setLocale: (locale: Locale) => void
  t: (key: string, fallback?: string) => string
}

const I18nContext = createContext<I18nContextType | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)
  const [dictionary, setDictionary] = useState<Dictionary>(() => getDictionary(defaultLocale))

  // Load locale from localStorage on mount
  useEffect(() => {
    const savedLocale = localStorage.getItem('wedding-erp-locale')
    if (savedLocale && isValidLocale(savedLocale)) {
      setLocaleState(savedLocale)
      setDictionary(getDictionary(savedLocale))
      try {
        document.documentElement.lang = savedLocale
        document.documentElement.setAttribute('data-locale', savedLocale)
      } catch {}
    } else {
      try {
        document.documentElement.lang = defaultLocale
        document.documentElement.setAttribute('data-locale', defaultLocale)
      } catch {}
    }
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    setDictionary(getDictionary(newLocale))
    localStorage.setItem('wedding-erp-locale', newLocale)
    try {
      document.documentElement.lang = newLocale
      document.documentElement.setAttribute('data-locale', newLocale)
    } catch {}
  }

  const t = (key: string, fallback?: string) => {
    return translate(dictionary, key, fallback)
  }

  const value = {
    locale,
    dictionary,
    setLocale,
    t,
  }

  return React.createElement(I18nContext.Provider, { value }, children)
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

// Convenience hook for just the translation function
export function useTranslation() {
  const { t } = useI18n()
  return { t }
}
