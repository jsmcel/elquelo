const fs = require('fs');
const XLSX = require('xlsx');
const path = require('path');

console.log('🚀 Convirtiendo printful-catalog-full.json a Excel...\n');

// Leer el archivo JSON completo
const jsonPath = path.join(__dirname, '../mocks/printful-catalog-full.json');
let catalogData = {};

try {
  const fileContent = fs.readFileSync(jsonPath, 'utf8');
  catalogData = JSON.parse(fileContent);
  console.log(`📄 Archivo leído exitosamente`);
  console.log(`📅 Fecha de obtención: ${catalogData.fetchedAt || 'No disponible'}`);
  console.log(`📦 Total de productos: ${catalogData.items ? catalogData.items.length : 0}`);
} catch (error) {
  console.error('❌ Error al leer el archivo JSON:', error.message);
  process.exit(1);
}

// Función para procesar cada producto y sus variantes
function processProducts() {
  const allRows = [];
  let totalVariants = 0;
  
  if (!catalogData.items || !Array.isArray(catalogData.items)) {
    console.log('⚠️ No se encontraron productos en el archivo');
    return [];
  }

  catalogData.items.forEach((product, productIndex) => {
    // Información básica del producto
    const productInfo = {
      product_id: product.id,
      product_type: product.type,
      product_name: product.title || product.type_name || '',
      product_brand: product.brand || '',
      product_model: product.model || '',
      product_description: product.description ? product.description.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 500) : '',
      main_category_id: product.main_category_id,
      product_image: product.image || '',
      variant_count: product.variant_count || 0,
      currency: product.currency || 'USD',
      is_discontinued: product.is_discontinued ? 'Sí' : 'No',
      avg_fulfillment_time: product.avg_fulfillment_time || '',
      origin_country: product.origin_country || '',
      dimensions: product.dimensions ? JSON.stringify(product.dimensions) : '',
      fetched_at: catalogData.fetchedAt || ''
    };

    // Procesar técnicas
    if (product.techniques && Array.isArray(product.techniques)) {
      productInfo.techniques = product.techniques.map(t => t.display_name || t.key).join(', ');
    } else {
      productInfo.techniques = '';
    }

    // Procesar archivos disponibles
    if (product.files && Array.isArray(product.files)) {
      productInfo.available_files = product.files.map(f => `${f.title || f.id} (${f.type})`).join(', ');
      productInfo.additional_prices = product.files
        .filter(f => f.additional_price)
        .map(f => `${f.title || f.id}: $${f.additional_price}`)
        .join(', ');
    } else {
      productInfo.available_files = '';
      productInfo.additional_prices = '';
    }

    // Si el producto tiene variantes, crear una fila por variante
    if (product.variants && Array.isArray(product.variants)) {
      product.variants.forEach((variant, variantIndex) => {
        const row = {
          ...productInfo,
          variant_id: variant.id,
          variant_name: variant.name || '',
          variant_size: variant.size || '',
          variant_color: variant.color || '',
          variant_color_code: variant.color_code || '',
          variant_color_code2: variant.color_code2 || '',
          variant_image: variant.image || '',
          variant_price: variant.price || '',
          variant_in_stock: variant.in_stock ? 'Sí' : 'No',
          availability_regions: variant.availability_regions ? JSON.stringify(variant.availability_regions) : '',
          availability_status: variant.availability_status ? JSON.stringify(variant.availability_status) : '',
          variant_material: variant.material && Array.isArray(variant.material) ? variant.material.join(', ') : '',
          row_number: totalVariants + 1,
          product_index: productIndex + 1,
          variant_index: variantIndex + 1
        };
        
        allRows.push(row);
        totalVariants++;
      });
    } else {
      // Si no hay variantes, crear una fila solo con la información del producto
      const row = {
        ...productInfo,
        variant_id: '',
        variant_name: '',
        variant_size: '',
        variant_color: '',
        variant_color_code: '',
        variant_color_code2: '',
        variant_image: '',
        variant_price: '',
        variant_in_stock: '',
        availability_regions: '',
        availability_status: '',
        variant_material: '',
        row_number: totalVariants + 1,
        product_index: productIndex + 1,
        variant_index: 0
      };
      
      allRows.push(row);
      totalVariants++;
    }
  });

  console.log(`📊 Total de filas generadas: ${totalVariants}`);
  return allRows;
}

// Procesar los productos
const excelData = processProducts();

if (excelData.length === 0) {
  console.log('❌ No se generaron datos para el Excel');
  process.exit(1);
}

// Crear el workbook
const workbook = XLSX.utils.book_new();

// Hoja principal con todos los datos
const mainSheet = XLSX.utils.json_to_sheet(excelData);
XLSX.utils.book_append_sheet(workbook, mainSheet, 'Catálogo Completo');

