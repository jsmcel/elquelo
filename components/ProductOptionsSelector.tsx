'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown } from 'lucide-react'

interface ProductOptionsSelectorProps {
  onOptionsChange: (options: {
    size: string
    color: string
    gender: string
  }) => void
  initialOptions?: {
    size?: string
    color?: string
    gender?: string
  }
  className?: string
}

const SIZES = [
  'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'
]

const COLORS = [
  { name: 'Blanco', value: 'white', hex: '#FFFFFF' },
  { name: 'Negro', value: 'black', hex: '#000000' },
  { name: 'Gris', value: 'gray', hex: '#808080' },
  { name: 'Azul', value: 'blue', hex: '#0000FF' },
  { name: 'Rojo', value: 'red', hex: '#FF0000' },
  { name: 'Verde', value: 'green', hex: '#00FF00' },
  { name: 'Amarillo', value: 'yellow', hex: '#FFFF00' },
  { name: 'Rosa', value: 'pink', hex: '#FFC0CB' },
  { name: 'Naranja', value: 'orange', hex: '#FFA500' },
  { name: 'Morado', value: 'purple', hex: '#800080' }
]

const GENDERS = [
  { name: 'Unisex', value: 'unisex' },
  { name: 'Chica', value: 'chica' },
  { name: 'Chico', value: 'chico' }
]

export function ProductOptionsSelector({ 
  onOptionsChange, 
  initialOptions = {},
  className = '' 
}: ProductOptionsSelectorProps) {
  const [selectedSize, setSelectedSize] = useState(initialOptions.size || '')
  const [selectedColor, setSelectedColor] = useState(initialOptions.color || '')
  const [selectedGender, setSelectedGender] = useState(initialOptions.gender || '')
  const [isSizeOpen, setIsSizeOpen] = useState(false)
  const [isColorOpen, setIsColorOpen] = useState(false)
  const [isGenderOpen, setIsGenderOpen] = useState(false)
  
  const sizeRef = useRef<HTMLDivElement>(null)
  const colorRef = useRef<HTMLDivElement>(null)
  const genderRef = useRef<HTMLDivElement>(null)

  // Función para detectar si el dropdown debe abrirse hacia arriba
  const shouldOpenUpward = (ref: React.RefObject<HTMLDivElement>) => {
    if (!ref.current) return false
    const rect = ref.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    return rect.bottom + 240 > viewportHeight // 240px es aproximadamente la altura del dropdown
  }

  // Cerrar dropdowns cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sizeRef.current && !sizeRef.current.contains(event.target as Node)) {
        setIsSizeOpen(false)
      }
      if (colorRef.current && !colorRef.current.contains(event.target as Node)) {
        setIsColorOpen(false)
      }
      if (genderRef.current && !genderRef.current.contains(event.target as Node)) {
        setIsGenderOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleOptionChange = (type: 'size' | 'color' | 'gender', value: string) => {
    if (type === 'size') {
      setSelectedSize(value)
      setIsSizeOpen(false)
    } else if (type === 'color') {
      setSelectedColor(value)
      setIsColorOpen(false)
    } else if (type === 'gender') {
      setSelectedGender(value)
      setIsGenderOpen(false)
    }

    // Notificar cambios
    const newOptions = {
      size: type === 'size' ? value : selectedSize,
      color: type === 'color' ? value : selectedColor,
      gender: type === 'gender' ? value : selectedGender
    }
    onOptionsChange(newOptions)
  }

  const selectedColorInfo = COLORS.find(c => c.value === selectedColor)

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900">Opciones de producto</h3>
      
      {/* Talla */}
      <div className="relative" ref={sizeRef}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Talla
        </label>
        <button
          type="button"
          onClick={() => setIsSizeOpen(!isSizeOpen)}
          className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <span className={selectedSize ? 'text-gray-900' : 'text-gray-500'}>
            {selectedSize || 'Seleccionar talla'}
          </span>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>
        
        {isSizeOpen && (
          <div className={`absolute z-50 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden ${
            shouldOpenUpward(sizeRef) ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}>
            <div className="max-h-60 overflow-y-auto">
              {SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => handleOptionChange('size', size)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-100"
                >
                  <span>{size}</span>
                  {selectedSize === size && (
                    <Check className="h-4 w-4 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Color */}
      <div className="relative" ref={colorRef}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Color
        </label>
        <button
          type="button"
          onClick={() => setIsColorOpen(!isColorOpen)}
          className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <div className="flex items-center">
            {selectedColorInfo && (
              <div 
                className="w-4 h-4 rounded-full mr-2 border border-gray-300"
                style={{ backgroundColor: selectedColorInfo.hex }}
              />
            )}
            <span className={selectedColor ? 'text-gray-900' : 'text-gray-500'}>
              {selectedColorInfo?.name || 'Seleccionar color'}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>
        
        {isColorOpen && (
          <div className={`absolute z-50 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden ${
            shouldOpenUpward(colorRef) ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}>
            <div className="max-h-60 overflow-y-auto">
              {COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => handleOptionChange('color', color.value)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded-full mr-2 border border-gray-300"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span>{color.name}</span>
                  </div>
                  {selectedColor === color.value && (
                    <Check className="h-4 w-4 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Género */}
      <div className="relative" ref={genderRef}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Género
        </label>
        <button
          type="button"
          onClick={() => setIsGenderOpen(!isGenderOpen)}
          className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <span className={selectedGender ? 'text-gray-900' : 'text-gray-500'}>
            {GENDERS.find(g => g.value === selectedGender)?.name || 'Seleccionar género'}
          </span>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>
        
        {isGenderOpen && (
          <div className={`absolute z-50 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden ${
            shouldOpenUpward(genderRef) ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}>
            <div className="max-h-60 overflow-y-auto">
              {GENDERS.map((gender) => (
                <button
                  key={gender.value}
                  type="button"
                  onClick={() => handleOptionChange('gender', gender.value)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-100"
                >
                  <span>{gender.name}</span>
                  {selectedGender === gender.value && (
                    <Check className="h-4 w-4 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Resumen de selección */}
      {(selectedSize || selectedColor || selectedGender) && (
        <div className="bg-gray-50 p-3 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Resumen:</h4>
          <div className="text-sm text-gray-600 space-y-1">
            {selectedSize && <div>Talla: {selectedSize}</div>}
            {selectedColorInfo && (
              <div className="flex items-center">
                <span>Color: {selectedColorInfo.name}</span>
                <div 
                  className="w-3 h-3 rounded-full ml-2 border border-gray-300"
                  style={{ backgroundColor: selectedColorInfo.hex }}
                />
              </div>
            )}
            {selectedGender && (
              <div>Género: {GENDERS.find(g => g.value === selectedGender)?.name}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
