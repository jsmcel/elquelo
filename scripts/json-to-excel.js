const fs = require('fs');
const XLSX = require('xlsx');
const path = require('path');

// Función para obtener todos los productos desde la API
async function fetchAllProducts() {
  try {
    console.log('Obteniendo todos los productos desde Printful...');
    
    // Hacer petición a nuestro endpoint que obtiene todos los productos
    const response = await fetch('http://localhost:3000/api/products?limit=200');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Error al obtener productos');
    }
    
    console.log(`Obtenidos ${data.products.length} productos desde Printful`);
    return data.products;
  } catch (error) {
    console.error('Error obteniendo productos desde API:', error);
    console.log('Usando archivo JSON como respaldo...');
    
    // Fallback al archivo JSON si la API falla
    const jsonPath = path.join(__dirname, '../mocks/printful-catalog.json');
    if (fs.existsSync(jsonPath)) {
      const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      return jsonData.products || [];
    }
    
    return [];
  }
}

// Obtener los productos
const products = await fetchAllProducts();

// Preparar los datos para Excel
const excelData = products.map(product => {
  // Los datos vienen directamente de la API, no necesitan raw
  const description = product.description ? product.description.replace(/\n/g, ' ').substring(0, 500) : '';
  
  return {
    'ID': product.id,
    'Nombre': product.name || '',
    'Tipo': product.type || '',
    'Marca': product.brand || '',
    'Modelo': product.model || '',
    'Descripción': description,
    'Categoría Principal ID': product.main_category_id || '',
    'Tipo de Producto': product.type_name || '',
    'Título': product.title || '',
    'Imagen': product.image || '',
    'Número de Variantes': product.variant_count || (product.variants ? product.variants.length : 0),
    'Moneda': product.currency || '',
    'Descontinuado': product.is_discontinued ? 'Sí' : 'No',
    'Tiempo Promedio de Cumplimiento': product.avg_fulfillment_time || '',
    'País de Origen': product.origin_country || '',
    'Técnicas': product.techniques ? product.techniques.map(t => t.display_name || t.key).join(', ') : '',
    'Archivos Disponibles': product.files ? product.files.map(f => `${f.title || f.id} (${f.type})`).join(', ') : '',
    'Precios Adicionales': product.files ? product.files.filter(f => f.additional_price).map(f => `${f.title || f.id}: $${f.additional_price}`).join(', ') : '',
    'Dimensiones': product.dimensions ? JSON.stringify(product.dimensions) : '',
    'Opciones': product.options ? JSON.stringify(product.options) : '',
    'Número de Variantes Detalladas': product.variants ? product.variants.length : 0,
    'Colores Disponibles': product.variants ? [...new Set(product.variants.map(v => v.color).filter(Boolean))].join(', ') : '',
    'Tallas Disponibles': product.variants ? [...new Set(product.variants.map(v => v.size).filter(Boolean))].join(', ') : '',
    'Precio Mínimo': product.variants && product.variants.length > 0 ? Math.min(...product.variants.map(v => parseFloat(v.price || 0)).filter(p => p > 0)) : '',
    'Precio Máximo': product.variants && product.variants.length > 0 ? Math.max(...product.variants.map(v => parseFloat(v.price || 0))) : ''
  };
});

// Crear un nuevo workbook
const workbook = XLSX.utils.book_new();

// Crear una hoja de trabajo
const worksheet = XLSX.utils.json_to_sheet(excelData);

// Agregar la hoja al workbook
XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos Printful');

// Guardar el archivo Excel
const outputPath = path.join(__dirname, '../printful-catalog.xlsx');
XLSX.writeFile(workbook, outputPath);

console.log(`Archivo Excel creado exitosamente: ${outputPath}`);
console.log(`Total de productos procesados: ${products.length}`);
