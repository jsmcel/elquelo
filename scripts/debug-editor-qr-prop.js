const fs = require('fs')

// Simular lo que pasa en el componente
function debugEditorQRProp() {
  console.log('🔍 DEBUGGANDO PROPS DEL EDITOR...\n')
  
  // Leer el archivo QRGenerator.tsx para ver el cambio
  const qrGeneratorContent = fs.readFileSync('components/QRGenerator.tsx', 'utf8')
  
  // Buscar la línea donde se pasa el prop al editor
  const lines = qrGeneratorContent.split('\n')
  const editorLine = lines.find(line => line.includes('qrCode={editingQR.'))
  
  if (editorLine) {
    console.log('📱 Línea encontrada en QRGenerator.tsx:')
    console.log(`   ${editorLine.trim()}`)
    
    if (editorLine.includes('destination_url')) {
      console.log('✅ CORRECTO: Se está pasando destination_url (URL completa)')
    } else if (editorLine.includes('.code')) {
      console.log('❌ INCORRECTO: Se está pasando solo .code (código corto)')
    } else {
      console.log('❓ DESCONOCIDO: No se puede determinar qué se está pasando')
    }
  } else {
    console.log('❌ No se encontró la línea del editor')
  }
  
  // También verificar la función regenerateQRFiles
  const regenerateLine = lines.find(line => line.includes('await regenerateQRFiles('))
  if (regenerateLine) {
    console.log('\n🔄 Línea de regenerateQRFiles:')
    console.log(`   ${regenerateLine.trim()}`)
    
    const paramCount = (regenerateLine.match(/,/g) || []).length + 1
    if (paramCount === 4) {
      console.log('✅ CORRECTO: regenerateQRFiles tiene 4 parámetros (incluye qrs)')
    } else {
      console.log(`❌ INCORRECTO: regenerateQRFiles tiene ${paramCount} parámetros, debería tener 4`)
    }
  }
  
  console.log('\n🎯 DIAGNÓSTICO:')
  console.log('Si ambos están correctos, el problema puede estar en:')
  console.log('1. Cache del navegador')
  console.log('2. El componente no se está re-renderizando')
  console.log('3. Hay otro lugar donde se genera el QR')
}

debugEditorQRProp()

