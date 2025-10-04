const QRCode = require('qrcode')

async function debugQRGeneration() {
  try {
    console.log('🔍 DEBUGGANDO GENERACIÓN DE QR...\n')
    
    // Simular el QR original del usuario
    const userQRCode = 'ecfd81794e65'
    const userQRUrl = 'http://localhost:3000/bienvenida?qr=ecfd81794e65&name=sal&source=qr&timestamp=1759505806664'
    
    console.log('📱 QR Original del Usuario:')
    console.log(`   Código corto: ${userQRCode}`)
    console.log(`   URL completa: ${userQRUrl}`)
    
    // Generar QR con código corto (LO QUE ESTABA MAL)
    console.log('\n🔍 Generando QR con código corto...')
    const shortQRDataUrl = await QRCode.toDataURL(userQRCode, {
      width: 300,
      margin: 1,
      color: { dark: '#000000', light: '#FFFFFF' }
    })
    
    // Generar QR con URL completa (LO QUE DEBERÍA SER)
    console.log('🔍 Generando QR con URL completa...')
    const fullQRDataUrl = await QRCode.toDataURL(userQRUrl, {
      width: 300,
      margin: 1,
      color: { dark: '#000000', light: '#FFFFFF' }
    })
    
    // Comparar
    console.log('\n📊 COMPARACIÓN:')
    console.log(`   QR código corto (${userQRCode.length} chars): ${shortQRDataUrl.substring(0, 100)}...`)
    console.log(`   QR URL completa (${userQRUrl.length} chars): ${fullQRDataUrl.substring(0, 100)}...`)
    
    const areEqual = shortQRDataUrl === fullQRDataUrl
    console.log(`\n🎯 ¿Son iguales? ${areEqual ? 'SÍ' : 'NO'}`)
    
    if (areEqual) {
      console.log('❌ PROBLEMA: Los QRs son iguales cuando deberían ser diferentes')
    } else {
      console.log('✅ CORRECTO: Los QRs son diferentes como debe ser')
    }
    
    // Probar decodificar para verificar contenido
    console.log('\n🔍 Verificando contenido...')
    console.log(`   QR código corto decodificado: ${userQRCode}`)
    console.log(`   QR URL completa decodificado: ${userQRUrl}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

debugQRGeneration()

