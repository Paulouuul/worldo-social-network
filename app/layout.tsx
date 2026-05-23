import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import 'bootstrap-icons/font/bootstrap-icons.css';
import './globals.css'
import { BFCacheGuard } from '@/components/BFCacheGuard'
import Header from '@/components/Header'
import { MainWrapper } from '@/components/MainWrapper'
import { AuthProvider } from '@/components/providers/auth-provider'
import { AuthRedirect } from '@/components/AuthRedirect'
import { GlobalMediaProtector } from '@/components/GlobalMediaProtector'


const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'WORLDO',
  description: 'Sua Rede Social',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '32x32' }
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    shortcut: ['/shortcut-icon.png']
  }
}
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthProvider>
          <GlobalMediaProtector />
          <Header/>

        <MainWrapper>{children}</MainWrapper>
        </AuthProvider> 
      </body>
    </html>
  )
}