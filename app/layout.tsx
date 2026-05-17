import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import 'bootstrap-icons/font/bootstrap-icons.css';
import './globals.css'
import { AuthProvider } from '@/components/providers/auth-provider'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'E-commerce Store',
  description: 'Sua loja online completa',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthProvider> 
        <main className="min-h-screen">
          {children}
        </main>
        </AuthProvider> 
      </body>
    </html>
  )
}