import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

/**
 * API endpoint para obtener los printfiles actualizados
 * Se revalida cada hora para asegurar que siempre tengamos datos frescos
 */

export const revalidate = 3600 // Revalidar cada hora

let cachedPrintfiles: any = null
let cacheTimestamp = 0
const CACHE_TTL_MS = 3600000 // 1 hora

export async function GET(request: NextRequest) {
  try {
    const now = Date.now()
    
    // Usar caché si es válido
    if (cachedPrintfiles && (now - cacheTimestamp) < CACHE_TTL_MS) {
      return NextResponse.json({
        success: true,
        source: 'cache',
        ...cachedPrintfiles,
        cachedAt: new Date(cacheTimestamp).toISOString(),
      })
    }

    // Cargar desde archivo
    const filePath = join(process.cwd(), 'mocks', 'printful-printfiles.json')
    const fileContent = await readFile(filePath, 'utf-8')
    const data = JSON.parse(fileContent)

    // Actualizar caché
    cachedPrintfiles = data
    cacheTimestamp = now

    return NextResponse.json({
      success: true,
      source: 'file',
      ...data,
      loadedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[printfiles] Error loading printfiles:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Could not load printfiles',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

/**
 * Endpoint para forzar recarga del caché (útil después de actualización)
 */
export async function POST(request: NextRequest) {
  try {
    // Invalidar caché
    cachedPrintfiles = null
    cacheTimestamp = 0

    // Recargar
    const filePath = join(process.cwd(), 'mocks', 'printful-printfiles.json')
    const fileContent = await readFile(filePath, 'utf-8')
    const data = JSON.parse(fileContent)

    cachedPrintfiles = data
    cacheTimestamp = Date.now()

    return NextResponse.json({
      success: true,
      message: 'Printfiles cache reloaded',
      ...data,
      reloadedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[printfiles] Error reloading printfiles:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Could not reload printfiles',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

