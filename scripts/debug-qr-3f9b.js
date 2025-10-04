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

async function debugQR3f9b() {
  try {
    console.log('🔍 DEBUGGING QR 3f9b92808b7c...\n')
    
    // Buscar todos los diseños
    const { data: designs, error } = await supabase
      .from('qr_designs')
      .select('qr_code, design_data, created_at')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error al consultar diseños:', error)
      return
    }
    
    console.log(`📊 Encontrados ${designs.length} diseños relacionados con 3f9b92808b7c\n`)
    
    designs.forEach((design, index) => {
      console.log(`${index + 1}. QR de Usuario: ${design.qr_code}`)
      console.log(`   Creado: ${design.created_at}`)
      
      const designData = design.design_data
      
      // Buscar todas las URLs que contengan 3f9b92808b7c
      console.log('   URLs que contienen 3f9b92808b7c:')
      
      const searchFor3f9b = (obj, path = '') => {
        if (typeof obj === 'string' && obj.includes('3f9b92808b7c')) {
          console.log(`     ${path}: ${obj}`)
        } else if (typeof obj === 'object' && obj !== null) {
          Object.entries(obj).forEach(([key, value]) => {
            searchFor3f9b(value, path ? `${path}.${key}` : key)
          })
        }
      }
      
      searchFor3f9b(designData)
      console.log('')
    })
    
    // También buscar en Supabase Storage
    console.log('🔍 Buscando archivos en Storage...')
    const { data: files, error: storageError } = await supabase.storage
      .from('designs')
      .list('designs', {
        search: '3f9b92808b7c'
      })
    
    if (storageError) {
      console.error('Error consultando storage:', storageError)
    } else {
      console.log(`📁 Archivos en Storage que contienen 3f9b92808b7c: ${files.length}`)
      files.forEach(file => {
        console.log(`   - ${file.name}`)
      })
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

debugQR3f9b()
