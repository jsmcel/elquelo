const QRCode = require('qrcode')

async function testShortUrlFix() {
  try {
    console.log('🧪 PROBANDO CORRECCIÓN CON URL CORTA...\n')
    
    const qrCode = 'fda8fbe45796'
    const shortUrl = `https://elquelo.eu/qr/${qrCode}`
    const longUrl = `http://localhost:3000/bienvenida?qr=${qrCode}&name=momo&source=qr&timestamp=1759507098541`
    
    console.log('📱 URLs a comparar:')
    console.log(`   QR original del usuario: ${shortUrl}`)
    console.log(`   URL larga (incorrecta): ${longUrl}`)
    
    // Generar QRs
    const shortQR = await QRCode.toDataURL(shortUrl, {
      width: 300,
      margin: 1,
      color: { dark: '#000000', light: '#FFFFFF' }
    })
    
    const longQR = await QRCode.toDataURL(longUrl, {
      width: 300,
      margin: 1,
      color: { dark: '#000000', light: '#FFFFFF' }
    })
    
    console.log('\n🎯 RESULTADO:')
    const areEqual = shortQR === longQR
    console.log(`   ¿Son iguales? ${areEqual ? 'SÍ' : 'NO'}`)
    
    if (areEqual) {
      console.log('   ❌ PROBLEMA: Siguen siendo iguales')
    } else {
      console.log('   ✅ CORRECTO: Ahora son diferentes')
      console.log('   ✅ El QR en la camiseta apuntará a la misma URL que el QR original')
    }
    
    console.log('\n📝 PRÓXIMO PASO:')
    console.log('   1. Reinicia el servidor de desarrollo')
    console.log('   2. Abre el editor de diseño para el QR fda8fbe45796')
    console.log('   3. Coloca el QR en la camiseta')
    console.log('   4. Verifica que el QR colocado sea idéntico al QR original')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testShortUrlFix()

