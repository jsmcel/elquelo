import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ELQUELO - Camisetas con QR Dinámicos',
  description: 'Camisetas inteligentes con códigos QR dinámicos, NFTs y experiencias únicas. Drops, eventos, merchandising y estados personalizados.',
  keywords: 'camisetas, QR, NFT, dropshipping, merchandising, eventos',
  authors: [{ name: 'ELQUELO' }],
  openGraph: {
    title: 'ELQUELO - Camisetas con QR Dinámicos',
    description: 'Camisetas inteligentes con códigos QR dinámicos, NFTs y experiencias únicas.',
    type: 'website',
    locale: 'es_ES',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
