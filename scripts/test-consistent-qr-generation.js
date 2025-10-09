const { generateStandardQR } = require('./lib/qr-generator.ts')

async function testConsistentQRGeneration() {
  try {
    console.log('🧪 PROBANDO GENERACIÓN CONSISTENTE DE QR...\n')
    
    const testUrl = 'https://elquelo.eu/qr/fda8fbe45796'
    
    console.log(`📱 Generando QR para: ${testUrl}`)
    
    // Generar el mismo QR 5 veces
    const qrPromises = []
    for (let i = 0; i < 5; i++) {
      qrPromises.push(generateStandardQR(testUrl))
    }
    
    const qrs = await Promise.all(qrPromises)
    
    console.log(`✅ Generados ${qrs.length} QRs`)
    
    // Verificar que todos sean idénticos
    const firstQR = qrs[0]
    let allIdentical = true
    
    for (let i = 1; i < qrs.length; i++) {
      if (qrs[i] !== firstQR) {
        allIdentical = false
        console.log(`❌ QR ${i + 1} es diferente al primero`)
      }
    }
    
    if (allIdentical) {
      console.log('✅ TODOS LOS QRs SON IDÉNTICOS')
      console.log('✅ La generación es consistente')
      console.log('✅ Los QRs originales y de camiseta serán visualmente iguales')
    } else {
      console.log('❌ LOS QRs NO SON IDÉNTICOS')
      console.log('❌ Hay inconsistencia en la generación')
    }
    
    console.log('\n📊 INFORMACIÓN:')
    console.log(`   Longitud del QR: ${firstQR.length} caracteres`)
    console.log(`   Primeros 100 chars: ${firstQR.substring(0, 100)}...`)
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error)
  }
}

testConsistentQRGeneration()

