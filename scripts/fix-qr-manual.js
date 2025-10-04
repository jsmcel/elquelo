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

async function generateQRBuffer(userQRCode) {
  try {
    return await QRCode.toBuffer(userQRCode, {
      width: 300,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
  } catch (error) {
    console.error('Error generating QR buffer:', error)
    return null
  }
}

async function fixSpecificQR(userQRCode, placement) {
  try {
    console.log(`🔧 Regenerando QR para ${userQRCode} en ${placement}...`)
    
    // Generar QR
    const qrBuffer = await generateQRBuffer(userQRCode)
    if (!qrBuffer) return false
    
    // Generar nombre de archivo
    const fileName = `${userQRCode}-${placement}-qr.png`
    const filePath = `designs/${fileName}`
    
    // Subir a Supabase
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('designs')
      .upload(filePath, qrBuffer, {
        contentType: 'image/png',
        upsert: true,
      })
    
    if (uploadError) {
      console.error('Error uploading:', uploadError)
      return false
    }
    
    // Obtener URL
    const { data: urlData } = supabase.storage
      .from('designs')
      .getPublicUrl(filePath)
    
    console.log(`✅ QR generado: ${urlData.publicUrl}`)
    return urlData.publicUrl
  } catch (error) {
    console.error('Error in fixSpecificQR:', error)
    return false
  }
}

async function fixAllQRMismatches() {
  try {
    console.log('🚨 ARREGLANDO MANUALMENTE TODOS LOS DESAJUSTES DE QR...\n')
    
    // Lista de QRs que necesitan corrección (basado en el debug anterior)
    const qrsToFix = [
      { userQR: 'b2fb89714aef', placement: 'sleeve_left' },
      { userQR: '0c9f922fc5ed', placement: 'sleeve_left' },
      { userQR: '7c9462f611e5', placement: 'sleeve_left' },
      { userQR: 'c115fdfaae94', placement: 'sleeve_left' },
    ]
    
    let fixedCount = 0
    
    for (const { userQR, placement } of qrsToFix) {
      console.log(`\n📱 Procesando ${userQR}...`)
      
      // Obtener el diseño actual
      const { data: design, error: fetchError } = await supabase
        .from('qr_designs')
        .select('design_data')
        .eq('qr_code', userQR)
        .single()
      
      if (fetchError) {
        console.error(`❌ Error obteniendo diseño para ${userQR}:`, fetchError)
        continue
      }
      
      const designData = design.design_data
      
      // Generar nuevo QR
      const newQRUrl = await fixSpecificQR(userQR, placement)
      if (!newQRUrl) {
        console.error(`❌ Error generando QR para ${userQR}`)
        continue
      }
      
      // Actualizar design_data
      if (designData.printful?.placements?.[placement]) {
        designData.printful.placements[placement].imageUrl = newQRUrl
      }
      
      if (designData.designsByPlacement?.[placement]) {
        designData.designsByPlacement[placement] = newQRUrl
      }
      
      // Guardar diseño actualizado
      const { error: updateError } = await supabase
        .from('qr_designs')
        .update({ design_data: designData })
        .eq('qr_code', userQR)
      
      if (updateError) {
        console.error(`❌ Error guardando diseño para ${userQR}:`, updateError)
        continue
      }
      
      console.log(`✅ Diseño actualizado para ${userQR}`)
      fixedCount++
    }
    
    console.log(`\n🎉 CORRECCIÓN COMPLETADA:`)
    console.log(`🔧 QRs corregidos: ${fixedCount}/${qrsToFix.length}`)
    
    if (fixedCount === qrsToFix.length) {
      console.log(`✅ ¡TODOS LOS QR CORREGIDOS! Ahora cada camiseta tiene su QR correcto.`)
    } else {
      console.log(`⚠️  Algunos QRs no se pudieron corregir.`)
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

fixAllQRMismatches()

