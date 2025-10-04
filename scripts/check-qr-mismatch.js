const { createClient } = require('@supabase/supabase-js')
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

async function checkQRMismatch() {
  try {
    console.log('🔍 Verificando coincidencia entre QRs de usuario y QRs en archivos...\n')
    
    // Obtener todos los diseños
    const { data: designs, error } = await supabase
      .from('qr_designs')
      .select('qr_code, design_data, created_at')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error al consultar diseños:', error)
      return
    }
    
    console.log(`📊 Analizando ${designs.length} diseños...\n`)
    
    let mismatches = 0
    let matches = 0
    
    designs.forEach((design, index) => {
      const userQRCode = design.qr_code
      const designData = design.design_data
      const placements = designData?.designsByPlacement || designData?.printful?.placements || {}
      
      console.log(`${index + 1}. QR Usuario: ${userQRCode}`)
      
      let foundQRFiles = []
      
      // Buscar archivos QR en el diseño
      Object.entries(placements).forEach(([placement, value]) => {
        let imageUrl = null
        
        if (typeof value === 'string') {
          imageUrl = value
        } else if (value && typeof value === 'object' && 'imageUrl' in value) {
          imageUrl = value.imageUrl
        }
        
        // Si es un archivo de QR
        if (imageUrl && (imageUrl.includes('-qr.png') || imageUrl.includes('qr'))) {
          // Extraer el código QR del nombre del archivo
          const fileNameMatch = imageUrl.match(/([a-f0-9]+)-([a-z_]+)-qr\.png/)
          if (fileNameMatch) {
            const fileQRCode = fileNameMatch[1]
            foundQRFiles.push({
              placement,
              fileQRCode,
              imageUrl
            })
          }
        }
      })
      
      if (foundQRFiles.length > 0) {
        foundQRFiles.forEach(qrFile => {
          console.log(`   📱 Placement ${qrFile.placement}: QR en archivo = ${qrFile.fileQRCode}`)
          
          if (qrFile.fileQRCode === userQRCode) {
            console.log(`   ✅ COINCIDE`)
            matches++
          } else {
            console.log(`   ❌ NO COINCIDE - Usuario: ${userQRCode}, Archivo: ${qrFile.fileQRCode}`)
            mismatches++
          }
        })
      } else {
        console.log(`   ⚠️  No se encontraron archivos QR en este diseño`)
      }
      
      console.log('')
    })
    
    console.log('📈 RESUMEN:')
    console.log(`✅ Coincidencias: ${matches}`)
    console.log(`❌ Desajustes: ${mismatches}`)
    console.log(`📊 Total archivos QR analizados: ${matches + mismatches}`)
    
    if (mismatches > 0) {
      console.log(`\n🚨 PROBLEMA DETECTADO: ${mismatches} archivos QR no coinciden con el QR del usuario`)
      console.log('   Esto significa que al escanear el QR de la camiseta, no se llegará al QR correcto.')
    } else {
      console.log(`\n✅ TODO CORRECTO: Todos los QRs en archivos coinciden con los QRs de usuario`)
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

checkQRMismatch()

