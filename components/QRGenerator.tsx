'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useUser } from '@/app/providers'
import { toast } from 'react-hot-toast'
import QRCode from 'qrcode'
import {
  QrCode,
  Copy,
  ExternalLink,
  UploadCloud,
  Loader2,
  Pencil,
  X,
  Trash2,
  Download,
  Image as ImageIcon,
  Eye,
} from 'lucide-react'
import { TShirtEditor } from './TShirtEditor'

interface QRRow {
  id: string
  code: string
  title: string | null
  description: string | null
  destination_url: string
  scan_count: number
  is_active: boolean
  created_at: string
  updated_at: string
  qr_url: string
}

interface DesignState {
  [code: string]: {
    url?: string
    loading: boolean
    designData?: any
    hasDesign?: boolean
  }
}

const FALLBACK_DESTINATION = 'https://elquelo.com/despedida'

export function QRGenerator() {
  const { user } = useUser()
  const [defaultDestination, setDefaultDestination] = useState(FALLBACK_DESTINATION)
  const previousDefaultRef = useRef(FALLBACK_DESTINATION)
  const [qrs, setQrs] = useState<QRRow[]>([])
  const [designs, setDesigns] = useState<DesignState>({})
  const [listLoading, setListLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formMode, setFormMode] = useState<'single' | 'bulk'>('single')
  const [formData, setFormData] = useState({
    title: '',
  })
  const [bulkForm, setBulkForm] = useState({
    names: '',
    groupName: 'Despedida',
  })
  const [editingCode, setEditingCode] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    title: '',
    destination_url: defaultDestination,
    description: '',
  })
  const [updatingCode, setUpdatingCode] = useState<string | null>(null)
  const [deletingCode, setDeletingCode] = useState<string | null>(null)
  const [qrImages, setQrImages] = useState<Record<string, string>>({})
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingQR, setEditingQR] = useState<QRRow | null>(null)
  const [viewDesignOpen, setViewDesignOpen] = useState(false)
  const [viewingDesign, setViewingDesign] = useState<{ code: string; designData: any } | null>(null)
  const [copyDesignOpen, setCopyDesignOpen] = useState(false)
  const [sourceDesign, setSourceDesign] = useState<{ code: string; designData: any } | null>(null)
  const [selectedTargetQRs, setSelectedTargetQRs] = useState<string[]>([])
  const [copyingDesign, setCopyingDesign] = useState(false)

  useEffect(() => {
    if (!user) {
      setQrs([])
      setDesigns({})
      setQrImages({})
      setDeletingCode(null)
      setUpdatingCode(null)
      setEditingCode(null)
      setShowForm(false)
      setFormMode('single')
      setFormData({ title: '' })
      setBulkForm({
        names: '',
        groupName: 'Despedida',
      })
      setEditForm({ title: '', destination_url: FALLBACK_DESTINATION, description: '' })
      setListLoading(false)
      return
    }

    const fetchQrs = async () => {
      setListLoading(true)
      try {
        const response = await fetch('/api/qr/user')
        if (!response.ok) {
          throw new Error('Failed to fetch qrs')
        }
        const data = await response.json()
        const rows = (data.qrs || []) as QRRow[]
        setQrs(rows)
      } catch (error) {
        console.error(error)
        toast.error('No se pudieron cargar tus QR')
      } finally {
        setListLoading(false)
      }
    }

    fetchQrs()
  }, [user])

  useEffect(() => {
    if (!user) {
      setDefaultDestination(FALLBACK_DESTINATION)
      return
    }

    let active = true

    const loadProfile = async () => {
      try {
        const response = await fetch('/api/user/profile')
        if (!response.ok) {
          throw new Error('Failed to load profile')
        }
        const data = await response.json()
        const candidate =
          typeof data?.profile?.default_destination_url === 'string'
            ? data.profile.default_destination_url.trim()
            : ''

        if (candidate && active) {
          setDefaultDestination(candidate)
        }
      } catch (error) {
        console.error('Error loading default destination', error)
        if (active) {
          setDefaultDestination(FALLBACK_DESTINATION)
        }
      }
    }

    loadProfile()

    return () => {
      active = false
    }
  }, [user])

  useEffect(() => {
    const previousDefault = previousDefaultRef.current
    if (defaultDestination === previousDefault) {
      return
    }

    // Los formularios ya no manejan destination_url, se genera automáticamente

    if (!editingCode) {
      setEditForm((prev) => ({ ...prev, destination_url: defaultDestination }))
    }

    previousDefaultRef.current = defaultDestination
  }, [defaultDestination, editingCode])

  useEffect(() => {
    if (!qrs.length) {
      setQrImages({})
      setDesigns({})
      return
    }

    const generateImages = async () => {
      const entries = await Promise.all(
        qrs.map(async (qr) => {
          try {
            const dataUrl = await QRCode.toDataURL(qr.qr_url, { width: 220, margin: 1 })
            return { code: qr.code, dataUrl }
          } catch (error) {
            console.error('Error generating QR', error)
            return { code: qr.code, dataUrl: '' }
          }
        })
      )

      const next: Record<string, string> = {}
      entries.forEach(({ code, dataUrl }) => {
        if (dataUrl) next[code] = dataUrl
      })
      setQrImages(next)
    }

    const fetchDesigns = async () => {
      const map: DesignState = {}
      await Promise.all(
        qrs.map(async (qr) => {
          map[qr.code] = { loading: true }
          try {
            const response = await fetch(`/api/design/${qr.code}`)
            if (response.ok) {
              const data = await response.json()
              map[qr.code] = { 
                loading: false, 
                url: data.url,
                designData: data.designData, // Incluir los datos del diseño
                hasDesign: data.hasDesign // Indicador de que tiene diseño guardado
              }
            } else {
              map[qr.code] = { loading: false }
            }
          } catch (error) {
            console.error('Error loading design', error)
            map[qr.code] = { loading: false }
          }
        })
      )
      setDesigns(map)
    }

    generateImages()
    fetchDesigns()
  }, [qrs])

  const downloadPng = (code: string) => {
    const dataUrl = qrImages[code]
    if (!dataUrl) {
      toast.error('No se pudo descargar el QR')
      return
    }

    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `${code}.png`
    link.click()
  }

  const handleCreateSingle = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user) return

    setCreating(true)
    try {
      const response = await fetch('/api/qr/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al crear el QR')
      }
      const newQr = data.qr as QRRow
      setQrs((prev) => [newQr, ...prev])
      toast.success('QR creado')
      setShowForm(false)
      setFormData({ title: '' })
    } catch (error) {
      console.error(error)
      toast.error('No se pudo crear el QR')
    } finally {
      setCreating(false)
    }
  }

  const handleCreateBulk = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user) return

    const names = bulkForm.names
      .split('\n')
      .map((name) => name.trim())
      .filter(Boolean)

    if (!names.length) {
      toast.error('Aade al menos un nombre')
      return
    }

    setCreating(true)
    try {
      const payload = {
        group: bulkForm.groupName,
        members: names.map((name) => ({
          name,
          title: `${bulkForm.groupName} - ${name}`,
        })),
      }
      const response = await fetch('/api/qr/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al crear los QRs')
      }
      const created = (data.qrs || []) as QRRow[]
      setQrs((prev) => [...created, ...prev])
      toast.success(`Se generaron ${created.length} QRs`)
      setShowForm(false)
      setBulkForm({
        names: '',
        groupName: bulkForm.groupName,
      })
    } catch (error) {
      console.error(error)
      toast.error('No se pudieron crear los QRs del grupo')
    } finally {
      setCreating(false)
    }
  }

  const toggleActive = async (qr: QRRow) => {
    setUpdatingCode(qr.code)
    try {
      const response = await fetch(`/api/qr/${qr.code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !qr.is_active }),
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error')
      }
      setQrs((prev) => prev.map((item) => (item.id === data.qr.id ? data.qr : item)))
      toast.success('Estado del QR actualizado')
    } catch (error) {
      console.error(error)
      toast.error('No se pudo cambiar el estado')
    } finally {
      setUpdatingCode(null)
    }
  }

  const startEditing = (qr: QRRow) => {
    setEditingCode(qr.code)
    setEditForm({
      title: qr.title ?? '',
      destination_url: qr.destination_url,
      description: qr.description ?? '',
    })
  }

  const cancelEditing = () => {
    setEditingCode(null)
    setEditForm({ title: '', destination_url: defaultDestination, description: '' })
  }

  const saveEdits = async (code: string) => {
    setUpdatingCode(code)
    try {
      const response = await fetch(`/api/qr/${code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al guardar')
      }
      setQrs((prev) => prev.map((item) => (item.id === data.qr.id ? data.qr : item)))
      toast.success('QR actualizado')
      cancelEditing()
    } catch (error) {
      console.error(error)
      toast.error('No se pudieron guardar los cambios')
    } finally {
      setUpdatingCode(null)
    }
  }

  const handleDelete = async (qr: QRRow) => {
    const confirmed = window.confirm('Seguro que quieres eliminar este QR?')
    if (!confirmed) {
      return
    }

    setDeletingCode(qr.code)
    try {
      const response = await fetch(`/api/qr/${qr.code}`, { method: 'DELETE' })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al borrar el QR')
      }

      setQrs((prev) => prev.filter((item) => item.code !== qr.code))
      setDesigns((prev) => {
        const next = { ...prev }
        delete next[qr.code]
        return next
      })
      setQrImages((prev) => {
        const next = { ...prev }
        delete next[qr.code]
        return next
      })
      if (editingCode === qr.code) {
        cancelEditing()
      }
      toast.success('QR eliminado')
    } catch (error) {
      console.error('Error deleting QR', error)
      toast.error('No se pudo borrar el QR')
    } finally {
      setDeletingCode(null)
    }
  }

  const uploadDesign = async (code: string) => {
    // Encontrar el QR correspondiente y abrir el editor
    const qr = qrs.find(q => q.code === code)
    if (qr) {
      setEditingQR(qr)
      setEditorOpen(true)
    } else {
      toast.error('No se encontr el QR')
    }
  }

  const handleEditorSave = (designData: any) => {
    if (editingQR) {
      // Subir el diseño al servidor
      uploadDesignToServer(editingQR.code, designData)
    }
    setEditorOpen(false)
    setEditingQR(null)
  }

  const handleViewDesign = (code: string) => {
    const designState = designs[code]
    if (designState?.hasDesign && designState.designData) {
      setViewingDesign({ code, designData: designState.designData })
      setViewDesignOpen(true)
    }
  }

  const handleCopyDesign = (code: string) => {
    const designState = designs[code]
    if (designState?.hasDesign && designState.designData) {
      setSourceDesign({ code, designData: designState.designData })
      setSelectedTargetQRs([])
      setCopyDesignOpen(true)
    }
  }

  const handleCopyDesignToQRs = async () => {
    if (!sourceDesign || selectedTargetQRs.length === 0) return

    setCopyingDesign(true)
    try {
      // Obtener QRs destino (excluyendo el QR origen)
      const targetQRs = qrs.filter(qr => 
        selectedTargetQRs.includes(qr.code) && qr.code !== sourceDesign.code
      )

      // Para cada QR destino, crear un nuevo diseño basado en el origen
      const copyPromises = targetQRs.map(async (targetQR) => {
        // Generar el QR específico para este QR destino
        const targetQRUrl = targetQR.destination_url
        
        // Crear nuevo designData copiando todo y sustituyendo el QR
        const newDesignData = {
          ...sourceDesign.designData,
          // Sustituir QRs con el QR correcto para este destino
          confirmedQRs: sourceDesign.designData.confirmedQRs?.map((qr: any, index: number) => ({
            ...qr,
            id: `qr-${targetQR.code}-${index}`, // ID único para este QR
            // Mantener la misma posición y configuración
            position: qr.position,
            side: qr.side
          })) || [],
          confirmedImages: sourceDesign.designData.confirmedImages || [],
          // Mantener posiciones y configuraciones
          imageUrl: sourceDesign.designData.imageUrl,
          position: sourceDesign.designData.position,
          qrPosition: sourceDesign.designData.qrPosition,
          side: sourceDesign.designData.side,
          printArea: sourceDesign.designData.printArea,
          // Agregar metadatos de copia
          copiedFrom: sourceDesign.code,
          copiedAt: new Date().toISOString(),
          version: '1.0',
          // Agregar el QR específico para este destino
          targetQRCode: targetQR.code,
          targetQRUrl: targetQRUrl
        }

        // Guardar el diseño copiado
        const response = await fetch('/api/design/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: targetQR.code,
            designData: newDesignData
          }),
        })

        if (!response.ok) {
          throw new Error(`Error copiando diseño a ${targetQR.code}`)
        }

        return targetQR.code
      })

      const copiedCodes = await Promise.all(copyPromises)
      
      // Actualizar el estado local
      const updatedDesigns = { ...designs }
      copiedCodes.forEach(code => {
        const targetQR = qrs.find(qr => qr.code === code)
        updatedDesigns[code] = {
          loading: false,
          url: 'design-saved',
          hasDesign: true,
          designData: {
            ...sourceDesign.designData,
            // Incluir QRs sustituidos con el QR correcto
            confirmedQRs: sourceDesign.designData.confirmedQRs?.map((qr: any, index: number) => ({
              ...qr,
              id: `qr-${code}-${index}`,
              position: qr.position,
              side: qr.side
            })) || [],
            confirmedImages: sourceDesign.designData.confirmedImages || [],
            copiedFrom: sourceDesign.code,
            copiedAt: new Date().toISOString(),
            targetQRCode: code,
            targetQRUrl: targetQR?.destination_url
          }
        }
      })
      setDesigns(updatedDesigns)

      toast.success(`Diseño copiado a ${copiedCodes.length} QR(s)`)
      setCopyDesignOpen(false)
      setSourceDesign(null)
      setSelectedTargetQRs([])

    } catch (error) {
      console.error('Error copying design:', error)
      toast.error('Error al copiar el diseño')
    } finally {
      setCopyingDesign(false)
    }
  }

  const uploadDesignToServer = async (code: string, designData: any) => {
    try {
      const uploadResponse = await fetch('/api/design/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          designData
        }),
      })

      const data = await uploadResponse.json()
      if (!uploadResponse.ok || !data.success) {
        throw new Error(data.error || 'Error al guardar el diseño')
      }

      setDesigns((prev) => ({
        ...prev,
        [code]: {
          loading: false,
          url: 'design-saved',
          hasDesign: true,
          designData: designData
        },
      }))
      toast.success('Diseño guardado correctamente')
    } catch (error) {
      console.error('Error uploading design:', error)
      toast.error('No se pudo guardar el diseño')
    }
  }

  if (!user) {
    return (
      <div className="rounded-3xl border border-dashed border-primary-200 bg-primary-50 p-12 text-center">
        <h3 className="text-xl font-semibold text-primary-700">Inicia sesin para gestionar tus QRs</h3>
        <p className="mt-3 text-sm text-primary-600">
          Podrs crear un QR por integrante, subir diseos PNG y activar o desactivar cada camiseta.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mis camisetas con QR</h2>
          <p className="text-sm text-gray-600">
            Administra el QR, el diseo y el estado de cada camiseta. Todo sincronizado con tu panel y la app mvil.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              setFormMode('single')
              setShowForm((prev) => !prev)
            }}
            className="inline-flex items-center gap-2 rounded-full border border-primary-200 px-4 py-2 text-sm font-semibold text-primary-600 transition hover:border-primary-400"
          >
            <QrCode className="h-4 w-4" /> Nuevo QR
          </button>
          <button
            onClick={() => {
              setFormMode('bulk')
              setShowForm(true)
            }}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary-200 hover:text-primary-600"
          >
            Generar para todo el grupo
          </button>
        </div>
      </div>

      {showForm && (
        <div className="rounded-3xl border border-primary-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Crear QR</h3>
            <div className="flex rounded-full border border-gray-200 bg-gray-100 p-1 text-sm font-semibold">
              <button
                onClick={() => setFormMode('single')}
                className={`rounded-full px-4 py-1.5 transition ${
                  formMode === 'single' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Individual
              </button>
              <button
                onClick={() => setFormMode('bulk')}
                className={`rounded-full px-4 py-1.5 transition ${
                  formMode === 'bulk' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Grupo
              </button>
            </div>
          </div>

          {formMode === 'single' ? (
            <form onSubmit={handleCreateSingle} className="mt-6 grid gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nombre o ttulo</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
                  required
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  placeholder="Laura  Team Bride"
                />
              </div>
              <div className="sm:col-span-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-primary-200 hover:text-primary-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Crear QR'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCreateBulk} className="mt-6 grid gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nombres (uno por lnea)</label>
                <textarea
                  rows={5}
                  value={bulkForm.names}
                  onChange={(event) => setBulkForm((prev) => ({ ...prev, names: event.target.value }))}
                  required
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  placeholder={`Laura\nAna\nMarta`}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nombre del grupo</label>
                <input
                  type="text"
                  value={bulkForm.groupName}
                  onChange={(event) => setBulkForm((prev) => ({ ...prev, groupName: event.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-primary-200 hover:text-primary-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Crear QRs del grupo'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {listLoading ? (
        <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center shadow-sm">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-600" />
          <p className="mt-3 text-sm text-gray-600">Cargando QRs...</p>
        </div>
      ) : qrs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-12 text-center shadow-sm">
          <QrCode className="mx-auto h-10 w-10 text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">An no tienes QRs</h3>
          <p className="mt-2 text-sm text-gray-600">Crea tu primer QR para cada integrante o genera todo el grupo de golpe.</p>
          <button
            onClick={() => {
              setFormMode('bulk')
              setShowForm(true)
            }}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-700"
          >
            Crear QRs para la despedida
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {qrs.map((qr) => {
            const designState = designs[qr.code]
            const qrImage = qrImages[qr.code]
            const isEditing = editingCode === qr.code
            const isUpdating = updatingCode === qr.code
            const isDeleting = deletingCode === qr.code

            return (
              <div key={qr.id} className="rounded-2xl border border-gray-200/50 bg-white p-6 shadow-sm transition hover:border-primary-200">
                <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
                  <div className="flex flex-col items-center justify-between rounded-2xl border border-dashed border-gray-300/60 bg-gray-50/80 p-4">
                    {qrImage ? (
                      <img src={qrImage} alt={`QR ${qr.title ?? qr.code}`} className="h-44 w-44 rounded-2xl border border-white shadow" />
                    ) : (
                      <div className="flex h-44 w-44 items-center justify-center rounded-2xl border border-dashed border-gray-300/60 text-gray-400">
                        <QrCode className="h-8 w-8" />
                      </div>
                    )}
                    <div className="mt-4 flex gap-2 text-sm">
                      <button
                        onClick={() => navigator.clipboard.writeText(qr.qr_url).then(() => toast.success('URL copiada'))}
                        className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 transition hover:border-primary-200 hover:text-primary-600"
                      >
                        <Copy className="h-3.5 w-3.5" /> Copiar
                      </button>
                      {qrImage ? (
                        <button
                          onClick={() => downloadPng(qr.code)}
                          className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 transition hover:border-primary-200 hover:text-primary-600"
                        >
                          <Download className="h-3.5 w-3.5" /> PNG
                        </button>
                      ) : null}
                      <a
                        href={qr.qr_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 transition hover:border-primary-200 hover:text-primary-600"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Abrir
                      </a>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-semibold text-gray-900">{qr.title || 'QR sin ttulo'}</h3>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            qr.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {qr.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-gray-500">{qr.code}</p>
                        <p className="mt-1 text-sm text-gray-500">{qr.scan_count} escaneos</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => (isEditing ? cancelEditing() : startEditing(qr))}
                          disabled={isDeleting}
                          className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:border-primary-200 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isEditing ? <X className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                          {isEditing ? 'Cancelar' : 'Editar' }
                        </button>
                        <button
                          onClick={() => toggleActive(qr)}
                          disabled={isUpdating || isDeleting}
                          className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:border-primary-200 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                          {qr.is_active ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          onClick={() => handleDelete(qr)}
                          disabled={isDeleting}
                          className="inline-flex items-center gap-2 rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isDeleting ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          Eliminar
                        </button>
                      </div>
                    </div>

                    {isEditing ? (
                      <form
                        onSubmit={(event) => {
                          event.preventDefault()
                          saveEdits(qr.code)
                        }}
                        className="space-y-4"
                      >
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Ttulo</label>
                            <input
                              type="text"
                              value={editForm.title}
                              onChange={(event) => setEditForm((prev) => ({ ...prev, title: event.target.value }))}
                              required
                              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">URL destino</label>
                            <input
                              type="url"
                              value={editForm.destination_url}
                              onChange={(event) => setEditForm((prev) => ({ ...prev, destination_url: event.target.value }))}
                              required
                              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Descripcin</label>
                          <textarea
                            rows={3}
                            value={editForm.description}
                            onChange={(event) => setEditForm((prev) => ({ ...prev, description: event.target.value }))}
                            className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                          />
                        </div>
                        <div className="flex items-center justify-end gap-3">
                          <button
                            type="button"
                            onClick={cancelEditing}
                            className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 transition hover:border-primary-200 hover:text-primary-600"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            disabled={isUpdating}
                            className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-5 py-2 text-xs font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Guardar cambios
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-3 text-sm text-gray-700">
                        {qr.description && <p className="text-gray-600">{qr.description}</p>}
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">URL actual</span>
                          <a
                            href={qr.destination_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 block break-words font-semibold text-primary-600 hover:text-primary-700"
                          >
                            {qr.destination_url}
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="rounded-2xl border border-dashed border-gray-300/60 bg-gray-50/80 p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-inner shadow-black/5">
                            <ImageIcon className="h-6 w-6 text-primary-500" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">Diseño PNG</p>
                            <p className="text-xs text-gray-500">Sube la creatividad que se imprimirá en la camiseta.</p>
                          </div>
                        </div>
                        <button
                          onClick={() => uploadDesign(qr.code)}
                          className="inline-flex items-center gap-2 rounded-full border border-gray-200/60 px-4 py-2 text-xs font-semibold text-gray-600 transition hover:border-primary-200 hover:text-primary-600"
                        >
                          <UploadCloud className="h-4 w-4" />
                          {designState?.loading ? 'Subiendo...' : 'Subir nuevo PNG'}
                        </button>
                      </div>
                      <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200/40 bg-white">
                        {designState?.loading ? (
                          <div className="flex h-40 items-center justify-center text-sm text-gray-500">
                            <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
                            <span className="ml-2">Procesando PNG...</span>
                          </div>
                        ) : designState?.hasDesign ? (
                          <div className="flex h-40 items-center justify-center text-sm text-gray-500">
                            <div className="text-center">
                              <div className="mb-2 text-green-600">✓ Diseño guardado</div>
                              <div className="text-xs text-gray-400 mb-3">
                                {designState.designData?.confirmedQRs?.length || 0} QRs fijados, {designState.designData?.confirmedImages?.length || 0} diseños fijados
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleViewDesign(qr.code)}
                                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  Ver diseño
                                </button>
                                <button
                                  onClick={() => handleCopyDesign(qr.code)}
                                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                                >
                                  <Copy className="w-3 h-3 mr-1" />
                                  Copiar diseño
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : designState?.url && designState.url !== 'design-saved' ? (
                          <div className="relative">
                            <img src={designState.url} alt={`Diseo ${qr.title ?? qr.code}`} className="w-full rounded-2xl" />
                            <a
                              href={designState.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-primary-600 shadow"
                            >
                              <Eye className="h-3.5 w-3.5" /> Ver PNG
                            </a>
                          </div>
                        ) : (
                          <div className="flex h-40 items-center justify-center text-sm text-gray-500">
                            No hay diseño todavía. Sube un PNG para esta camiseta.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      
      {/* Editor de Camisetas */}
      {editorOpen && editingQR && (
        <TShirtEditor
          isOpen={editorOpen}
          onClose={() => {
            setEditorOpen(false)
            setEditingQR(null)
          }}
          qrCode={editingQR.code}
          qrUrl={editingQR.qr_url}
          participantName={editingQR.title || 'Usuario'}
          onSave={handleEditorSave}
          savedDesignData={designs[editingQR.code]?.designData}
        />
      )}

      {/* Modal para ver diseño */}
      {viewDesignOpen && viewingDesign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Diseño guardado - {viewingDesign.code}
              </h3>
              <button
                onClick={() => {
                  setViewDesignOpen(false)
                  setViewingDesign(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-4">
                {/* Información del diseño */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">QRs confirmados</h4>
                    <div className="text-sm text-gray-600">
                      {viewingDesign.designData?.confirmedQRs?.length || 0} QRs fijados
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Diseños confirmados</h4>
                    <div className="text-sm text-gray-600">
                      {viewingDesign.designData?.confirmedImages?.length || 0} diseños fijados
                    </div>
                  </div>
                </div>

                {/* Vista previa del diseño */}
                {viewingDesign.designData?.canvasData && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Vista previa del diseño</h4>
                    <div className="flex justify-center">
                      <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <img 
                          src={viewingDesign.designData.canvasData} 
                          alt="Diseño guardado" 
                          className="max-w-full max-h-96 object-contain"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Detalles técnicos */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Detalles del diseño</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Fecha de creación: {new Date(viewingDesign.designData?.createdAt || Date.now()).toLocaleString()}</div>
                    <div>Versión: {viewingDesign.designData?.version || '1.0'}</div>
                    <div>Resolución: {viewingDesign.designData?.resolution || 'No especificada'}</div>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      setViewDesignOpen(false)
                      setViewingDesign(null)
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Cerrar
                  </button>
                  {viewingDesign.designData?.canvasData && (
                    <button
                      onClick={() => {
                        const link = document.createElement('a')
                        link.href = viewingDesign.designData.canvasData
                        link.download = `diseño-${viewingDesign.code}.png`
                        link.click()
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <Download className="w-4 h-4 inline mr-2" />
                      Descargar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para copiar diseño */}
      {copyDesignOpen && sourceDesign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Copiar diseño - {sourceDesign.code}
              </h3>
              <button
                onClick={() => {
                  setCopyDesignOpen(false)
                  setSourceDesign(null)
                  setSelectedTargetQRs([])
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-4">
                {/* Información del diseño origen */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Diseño origen</h4>
                  <div className="text-sm text-blue-700">
                    <div>QR: {sourceDesign.code}</div>
                    <div>Imágenes: {sourceDesign.designData?.confirmedImages?.length || 0}</div>
                    <div>Lado: {sourceDesign.designData?.side || 'No especificado'}</div>
                  </div>
                </div>

                {/* Selección de QRs destino */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Seleccionar QRs destino</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {qrs
                      .filter(qr => qr.code !== sourceDesign.code) // Excluir el QR origen
                      .map((qr) => (
                        <label key={qr.code} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedTargetQRs.includes(qr.code)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTargetQRs([...selectedTargetQRs, qr.code])
                              } else {
                                setSelectedTargetQRs(selectedTargetQRs.filter(code => code !== qr.code))
                              }
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div className="ml-3 flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {qr.title || 'Sin título'} ({qr.code})
                            </div>
                            <div className="text-xs text-gray-500">
                              {qr.destination_url}
                            </div>
                            {designs[qr.code]?.hasDesign && (
                              <div className="text-xs text-orange-600 mt-1">
                                ⚠️ Ya tiene diseño - se sobrescribirá
                              </div>
                            )}
                          </div>
                        </label>
                      ))}
                  </div>
                </div>

                {/* Información sobre la copia */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">✅ Copia automática</h4>
                  <div className="text-sm text-green-700 space-y-1">
                    <div>• Se copiarán las imágenes y posiciones del diseño</div>
                    <div>• Los QRs se sustituirán automáticamente por el QR correcto de cada destino</div>
                    <div>• Si un QR ya tiene diseño, se sobrescribirá</div>
                    <div>• Cada QR mantendrá su URL única pero con el mismo diseño</div>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      setCopyDesignOpen(false)
                      setSourceDesign(null)
                      setSelectedTargetQRs([])
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCopyDesignToQRs}
                    disabled={selectedTargetQRs.length === 0 || copyingDesign}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {copyingDesign ? (
                      <>
                        <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                        Copiando...
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 inline mr-2" />
                        Copiar a {selectedTargetQRs.length} QR(s)
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
