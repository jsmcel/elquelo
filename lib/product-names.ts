/**
 * Sistema de nombres de productos en español
 * Mapea IDs de Printful a nombres amigables para el usuario
 * 
 * PRIORIDAD:
 * 1. PRODUCT_NAMES_MANUAL (este archivo) - Nombres curados manualmente
 * 2. PRODUCT_NAMES_GENERATED (generado automáticamente) - Para el resto
 */

import { 
  PRODUCT_NAMES_GENERATED, 
  CATEGORY_INFO as GENERATED_CATEGORY_INFO 
} from './product-names-generated'

export interface ProductNameInfo {
  id: number
  name: string // Nombre en español
  description: string // Descripción breve
  category: 'ropa' | 'accesorios' | 'hogar' | 'otros'
  emoji: string
  originalName?: string // Nombre original de Printful (opcional)
}

export const PRODUCT_NAMES: Record<number, ProductNameInfo> = {
  // ROPA
  71: {
    id: 71,
    name: 'Camiseta Unisex',
    description: 'Camiseta básica de algodón',
    category: 'ropa',
    emoji: '👕'
  },
  145: {
    id: 145,
    name: 'Sudadera',
    description: 'Sudadera con capucha',
    category: 'ropa',
    emoji: '🧥'
  },
  242: {
    id: 242,
    name: 'Crop Top',
    description: 'Top corto estilo fitness',
    category: 'ropa',
    emoji: '👚'
  },
  
  // ACCESORIOS
  92: {
    id: 92,
    name: 'Gorra',
    description: 'Gorra de 5 paneles',
    category: 'accesorios',
    emoji: '🧢'
  },
  382: {
    id: 382,
    name: 'Botella de Agua',
    description: 'Botella térmica de acero',
    category: 'accesorios',
    emoji: '🍶'
  },
  257: {
    id: 257,
    name: 'Bolsa Tote',
    description: 'Bolsa de tela reutilizable',
    category: 'accesorios',
    emoji: '🛍️'
  },
  259: {
    id: 259,
    name: 'Bolsa Tote Grande',
    description: 'Bolsa grande con bolsillo',
    category: 'accesorios',
    emoji: '👜'
  },
  
  // HOGAR Y OFICINA
  19: {
    id: 19,
    name: 'Taza',
    description: 'Taza de cerámica brillante',
    category: 'hogar',
    emoji: '☕'
  },
  474: {
    id: 474,
    name: 'Libreta',
    description: 'Cuaderno con espiral',
    category: 'hogar',
    emoji: '📓'
  },
  1: {
    id: 1,
    name: 'Póster',
    description: 'Póster de alta calidad',
    category: 'hogar',
    emoji: '🖼️'
  },
  
  // PLAYA Y VERANO
  259: {
    id: 259,
    name: 'Toalla de Playa',
    description: 'Toalla grande para la playa',
    category: 'accesorios',
    emoji: '🏖️'
  }
}

// Usar CATEGORY_INFO del generado (es el mismo)
export const CATEGORY_INFO = GENERATED_CATEGORY_INFO

/**
 * Obtiene el nombre en español para un producto
 * Prioridad: manual > generado > fallback
 */
export function getProductName(productId: number): string {
  return PRODUCT_NAMES[productId]?.name || 
         PRODUCT_NAMES_GENERATED[productId]?.name || 
         `Producto ${productId}`
}

/**
 * Obtiene la información completa del producto
 * Prioridad: manual > generado > null
 */
export function getProductInfo(productId: number): ProductNameInfo | null {
  return PRODUCT_NAMES[productId] || PRODUCT_NAMES_GENERATED[productId] || null
}

/**
 * Obtiene la categoría de un producto
 * Prioridad: manual > generado > 'otros'
 */
export function getProductCategory(productId: number): 'ropa' | 'accesorios' | 'hogar' | 'otros' {
  return PRODUCT_NAMES[productId]?.category || 
         PRODUCT_NAMES_GENERATED[productId]?.category || 
         'otros'
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

