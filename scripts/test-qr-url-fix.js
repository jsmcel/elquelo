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

async function testQRUrlFix() {
  try {
    console.log('🧪 PROBANDO CORRECCIÓN DE QR URL...\n')
    
    // Obtener un QR de ejemplo
    const { data: qrs, error: qrError } = await supabase
      .from('qrs')
      .select('code, destination_url, title')
      .limit(1)
    
    if (qrError) {
      console.error('❌ Error obteniendo QRs:', qrError)
      return
    }
    
    if (qrs.length === 0) {
      console.log('❌ No hay QRs para probar')
      return
    }
    
    const testQR = qrs[0]
    console.log(`📱 Probando con QR: ${testQR.code}`)
    console.log(`🔗 URL completa: ${testQR.destination_url}`)
    
    // Generar QR con código corto (ANTES)
    console.log('\n🔍 ANTES (código corto):')
    const shortQRDataUrl = await QRCode.toDataURL(testQR.code, {
      width: 300,
      margin: 1,
      color: { dark: '#000000', light: '#FFFFFF' }
    })
    console.log(`✅ QR generado con código corto: ${testQR.code}`)
    
    // Generar QR con URL completa (DESPUÉS)
    console.log('\n🔍 DESPUÉS (URL completa):')
    const fullQRDataUrl = await QRCode.toDataURL(testQR.destination_url, {
      width: 300,
      margin: 1,
      color: { dark: '#000000', light: '#FFFFFF' }
    })
    console.log(`✅ QR generado con URL completa`)
    
    // Comparar si son diferentes
    const areDifferent = shortQRDataUrl !== fullQRDataUrl
    console.log(`\n🎯 RESULTADO:`)
    console.log(`   ${areDifferent ? '✅ Los QRs son DIFERENTES (correcto)' : '❌ Los QRs son IGUALES (incorrecto)'}`)
    
    if (areDifferent) {
      console.log('\n🎉 ¡CORRECCIÓN EXITOSA!')
      console.log('   - El QR original del usuario contiene la URL completa')
      console.log('   - El QR en la camiseta ahora también contiene la URL completa')
      console.log('   - ¡Ambos QRs son consistentes!')
    } else {
      console.log('\n❌ PROBLEMA PERSISTE')
      console.log('   - Los QRs siguen siendo iguales')
      console.log('   - Necesita más investigación')
    }
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error)
  }
}

testQRUrlFix()

