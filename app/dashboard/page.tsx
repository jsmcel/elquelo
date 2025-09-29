'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { DashboardStats } from '@/components/DashboardStats'
import { QRGenerator } from '@/components/QRGenerator'
import { ConfirmOrderButton } from '@/components/ConfirmOrderButton'
import { OrderStatus } from '@/components/OrderStatus'
import { useUser } from '@/app/providers'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Loader2 } from 'lucide-react'

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser()
  const router = useRouter()
  const [checkingQRs, setCheckingQRs] = useState(true)
  const [userQRs, setUserQRs] = useState<any[]>([])
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkUserQRs = async () => {
      if (!user) return

      try {
        const { data: qrs, count } = await supabase
          .from('qrs')
          .select('*')
          .eq('user_id', user.id)

        // If user has no QRs, redirect to configurador
        if (count === 0) {
          router.replace('/configurador')
          return
        }

        // Store QRs for the confirm order button
        setUserQRs(qrs || [])
      } catch (error) {
        console.error('Error checking QRs:', error)
      } finally {
        setCheckingQRs(false)
      }
    }

    if (!userLoading && user) {
      checkUserQRs()
    }
  }, [user, userLoading, router, supabase])

  if (userLoading || checkingQRs) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!user) {
    router.replace('/auth/login')
    return null
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mi Cuenta</h1>
          <p className="text-gray-600">Gestiona tus QRs y pedidos</p>
        </div>

        {/* Confirm Order - Prominent Position */}
        {userQRs.length > 0 && (
          <div className="mb-8">
            <ConfirmOrderButton qrCodes={userQRs.map(qr => qr.code)} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <DashboardStats />
            <QRGenerator />
            <OrderStatus />
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Additional sidebar content can go here */}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
