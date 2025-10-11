/**
 * Dimensiones optimizadas de áreas de impresión para productos Printful
 * 
 * FUENTES DE DATOS (en orden de prioridad):
 * 1. Printfiles API (mocks/printful-printfiles.json) - Actualizado diariamente a las 5 AM
 * 2. Dimensiones estándar documentadas (STANDARD_DIMENSIONS) - Basado en docs oficiales
 * 3. Fallbacks genéricos - Para productos sin datos específicos
 * 
 * Todas las dimensiones están en píxeles a 300 DPI:
 * - 1 inch = 300 pixels
 * - Por ejemplo: 12" × 16" = 3600px × 4800px
 */

export interface PlacementDimensions {
  placement: string
  label: string
  description: string
  // Dimensiones en píxeles a 300 DPI
  width: number
  height: number
  // Área total disponible
  areaWidth: number
  areaHeight: number
  // Posición (top, left) para centrar el diseño correctamente
  position: {
    top: number
    left: number
    width: number
    height: number
  }
}

/**
 * Dimensiones estándar de Printful para camisetas y productos de ropa
 * Fuente: https://www.printful.com/docs
 */
export const STANDARD_DIMENSIONS = {
  // Camisetas - Front (área estándar)
  TSHIRT_FRONT: {
    inches: { width: 12, height: 16 },
    pixels: { width: 3600, height: 4800 },
    position: { top: 0, left: 0 }
  },
  // Camisetas - Front Large (área grande)
  TSHIRT_FRONT_LARGE: {
    inches: { width: 15, height: 18 },
    pixels: { width: 4500, height: 5400 },
    position: { top: 0, left: 0 }
  },
  // Camisetas - Back (área trasera)
  TSHIRT_BACK: {
    inches: { width: 12, height: 16 },
    pixels: { width: 3600, height: 4800 },
    // Ajustado: top: 800px para evitar el cuello
    position: { top: 800, left: 0 }
  },
  // Camisetas - Mangas
  TSHIRT_SLEEVE: {
    inches: { width: 4, height: 3.5 },
    pixels: { width: 1200, height: 1050 },
    position: { top: 0, left: 0 }
  },
  // Sudaderas - Front
  SWEATSHIRT_FRONT: {
    inches: { width: 12, height: 16 },
    pixels: { width: 3600, height: 4800 },
    position: { top: 0, left: 0 }
  },
  // Sudaderas - Back
  SWEATSHIRT_BACK: {
    inches: { width: 12, height: 16 },
    pixels: { width: 3600, height: 4800 },
    position: { top: 800, left: 0 }
  },
  // Tazas - Wrap (área envolvente)
  MUG_WRAP: {
    inches: { width: 8.5, height: 3.5 },
    pixels: { width: 2475, height: 1155 },
    position: { top: 0, left: 0 }
  },
  // Tote Bags - Front
  TOTE_BAG_FRONT: {
    inches: { width: 15, height: 16 },
    pixels: { width: 4500, height: 4800 },
    position: { top: 0, left: 0 }
  },
  // Crop Top - Front
  CROP_TOP_FRONT: {
    inches: { width: 12, height: 12 },
    pixels: { width: 3600, height: 3600 },
    position: { top: 0, left: 0 }
  },
  // Gorras - Front
  CAP_FRONT: {
    inches: { width: 5, height: 2.5 },
    pixels: { width: 1500, height: 750 },
    position: { top: 0, left: 0 }
  },
  // Botellas - Wrap
  BOTTLE_WRAP: {
    inches: { width: 8.4, height: 4.5 },
    pixels: { width: 2520, height: 1350 },
    position: { top: 0, left: 0 }
  },
  // Libretas - Front/Back
  NOTEBOOK_COVER: {
    inches: { width: 5.5, height: 8.5 },
    pixels: { width: 1650, height: 2550 },
    position: { top: 0, left: 0 }
  }
} as const

/**
 * Configuraciones optimizadas por producto
 * Key: productId de Printful
 */
