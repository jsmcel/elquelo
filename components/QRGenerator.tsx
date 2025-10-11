'use client'

/* eslint-disable @next/next/no-img-element */

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
import { MultiProductDesignEditor } from './MultiProductDesignEditor'
import { QRProductsList } from './QRProductsList'
import { ViewMultiProductDesignModal } from './ViewMultiProductDesignModal'
import { migrateLegacyDesign } from '@/types/qr-product'

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

interface DesignStateItem {
  url?: string
  previewUrl?: string
  loading: boolean
  designData?: any
  hasDesign?: boolean
  mockups?: Array<{ placement: string; url: string }>
  variantId?: number
  source?: 'printful' | 'legacy' | 'unknown'
  printfulSummary?: PrintfulSummary
}

type DesignState = Record<string, DesignStateItem>

interface PrintfulSummary {
  isPrintful: boolean
  previewUrl?: string
  mockups: Array<{ placement: string; url: string }>
  variantId?: number
  size?: string | null
  color?: string | null
  colorCode?: string | null
  source?: string | null
  placements?: Record<string, any>
}

function extractPrintfulSummary(designData: any): PrintfulSummary {
  if (!designData) {
    return {
      isPrintful: false,
      previewUrl: undefined,
      mockups: [],
      variantId: undefined,
      size: null,
      color: null,
      colorCode: null,
      source: null,
      placements: {},
    }
  }

  const printfulData = designData.printful || {}
  const isPrintful = designData.editorType === 'printful' || Boolean(printfulData && Object.keys(printfulData).length)

  if (!isPrintful) {
    const preview =
      designData.canvasData ||
      designData.imageUrl ||
      designData.printFileUrl ||
      designData.printFilePath ||
      undefined

    return {
      isPrintful: false,
      previewUrl: preview,
      mockups: [],
      variantId: undefined,
      size: null,
      color: null,
      colorCode: null,
      source: null,
      placements: designData.designsByPlacement || designData.confirmedImages || {},
    }
  }

  let variantMockups: any =
    designData.variantMockups ||
    printfulData.variantMockups ||
    printfulData.allMockups ||
    null

  let variantId =
    designData.selectedVariantId ??
    designData.printfulProduct?.variantId ??
    printfulData.variantId ??
    null

  const mockups: Array<{ placement: string; url: string }> = []

  if (variantMockups && typeof variantMockups === 'object') {
    const variantKeys = Object.keys(variantMockups)
    const targetKey =
      variantId !== null && variantId !== undefined && (variantMockups as any)[String(variantId)]
        ? String(variantId)
        : variantKeys[0]

    if (targetKey) {
      const entry =
        (variantMockups as any)[targetKey] ??
        (variantMockups as any)[Number(targetKey)]

      if (entry && typeof entry === 'object') {
        Object.entries(entry as Record<string, any>).forEach(([placement, value]) => {
          if (!value) return
          if (typeof value === 'string') {
            mockups.push({ placement, url: value })
          } else if (typeof value === 'object' && typeof value.url === 'string') {
            mockups.push({ placement, url: value.url })
          }
        })
      } else if (typeof entry === 'string') {
        mockups.push({ placement: 'front', url: entry })
      }

      if ((variantId === null || variantId === undefined) && targetKey) {
        const numericKey = Number(targetKey)
        if (!Number.isNaN(numericKey)) {
          variantId = numericKey
        }
      }
    }
  }

  const previewUrl =
    printfulData.previewUrl ||
    (mockups.length ? mockups[0].url : undefined) ||
    designData.printFileUrl ||
    designData.printFilePath ||
    undefined

  return {
    isPrintful: true,
    previewUrl,
    mockups,
    variantId: typeof variantId === 'number' && !Number.isNaN(variantId) ? variantId : undefined,
    size: printfulData.size || designData.printfulProduct?.size || null,
    color: printfulData.color || designData.printfulProduct?.color || null,
    colorCode: printfulData.colorCode || designData.printfulProduct?.colorCode || null,
    source: printfulData.source || null,
    placements: printfulData.placements || designData.designsByPlacement || {},
  }
}

