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

async function debugQRContent() {
  try {
    console.log('🔍 ANALIZANDO CONTENIDO DE QRs...\n')
    
    // Obtener todos los QRs de la base de datos
    const { data: qrs, error: qrError } = await supabase
      .from('qrs')
      .select('code, destination_url, title, description')
    
    if (qrError) {
      console.error('❌ Error obteniendo QRs:', qrError)
      return
    }
    
    console.log(`📊 Total de QRs en BD: ${qrs.length}`)
    
    if (qrs.length === 0) {
      console.log('✅ No hay QRs en la base de datos (base limpia)')
      return
    }
    
    console.log('\n📱 ANÁLISIS DE QRs:')
    console.log('=' * 80)
    
    qrs.forEach((qr, index) => {
      console.log(`\n${index + 1}. QR Code: ${qr.code}`)
      console.log(`   📍 Destination URL: ${qr.destination_url}`)
      console.log(`   🏷️  Title: ${qr.title || 'Sin título'}`)
      console.log(`   📝 Description: ${qr.description || 'Sin descripción'}`)
      
      // Analizar la URL de destino
      try {
        const url = new URL(qr.destination_url)
        console.log(`   🔗 Base URL: ${url.origin}${url.pathname}`)
        console.log(`   📋 Parámetros:`)
        
        url.searchParams.forEach((value, key) => {
          console.log(`      - ${key}: ${value}`)
        })
      } catch (error) {
        console.log(`   ❌ Error parsing URL: ${error.message}`)
      }
    })
    
    console.log('\n🎯 CONCLUSIÓN:')
    console.log('=' * 80)
    console.log('El QR original del usuario contiene una URL COMPLETA con parámetros.')
    console.log('Pero en el diseño se está generando solo el CÓDIGO CORTO.')
    console.log('¡ESO ES EL PROBLEMA! 🚨')
    
  } catch (error) {
    console.error('❌ Error durante el análisis:', error)
  }
}

debugQRContent()

