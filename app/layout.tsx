import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'react-hot-toast'
import { StripeProvider } from '@/components/StripeProvider'

const font = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'] })

export const metadata: Metadata = {
  title: 'ELQUELO  Kit de camisetas con QR para despedidas',
  description:
    'Organiza una despedida inolvidable con camisetas personalizadas, QR dinmicos y panel de control para cada integrante.',
  keywords: 'despedidas de soltera, camisetas personalizadas, qr dinmicos, kit despedida',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'Kit ELQUELO para despedidas',
    description:
      'Camisetas inteligentes con QR dinmico, panel para cambiar el contenido en segundos y entrega express en Espaa.',
    type: 'website',
    locale: 'es_ES',
    images: [
      {
        url: '/logo.png',
        width: 512,
        height: 512,
        alt: 'ELQUELO Logo',
      },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${font.className} bg-gray-50 text-gray-900`}>
        <Providers>
          <StripeProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#111827',
                  color: '#F9FAFB',
                },
              }}
            />
          </StripeProvider>
        </Providers>
      </body>
    </html>
  )
}