export const OPTIMIZED_PLACEMENTS_BY_PRODUCT: Record<number, PlacementDimensions[]> = {
  // 71: Unisex Staple T-Shirt | Bella + Canvas 3001
  71: [
    {
      placement: 'front',
      label: 'Frente',
      description: 'Área frontal estándar (12" × 16" / 30.5 × 40.6 cm)',
      width: STANDARD_DIMENSIONS.TSHIRT_FRONT.pixels.width,
      height: STANDARD_DIMENSIONS.TSHIRT_FRONT.pixels.height,
      areaWidth: STANDARD_DIMENSIONS.TSHIRT_FRONT.pixels.width,
      areaHeight: STANDARD_DIMENSIONS.TSHIRT_FRONT.pixels.height,
      position: {
        top: STANDARD_DIMENSIONS.TSHIRT_FRONT.position.top,
        left: STANDARD_DIMENSIONS.TSHIRT_FRONT.position.left,
        width: STANDARD_DIMENSIONS.TSHIRT_FRONT.pixels.width,
        height: STANDARD_DIMENSIONS.TSHIRT_FRONT.pixels.height,
      }
    },
    {
      placement: 'front_large',
      label: 'Frente Grande',
      description: 'Área frontal grande (15" × 18" / 38.1 × 45.7 cm) - Recomendado',
      width: STANDARD_DIMENSIONS.TSHIRT_FRONT_LARGE.pixels.width,
      height: STANDARD_DIMENSIONS.TSHIRT_FRONT_LARGE.pixels.height,
      areaWidth: STANDARD_DIMENSIONS.TSHIRT_FRONT_LARGE.pixels.width,
      areaHeight: STANDARD_DIMENSIONS.TSHIRT_FRONT_LARGE.pixels.height,
      position: {
        top: STANDARD_DIMENSIONS.TSHIRT_FRONT_LARGE.position.top,
        left: STANDARD_DIMENSIONS.TSHIRT_FRONT_LARGE.position.left,
        width: STANDARD_DIMENSIONS.TSHIRT_FRONT_LARGE.pixels.width,
        height: STANDARD_DIMENSIONS.TSHIRT_FRONT_LARGE.pixels.height,
      }
    },
    {
      placement: 'back',
      label: 'Espalda',
      description: 'Área trasera completa (12" × 16" / 30.5 × 40.6 cm)',
      width: 3600,
      height: 4000, // Reducido de 4800 para mejor centrado
      areaWidth: STANDARD_DIMENSIONS.TSHIRT_BACK.pixels.width,
      areaHeight: STANDARD_DIMENSIONS.TSHIRT_BACK.pixels.height,
      position: {
        top: 800, // Desplazado hacia abajo para evitar el cuello
        left: 0,
        width: 3600,
        height: 4000,
      }
    },
    {
      placement: 'sleeve_left',
      label: 'Manga Izquierda',
      description: 'Área de manga izquierda (4" × 3.5" / 10.2 × 8.9 cm)',
      width: STANDARD_DIMENSIONS.TSHIRT_SLEEVE.pixels.width,
      height: STANDARD_DIMENSIONS.TSHIRT_SLEEVE.pixels.height,
      areaWidth: STANDARD_DIMENSIONS.TSHIRT_SLEEVE.pixels.width,
      areaHeight: STANDARD_DIMENSIONS.TSHIRT_SLEEVE.pixels.height,
      position: {
        top: STANDARD_DIMENSIONS.TSHIRT_SLEEVE.position.top,
        left: STANDARD_DIMENSIONS.TSHIRT_SLEEVE.position.left,
        width: STANDARD_DIMENSIONS.TSHIRT_SLEEVE.pixels.width,
        height: STANDARD_DIMENSIONS.TSHIRT_SLEEVE.pixels.height,
      }
    },
    {
      placement: 'sleeve_right',
      label: 'Manga Derecha',
      description: 'Área de manga derecha (4" × 3.5" / 10.2 × 8.9 cm)',
      width: STANDARD_DIMENSIONS.TSHIRT_SLEEVE.pixels.width,
      height: STANDARD_DIMENSIONS.TSHIRT_SLEEVE.pixels.height,
      areaWidth: STANDARD_DIMENSIONS.TSHIRT_SLEEVE.pixels.width,
      areaHeight: STANDARD_DIMENSIONS.TSHIRT_SLEEVE.pixels.height,
      position: {
        top: STANDARD_DIMENSIONS.TSHIRT_SLEEVE.position.top,
        left: STANDARD_DIMENSIONS.TSHIRT_SLEEVE.position.left,
        width: STANDARD_DIMENSIONS.TSHIRT_SLEEVE.pixels.width,
        height: STANDARD_DIMENSIONS.TSHIRT_SLEEVE.pixels.height,
      }
    }
  ],
  
  // 145: Unisex Crew Neck Sweatshirt | Gildan 18000
  145: [
    {
      placement: 'front',
      label: 'Frente',
      description: 'Área frontal (12" × 16" / 30.5 × 40.6 cm)',
      width: STANDARD_DIMENSIONS.SWEATSHIRT_FRONT.pixels.width,
      height: STANDARD_DIMENSIONS.SWEATSHIRT_FRONT.pixels.height,
      areaWidth: STANDARD_DIMENSIONS.SWEATSHIRT_FRONT.pixels.width,
      areaHeight: STANDARD_DIMENSIONS.SWEATSHIRT_FRONT.pixels.height,
      position: {
        top: STANDARD_DIMENSIONS.SWEATSHIRT_FRONT.position.top,
        left: STANDARD_DIMENSIONS.SWEATSHIRT_FRONT.position.left,
        width: STANDARD_DIMENSIONS.SWEATSHIRT_FRONT.pixels.width,
        height: STANDARD_DIMENSIONS.SWEATSHIRT_FRONT.pixels.height,
      }
    },
    {
      placement: 'back',
      label: 'Espalda',
      description: 'Área trasera (12" × 16" / 30.5 × 40.6 cm)',
      width: 3600,
      height: 4000,
      areaWidth: STANDARD_DIMENSIONS.SWEATSHIRT_BACK.pixels.width,
      areaHeight: STANDARD_DIMENSIONS.SWEATSHIRT_BACK.pixels.height,
      position: {
        top: 800,
        left: 0,
        width: 3600,
        height: 4000,
      }
    }
  ],
  
  // 19: White Glossy Mug
  19: [
    {
      placement: 'default',
      label: 'Área de Impresión',
      description: 'Área envolvente de la taza (8.5" × 3.5" / 21.6 × 8.9 cm)',
      width: STANDARD_DIMENSIONS.MUG_WRAP.pixels.width,
      height: STANDARD_DIMENSIONS.MUG_WRAP.pixels.height,
      areaWidth: STANDARD_DIMENSIONS.MUG_WRAP.pixels.width,
      areaHeight: STANDARD_DIMENSIONS.MUG_WRAP.pixels.height,
      position: {
        top: STANDARD_DIMENSIONS.MUG_WRAP.position.top,
        left: STANDARD_DIMENSIONS.MUG_WRAP.position.left,
        width: STANDARD_DIMENSIONS.MUG_WRAP.pixels.width,
        height: STANDARD_DIMENSIONS.MUG_WRAP.pixels.height,
      }
    }
  ],
  
  // 257: All-Over Print Tote Bag
  257: [
    {
      placement: 'front',
      label: 'Frente',
      description: 'Área frontal (15" × 16" / 38.1 × 40.6 cm)',
      width: STANDARD_DIMENSIONS.TOTE_BAG_FRONT.pixels.width,
      height: STANDARD_DIMENSIONS.TOTE_BAG_FRONT.pixels.height,
      areaWidth: STANDARD_DIMENSIONS.TOTE_BAG_FRONT.pixels.width,
      areaHeight: STANDARD_DIMENSIONS.TOTE_BAG_FRONT.pixels.height,
      position: {
        top: STANDARD_DIMENSIONS.TOTE_BAG_FRONT.position.top,
        left: STANDARD_DIMENSIONS.TOTE_BAG_FRONT.position.left,
        width: STANDARD_DIMENSIONS.TOTE_BAG_FRONT.pixels.width,
        height: STANDARD_DIMENSIONS.TOTE_BAG_FRONT.pixels.height,
      }
    }
  ],
  
  // 242: All-Over Print Crop Top
  242: [
    {
      placement: 'front',
      label: 'Frente',
      description: 'Área frontal (12" × 12" / 30.5 × 30.5 cm)',
      width: STANDARD_DIMENSIONS.CROP_TOP_FRONT.pixels.width,
      height: STANDARD_DIMENSIONS.CROP_TOP_FRONT.pixels.height,
      areaWidth: STANDARD_DIMENSIONS.CROP_TOP_FRONT.pixels.width,
      areaHeight: STANDARD_DIMENSIONS.CROP_TOP_FRONT.pixels.height,
      position: {
        top: STANDARD_DIMENSIONS.CROP_TOP_FRONT.position.top,
        left: STANDARD_DIMENSIONS.CROP_TOP_FRONT.position.left,
        width: STANDARD_DIMENSIONS.CROP_TOP_FRONT.pixels.width,
        height: STANDARD_DIMENSIONS.CROP_TOP_FRONT.pixels.height,
      }
    }
  ],
  
  // 92: 5 Panel Cap | Yupoong 7005
  92: [
    {
      placement: 'front',
      label: 'Frente',
      description: 'Área frontal de la gorra (5" × 2.5" / 12.7 × 6.4 cm)',
      width: STANDARD_DIMENSIONS.CAP_FRONT.pixels.width,
      height: STANDARD_DIMENSIONS.CAP_FRONT.pixels.height,
      areaWidth: STANDARD_DIMENSIONS.CAP_FRONT.pixels.width,
      areaHeight: STANDARD_DIMENSIONS.CAP_FRONT.pixels.height,
      position: {
        top: STANDARD_DIMENSIONS.CAP_FRONT.position.top,
        left: STANDARD_DIMENSIONS.CAP_FRONT.position.left,
        width: STANDARD_DIMENSIONS.CAP_FRONT.pixels.width,
        height: STANDARD_DIMENSIONS.CAP_FRONT.pixels.height,
      }
    }
  ],
  
  // 382: Stainless Steel Water Bottle
  382: [
    {
      placement: 'default',
      label: 'Área de Impresión',
      description: 'Área envolvente de la botella (8.4" × 4.5" / 21.3 × 11.4 cm)',
      width: STANDARD_DIMENSIONS.BOTTLE_WRAP.pixels.width,
      height: STANDARD_DIMENSIONS.BOTTLE_WRAP.pixels.height,
      areaWidth: STANDARD_DIMENSIONS.BOTTLE_WRAP.pixels.width,
      areaHeight: STANDARD_DIMENSIONS.BOTTLE_WRAP.pixels.height,
      position: {
        top: STANDARD_DIMENSIONS.BOTTLE_WRAP.position.top,
        left: STANDARD_DIMENSIONS.BOTTLE_WRAP.position.left,
        width: STANDARD_DIMENSIONS.BOTTLE_WRAP.pixels.width,
        height: STANDARD_DIMENSIONS.BOTTLE_WRAP.pixels.height,
      }
    }
  ],
  
  // 474: Spiral Notebook
  474: [
    {
      placement: 'front',
      label: 'Portada',
      description: 'Área de portada (5.5" × 8.5" / 14 × 21.6 cm)',
      width: STANDARD_DIMENSIONS.NOTEBOOK_COVER.pixels.width,
      height: STANDARD_DIMENSIONS.NOTEBOOK_COVER.pixels.height,
      areaWidth: STANDARD_DIMENSIONS.NOTEBOOK_COVER.pixels.width,
      areaHeight: STANDARD_DIMENSIONS.NOTEBOOK_COVER.pixels.height,
      position: {
        top: STANDARD_DIMENSIONS.NOTEBOOK_COVER.position.top,
        left: STANDARD_DIMENSIONS.NOTEBOOK_COVER.position.left,
        width: STANDARD_DIMENSIONS.NOTEBOOK_COVER.pixels.width,
        height: STANDARD_DIMENSIONS.NOTEBOOK_COVER.pixels.height,
      }
    },
    {
      placement: 'back',
      label: 'Contraportada',
      description: 'Área de contraportada (5.5" × 8.5" / 14 × 21.6 cm)',
      width: STANDARD_DIMENSIONS.NOTEBOOK_COVER.pixels.width,
      height: STANDARD_DIMENSIONS.NOTEBOOK_COVER.pixels.height,
      areaWidth: STANDARD_DIMENSIONS.NOTEBOOK_COVER.pixels.width,
      areaHeight: STANDARD_DIMENSIONS.NOTEBOOK_COVER.pixels.height,
      position: {
        top: STANDARD_DIMENSIONS.NOTEBOOK_COVER.position.top,
        left: STANDARD_DIMENSIONS.NOTEBOOK_COVER.position.left,
        width: STANDARD_DIMENSIONS.NOTEBOOK_COVER.pixels.width,
        height: STANDARD_DIMENSIONS.NOTEBOOK_COVER.pixels.height,
      }
    }
  ]
}

