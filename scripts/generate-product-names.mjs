#!/usr/bin/env node

/**
 * Script para generar nombres en español para todos los productos del catálogo
 * Lee el catálogo completo de Printful y genera nombres amigables en español
 */

import fs from 'fs'
import path from 'path'

const CATALOG_PATH = './mocks/printful-catalog-full.json'
const OUTPUT_PATH = './lib/product-names-generated.ts'

// Mapeo de términos en inglés a español
const TRANSLATIONS = {
  // Tipos de productos
  'T-Shirt': 'Camiseta',
  'T-shirt': 'Camiseta',
  'Tshirt': 'Camiseta',
  'Shirt': 'Camisa',
  'Sweatshirt': 'Sudadera',
  'Hoodie': 'Sudadera con Capucha',
  'Tank Top': 'Camiseta sin Mangas',
  'Crop Top': 'Crop Top',
  'Dress': 'Vestido',
  'Skirt': 'Falda',
  'Shorts': 'Pantalones Cortos',
  'Pants': 'Pantalones',
  'Leggings': 'Mallas',
  'Jacket': 'Chaqueta',
  'Coat': 'Abrigo',
  
  // Accesorios
  'Hat': 'Sombrero',
  'Cap': 'Gorra',
  'Beanie': 'Gorro',
  'Bag': 'Bolsa',
  'Tote': 'Bolsa',
  'Backpack': 'Mochila',
  'Bottle': 'Botella',
  'Mug': 'Taza',
  'Cup': 'Vaso',
  'Tumbler': 'Vaso Térmico',
  'Sticker': 'Pegatina',
  'Poster': 'Póster',
  'Canvas': 'Lienzo',
  'Notebook': 'Libreta',
  'Journal': 'Diario',
  'Phone Case': 'Funda de Móvil',
  'Pillow': 'Cojín',
  'Blanket': 'Manta',
  'Towel': 'Toalla',
  'Mat': 'Alfombrilla',
  'Socks': 'Calcetines',
  'Scarf': 'Bufanda',
  'Gloves': 'Guantes',
  'Apron': 'Delantal',
  
  // Materiales y características
  'Cotton': 'Algodón',
  'Polyester': 'Poliéster',
  'Premium': 'Premium',
  'Organic': 'Orgánico',
  'Unisex': 'Unisex',
  'Women': 'Mujer',
  'Men': 'Hombre',
  'Kids': 'Niños',
  'Baby': 'Bebé',
  'Athletic': 'Deportiva',
  'Vintage': 'Vintage',
  'Classic': 'Clásica',
  'Fitted': 'Ajustada',
  'Relaxed': 'Holgada',
  'Slim': 'Slim',
  'Oversized': 'Oversize',
  'Cropped': 'Corta',
  'Long Sleeve': 'Manga Larga',
  'Short Sleeve': 'Manga Corta',
  'Sleeveless': 'Sin Mangas',
  'Zip': 'con Cremallera',
  'Hooded': 'con Capucha',
  'Crew Neck': 'Cuello Redondo',
  'V-Neck': 'Cuello en V',
  'Polo': 'Polo',
  'Tank': 'Tirantes',
  'Racerback': 'Espalda Nadador',
  
  // Otros
  'All-Over Print': 'Estampado Completo',
  'Embroidered': 'Bordado',
  'Printed': 'Estampado',
  'Water Bottle': 'Botella de Agua',
  'Travel Mug': 'Taza de Viaje',
  'Glossy': 'Brillante',
  'Matte': 'Mate',
  'White': 'Blanco',
  'Black': 'Negro',
  'Stainless Steel': 'Acero Inoxidable',
  'Ceramic': 'Cerámica',
  'Spiral': 'Espiral',
  'Hardcover': 'Tapa Dura',
  'Softcover': 'Tapa Blanda',
  'Framed': 'Enmarcado',
  'Canvas Print': 'Impresión en Lienzo',
  'Art Print': 'Lámina Artística',
  'Photo Print': 'Impresión Fotográfica',
}

function translateProductName(englishName) {
  let spanishName = englishName
  
  // Aplicar traducciones
  Object.entries(TRANSLATIONS).forEach(([en, es]) => {
    const regex = new RegExp(en, 'gi')
    spanishName = spanishName.replace(regex, es)
  })
  
  // Limpiar caracteres extraños
  spanishName = spanishName
    .replace(/\s+/g, ' ')
    .replace(/\|\s*/g, '- ')
    .trim()
  
  return spanishName
}

function categorizeProduct(product) {
  const name = product.name.toLowerCase()
  const type = product.type?.toLowerCase() || ''
  
  // Categorización por tipo
  if (type.includes('t-shirt') || type.includes('shirt') || 
      type.includes('sweatshirt') || type.includes('hoodie') ||
      type.includes('tank') || type.includes('crop') || type.includes('dress') ||
      type.includes('jacket') || type.includes('shorts') || type.includes('pants') ||
      type.includes('leggings') || type.includes('skirt')) {
    return 'ropa'
  }
  
  if (type.includes('hat') || type.includes('cap') || type.includes('beanie') ||
      type.includes('bag') || type.includes('backpack') || type.includes('tote') ||
      type.includes('bottle') || type.includes('socks') || type.includes('scarf') ||
      type.includes('gloves') || type.includes('apron')) {
    return 'accesorios'
  }
  
  if (type.includes('mug') || type.includes('cup') || type.includes('tumbler') ||
      type.includes('poster') || type.includes('canvas') || type.includes('print') ||
      type.includes('notebook') || type.includes('journal') || type.includes('pillow') ||
      type.includes('blanket') || type.includes('towel') || type.includes('mat') ||
      type.includes('sticker')) {
    return 'hogar'
  }
  
  return 'otros'
}

