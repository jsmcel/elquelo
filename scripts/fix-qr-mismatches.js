const { createClient } = require('@supabase/supabase-js')
const QRCode = require('qrcode')
const fs = require('fs')
const path = require('path')

// Leer variables de entorno desde .env.local
function loadEnvFile() {
  try {
    const envPath = path.join(process.cwd(), '.env.local')
    const envContent = fs.readFileSync(envPath, 'utf8')
    const envVars = {}
    
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=')
        if (key && valueParts.length > 0) {
          envVars[key] = valueParts.join('=')
        }
      }
    })
    
    return envVars
  } catch (error) {
    console.error('Error reading .env.local:', error.message)
    return {}
  }
}

const envVars = loadEnvFile()
const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function generateAndUploadQR(userQRCode, placement) {
  try {
    // Generar QR para el usuario correcto
    const qrBuffer = await QRCode.toBuffer(userQRCode, {
      width: 300,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    
    // Generar nombre de archivo único
    const fileName = `${userQRCode}-${placement}-qr.png`
    const filePath = `designs/${fileName}`
    
    // Subir directamente a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('designs')
      .upload(filePath, qrBuffer, {
        contentType: 'image/png',
        upsert: true, // Sobrescribir si existe
      })
    
    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return null
    }
    
    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('designs')
      .getPublicUrl(filePath)
    
    return urlData.publicUrl
  } catch (error) {
    console.error('Error generating/uploading QR:', error)
    return null
  }
}

async function fixQRMismatches() {
  try {
    console.log('🔧 ARREGLANDO DESAJUSTES DE QR...\n')
    
    // Obtener todos los diseños
    const { data: designs, error } = await supabase
      .from('qr_designs')
      .select('qr_code, design_data, created_at')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error al consultar diseños:', error)
      return
    }
    
    let fixedCount = 0
    let skippedCount = 0
    
    for (const design of designs) {
      const userQRCode = design.qr_code
      const designData = design.design_data
      
      console.log(`\n🔍 Procesando QR: ${userQRCode}`)
      
      let needsFix = false
      const fixes = []
      
      // Verificar printful.placements
      if (designData.printful?.placements) {
        Object.entries(designData.printful.placements).forEach(([placement, value]) => {
          if (value && value.imageUrl && value.imageUrl.includes('qr')) {
            // Extraer QR del archivo actual
            const fileNameMatch = value.imageUrl.match(/([a-f0-9]+)-([a-z_]+)-qr\.png/)
            if (fileNameMatch) {
              const fileQRCode = fileNameMatch[1]
              if (fileQRCode !== userQRCode) {
                console.log(`   ❌ Placement ${placement}: QR archivo (${fileQRCode}) ≠ QR usuario (${userQRCode})`)
                needsFix = true
                fixes.push({ placement, currentUrl: value.imageUrl, fileQRCode })
              } else {
                console.log(`   ✅ Placement ${placement}: QR correcto`)
              }
            }
          }
        })
      }
      
      if (needsFix) {
        console.log(`   🔧 Regenerando QRs para ${userQRCode}...`)
        
        for (const fix of fixes) {
          console.log(`     - Regenerando ${fix.placement}...`)
          
          // Generar nuevo QR
          const newQRUrl = await generateAndUploadQR(userQRCode, fix.placement)
          
          if (newQRUrl) {
            // Actualizar el diseño
            designData.printful.placements[fix.placement].imageUrl = newQRUrl
            
            // También actualizar designsByPlacement si existe
            if (designData.designsByPlacement && designData.designsByPlacement[fix.placement]) {
              designData.designsByPlacement[fix.placement] = newQRUrl
            }
            
            console.log(`     ✅ Actualizado: ${newQRUrl}`)
            fixedCount++
          } else {
            console.log(`     ❌ Error generando QR para ${fix.placement}`)
          }
        }
        
        // Guardar diseño actualizado
        const { error: updateError } = await supabase
          .from('qr_designs')
          .update({ design_data: designData })
          .eq('qr_code', userQRCode)
        
        if (updateError) {
          console.error(`   ❌ Error guardando diseño:`, updateError)
        } else {
          console.log(`   ✅ Diseño guardado correctamente`)
        }
      } else {
        console.log(`   ✅ No necesita corrección`)
        skippedCount++
      }
    }
    
    console.log(`\n📊 RESUMEN DE CORRECCIÓN:`)
    console.log(`🔧 Archivos QR corregidos: ${fixedCount}`)
    console.log(`✅ Diseños que no necesitaban corrección: ${skippedCount}`)
    console.log(`📝 Total diseños procesados: ${designs.length}`)
    
    if (fixedCount > 0) {
      console.log(`\n🎉 ¡PROBLEMA CORREGIDO! Todos los QRs ahora coinciden con sus usuarios.`)
    } else {
      console.log(`\n✅ No se encontraron problemas que corregir.`)
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

fixQRMismatches()
