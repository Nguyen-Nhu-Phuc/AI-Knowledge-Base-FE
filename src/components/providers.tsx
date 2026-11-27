"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";
import { ConfirmDialogHost, Toaster } from "@/components/feedback";
import { ThemePrefsProvider } from "@/components/theme-prefs-provider";
import { detectStoredLocale, getClientI18n, setAppLocale } from "@/i18n/config";
import type { AppLocale } from "@/i18n/locale";
import { rehydrateAuthStore, useAuthStore } from "@/stores/auth-store";

export function Providers({
  children,
  locale,
}: {
  children: React.ReactNode;
  /** From cookie on the server — must match first client render. */
  locale: AppLocale;
}) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 20_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );
  const [i18n] = useState(() => getClientI18n(locale));

  useEffect(() => {
    // After hydration: apply saved preference (updates cookie for next SSR).
    const preferred = detectStoredLocale();
    if (preferred !== locale) {
      void setAppLocale(preferred);
    } else {
      writeCookieOnly(preferred);
    }

    const persistApi = useAuthStore.persist;
    const unsub = persistApi?.onFinishHydration(() => {
      useAuthStore.setState({ hasHydrated: true });
    });
    rehydrateAuthStore();
    const t = window.setTimeout(() => {
      if (!useAuthStore.getState().hasHydrated) {
        useAuthStore.setState({ hasHydrated: true });
      }
    }, 1500);
    return () => {
      unsub?.();
      window.clearTimeout(t);
    };
  }, [locale]);

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <ThemePrefsProvider>
          <QueryClientProvider client={client}>
            {children}
            <Toaster />
            <ConfirmDialogHost />
          </QueryClientProvider>
        </ThemePrefsProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}

function writeCookieOnly(locale: AppLocale) {
  document.cookie = `akb-locale=${locale};path=/;max-age=31536000;samesite=lax`;
  document.documentElement.lang = locale;
}
