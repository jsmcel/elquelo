'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Upload, Download, RotateCcw, ZoomIn, ZoomOut, Move, Image as ImageIcon, QrCode } from 'lucide-react'
import { toast } from 'react-hot-toast'
import QRCode from 'qrcode'
import { ProductOptionsSelector } from './ProductOptionsSelector'

interface TShirtEditorProps {
  isOpen: boolean
  onClose: () => void
  qrCode: string
  qrUrl: string
  participantName: string
  onSave: (designData: {
    imageUrl: string;
    position: { x: number; y: number; scale: number; rotation: number };
    qrPosition: { x: number; y: number; scale: number; rotation: number };
    side: string;
    printArea: { name: string; dimensions: string; maxWidth: number; maxHeight: number };
    confirmedQRs?: any[];
    confirmedImages?: any[];
    productOptions?: {
      size: string;
      color: string;
      gender: string;
    };
    printFileUrl?: string | null;
    printFilePath?: string | null;
    printUploadedAt?: string;
  }) => Promise<void> | void
  savedDesignData?: any
}

export function TShirtEditor({ isOpen, onClose, qrCode, qrUrl, participantName, onSave, savedDesignData }: TShirtEditorProps) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0, scale: 1, rotation: 0 })
  const [qrPosition, setQrPosition] = useState({ x: 0, y: 0, scale: 1, rotation: 0 })
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isDraggingQR, setIsDraggingQR] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isResizing, setIsResizing] = useState(false)
  const [currentSide, setCurrentSide] = useState<'front' | 'back' | 'left-chest' | 'right-chest' | 'left-sleeve' | 'right-sleeve'>('front')
  const [showQR, setShowQR] = useState(false)
  const [confirmedQRs, setConfirmedQRs] = useState<Array<{
    id: string
    position: { x: number; y: number; scale: number; rotation: number }
    side: string
  }>>([])
  const [currentQRId, setCurrentQRId] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editingElement, setEditingElement] = useState<{type: 'qr' | 'image', id: string} | null>(null)
  const [confirmedImages, setConfirmedImages] = useState<Array<{
    id: string
    position: { x: number; y: number; scale: number; rotation: number }
    side: string
    imageUrl: string
  }>>([])
  const [currentImageId, setCurrentImageId] = useState<string | null>(null)
  const [productOptions, setProductOptions] = useState({
    size: '',
    color: '',
    gender: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const tshirtRef = useRef<HTMLDivElement>(null)

  // Generar QR como imagen
  const [qrImage, setQrImage] = useState<string>('')

  useEffect(() => {
    if (qrUrl) {
      // Generar QR real usando la librería
      QRCode.toDataURL(qrUrl, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }).then((dataUrl) => {
        setQrImage(dataUrl)
      }).catch((error) => {
        console.error('Error generating QR:', error)
        // Fallback a un QR simple
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (ctx) {
          canvas.width = 200
          canvas.height = 200
          ctx.fillStyle = '#000'
          ctx.fillRect(10, 10, 180, 180)
          ctx.fillStyle = '#fff'
          ctx.font = '12px Arial'
          ctx.textAlign = 'center'
          ctx.fillText('QR Code', 100, 100)
          ctx.fillText(qrCode, 100, 120)
          setQrImage(canvas.toDataURL())
        }
      })
    }
  }, [qrUrl, qrCode])

  // Cargar datos guardados cuando se abre el editor
  useEffect(() => {
    if (savedDesignData && isOpen) {
      // Cargar imagen si existe
      if (savedDesignData.imageUrl) {
        setUploadedImage(savedDesignData.imageUrl)
        setImagePosition(savedDesignData.position || { x: 0, y: 0, scale: 1, rotation: 0 })
      }

      setUploadedFile(null)
      
      // Cargar QRs confirmados
      if (savedDesignData.confirmedQRs) {
        setConfirmedQRs(savedDesignData.confirmedQRs)
      }
      
      // Cargar imágenes confirmadas
      if (savedDesignData.confirmedImages) {
        setConfirmedImages(savedDesignData.confirmedImages)
      }
      
      // Cargar posición del QR
      if (savedDesignData.qrPosition) {
        setQrPosition(savedDesignData.qrPosition)
      }
      
      // Cargar vista actual
      if (savedDesignData.side) {
        setCurrentSide(savedDesignData.side)
      }
      
      // Cargar opciones de producto
      if (savedDesignData.productOptions) {
        setProductOptions(savedDesignData.productOptions)
      }
    }
  }, [savedDesignData, isOpen])

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type !== 'image/png' && file.type !== 'image/jpeg') {
        toast.error('Solo se permiten archivos PNG y JPEG')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string)
        setImagePosition({ x: 0, y: 0, scale: 1, rotation: 0 })
      }
      reader.readAsDataURL(file)
      setUploadedFile(file)
    }
  }

  const handleMouseDown = (e: React.MouseEvent, type: 'image' | 'qr') => {
    if (type === 'image' && uploadedImage) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y })
    } else if (type === 'qr') {
      setIsDraggingQR(true)
      setDragStart({ x: e.clientX - qrPosition.x, y: e.clientY - qrPosition.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && uploadedImage) {
      setImagePosition(prev => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      }))
    } else if (isDraggingQR) {
      setQrPosition(prev => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      }))
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setIsDraggingQR(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (uploadedImage) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      setImagePosition(prev => ({
        ...prev,
        scale: Math.max(0.1, Math.min(3, prev.scale * delta))
      }))
    }
  }

  const convertFileToPng = (file: File, fallbackName: string) =>
    new Promise<File>((resolve, reject) => {
      if (file.type === 'image/png') {
        const name = file.name?.toLowerCase().endsWith('.png')
          ? file.name
          : `${fallbackName}.png`
        resolve(name === file.name ? file : new File([file], name, { type: 'image/png' }))
        return
      }

      const objectUrl = URL.createObjectURL(file)
      const image = new Image()
      image.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = image.width
        canvas.height = image.height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          URL.revokeObjectURL(objectUrl)
          reject(new Error('No se pudo procesar la imagen'))
          return
        }
        ctx.drawImage(image, 0, 0)
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(objectUrl)
          if (!blob) {
            reject(new Error('No se pudo convertir la imagen a PNG'))
            return
          }
          resolve(new File([blob], `${fallbackName}.png`, { type: 'image/png' }))
        }, 'image/png')
      }
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('No se pudo procesar la imagen'))
      }
      image.src = objectUrl
    })

  const createFileFromSource = async (source: string, fallbackName: string) => {
    const response = await fetch(source)
    if (!response.ok) {
      throw new Error('No se pudo obtener la imagen para subir')
    }
    const blob = await response.blob()
    const type = blob.type || 'image/png'
    const extension = type.includes('/') ? `.${type.split('/')[1]}` : '.png'
    return new File([blob], `${fallbackName}${extension}`, { type })
  }

  const prepareFileForUpload = async () => {
    if (uploadedFile) {
      return convertFileToPng(uploadedFile, qrCode)
    }

    if (uploadedImage) {
      const fileFromImage = await createFileFromSource(uploadedImage, qrCode)
      return convertFileToPng(fileFromImage, qrCode)
    }

    return null
  }

  const handleDesignSave = async () => {
    if (!uploadedImage && !savedDesignData?.imageUrl) {
      toast.error('Sube una imagen primero')
      return
    }

    setIsSaving(true)
    try {
      const shouldUploadFile = Boolean(uploadedFile) || !savedDesignData?.printFileUrl
      let finalPrintFileUrl = savedDesignData?.printFileUrl || null
      let finalPrintFilePath = savedDesignData?.printFilePath || savedDesignData?.printStoragePath || null

      if (shouldUploadFile) {
        const fileForUpload = await prepareFileForUpload()
        if (!fileForUpload) {
          throw new Error('No se pudo preparar el archivo para subir')
        }

        const formData = new FormData()
        formData.append('code', qrCode)
        formData.append('file', fileForUpload)

        const uploadResponse = await fetch('/api/design/upload', {
          method: 'POST',
          body: formData
        })

        const uploadResult = await uploadResponse.json()
        if (!uploadResponse.ok || !uploadResult?.success || !uploadResult?.url) {
          throw new Error(uploadResult?.error || 'No se pudo subir el PNG')
        }

        finalPrintFileUrl = uploadResult.url
        finalPrintFilePath = uploadResult.path ?? null
      }

      const designData = {
        imageUrl: uploadedImage || savedDesignData?.imageUrl || '',
        position: imagePosition,
        qrPosition: qrPosition,
        side: currentSide,
        printArea: {
          name: getPrintAreaInfo(currentSide).name,
          dimensions: getPrintAreaInfo(currentSide).dimensions,
          maxWidth: getPrintAreaInfo(currentSide).maxWidth,
          maxHeight: getPrintAreaInfo(currentSide).maxHeight
        },
        confirmedQRs: confirmedQRs,
        confirmedImages: confirmedImages,
        productOptions: productOptions,
        printFileUrl: finalPrintFileUrl,
        printFilePath: finalPrintFilePath,
        printUploadedAt: new Date().toISOString()
      }

      await onSave(designData)
      setUploadedFile(null)
      toast.success('Diseño guardado con todos los elementos')
    } catch (error) {
      console.error('Error saving design', error)
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar el diseño')
    } finally {
      setIsSaving(false)
    }
  }

  const rotateImage = () => {
    setImagePosition(prev => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360
    }))
  }

  const resetImage = () => {
    setImagePosition({ x: 0, y: 0, scale: 1, rotation: 0 })
  }

  const getPrintAreaInfo = (side: string) => {
    // Áreas ajustadas según medidas reales de camiseta talla L
    const areas = {
      'front': { name: 'Frontal', dimensions: '30x45cm', maxWidth: 180, maxHeight: 220 },
      'back': { name: 'Espalda', dimensions: '30x45cm', maxWidth: 180, maxHeight: 220 },
      'left-chest': { name: 'Pecho Izquierdo', dimensions: '10x10cm', maxWidth: 70, maxHeight: 70 },
      'right-chest': { name: 'Pecho Derecho', dimensions: '10x10cm', maxWidth: 70, maxHeight: 70 },
      'left-sleeve': { name: 'Manga Izquierda', dimensions: '9x9cm', maxWidth: 55, maxHeight: 55 },
      'right-sleeve': { name: 'Manga Derecha', dimensions: '9x9cm', maxWidth: 55, maxHeight: 55 }
    }
    return areas[side as keyof typeof areas] || areas.front
  }

  const getTShirtImage = (side: string) => {
    // Usar las imágenes PNG reales desde la carpeta public
    const images = {
      'front': '/images/tshirts/frente.png',
      'back': '/images/tshirts/espalda.png',
      'left-chest': '/images/tshirts/frente.png', // Usar frente para pecho izquierdo
      'right-chest': '/images/tshirts/frente.png', // Usar frente para pecho derecho
      'left-sleeve': '/images/tshirts/manga izquierda.png',
      'right-sleeve': '/images/tshirts/manga derecha.png'
    }
    return images[side as keyof typeof images] || images.front
  }

  const getPrintAreaStyle = (side: string) => {
    // Áreas de impresión a escala real según medidas de camiseta talla L
    // Camiseta: 50.5cm ancho x 71.6cm largo
    const styles = {
      'front': { 
        left: '30%', 
        top: '30%', 
        width: '141px', 
        height: '172px',
        // 30x45cm en una camiseta de 50.5x71.6cm = área reducida 8% y movida 5% a la derecha
      },
      'back': { 
        left: '30%', 
        top: '30%', 
        width: '141px', 
        height: '172px',
        // 30x45cm en una camiseta de 50.5x71.6cm = área reducida 8% y movida 5% a la derecha
      },
      'left-chest': { 
        left: '32%', 
        top: '30%', 
        width: '51px', 
        height: '51px',
        // 10x10cm en una camiseta de 50.5x71.6cm = CUADRADO perfecto reducido 15%
      },
      'right-chest': { 
        left: '50%', 
        top: '30%', 
        width: '51px', 
        height: '51px',
        // 10x10cm en una camiseta de 50.5x71.6cm = CUADRADO perfecto reducido 15%
      },
      'left-sleeve': { 
        left: '48%', 
        top: '32%', 
        width: '46px', 
        height: '46px',
        // 9x9cm en una camiseta de 50.5x71.6cm = CUADRADO perfecto reducido 15%
      },
      'right-sleeve': { 
        left: '39%', 
        top: '32%', 
        width: '46px', 
        height: '46px',
        // 9x9cm en una camiseta de 50.5x71.6cm = CUADRADO perfecto reducido 15%
      }
    }
    return styles[side as keyof typeof styles] || styles.front
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-6xl rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Editor de Camiseta</h2>
            <p className="text-sm text-gray-600">{participantName}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex h-[600px]">
          {/* Panel de herramientas */}
          <div className="w-80 border-r border-gray-200 bg-gray-50 p-6 relative" style={{ zIndex: 10 }}>
            <div className="space-y-6">
              {/* Insertar QR */}
              <div>
                <label className="mb-3 block text-sm font-medium text-gray-700">
                  Insertar QR
                </label>
                <button
                  onClick={() => {
                    setShowQR(true)
                    setCurrentQRId(Date.now().toString())
                    setQrPosition({ x: 0, y: 0, scale: 1, rotation: 0 })
                    toast.success('Mismo QR insertado en otra posición')
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  <QrCode className="h-5 w-5" />
                  {confirmedQRs.length > 0 ? 'Añadir QR en otra posición' : 'Insertar QR'}
                </button>
              </div>

              {/* Controles de QR */}
              {showQR && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700">Controles de QR</h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setQrPosition(prev => ({ ...prev, rotation: (prev.rotation + 90) % 360 }))}
                      className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Rotar QR
                    </button>
                    
                    <button
                      onClick={() => setQrPosition({ x: 0, y: 0, scale: 1, rotation: 0 })}
                      className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <Move className="h-4 w-4" />
                      Reset QR
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600">Escala QR: {Math.round(qrPosition.scale * 100)}%</label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={qrPosition.scale}
                      onChange={(e) => setQrPosition(prev => ({ ...prev, scale: parseFloat(e.target.value) }))}
                      className="w-full"
                    />
                  </div>

                  <button
                    onClick={() => {
                      if (currentQRId) {
                        setConfirmedQRs(prev => [...prev, {
                          id: currentQRId,
                          position: qrPosition,
                          side: currentSide
                        }])
                        setShowQR(false)
                        setCurrentQRId(null)
                        toast.success('Mismo QR fijado en nueva posición')
                      }
                    }}
                    className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                  >
                    Confirmar posición de QR
                  </button>
                </div>
              )}

              {/* Botón para pasar a editar diseño */}
              {confirmedQRs.length > 0 && !editMode && (
                <div className="space-y-4">
                  <button
                    onClick={() => {
                      setEditMode(true)
                      toast.success('Modo edición activado - Puedes subir PNGs')
                    }}
                    className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Editar Diseño
                  </button>
                </div>
              )}

              {/* Subir imagen - Solo en modo edición */}
              {editMode && (
                <div>
                  <label className="mb-3 block text-sm font-medium text-gray-700">
                    Subir diseño
                  </label>
                  <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-gray-300 bg-white p-6 transition hover:border-primary-400">
                    <Upload className="h-8 w-8 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600">Subir PNG/JPEG</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* Controles para editar elemento fijado */}
              {editingElement && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700">
                    Editando {editingElement.type === 'qr' ? 'QR' : 'Diseño'}
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        if (editingElement.type === 'qr') {
                          const qr = confirmedQRs.find(q => q.id === editingElement.id)
                          if (qr) {
                            setQrPosition(qr.position)
                            setShowQR(true)
                            setCurrentQRId(editingElement.id)
                          }
                        }
                        setEditingElement(null)
                        toast.success('Elemento en modo edición')
                      }}
                      className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <Move className="h-4 w-4" />
                      Mover
                    </button>
                    
                    <button
                      onClick={() => {
                        if (editingElement.type === 'qr') {
                          setConfirmedQRs(prev => prev.filter(item => item.id !== editingElement.id))
                        }
                        setEditingElement(null)
                        toast.success('Elemento eliminado')
                      }}
                      className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                    >
                      <X className="h-4 w-4" />
                      Eliminar
                    </button>
                  </div>

                  <button
                    onClick={() => setEditingElement(null)}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar edición
                  </button>
                </div>
              )}

              {/* Controles de imagen */}
              {uploadedImage && !currentImageId && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700">Controles de Diseño</h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={rotateImage}
                      className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Rotar
                    </button>
                    
                    <button
                      onClick={resetImage}
                      className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <Move className="h-4 w-4" />
                      Reset
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600">Escala Imagen: {Math.round(imagePosition.scale * 100)}%</label>
                    <input
                      type="range"
                      min="0.1"
                      max="3"
                      step="0.1"
                      value={imagePosition.scale}
                      onChange={(e) => setImagePosition(prev => ({ ...prev, scale: parseFloat(e.target.value) }))}
                      className="w-full"
                    />
                  </div>

                  <button
                    onClick={() => {
                      setCurrentImageId(Date.now().toString())
                      setConfirmedImages(prev => [...prev, {
                        id: Date.now().toString(),
                        position: imagePosition,
                        side: currentSide,
                        imageUrl: uploadedImage
                      }])
                      setUploadedImage(null)
                      toast.success('Diseño fijado en el diseño')
                    }}
                    className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                  >
                    Fijar posición del diseño
                  </button>
                </div>
              )}

              {/* Opciones de producto */}
              <div className="space-y-4">
                <ProductOptionsSelector
                  onOptionsChange={setProductOptions}
                  initialOptions={productOptions}
                />
              </div>


              {/* Información del QR */}
              <div className="rounded-lg bg-blue-50 p-4">
                <h3 className="text-sm font-medium text-blue-900">QR Code</h3>
                <p className="mt-1 text-xs text-blue-700">Código: {qrCode}</p>
                <p className="mt-1 text-xs text-blue-700">URL: {qrUrl}</p>
              </div>
            </div>
          </div>

          {/* Área de diseño */}
          <div className="flex-1 p-6">
            <div className="flex h-full flex-col items-center justify-center">
              {/* Selector de vista */}
              <div className="mb-6 space-y-3">
                <h3 className="text-sm font-medium text-gray-700">Área de Impresión</h3>
                
                {/* Información del área actual */}
                <div className="rounded-lg bg-blue-50 p-3">
                  <div className="text-xs font-medium text-blue-800">
                    {getPrintAreaInfo(currentSide).name}
                  </div>
                  <div className="text-xs text-blue-600">
                    Máximo: {getPrintAreaInfo(currentSide).dimensions}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setCurrentSide('front')}
                    className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                      currentSide === 'front'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Frontal (30x45cm)
                  </button>
                  <button
                    onClick={() => setCurrentSide('back')}
                    className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                      currentSide === 'back'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Espalda (30x45cm)
                  </button>
                  <button
                    onClick={() => setCurrentSide('left-chest')}
                    className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                      currentSide === 'left-chest'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Pecho Izq (10x10cm)
                  </button>
                  <button
                    onClick={() => setCurrentSide('right-chest')}
                    className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                      currentSide === 'right-chest'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Pecho Der (10x10cm)
                  </button>
                  <button
                    onClick={() => setCurrentSide('left-sleeve')}
                    className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                      currentSide === 'left-sleeve'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Manga Izq (9x9cm)
                  </button>
                  <button
                    onClick={() => setCurrentSide('right-sleeve')}
                    className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                      currentSide === 'right-sleeve'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Manga Der (9x9cm)
                  </button>
                </div>
              </div>

              {/* Camiseta realista */}
              <div 
                ref={tshirtRef}
                className="relative"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
              >
                <div className="relative h-[500px] w-[400px]">
                  {/* QR Codes fijados - Solo se muestran en la vista donde se fijaron */}
                  {confirmedQRs
                    .filter(qr => qr.side === currentSide)
                    .map((qr) => (
                    <div
                      key={qr.id}
                      className="absolute z-10 group"
                      style={{
                        transform: `translate(${qr.position.x}px, ${qr.position.y}px) scale(${qr.position.scale}) rotate(${qr.position.rotation}deg)`,
                        transformOrigin: 'center'
                      }}
                    >
                      <img 
                        src={qrImage} 
                        alt="QR Code" 
                        className="h-20 w-20 object-contain"
                      />
                      {/* Botones de edición/borrado */}
                      <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-1">
                          <button
                            onClick={() => setEditingElement({type: 'qr', id: qr.id})}
                            className="bg-blue-500 text-white rounded-full p-1 hover:bg-blue-600"
                            title="Editar QR"
                          >
                            <Move className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => {
                              setConfirmedQRs(prev => prev.filter(item => item.id !== qr.id))
                              toast.success('QR eliminado')
                            }}
                            className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            title="Eliminar QR"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* QR Code movible - Solo se muestra si showQR es true */}
                  {showQR && qrImage && (
                    <div
                      className="absolute z-20 cursor-move"
                      style={{
                        transform: `translate(${qrPosition.x}px, ${qrPosition.y}px) scale(${qrPosition.scale}) rotate(${qrPosition.rotation}deg)`,
                        transformOrigin: 'center'
                      }}
                      onMouseDown={(e) => handleMouseDown(e, 'qr')}
                    >
                      <img 
                        src={qrImage} 
                        alt="QR Code" 
                        className="h-20 w-20 object-contain"
                      />
                    </div>
                  )}

                  {/* Imágenes fijadas - Solo se muestran en la vista donde se fijaron */}
                  {confirmedImages
                    .filter(img => img.side === currentSide)
                    .map((img) => (
                    <div
                      key={img.id}
                      className="absolute z-10 group"
                      style={{
                        transform: `translate(${img.position.x}px, ${img.position.y}px) scale(${img.position.scale}) rotate(${img.position.rotation}deg)`,
                        transformOrigin: 'center'
                      }}
                    >
                      <img
                        src={img.imageUrl}
                        alt="Diseño"
                        className="max-h-40 max-w-40 object-contain rounded-lg shadow-lg"
                        draggable={false}
                      />
                      {/* Botones de edición/borrado */}
                      <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-1">
                          <button
                            onClick={() => setEditingElement({type: 'image', id: img.id})}
                            className="bg-blue-500 text-white rounded-full p-1 hover:bg-blue-600"
                            title="Editar Diseño"
                          >
                            <Move className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => {
                              setConfirmedImages(prev => prev.filter(item => item.id !== img.id))
                              toast.success('Diseño eliminado')
                            }}
                            className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            title="Eliminar Diseño"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Imagen subida por el usuario - Solo se muestra si no está fijada */}
                  {uploadedImage && !currentImageId && (
                    <div
                      className="absolute z-10 cursor-move"
                      style={{
                        transform: `translate(${imagePosition.x}px, ${imagePosition.y}px) scale(${imagePosition.scale}) rotate(${imagePosition.rotation}deg)`,
                        transformOrigin: 'center'
                      }}
                      onMouseDown={(e) => handleMouseDown(e, 'image')}
                    >
                      <img
                        src={uploadedImage}
                        alt="Diseño"
                        className="max-h-40 max-w-40 object-contain rounded-lg shadow-lg"
                        draggable={false}
                      />
                    </div>
                  )}

                  {/* Imágenes PNG reales de la carpeta tshirts - Detrás de la botonera */}
                  <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none" style={{ zIndex: 1 }}>
                    <div className="relative flex items-center justify-center w-full h-full">
                      <img
                        src={getTShirtImage(currentSide)}
                        alt={`Camiseta ${currentSide}`}
                        className="object-contain"
                        style={{ 
                          minHeight: '800px', 
                          minWidth: '600px',
                          maxHeight: '90vh',
                          maxWidth: '90vw'
                        }}
                      />
                      
                      {/* Área de impresión superpuesta */}
                      <div 
                        className="absolute border-2 border-red-500 border-dashed opacity-80"
                        style={{
                          ...getPrintAreaStyle(currentSide)
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 p-6">
          <button
            onClick={onClose}
            className="rounded-full border border-gray-200 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleDesignSave}
            disabled={isSaving || (confirmedQRs.length === 0 && confirmedImages.length === 0)}
            className="rounded-full bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? 'Guardando...' : 'Guardar Diseño'}
          </button>
        </div>
      </div>
    </div>
  )
}
