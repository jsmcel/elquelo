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

async function checkQRUrls() {
  try {
    console.log('🔍 VERIFICANDO URLs DE QR EN LA BASE DE DATOS...\n')
    
    // Buscar el QR específico
    const { data: qrs, error: qrError } = await supabase
      .from('qrs')
      .select('code, destination_url, title')
      .eq('code', 'fda8fbe45796')
    
    if (qrError) {
      console.error('❌ Error obteniendo QR:', qrError)
      return
    }
    
    if (qrs.length === 0) {
      console.log('❌ No se encontró el QR fda8fbe45796')
      return
    }
    
    const qr = qrs[0]
    console.log('📱 QR encontrado:')
    console.log(`   Código: ${qr.code}`)
    console.log(`   Título: ${qr.title}`)
    console.log(`   Destination URL: ${qr.destination_url}`)
    
    console.log('\n🎯 ANÁLISIS:')
    console.log(`   URL en BD: ${qr.destination_url}`)
    console.log(`   URL corta que mencionas: https://elquelo.eu/qr/${qr.code}`)
    
    const isLongUrl = qr.destination_url.length > 50
    const isShortUrl = qr.destination_url.includes('elquelo.eu/qr')
    
    if (isLongUrl && !isShortUrl) {
      console.log('   ✅ La BD tiene la URL completa (correcto)')
      console.log('   ❓ Pero el QR real apunta a la URL corta')
      console.log('   🚨 ESTE ES EL PROBLEMA: Hay inconsistencia')
    } else if (isShortUrl) {
      console.log('   ✅ La BD tiene la URL corta (correcto)')
      console.log('   ✅ El QR y la BD son consistentes')
    } else {
      console.log('   ❓ URL no reconocida')
    }
    
    console.log('\n💡 SOLUCIÓN:')
    console.log('   Si el QR real apunta a elquelo.eu/qr/fda8fbe45796')
    console.log('   Entonces debemos usar esa URL en el PrintfulDesignEditor')
    console.log('   No la URL completa de destination_url')
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error)
  }
}

checkQRUrls()

