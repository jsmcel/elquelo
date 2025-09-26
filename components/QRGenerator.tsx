'use client'

import { useState } from 'react'
import { useUser } from '@/app/providers'
import { toast } from 'react-hot-toast'
import { QrCode, Copy, ExternalLink, Edit, Trash2 } from 'lucide-react'
import QRCode from 'qrcode'

interface QR {
  id: string
  code: string
  title: string
  description: string
  destination_url: string
  scan_count: number
  is_active: boolean
  created_at: string
  qr_url: string
}

export function QRGenerator() {
  const { user } = useUser()
  const [qrs, setQrs] = useState<QR[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    destination_url: '',
  })

  const createQR = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      const response = await fetch('/api/qr/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const { success, qr, qr_url } = await response.json()

      if (success) {
        setQrs([{ ...qr, qr_url }, ...qrs])
        setFormData({ title: '', description: '', destination_url: '' })
        setShowCreateForm(false)
        toast.success('QR creado exitosamente')
      } else {
        toast.error('Error al crear QR')
      }
    } catch (error) {
      toast.error('Error al crear QR')
    } finally {
      setLoading(false)
    }
  }

  const copyQRUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success('URL copiada al portapapeles')
  }

  const updateQR = async (code: string, updates: Partial<QR>) => {
    if (!user) return

    try {
      const response = await fetch(`/api/qr/${code}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`,
        },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        setQrs(qrs.map(qr => qr.code === code ? { ...qr, ...updates } : qr))
        toast.success('QR actualizado')
      } else {
        toast.error('Error al actualizar QR')
      }
    } catch (error) {
      toast.error('Error al actualizar QR')
    }
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Inicia sesión para gestionar tus QRs</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Mis QRs</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
        >
          <QrCode className="w-5 h-5" />
          <span>Crear QR</span>
        </button>
      </div>

      {/* Create QR Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Crear Nuevo QR</h3>
          <form onSubmit={createQR} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Mi QR personal"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Descripción opcional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL de Destino
              </label>
              <input
                type="url"
                value={formData.destination_url}
                onChange={(e) => setFormData({ ...formData, destination_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="https://ejemplo.com"
                required
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? 'Creando...' : 'Crear QR'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* QRs List */}
      <div className="space-y-4">
        {qrs.map((qr) => (
          <div key={qr.id} className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{qr.title}</h3>
                {qr.description && (
                  <p className="text-gray-600 text-sm">{qr.description}</p>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => copyQRUrl(qr.qr_url)}
                  className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                  title="Copiar URL"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <a
                  href={qr.qr_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                  title="Abrir QR"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">URL de Destino</p>
                <p className="text-sm text-gray-900 truncate">{qr.destination_url}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Escaneos</p>
                <p className="text-sm text-gray-900">{qr.scan_count}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Estado</p>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  qr.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {qr.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => updateQR(qr.code, { is_active: !qr.is_active })}
                className="text-sm px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                {qr.is_active ? 'Desactivar' : 'Activar'}
              </button>
              <button
                onClick={() => {
                  const newUrl = prompt('Nueva URL de destino:', qr.destination_url)
                  if (newUrl && newUrl !== qr.destination_url) {
                    updateQR(qr.code, { destination_url: newUrl })
                  }
                }}
                className="text-sm px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Cambiar URL
              </button>
            </div>
          </div>
        ))}

        {qrs.length === 0 && (
          <div className="text-center py-12">
            <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No tienes QRs creados aún</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
            >
              Crear tu primer QR
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