/**
 * Carga printfiles desde el archivo JSON (si está disponible en el servidor)
 * Nota: Esta función solo funciona en el servidor (Node.js), no en el cliente
 */
export async function loadPrintfilesFromFile(): Promise<Record<number, any> | null> {
  if (typeof window !== 'undefined') {
    // Cliente: no puede leer archivos del sistema
    return null
  }

  try {
    const fs = await import('fs/promises')
    const path = await import('path')
    const filePath = path.join(process.cwd(), 'mocks', 'printful-printfiles.json')
    
    const fileContent = await fs.readFile(filePath, 'utf-8')
    const data = JSON.parse(fileContent)
    
    return data?.products || null
  } catch (error) {
    console.warn('[printful-dimensions] Could not load printfiles from file:', error)
    return null
  }
}

/**
 * Aplica ajustes manuales optimizados a los placements de Printful
 * Esto preserva nuestras mejoras manuales (como back offset) sobre los datos de la API
 */
function applyManualOptimizations(placement: PlacementDimensions): PlacementDimensions {
  const normalized = placement.placement.toLowerCase()
  
  // AJUSTE 1: Back area - desplazar hacia abajo para evitar cuello
  if (normalized.includes('back')) {
    return {
      ...placement,
      position: {
        ...placement.position,
        top: 800, // Desplazado hacia abajo
        height: Math.min(placement.height, 4000), // Limitar altura
      },
      height: Math.min(placement.height, 4000),
      description: placement.description + ' (optimizado: centrado vertical)',
    }
  }
  
  // AJUSTE 2: Sleeves - normalizar a dimensiones de Printful (1200×1050px @ 300 DPI)
  if (normalized.includes('sleeve')) {
    // Convertir de 150 DPI a 300 DPI si es necesario
    const expectedWidth150 = 600
    const expectedHeight150 = 525
    
    // Si las dimensiones son las de 150 DPI, convertir a 300 DPI
    if (placement.width === expectedWidth150 && placement.height === expectedHeight150) {
      return {
        ...placement,
        width: 1200,   // 4" @ 300 DPI
        height: 1050,  // 3.5" @ 300 DPI
        areaWidth: 1200,
        areaHeight: 1050,
        position: {
          ...placement.position,
          width: 1200,
          height: 1050,
        },
        description: 'Área de manga (4" × 3.5" / 10.2 × 8.9 cm) (optimizado a 300 DPI)',
      }
    }
  }
  
  return placement
}