function getCategoryEmoji(category) {
  const emojis = {
    ropa: '👕',
    accesorios: '🎒',
    hogar: '🏠',
    otros: '🎁'
  }
  return emojis[category] || '🎁'
}

function generateProductDescription(product) {
  const descriptions = {
    't-shirt': 'Camiseta de algodón',
    'sweatshirt': 'Sudadera cómoda',
    'hoodie': 'Sudadera con capucha',
    'mug': 'Taza de cerámica',
    'poster': 'Póster decorativo',
    'bag': 'Bolsa reutilizable',
    'cap': 'Gorra ajustable',
    'bottle': 'Botella térmica',
    'notebook': 'Cuaderno para notas',
    'tank': 'Camiseta sin mangas',
    'crop': 'Top corto',
    'pillow': 'Cojín decorativo',
    'towel': 'Toalla suave',
    'sticker': 'Pegatina resistente',
    'canvas': 'Lienzo artístico',
    'apron': 'Delantal de cocina',
  }
  
  const type = product.type?.toLowerCase() || ''
  
  for (const [key, desc] of Object.entries(descriptions)) {
    if (type.includes(key)) {
      return desc
    }
  }
  
  return product.description?.split('\n')[0]?.substring(0, 50) || 'Producto personalizable'
}

async function generateProductNames() {
  console.log('🚀 Generando nombres en español para todos los productos...')
  
  // Cargar catálogo
  const catalogData = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'))
  const items = catalogData.items || []
  
  console.log(`📦 Procesando ${items.length} productos...`)
  
  const productMap = {}
  let processed = 0
  
  items.forEach(product => {
    if (!product.productId) return
    
    const spanishName = translateProductName(product.name || product.title || `Producto ${product.productId}`)
    const category = categorizeProduct(product)
    const emoji = getCategoryEmoji(category)
    const description = generateProductDescription(product)
    
    productMap[product.productId] = {
      id: product.productId,
      name: spanishName,
      description,
      category,
      emoji,
      originalName: product.name || product.title
    }
    
    processed++
    
    if (processed % 50 === 0) {
      console.log(`📊 Progress: ${processed}/${items.length}`)
    }
  })
  
  console.log(`✅ Procesados ${processed} productos únicos`)
  
  // Generar archivo TypeScript
  const output = `/**
 * Nombres de productos en español - Generado automáticamente
 * Fecha: ${new Date().toISOString()}
 * Productos: ${Object.keys(productMap).length}
 * 
 * NO EDITAR MANUALMENTE - Usar scripts/generate-product-names.mjs
 * Para personalizar nombres específicos, editar lib/product-names.ts
 */

export interface ProductNameInfo {
  id: number
  name: string
  description: string
  category: 'ropa' | 'accesorios' | 'hogar' | 'otros'
  emoji: string
  originalName?: string
}

export const PRODUCT_NAMES_GENERATED: Record<number, ProductNameInfo> = ${JSON.stringify(productMap, null, 2)}

export const CATEGORY_INFO = {
  ropa: {
    name: 'Ropa',
    icon: '👕',
    description: 'Camisetas, sudaderas y más'
  },
  accesorios: {
    name: 'Accesorios',
    icon: '🎒',
    description: 'Gorras, bolsas, botellas'
  },
  hogar: {
    name: 'Hogar y Oficina',
    icon: '🏠',
    description: 'Tazas, libretas, decoración'
  },
  otros: {
    name: 'Otros',
    icon: '🎁',
    description: 'Productos variados'
  }
}

/**
 * Obtiene el nombre en español para un producto
 */
export function getProductName(productId: number): string {
  return PRODUCT_NAMES_GENERATED[productId]?.name || \`Producto \${productId}\`
}

/**
 * Obtiene la información completa del producto
 */
export function getProductInfo(productId: number): ProductNameInfo | null {
  return PRODUCT_NAMES_GENERATED[productId] || null
}

/**
 * Obtiene la categoría de un producto
 */
export function getProductCategory(productId: number): 'ropa' | 'accesorios' | 'hogar' | 'otros' {
  return PRODUCT_NAMES_GENERATED[productId]?.category || 'otros'
}

/**
 * Formatea el nombre del producto con talla y color
 */
export function formatProductDisplayName(
  productId: number,
  size?: string | null,
  color?: string | null
): string {
  const baseName = getProductName(productId)
  const parts = [baseName]
  
  if (size) parts.push(size)
  if (color) parts.push(color)
  
  return parts.join(' · ')
}
`
  
  fs.writeFileSync(OUTPUT_PATH, output, 'utf8')
  
  console.log(`\n💾 Archivo generado: ${OUTPUT_PATH}`)
  console.log(`📁 Tamaño: ${(fs.statSync(OUTPUT_PATH).size / 1024).toFixed(2)} KB`)
  console.log(`✨ ¡Listo! Ahora todos los productos tienen nombres en español`)
}

generateProductNames().catch(error => {
  console.error('❌ Error:', error)
  process.exit(1)
})