function buildDesignStateEntry(designData: any, url?: string) {
  const summary = extractPrintfulSummary(designData)
  const fallbackUrl = url && url !== 'design-saved' ? url : undefined
  const previewUrl = summary.previewUrl || fallbackUrl

  let source: 'printful' | 'legacy' | 'unknown' = 'unknown'
  if (summary.isPrintful) {
    source = summary.source === 'printful' ? 'printful' : 'unknown'
  } else if (fallbackUrl) {
    source = 'legacy'
  }

  return {
    url: previewUrl || fallbackUrl || url,
    previewUrl,
    mockups: summary.mockups,
    variantId: summary.variantId,
    source,
    printfulSummary: summary,
  }
}

const FALLBACK_DESTINATION = 'https://elquelo.com/despedida'

interface QRGeneratorProps {
  onDesignChanged?: () => void
}

export function QRGenerator({ onDesignChanged }: QRGeneratorProps = {}) {
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
  const [productTrashOpen, setProductTrashOpen] = useState(false)
  const [trashQRCode, setTrashQRCode] = useState<string | null>(null)
  const [priceRefreshKey, setPriceRefreshKey] = useState(0)

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

    // Los formularios ya no manejan destination_url, se genera automaticamente

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
            const { generateStandardQR } = await import('@/lib/qr-generator')
            const dataUrl = await generateStandardQR(qr.qr_url)
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
              const entry = buildDesignStateEntry(data.designData, data.url)
              map[qr.code] = {
                loading: false,
                url: entry.url,
                previewUrl: entry.previewUrl,
                mockups: entry.mockups,
                variantId: entry.variantId,
                source: entry.source,
                printfulSummary: entry.printfulSummary,
                designData: data.designData,
                hasDesign: data.hasDesign ?? Boolean(data.designData),
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

  const handleEditorSave = async (designData: any) => {
    if (editingQR) {
      await uploadDesignToServer(editingQR.code, designData)
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

    // Preparar los productos origen
    const sourceMigrated = migrateLegacyDesign(sourceDesign.designData)
    const sourceProducts = sourceMigrated.products || []

    // Validar que no se copien diseños entre tipos de productos incompatibles
    for (const targetCode of selectedTargetQRs) {
      const targetDesign = designs[targetCode]?.designData
      if (targetDesign) {
        const targetMigrated = migrateLegacyDesign(targetDesign)
        const targetProducts = targetMigrated.products || []
        
        // Si el destino tiene productos, verificar que sean del mismo tipo
        if (targetProducts.length > 0) {
          const sourceProductIds = new Set(sourceProducts.map(p => p.productId))
          const targetProductIds = new Set(targetProducts.map(p => p.productId))
          
          // Verificar que haya al menos un producto en común
          const hasCommonProducts = Array.from(sourceProductIds).some(id => targetProductIds.has(id))
          
          if (!hasCommonProducts && targetProducts.length > 0) {
            toast.error(`El QR ${targetCode} tiene productos de tipo diferente. No se puede copiar el diseño de camisetas a tazas, etc.`)
            setCopyingDesign(false)
            return
          }
        }
      }
    }

    setCopyingDesign(true)
    try {
      // Obtener QRs destino (excluyendo el QR origen)
      const targetQRs = qrs.filter(qr => 
        selectedTargetQRs.includes(qr.code) && qr.code !== sourceDesign.code
      )

      const copyPromises = targetQRs.map(async (targetQR) => {
        // Obtener el diseño actual del QR destino
        const targetResponse = await fetch(`/api/design/${targetQR.code}`)
        const targetDesignData = targetResponse.ok ? (await targetResponse.json()).designData : null
        
        const clonedDesign = JSON.parse(JSON.stringify(sourceDesign.designData || {}))
        clonedDesign.qrCode = targetQR.code
        clonedDesign.copiedFrom = sourceDesign.code
        clonedDesign.copiedAt = new Date().toISOString()
        clonedDesign.targetQRCode = targetQR.code
        clonedDesign.targetQRUrl = targetQR.destination_url
        
        // Copiar productos pero respetando tallas existentes en el destino
        if (clonedDesign.products && targetDesignData) {
          const migratedTarget = migrateLegacyDesign(targetDesignData)
          const targetProducts = migratedTarget.products || []
          
          if (targetProducts.length > 0) {
            // Si el destino tiene productos, hacer match por productId y respetar sus tallas
            clonedDesign.products.forEach((sourceProduct: any) => {
              const matchingTargetProduct = targetProducts.find(
                (tp: any) => tp.productId === sourceProduct.productId
              )
              
              if (matchingTargetProduct) {
                // Respetar la talla, color y variantId del QR destino
                sourceProduct.size = matchingTargetProduct.size || sourceProduct.size
                sourceProduct.color = matchingTargetProduct.color || sourceProduct.color
                sourceProduct.colorCode = matchingTargetProduct.colorCode || sourceProduct.colorCode
                sourceProduct.variantId = matchingTargetProduct.variantId || sourceProduct.variantId
              }
            })
          }
          // Si el destino NO tiene productos, se copian tal cual del origen (ya están en clonedDesign)
        }
        
        // Regenerar archivos de QR para el nuevo QR
        console.log(`Regenerando QR files para ${targetQR.code}...`)
        await regenerateQRFiles(clonedDesign, sourceDesign.code, targetQR.code, qrs)
        
        if (clonedDesign.printful) {
          clonedDesign.printful = {
            ...clonedDesign.printful,
            qrCode: targetQR.code,
          }
        }
        if (clonedDesign.printfulProduct) {
          clonedDesign.printfulProduct = {
            ...clonedDesign.printfulProduct,
            qrCode: targetQR.code,
          }
        }

        await uploadDesignToServer(targetQR.code, clonedDesign)
        return targetQR.code
      })

      const copiedCodes = await Promise.all(copyPromises)

      toast.success(`Diseno copiado a ${copiedCodes.length} QR(s). QRs regenerados correctamente.`)
      setCopyDesignOpen(false)
      setSourceDesign(null)
      setSelectedTargetQRs([])

    } catch (error) {
      console.error('Error copying design:', error)
      toast.error('Error al copiar el diseno')
    } finally {
      setCopyingDesign(false)
    }
  }

  const regenerateQRFiles = async (clonedDesign: any, sourceQRCode: string, targetQRCode: string, availableQRs: QRRow[]) => {
    try {
      // Buscar archivos de QR en el diseño clonado
      const placements = clonedDesign.designsByPlacement || clonedDesign.printful?.placements || {}
      
      for (const [placement, value] of Object.entries(placements)) {
        let imageUrl: string | null = null
        
        if (typeof value === 'string') {
          imageUrl = value
        } else if (value && typeof value === 'object' && 'imageUrl' in value) {
          imageUrl = (value as any).imageUrl
        }
        
        // Si es un archivo de QR (contiene '-qr.png' o 'qr' en la URL)
        if (imageUrl && (imageUrl.includes('-qr.png') || imageUrl.includes('qr'))) {
          console.log(`Regenerando QR para placement ${placement}: ${sourceQRCode} -> ${targetQRCode}`)
          
          // Generar nueva imagen QR para el target QR (usar URL corta como el QR original)
          const targetQR = availableQRs.find(qr => qr.code === targetQRCode)
          const targetQRUrl = targetQR ? targetQR.qr_url : targetQRCode
          
          const { generateStandardQR } = await import('@/lib/qr-generator')
          const qrDataUrl = await generateStandardQR(targetQRUrl)
          
          // Convertir a archivo
          const qrResponse = await fetch(qrDataUrl)
          const blob = await qrResponse.blob()
          const qrFile = new File([blob], `qr-${targetQRCode}.png`, { type: 'image/png' })
          
          // Subir nuevo QR
          const formData = new FormData()
          formData.append('file', qrFile)
          formData.append('code', `${targetQRCode}-${placement}`)
          formData.append('placement', placement)
          
          const uploadResponse = await fetch('/api/design/upload-qr', {
            method: 'POST',
            body: formData,
          })
          
          const uploadData = await uploadResponse.json()
          if (!uploadResponse.ok || !uploadData.success) {
            console.error('Error regenerating QR:', uploadData.error)
            continue
          }
          
          // Actualizar la URL en el diseño clonado
          if (typeof value === 'string') {
            clonedDesign.designsByPlacement[placement] = uploadData.url
          } else if (value && typeof value === 'object') {
            (value as any).imageUrl = uploadData.url
          }
          
          // CRÍTICO: También actualizar en printful.placements si existe
          if (clonedDesign.printful?.placements?.[placement]) {
            clonedDesign.printful.placements[placement].imageUrl = uploadData.url
          }
          
          console.log(`QR regenerado para ${placement}: ${uploadData.url}`)
        }
      }
    } catch (error) {
      console.error('Error regenerating QR files:', error)
      // No lanzar error para no interrumpir la copia completa
    }
  }

  const uploadDesignToServer = async (code: string, designData: any) => {
    setDesigns((prev) => ({
      ...prev,
      [code]: {
        ...(prev[code] || {}),
        loading: true
      }
    }))

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
      console.log('=== CLIENT SIDE DEBUG ===')
      console.log('Response status:', uploadResponse.status)
      console.log('Response ok:', uploadResponse.ok)
      console.log('Response data:', data)
      
      if (!uploadResponse.ok || !data.success) {
        console.error('Save failed:', { status: uploadResponse.status, data })
        throw new Error(data.error || 'Error al guardar el diseno')
      }

      setDesigns((prev) => {
        const entry = buildDesignStateEntry(designData, designData.printFileUrl || prev[code]?.previewUrl || prev[code]?.url)
        return {
          ...prev,
          [code]: {
            ...(prev[code] || {}),
            ...entry,
            loading: false,
            hasDesign: true,
            designData,
          },
        }
      })
      
      // Notificar cambio de diseño para actualizar precios
      onDesignChanged?.()
    } catch (error) {
      console.error('Error uploading design:', error)
      setDesigns((prev) => ({
        ...prev,
        [code]: {
          ...(prev[code] || {}),
          loading: false,
        },
      }))
      throw (error instanceof Error ? error : new Error('Error al guardar el diseno'))
    }
  }

  const viewingSummary = viewingDesign?.designData ? extractPrintfulSummary(viewingDesign.designData) : null
  const viewingPreviewUrl =
    viewingSummary?.previewUrl ||
    viewingDesign?.designData?.canvasData ||
    viewingDesign?.designData?.imageUrl ||
    viewingDesign?.designData?.printFileUrl ||
    viewingDesign?.designData?.printFilePath
  const viewingMockups = viewingSummary?.mockups ?? []
  const viewingPlacements =
    viewingSummary?.placements && typeof viewingSummary.placements === 'object'
      ? Object.entries(viewingSummary.placements as Record<string, any>)
      : []

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
            const previewUrl =
              designState?.previewUrl ||
              (designState?.url && designState.url !== 'design-saved' ? designState.url : undefined)
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
                      </div>
                    )}

                    <div className="rounded-2xl border border-dashed border-gray-300/60 bg-gray-50/80 p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-inner shadow-black/5">
                            <ImageIcon className="h-6 w-6 text-primary-500" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">Mockups</p>
                            <p className="text-xs text-gray-500">Gestiona las creatividades y genera mockups oficiales.</p>
                          </div>
                        </div>
                        <button
                          onClick={() => uploadDesign(qr.code)}
                          className="inline-flex items-center gap-2 rounded-full border border-gray-200/60 px-4 py-2 text-xs font-semibold text-gray-600 transition hover:border-primary-200 hover:text-primary-600"
                        >
                          <UploadCloud className="h-4 w-4" />
                          {designState?.loading ? 'Preparando editor...' : 'Editar diseño'}
                        </button>
                      </div>
                      <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200/40 bg-white">
                        {designState?.loading ? (
                          <div className="flex h-40 items-center justify-center text-sm text-gray-500">
                            <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
                            <span className="ml-2">Procesando PNG...</span>
                          </div>
                        ) : designState?.hasDesign ? (
                          <div className="flex flex-col gap-4 p-4 text-sm text-gray-600">
                            {/* Lista de productos asociados */}
                            <QRProductsList 
                              designData={designState.designData}
                              onAddProduct={() => {
                                setEditingQR(qr)
                                setEditorOpen(true)
                              }}
                              onOpenTrash={() => {
                                setTrashQRCode(qr.code)
                                setProductTrashOpen(true)
                              }}
                              onDeleteProduct={async (productId) => {
                                // Marcar producto como eliminado
                                const currentDesign = designState.designData
                                if (currentDesign?.products) {
                                  const updatedProducts = currentDesign.products.map((p: any) =>
                                    p.id === productId ? { ...p, deletedAt: new Date().toISOString() } : p
                                  )
                                  const updatedDesign = { ...currentDesign, products: updatedProducts }
                                  await uploadDesignToServer(qr.code, updatedDesign)
                                  toast.success('Producto movido a la papelera')
                                }
                              }}
                            />
                            
                            {designState?.printfulSummary?.isPrintful ? (
                              <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                  {previewUrl ? (
                                    <img
                                      src={previewUrl}
                                      alt={`Mockup ${qr.code}`}
                                      className="h-20 w-20 rounded-xl border border-gray-200 object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                                      <ImageIcon className="h-6 w-6" />
                                    </div>
                                  )}
                                  <div>
                                    <p className="font-semibold text-gray-900">Diseño guardado</p>
                                    <p className="text-xs text-gray-500">
                                      Variante {designState.printfulSummary?.variantId ?? 'N/A'} -{' '}
                                      {designState.printfulSummary?.size ?? 'Sin talla'} -{' '}
                                      {designState.printfulSummary?.color ?? 'Sin color'}
                                    </p>
                                  </div>
                                </div>
                                {designState.mockups && designState.mockups.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {designState.mockups.slice(0, 4).map((mockup) => (
                                      <img
                                        key={`${mockup.placement}-${mockup.url}`}
                                        src={mockup.url}
                                        alt={`Mockup ${mockup.placement}`}
                                        className="h-16 w-16 rounded-lg border border-gray-100 object-cover"
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-2 text-center">
                                <div className="font-semibold text-green-600">Diseno guardado</div>
                                {previewUrl && (
                                  <img
                                    src={previewUrl}
                                    alt={`Diseno ${qr.code}`}
                                    className="h-24 w-24 rounded-xl border border-gray-100 object-cover"
                                  />
                                )}
                                <p className="text-xs text-gray-500">Diseno legacy guardado para este QR.</p>
                              </div>
                            )}
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => handleViewDesign(qr.code)}
                                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                              >
                                <Eye className="h-3.5 w-3.5" /> Ver diseno
                              </button>
                              <button
                                onClick={() => handleCopyDesign(qr.code)}
                                className="inline-flex items-center gap-2 rounded-full border border-green-200 px-3 py-1.5 text-xs font-semibold text-green-700 transition hover:border-green-300 hover:text-green-800"
                              >
                                <Copy className="h-3.5 w-3.5" /> Copiar diseno
                              </button>
                              <button
                                onClick={() => uploadDesign(qr.code)}
                                className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-primary-200 hover:text-primary-600"
                              >
                                <UploadCloud className="h-3.5 w-3.5" /> Editar diseño
                              </button>
                            </div>
                          </div>
                        ) : previewUrl ? (
                          <div className="relative">
                            <img src={previewUrl} alt={`Diseno ${qr.title ?? qr.code}`} className="w-full rounded-2xl object-contain bg-gray-50" />
                            <a
                              href={previewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-primary-600 shadow"
                            >
                              <Eye className="h-3.5 w-3.5" /> Ver archivo
                            </a>
                          </div>
                        ) : (
                          <div className="flex h-40 items-center justify-center text-sm text-gray-500">
                            No hay diseño todavía. Genera un mockup.
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
      
      {/* Editor de Diseño Multi-Producto */}
      {editorOpen && editingQR && (
        <MultiProductDesignEditor
          // Use short code for filenames/metadatos
          qrCode={editingQR.code}
          // Use canonical content (same as dashboard) for QR encoding
          qrContent={editingQR.qr_url}
          onClose={() => {
            setEditorOpen(false)
            setEditingQR(null)
          }}
          onSave={handleEditorSave}
          savedDesignData={designs[editingQR.code]?.designData}
        />
      )}

      {/* Modal para ver diseño multi-producto */}
      {viewDesignOpen && viewingDesign && (
        <ViewMultiProductDesignModal
          qrCode={viewingDesign.code}
          designData={viewingDesign.designData}
          onClose={() => {
            setViewDesignOpen(false)
            setViewingDesign(null)
          }}
          onEdit={(code) => {
            const qr = qrs.find(q => q.code === code)
            if (qr) {
              setEditingQR(qr)
              setEditorOpen(true)
            }
          }}
        />
      )}
      {/* Modal para copiar diseno */}
      {copyDesignOpen && sourceDesign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Copiar diseno - {sourceDesign.code}
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
                {/* Informacion del diseno origen */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Diseño origen</h4>
                  <div className="text-sm text-blue-700">
                    <div>QR: {sourceDesign.code}</div>
                    <div>Productos: {(() => {
                      const migrated = migrateLegacyDesign(sourceDesign.designData)
                      return migrated.products.map(p => p.productName).join(', ')
                    })()}</div>
                  </div>
                </div>

                {/* Seleccion de QRs destino */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Seleccionar QRs destino (solo productos homogéneos)</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {(() => {
                      const sourceMigrated = migrateLegacyDesign(sourceDesign.designData)
                      const sourceProductIds = new Set(sourceMigrated.products.map(p => p.productId))
                      
                      const compatibleQRs = qrs
                        .filter(qr => qr.code !== sourceDesign.code)
                        .filter(qr => {
                          const targetDesign = designs[qr.code]?.designData
                          if (!targetDesign) return false
                          
                          const targetMigrated = migrateLegacyDesign(targetDesign)
                          const targetProductIds = new Set(targetMigrated.products.map(p => p.productId))
                          
                          // Verificar que ambos conjuntos sean iguales
                          return (
                            sourceProductIds.size === targetProductIds.size &&
                            Array.from(sourceProductIds).every(id => targetProductIds.has(id))
                          )
                        })
                      
                      if (compatibleQRs.length === 0) {
                        return (
                          <div className="bg-yellow-50 p-4 rounded-lg text-sm text-yellow-800">
                            No hay QRs compatibles. Solo se pueden copiar diseños entre QRs que tengan exactamente los mismos productos.
                          </div>
                        )
                      }
                      
                      return compatibleQRs.map((qr) => (
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
                              {qr.title || 'Sin titulo'} ({qr.code})
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
                      ))
                    })()}
                  </div>
                </div>

                {/* Informacion sobre la copia */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">OK Copia automatica</h4>
                  <div className="text-sm text-green-700 space-y-1">
                    <div>- Se copiaran las imagenes y posiciones del diseno</div>
                    <div>- Los QRs se sustituiran automaticamente por el QR correcto de cada destino</div>
                    <div>- Si un QR ya tiene diseno, se sobrescribira</div>
                    <div>- Cada QR mantendra su URL unica pero con el mismo diseno</div>
                  </div>
                </div>

                {/* Botones de accion */}
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

      {/* Modal de Papelera de Productos */}
      {productTrashOpen && trashQRCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Trash2 className="h-6 w-6 text-gray-700" />
                <h2 className="text-2xl font-bold text-gray-900">Papelera de Productos</h2>
              </div>
              <button
                onClick={() => {
                  setProductTrashOpen(false)
                  setTrashQRCode(null)
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {(() => {
              const designState = designs[trashQRCode]
              const currentDesign = designState?.designData
              const trashedProducts = currentDesign?.products?.filter((p: any) => p.deletedAt) || []

              return trashedProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Trash2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">La papelera está vacía</h3>
                  <p className="text-gray-600">Los productos eliminados aparecerán aquí</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {trashedProducts.map((product: any) => (
                    <div key={product.id} className="flex items-center justify-between p-4 rounded-xl border-2 border-gray-200 bg-gray-50">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{product.productName}</div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                          {product.size && (
                            <span className="px-2 py-0.5 bg-white rounded border border-gray-200">
                              {product.size}
                            </span>
                          )}
                          {product.color && (
                            <span className="flex items-center gap-1">
                              {product.colorCode && (
                                <span
                                  className="w-3 h-3 rounded-full border border-gray-300"
                                  style={{ backgroundColor: product.colorCode }}
                                />
                              )}
                              {product.color}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Eliminado: {new Date(product.deletedAt).toLocaleString('es-ES')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={async () => {
                            // Restaurar producto
                            const updatedProducts = currentDesign.products.map((p: any) =>
                              p.id === product.id ? { ...p, deletedAt: null } : p
                            )
                            const updatedDesign = { ...currentDesign, products: updatedProducts }
                            await uploadDesignToServer(trashQRCode, updatedDesign)
                            toast.success('Producto restaurado')
                          }}
                          className="px-3 py-1.5 text-sm font-semibold text-green-600 border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors"
                        >
                          Restaurar
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm('¿Eliminar permanentemente este producto? Esta acción no se puede deshacer.')) {
                              // Eliminar permanentemente
                              const updatedProducts = currentDesign.products.filter((p: any) => p.id !== product.id)
                              const updatedDesign = { ...currentDesign, products: updatedProducts }
                              await uploadDesignToServer(trashQRCode, updatedDesign)
                              toast.success('Producto eliminado permanentemente')
                              
                              // Si no quedan productos en la papelera, cerrar el modal
                              const remainingTrashed = updatedProducts.filter((p: any) => p.deletedAt)
                              if (remainingTrashed.length === 0) {
                                setProductTrashOpen(false)
                                setTrashQRCode(null)
                              }
                            }
                          }}
                          className="px-3 py-1.5 text-sm font-semibold text-red-600 border-2 border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