/**
 * Convierte printfiles de Printful a PlacementDimensions
 * Solo incluye placements si son DIFERENTES a nuestras optimizaciones manuales
 */
export function convertPrintfilesToPlacements(printfilesData: any, productId: number): PlacementDimensions[] | null {
  if (!printfilesData || typeof printfilesData !== 'object') {
    return null
  }

  const placements: PlacementDimensions[] = []
  const printfiles = Array.isArray(printfilesData.printfiles) ? printfilesData.printfiles : []
  const variantPrintfiles = Array.isArray(printfilesData.variant_printfiles) 
    ? printfilesData.variant_printfiles[0]?.placements || {}
    : {}

  // Crear un mapa de printfiles por ID
  const printfileMap = new Map()
  printfiles.forEach((pf: any) => {
    if (pf?.printfile_id || pf?.id) {
      printfileMap.set(pf.printfile_id || pf.id, pf)
    }
  })

  // Obtener nuestras dimensiones manuales para comparar
  const manualPlacements = OPTIMIZED_PLACEMENTS_BY_PRODUCT[productId] || []
  const manualMap = new Map(manualPlacements.map(p => [p.placement, p]))

  // Procesar cada placement
  Object.entries(variantPrintfiles).forEach(([placementKey, printfileId]) => {
    // FILTRAR: Saltar placements que contengan "label" o "mockup"
    const lowerKey = placementKey.toLowerCase()
    if (lowerKey.includes('label') || lowerKey.includes('mockup')) {
      console.log(`🚫 FILTRADO PRINTFILES-DIMENSIONS: Skipping placement "${placementKey}" (contains label/mockup)`)
      return
    }
    
    const pf = printfileMap.get(Number(printfileId))
    if (!pf) return

    const width = Number(pf.width) || 3600
    const height = Number(pf.height) || 4800

    // Crear placement desde API
    let apiPlacement: PlacementDimensions = {
      placement: placementKey,
      label: placementKey.charAt(0).toUpperCase() + placementKey.slice(1),
      description: `${width}px × ${height}px (de API)`,
      width,
      height,
      areaWidth: width,
      areaHeight: height,
      position: {
        top: 0,
        left: 0,
        width,
        height,
      }
    }

    // Aplicar nuestras optimizaciones
    apiPlacement = applyManualOptimizations(apiPlacement)

    // Comparar con nuestra versión manual
    const manual = manualMap.get(placementKey)
    
    if (manual) {
      // Si las dimensiones son IGUALES, usar la manual (ya optimizada)
      const isDifferent = 
        manual.width !== apiPlacement.width ||
        manual.height !== apiPlacement.height ||
        manual.position.top !== apiPlacement.position.top
      
      if (isDifferent) {
        console.log(`[printfiles] Product ${productId} - ${placementKey}: Usando dimensiones de API (diferentes a manual)`)
        placements.push(apiPlacement)
      } else {
        console.log(`[printfiles] Product ${productId} - ${placementKey}: Usando dimensiones manuales (iguales)`)
        placements.push(manual)
      }
    } else {
      // No hay versión manual, usar la de API con optimizaciones
      console.log(`[printfiles] Product ${productId} - ${placementKey}: Nuevo placement de API`)
      placements.push(apiPlacement)
    }
  })

  return placements.length > 0 ? placements : null
}

