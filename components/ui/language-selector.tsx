"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { StandardDropdown } from "@/components/ui/standard-dropdown"
import { useI18n } from "@/hooks/use-i18n"
import { Locale, supportedLocales } from "@/lib/i18n"
import { Languages } from "lucide-react"

const localeLabels: Record<Locale, string> = {
  en: "English",
  al: "Shqip"
}

const localeOptions = supportedLocales.map(locale => ({
  label: localeLabels[locale],
  value: locale
}))

export function LanguageSelector({ className }: { className?: string }) {
  const { locale, setLocale } = useI18n()

  return (
    <StandardDropdown
      value={locale}
      onValueChange={(value) => setLocale(Array.isArray(value) ? value[0] as Locale : value as Locale)}
      options={localeOptions}
      placeholder="Language"
      className={className}
    />
  )
}

export function LanguageSelectorButton() {
  const { locale, setLocale } = useI18n()
  const [isOpen, setIsOpen] = useState(false)

  const toggleLanguage = () => {
    const newLocale = locale === 'en' ? 'al' : 'en'
    setLocale(newLocale)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="flex items-center gap-2"
    >
      <Languages className="h-4 w-4" />
      <span className="text-xs">{localeLabels[locale]}</span>
    </Button>
  )
}
