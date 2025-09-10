import enDictionary from './dictionaries/en.json'
import alDictionary from './dictionaries/al.json'

export type Locale = 'en' | 'al'
export type Dictionary = typeof enDictionary

const dictionaries = {
  en: enDictionary,
  al: alDictionary,
} as const

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries.en
}

export function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((current, key) => current?.[key], obj) ?? path
}

export function translate(dictionary: Dictionary, key: string, fallback?: string): string {
  const value = getNestedValue(dictionary, key)
  return typeof value === 'string' ? value : fallback ?? key
}

// Default locale
export const defaultLocale: Locale = 'al'
export const supportedLocales: Locale[] = ['en', 'al']

export function isValidLocale(locale: string): locale is Locale {
  return supportedLocales.includes(locale as Locale)
}
