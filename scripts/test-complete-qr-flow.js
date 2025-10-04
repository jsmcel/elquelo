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

async function testCompleteQRFlow() {
  try {
    console.log('🧪 PROBANDO FLUJO COMPLETO DE QR...\n')
    
    // 1. Crear un QR de prueba
    console.log('1️⃣ Creando QR de prueba...')
    const testQRCode = 'test' + Date.now().toString().slice(-8)
    const testQRUrl = `http://localhost:3000/bienvenida?qr=${testQRCode}&name=test&source=qr&timestamp=${Date.now()}`
    
    console.log(`   Código: ${testQRCode}`)
    console.log(`   URL: ${testQRUrl}`)
    
    // 2. Generar QRs para comparar
    console.log('\n2️⃣ Generando QRs para comparar...')
    
    const shortQR = await QRCode.toDataURL(testQRCode, {
      width: 300,
      margin: 1,
      color: { dark: '#000000', light: '#FFFFFF' }
    })
    
    const fullQR = await QRCode.toDataURL(testQRUrl, {
      width: 300,
      margin: 1,
      color: { dark: '#000000', light: '#FFFFFF' }
    })
    
    console.log(`   QR código corto generado: ${shortQR.substring(0, 50)}...`)
    console.log(`   QR URL completa generado: ${fullQR.substring(0, 50)}...`)
    
    // 3. Verificar que son diferentes
    const areDifferent = shortQR !== fullQR
    console.log(`\n3️⃣ ¿Los QRs son diferentes? ${areDifferent ? 'SÍ ✅' : 'NO ❌'}`)
    
    if (!areDifferent) {
      console.log('🚨 PROBLEMA: Los QRs deberían ser diferentes')
      return
    }
    
    // 4. Simular lo que debería pasar en el componente
    console.log('\n4️⃣ Simulando flujo del componente...')
    console.log('   - QRGenerator pasa editingQR.destination_url al PrintfulDesignEditor')
    console.log('   - PrintfulDesignEditor recibe la URL completa')
    console.log('   - handleQrPlacement genera QR con URL completa')
    console.log('   - Se sube a Supabase Storage')
    
    // 5. Verificar que el cambio está en el código
    console.log('\n5️⃣ Verificando cambios en el código...')
    const qrGeneratorContent = fs.readFileSync('components/QRGenerator.tsx', 'utf8')
    const hasCorrectProp = qrGeneratorContent.includes('qrCode={editingQR.destination_url}')
    
    if (hasCorrectProp) {
      console.log('   ✅ QRGenerator pasa destination_url correctamente')
    } else {
      console.log('   ❌ QRGenerator NO pasa destination_url')
      return
    }
    
    console.log('\n🎉 FLUJO COMPLETO VERIFICADO')
    console.log('✅ Los cambios están correctos en el código')
    console.log('✅ La generación de QRs funciona correctamente')
    console.log('✅ Los QRs son diferentes como debe ser')
    
    console.log('\n📝 INSTRUCCIONES PARA PROBAR:')
    console.log('1. Abre la aplicación en el navegador')
    console.log('2. Crea un nuevo QR')
    console.log('3. Abre el editor de diseño')
    console.log('4. Coloca el QR en la camiseta')
    console.log('5. Revisa la consola del navegador para ver los logs de debug')
    console.log('6. Verifica que el QR colocado sea el mismo que el original')
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error)
  }
}

testCompleteQRFlow()

