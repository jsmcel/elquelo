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
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'SET' : 'NOT SET')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function countQRsInDesigns() {
  try {
    console.log('Consultando QRs en diseños...')
    
    // Obtener todos los diseños
    const { data: designs, error } = await supabase
      .from('qr_designs')
      .select('qr_code, design_data, created_at')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error al consultar diseños:', error)
      return
    }
    
    console.log(`\n📊 ESTADÍSTICAS DE DISEÑOS:`)
    console.log(`Total de diseños guardados: ${designs.length}`)
    
    // Contar QRs únicos
    const uniqueQRCodes = new Set(designs.map(d => d.qr_code))
    console.log(`QRs únicos con diseños: ${uniqueQRCodes.size}`)
    
    // Analizar diseños con QRs
    let designsWithQR = 0
    let qrFilesCount = 0
    const qrFilesByQR = new Map()
    
    designs.forEach(design => {
      const designData = design.design_data
      const placements = designData?.designsByPlacement || designData?.printful?.placements || {}
      
      let hasQR = false
      let qrFilesInDesign = 0
      
      Object.entries(placements).forEach(([placement, value]) => {
        let imageUrl = null
        
        if (typeof value === 'string') {
          imageUrl = value
        } else if (value && typeof value === 'object' && 'imageUrl' in value) {
          imageUrl = value.imageUrl
        }
        
        // Si es un archivo de QR
        if (imageUrl && (imageUrl.includes('-qr.png') || imageUrl.includes('qr'))) {
          hasQR = true
          qrFilesInDesign++
        }
      })
      
      if (hasQR) {
        designsWithQR++
        qrFilesCount += qrFilesInDesign
        
        if (!qrFilesByQR.has(design.qr_code)) {
          qrFilesByQR.set(design.qr_code, 0)
        }
        qrFilesByQR.set(design.qr_code, qrFilesByQR.get(design.qr_code) + qrFilesInDesign)
      }
    })
    
    console.log(`\n🔍 ANÁLISIS DE QRs:`)
    console.log(`Diseños que contienen QRs: ${designsWithQR}`)
    console.log(`Total de archivos QR en diseños: ${qrFilesCount}`)
    console.log(`QRs únicos que tienen archivos QR: ${qrFilesByQR.size}`)
    
    // Mostrar detalles por QR
    console.log(`\n📋 DETALLES POR QR:`)
    const sortedQRs = Array.from(qrFilesByQR.entries()).sort((a, b) => b[1] - a[1])
    
    sortedQRs.forEach(([qrCode, fileCount]) => {
      const design = designs.find(d => d.qr_code === qrCode)
      const createdAt = new Date(design.created_at).toLocaleString('es-ES')
      console.log(`  ${qrCode}: ${fileCount} archivo(s) QR (creado: ${createdAt})`)
    })
    
    // Mostrar QRs sin archivos QR
    const qrsWithoutQRFiles = Array.from(uniqueQRCodes).filter(qr => !qrFilesByQR.has(qr))
    if (qrsWithoutQRFiles.length > 0) {
      console.log(`\n⚠️  QRs SIN ARCHIVOS QR (${qrsWithoutQRFiles.length}):`)
      qrsWithoutQRFiles.forEach(qr => {
        console.log(`  ${qr}`)
      })
    }
    
    console.log(`\n✅ Análisis completado`)
    
  } catch (error) {
    console.error('Error:', error)
  }
}

countQRsInDesigns()
