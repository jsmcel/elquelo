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

async function cleanDatabaseCompletely() {
  try {
    console.log('🧹 LIMPIANDO BASE DE DATOS COMPLETAMENTE...\n')
    
    // 1. Eliminar todos los diseños de la tabla qr_designs
    console.log('🗑️  Eliminando todos los diseños de qr_designs...')
    const { data: deletedDesigns, error: deleteDesignsError } = await supabase
      .from('qr_designs')
      .delete()
      .neq('qr_code', '') // Eliminar todos los registros
    
    if (deleteDesignsError) {
      console.error('❌ Error eliminando diseños:', deleteDesignsError)
      return
    }
    
    console.log('✅ Diseños eliminados de la base de datos')
    
    // 2. Eliminar todos los archivos del bucket 'designs'
    console.log('🗑️  Eliminando todos los archivos del bucket designs...')
    
    // Listar todos los archivos en el bucket
    const { data: files, error: listError } = await supabase.storage
      .from('designs')
      .list('designs', {
        limit: 1000 // Aumentar límite para asegurar que obtenemos todos
      })
    
    if (listError) {
      console.error('❌ Error listando archivos:', listError)
      return
    }
    
    console.log(`📁 Encontrados ${files.length} archivos para eliminar`)
    
    if (files.length > 0) {
      // Crear array de nombres de archivos
      const fileNames = files.map(file => `designs/${file.name}`)
      
      // Eliminar todos los archivos
      const { data: deletedFiles, error: deleteFilesError } = await supabase.storage
        .from('designs')
        .remove(fileNames)
      
      if (deleteFilesError) {
        console.error('❌ Error eliminando archivos:', deleteFilesError)
        return
      }
      
      console.log(`✅ ${deletedFiles.length} archivos eliminados del storage`)
    } else {
      console.log('✅ No hay archivos para eliminar')
    }
    
    // 3. Verificar limpieza
    console.log('\n🔍 Verificando limpieza...')
    
    // Verificar tabla qr_designs
    const { data: remainingDesigns, error: countDesignsError } = await supabase
      .from('qr_designs')
      .select('qr_code')
    
    if (countDesignsError) {
      console.error('❌ Error verificando diseños:', countDesignsError)
    } else {
      console.log(`📊 Diseños restantes en BD: ${remainingDesigns.length}`)
    }
    
    // Verificar archivos en storage
    const { data: remainingFiles, error: countFilesError } = await supabase.storage
      .from('designs')
      .list('designs', { limit: 100 })
    
    if (countFilesError) {
      console.error('❌ Error verificando archivos:', countFilesError)
    } else {
      console.log(`📁 Archivos restantes en storage: ${remainingFiles.length}`)
    }
    
    console.log('\n🎉 LIMPIEZA COMPLETA FINALIZADA')
    console.log('✅ Base de datos completamente limpia')
    console.log('✅ Storage completamente limpio')
    console.log('🚀 Listo para empezar desde cero')
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error)
  }
}

cleanDatabaseCompletely()

