'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

function BienvenidaContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const qrCode = searchParams.get('qr')
  const name = searchParams.get('name')
  const group = searchParams.get('group')

  useEffect(() => {
    const fetchQRAndRedirect = async () => {
      if (!qrCode) {
        // Si no hay código QR, redirigir a la página principal
        router.push('/')
        return
      }

      try {
        // Buscar el QR para obtener el event_id
        const response = await fetch(`/api/qr/list`)
        if (!response.ok) throw new Error('Failed to fetch QR')
        
        const data = await response.json()
        const qr = data.qrs?.find((q: any) => q.code === qrCode)

        if (qr && qr.event_id) {
          // Redirigir al microsite del evento
          const micrositeUrl = `/e/${qr.event_id}/microsite${
            name ? `?name=${encodeURIComponent(name)}` : ''
          }${name && group ? '&' : group ? '?' : ''}${
            group ? `group=${encodeURIComponent(group)}` : ''
          }`
          
          router.push(micrositeUrl)
        } else {
          // Si no se encuentra el QR o no tiene evento, redirigir a la home
          console.warn('QR not found or has no event_id')
          router.push('/')
        }
      } catch (error) {
        console.error('Error fetching QR info:', error)
        // En caso de error, redirigir a la home
        router.push('/')
      }
    }

    fetchQRAndRedirect()
  }, [qrCode, name, group, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Cargando experiencia...
        </h2>
        <p className="text-gray-600">
          {name ? `¡Bienvenido/a ${name}!` : '¡Bienvenido/a!'}
        </p>
        {group && (
          <p className="text-sm text-primary-600 mt-2">
            Grupo: {group}
          </p>
        )}
      </div>
    </div>
  )
}

export default function BienvenidaPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
      </div>
    }>
      <BienvenidaContent />
    </Suspense>
  )
}

