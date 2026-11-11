// app/layout.tsx
// Layout raiz do app: fonte, metadados e ícones, providers (sessão e React Query), proteção de
// mídia, Header e container principal.

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './globals.css';
import Header from '@/components/Header';
import { MainWrapper } from '@/components/MainWrapper';
import { AuthProvider } from '@/components/providers/auth-provider';
import { QueryProvider } from '@/components/providers/query-provider';
import { GlobalMediaProtector } from '@/components/GlobalMediaProtector';
/** Fonte Inter carregada pelo next/font. */
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

/** Título, descrição e ícones do site. */
export const metadata: Metadata = {
  title: 'WORLDO',
  description: 'Sua Rede Social',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: ['/shortcut-icon.png'],
  },
};

/** Envolve todas as páginas com os providers, o Header e o MainWrapper. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthProvider>
          <QueryProvider>
            <GlobalMediaProtector />
            <Header />
            <MainWrapper>{children}</MainWrapper>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