// Hoja de resumen por productos (sin variantes)
const productSummary = catalogData.items.map((product, index) => ({
  'Nº': index + 1,
  'ID': product.id,
  'Nombre': product.title || product.type_name || '',
  'Tipo': product.type,
  'Marca': product.brand || '',
  'Modelo': product.model || '',
  'Descripción': product.description ? product.description.replace(/\n/g, ' ').substring(0, 200) : '',
  'Categoría ID': product.main_category_id,
  'Número de Variantes': product.variant_count || 0,
  'Moneda': product.currency || 'USD',
  'Descontinuado': product.is_discontinued ? 'Sí' : 'No',
  'Imagen': product.image || '',
  'Técnicas': product.techniques ? product.techniques.map(t => t.display_name || t.key).join(', ') : '',
  'Fecha Obtención': catalogData.fetchedAt || ''
}));

const summarySheet = XLSX.utils.json_to_sheet(productSummary);
XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen Productos');

// Ajustar anchos de columna para la hoja principal
const mainColumnWidths = [
  { wch: 8 },   // row_number
  { wch: 15 },  // product_id
  { wch: 15 },  // product_type
  { wch: 50 },  // product_name
  { wch: 15 },  // product_brand
  { wch: 20 },  // product_model
  { wch: 60 },  // product_description
  { wch: 12 },  // main_category_id
  { wch: 50 },  // product_image
  { wch: 12 },  // variant_count
  { wch: 8 },   // currency
  { wch: 12 },  // is_discontinued
  { wch: 20 },  // avg_fulfillment_time
  { wch: 20 },  // origin_country
  { wch: 30 },  // dimensions
  { wch: 30 },  // techniques
  { wch: 50 },  // available_files
  { wch: 40 },  // additional_prices
  { wch: 15 },  // variant_id
  { wch: 50 },  // variant_name
  { wch: 15 },  // variant_size
  { wch: 15 },  // variant_color
  { wch: 15 },  // variant_color_code
  { wch: 15 },  // variant_color_code2
  { wch: 50 },  // variant_image
  { wch: 12 },  // variant_price
  { wch: 12 },  // variant_in_stock
  { wch: 40 },  // availability_regions
  { wch: 40 },  // availability_status
  { wch: 30 },  // variant_material
  { wch: 8 },   // product_index
  { wch: 8 },   // variant_index
  { wch: 20 }   // fetched_at
];

mainSheet['!cols'] = mainColumnWidths;

// Ajustar anchos de columna para la hoja de resumen
const summaryColumnWidths = [
  { wch: 5 },   // Nº
  { wch: 15 },  // ID
  { wch: 50 },  // Nombre
  { wch: 15 },  // Tipo
  { wch: 15 },  // Marca
  { wch: 20 },  // Modelo
  { wch: 60 },  // Descripción
  { wch: 12 },  // Categoría ID
  { wch: 15 },  // Número de Variantes
  { wch: 8 },   // Moneda
  { wch: 12 },  // Descontinuado
  { wch: 50 },  // Imagen
  { wch: 30 },  // Técnicas
  { wch: 20 }   // Fecha Obtención
];

summarySheet['!cols'] = summaryColumnWidths;

// Guardar el archivo Excel
const outputPath = path.join(__dirname, '../printful-catalog-full.xlsx');
XLSX.writeFile(workbook, outputPath);

console.log(`\n✅ Archivo Excel creado exitosamente: ${outputPath}`);
console.log(`📊 Estadísticas:`);
console.log(`   - Total productos: ${catalogData.items.length}`);
console.log(`   - Total filas (variantes): ${excelData.length}`);
console.log(`   - Hojas creadas:`);
console.log(`     * Catálogo Completo (${excelData.length} filas)`);
console.log(`     * Resumen Productos (${productSummary.length} productos)`);

// Estadísticas adicionales
const stats = {
  productsWithVariants: catalogData.items.filter(p => p.variants && p.variants.length > 0).length,
  productsWithoutVariants: catalogData.items.filter(p => !p.variants || p.variants.length === 0).length,
  totalVariants: catalogData.items.reduce((sum, p) => sum + (p.variants ? p.variants.length : 1), 0),
  productsWithImages: catalogData.items.filter(p => p.image).length,
  discontinuedProducts: catalogData.items.filter(p => p.is_discontinued).length
};

console.log(`\n📈 Estadísticas detalladas:`);
console.log(`   - Productos con variantes: ${stats.productsWithVariants}`);
console.log(`   - Productos sin variantes: ${stats.productsWithoutVariants}`);
console.log(`   - Total variantes: ${stats.totalVariants}`);
console.log(`   - Productos con imagen: ${stats.productsWithImages}`);
console.log(`   - Productos descontinuados: ${stats.discontinuedProducts}`);

console.log(`\n🎉 Conversión completada exitosamente!`);