/**
 * Obtiene las dimensiones optimizadas para un producto específico
 * Prioridad: 1) Printfiles cargados, 2) OPTIMIZED_PLACEMENTS_BY_PRODUCT, 3) null
 */
export function getOptimizedPlacementsForProduct(productId: number): PlacementDimensions[] | null {
  // Primero intentar con dimensiones manuales optimizadas
  return OPTIMIZED_PLACEMENTS_BY_PRODUCT[productId] || null
}

/**
 * Obtiene dimensiones con printfiles cargados (para uso en servidor)
 */
export async function getOptimizedPlacementsWithPrintfiles(productId: number): Promise<PlacementDimensions[] | null> {
  // Intentar cargar desde printfiles
  const printfilesData = await loadPrintfilesFromFile()
  if (printfilesData && printfilesData[productId]) {
    const fromPrintfiles = convertPrintfilesToPlacements(printfilesData[productId], productId)
    if (fromPrintfiles) {
      console.log(`[printful-dimensions] Using printfiles data for product ${productId}`)
      return fromPrintfiles
    }
  }

  // Fallback a dimensiones manuales
  return getOptimizedPlacementsForProduct(productId)
}

/**
 * Calcula dimensiones óptimas respetando el aspect ratio
 */
export function calculateOptimalDimensions(
  imageWidth: number,
  imageHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const aspectRatio = imageWidth / imageHeight
  const areaAspectRatio = maxWidth / maxHeight

  if (aspectRatio > areaAspectRatio) {
    // La imagen es más ancha, ajustar por width
    return {
      width: maxWidth,
      height: Math.round(maxWidth / aspectRatio)
    }
  } else {
    // La imagen es más alta, ajustar por height
    return {
      width: Math.round(maxHeight * aspectRatio),
      height: maxHeight
    }
  }
}

/**
 * Asegura que el QR mantenga proporción cuadrada 1:1
 */
export function ensureSquareQR(qrDimensions: { width: number; height: number }): { width: number; height: number } {
  const size = Math.min(qrDimensions.width, qrDimensions.height)
  return { width: size, height: size }
}

/**
 * Valida que una posición esté dentro de los límites del área
 */
export function validatePosition(
  position: { top: number; left: number; width: number; height: number },
  areaWidth: number,
  areaHeight: number
): boolean {
  return (
    position.top >= 0 &&
    position.left >= 0 &&
    position.top + position.height <= areaHeight &&
    position.left + position.width <= areaWidth
  )
}

