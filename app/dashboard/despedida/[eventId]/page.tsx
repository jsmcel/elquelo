'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { useUser } from '@/app/providers'
import { SimpleDashboard } from '@/components/despedida/SimpleDashboard'
import { QuickStartWizard } from '@/components/despedida/QuickStartWizard'

export default function EventDetailPage() {
  const params = useParams<{ eventId: string }>()
  const searchParams = useSearchParams()
  const eventId = params.eventId
  const { user, loading: userLoading } = useUser()
  const router = useRouter()
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showQuickStart, setShowQuickStart] = useState(false)

  useEffect(() => {
    if (!userLoading && !user) {
      router.replace('/auth/login')
    }
  }, [user, userLoading, router])

  const loadEvent = useCallback(async (options?: { background?: boolean }) => {
    if (!user || !eventId) return

    const background = options?.background ?? false
    if (!background) {
      setLoading(true)
    }

    try {
      const res = await fetch(`/api/events/${eventId}/summary`)
      if (!res.ok) throw new Error('Failed to load event')
      const data = await res.json()
      console.log('[DASHBOARD] Event loaded:', data)
      setEvent(data)

      if (!background && searchParams.get('quickstart') === 'true') {
        setShowQuickStart(true)
      }
    } catch (err) {
      console.error('Error loading event:', err)
      if (!background) {
        toast.error('No se pudo actualizar el evento')
      }
    } finally {
      if (!background) {
        setLoading(false)
      }
    }
  }, [user, eventId, searchParams])

  useEffect(() => {
    loadEvent()
  }, [loadEvent])

  if (userLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Evento no encontrado</h2>
          <p className="text-gray-600">No se pudo cargar la información del evento</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <SimpleDashboard eventId={eventId} event={event} onRefresh={loadEvent} onOpenQuickStart={() => setShowQuickStart(true)} />
      <Footer />
      
      {/* Quick Start Modal */}
      {showQuickStart && (
        <QuickStartWizard
          eventId={eventId}
          onClose={() => setShowQuickStart(false)}
          onComplete={async () => {
            setShowQuickStart(false)
            await loadEvent({ background: false })
          }}
        />
      )}
    </main>
  )
}
