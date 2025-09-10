"use client"

import { I18nProvider } from "@/hooks/use-i18n"

export default function I18nClientProvider({ children }: { children: React.ReactNode }) {
  return <I18nProvider>{children}</I18nProvider>
}
