/**
 * Script para migrar diseños existentes al nuevo formato multi-producto
 * 
 * Convierte diseños en formato legacy (1 producto) al nuevo formato v2.0 (array de productos)
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Cargar variables de entorno
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno de Supabase')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Migrar un diseño legacy al formato v2.0
 */
function migrateLegacyDesign(oldDesign) {
  // Si ya está en formato nuevo, retornar
  if (oldDesign?.version === '2.0' && Array.isArray(oldDesign?.products)) {
    return oldDesign
  }

  // Generar UUID simple
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c == 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  // Convertir diseño antiguo (1 producto) al nuevo formato
  const product = {
    id: generateUUID(),
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

async function migrateDesigns() {
  try {
    console.log('🚀 Iniciando migración de diseños...\n')

    // Obtener todos los diseños
    const { data: designs, error } = await supabase
      .from('qr_designs')
      .select('*')

    if (error) {
      throw error
    }

    console.log(`📦 Encontrados ${designs.length} diseños\n`)

    let migrated = 0
    let skipped = 0
    let errors = 0

    for (const design of designs) {
      try {
        const designData = design.design_data

        // Verificar si ya está migrado
        if (designData?.version === '2.0' && Array.isArray(designData?.products)) {
          console.log(`⏭️  Saltando ${design.qr_code} (ya migrado)`)
          skipped++
          continue
        }

        // Migrar
        const migratedDesign = migrateLegacyDesign(designData)

        // Actualizar en la base de datos
        const { error: updateError } = await supabase
          .from('qr_designs')
          .update({
            design_data: migratedDesign,
            updated_at: new Date().toISOString()
          })
          .eq('id', design.id)

        if (updateError) {
          throw updateError
        }

        console.log(`✅ Migrado ${design.qr_code} (${migratedDesign.products.length} productos)`)
        migrated++

      } catch (err) {
        console.error(`❌ Error migrando ${design.qr_code}:`, err.message)
        errors++
      }
    }

    console.log(`\n📊 Resumen de migración:`)
    console.log(`   ✅ Migrados: ${migrated}`)
    console.log(`   ⏭️  Saltados: ${skipped}`)
    console.log(`   ❌ Errores: ${errors}`)
    console.log(`\n🎉 Migración completada!`)

  } catch (error) {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  }
}

// Ejecutar migración
migrateDesigns()

