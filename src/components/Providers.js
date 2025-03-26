'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';

export function AuthProvider({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}

export function NextThemeProvider({ children }) {
  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="light"
      enableSystem={true}
      disableTransitionOnChange={false}
      storageKey="bo-resource-theme"
    >
      {children}
    </ThemeProvider>
  );
}

export function Providers({ children }) {
  return (
    <AuthProvider>
      <NextThemeProvider>
        {children}
      </NextThemeProvider>
    </AuthProvider>
  );
} 