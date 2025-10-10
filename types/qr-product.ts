/**
 * Tipos para el sistema de múltiples productos por QR
 */

export interface QRProduct {
  id: string // UUID único del producto en el QR
  productId: number // ID del producto de Printful
  templateId: number // Template ID de Printful
  variantId: number // Variant ID específica (talla + color)
  productName: string
  size: string | null
  color: string | null
  colorCode: string | null
  
  // Diseños por placement (front, back, etc.)
  designsByPlacement: Record<string, string> // { placement: imageUrl }
  
  // Metadatos de diseño (dimensiones)
  designMetadata?: Record<string, { width: number; height: number }>
  
  // Mockups generados
  variantMockups?: Record<number, Record<string, { url: string; raw?: any }>>
  
  // Info adicional
  createdAt: string
  updatedAt: string
}

export interface QRDesignData {
  // Version para compatibilidad
  version: '2.0' // Nueva versión con múltiples productos
  
  // Array de productos asociados al QR
  products: QRProduct[]
  
  // Metadata general
  qrCode: string
  lastUpdated: string
  
  // Para compatibilidad con versión anterior (opcional)
  legacyDesign?: any
}

/**
 * Helper para migrar diseños antiguos al nuevo formato
 */
export function migrateLegacyDesign(oldDesign: any): QRDesignData {
  // Si ya está en formato nuevo, retornar
  if (oldDesign?.version === '2.0' && Array.isArray(oldDesign?.products)) {
    return oldDesign as QRDesignData
  }

  // Convertir diseño antiguo (1 producto) al nuevo formato
  const product: QRProduct = {
    id: crypto.randomUUID ? crypto.randomUUID() : `product-${Date.now()}`,
    productId: oldDesign?.printfulProduct?.productId || oldDesign?.productId || 71,
    templateId: oldDesign?.printfulProduct?.templateId || oldDesign?.templateId || 71,
    variantId: oldDesign?.printfulProduct?.variantId || oldDesign?.printful?.variantId || null,
    productName: oldDesign?.printfulProduct?.name || oldDesign?.productName || 'Producto',
    size: oldDesign?.printful?.size || oldDesign?.printfulProduct?.size || null,
    color: oldDesign?.printful?.color || oldDesign?.printfulProduct?.color || null,
    colorCode: oldDesign?.printful?.colorCode || oldDesign?.printfulProduct?.colorCode || null,
    designsByPlacement: oldDesign?.designsByPlacement || oldDesign?.printful?.placements || {},
    designMetadata: oldDesign?.designMetadata || oldDesign?.printful?.designMetadata || {},
    variantMockups: oldDesign?.variantMockups || oldDesign?.printful?.variantMockups || {},
    createdAt: oldDesign?.savedAt || oldDesign?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  return {
    version: '2.0',
    products: product.variantId ? [product] : [], // Solo agregar si tiene variantId válido
    qrCode: oldDesign?.qrCode || '',
    lastUpdated: new Date().toISOString(),
    legacyDesign: oldDesign // Guardar para referencia
  }
}

/**
 * Helper para validar que un diseño tiene al menos un producto válido
 */
export function isValidQRDesign(design: QRDesignData): boolean {
  return (
    design?.version === '2.0' &&
    Array.isArray(design?.products) &&
    design.products.length > 0 &&
    design.products.every(p => p.variantId && p.productId)
  )
}

/**
 * Helper para calcular el número total de productos en un QR
 */
export function getTotalProductCount(design: QRDesignData): number {
  return design?.products?.length || 0
}

