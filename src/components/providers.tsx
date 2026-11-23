"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";
import { ConfirmDialogHost, Toaster } from "@/components/feedback";
import { ThemePrefsProvider } from "@/components/theme-prefs-provider";
import { detectStoredLocale, initI18n, setAppLocale } from "@/i18n/config";
import { rehydrateAuthStore, useAuthStore } from "@/stores/auth-store";

const i18n = initI18n();

export function Providers({ children }: { children: React.ReactNode }) {
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

  useEffect(() => {
    // Apply preferred locale only after mount (avoids hydration mismatch).
    void setAppLocale(detectStoredLocale());

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
  }, []);

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
