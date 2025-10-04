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

async function debugDesignStructure() {
  try {
    console.log('🔍 Debugging estructura de diseños...\n')
    
    // Obtener todos los diseños
    const { data: designs, error } = await supabase
      .from('qr_designs')
      .select('qr_code, design_data, created_at')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error al consultar diseños:', error)
      return
    }
    
    designs.forEach((design, index) => {
      console.log(`\n${index + 1}. QR: ${design.qr_code}`)
      console.log('   Estructura del design_data:')
      
      const designData = design.design_data
      if (designData) {
        console.log(`   - Keys principales: ${Object.keys(designData).join(', ')}`)
        
        // Verificar designsByPlacement
        if (designData.designsByPlacement) {
          console.log(`   - designsByPlacement: ${Object.keys(designData.designsByPlacement).join(', ')}`)
          Object.entries(designData.designsByPlacement).forEach(([placement, value]) => {
            if (typeof value === 'string' && value) {
              console.log(`     ${placement}: ${value.substring(0, 100)}...`)
            } else if (value && typeof value === 'object') {
              console.log(`     ${placement}: ${JSON.stringify(value)}`)
            }
          })
        }
        
        // Verificar printful.placements
        if (designData.printful?.placements) {
          console.log(`   - printful.placements: ${Object.keys(designData.printful.placements).join(', ')}`)
          Object.entries(designData.printful.placements).forEach(([placement, value]) => {
            if (value && typeof value === 'object') {
              console.log(`     ${placement}: ${JSON.stringify(value)}`)
            }
          })
        }
        
        // Buscar cualquier URL que contenga 'qr'
        console.log('   - URLs que contienen "qr":')
        const searchForQR = (obj, path = '') => {
          if (typeof obj === 'string' && obj.includes('qr')) {
            console.log(`     ${path}: ${obj}`)
          } else if (typeof obj === 'object' && obj !== null) {
            Object.entries(obj).forEach(([key, value]) => {
              searchForQR(value, path ? `${path}.${key}` : key)
            })
          }
        }
        searchForQR(designData)
      } else {
        console.log('   - No hay design_data')
      }
    })
    
  } catch (error) {
    console.error('Error:', error)
  }
}

debugDesignStructure()

