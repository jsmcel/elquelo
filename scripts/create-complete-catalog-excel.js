const fs = require('fs');
const XLSX = require('xlsx');
const path = require('path');

console.log('🚀 Creando catálogo completo de Printful...\n');

// Leer el JSON original
const originalJsonPath = path.join(__dirname, '../mocks/printful-catalog.json');
let originalProducts = [];
try {
  const originalData = JSON.parse(fs.readFileSync(originalJsonPath, 'utf8'));
  originalProducts = originalData.products || [];
  console.log(`📄 JSON original: ${originalProducts.length} productos`);
} catch (error) {
  console.log('⚠️ No se pudo leer el JSON original:', error.message);
}

// Leer productos escrapeados
const scrapedJsonPath = path.join(__dirname, '../mocks/printful-puppeteer-catalog.json');
let scrapedProducts = [];
try {
  const scrapedData = JSON.parse(fs.readFileSync(scrapedJsonPath, 'utf8'));
  scrapedProducts = scrapedData.products || [];
  console.log(`🌐 Productos escrapeados: ${scrapedProducts.length} productos`);
} catch (error) {
  console.log('⚠️ No se pudo leer los productos escrapeados:', error.message);
}

// Función para limpiar nombres de productos
function cleanProductName(name) {
  if (!name || typeof name !== 'string') return '';
  
  let cleaned = name.trim();
  
  // Filtrar nombres inválidos
  const invalidPatterns = [
    /^talla/i, /^s\s*-\s*xl$/i, /^xs\s*-\s*xxl$/i,
    /^\d+\s*-\s*\d+$/, /^€?\d+\.?\d*$/, /^con\s+vat/i,
    /^reseñas/i, /^puntuación/i, /^estrellas/i,
    /^\d+\s*estrellas/i, /^ver\s+más/i, /^cargar\s+más/i,
    /^mostrar\s+más/i, /^siguiente/i, /^anterior/i,
    /^página/i, /^\d+$/, /^[€$]\d+/, /^€?\d+\.?\d*\s*€?$/,
    /^\d+\s*€?$/, /^mejor\s+vendido/i, /^desde/i
  ];
  
  for (const pattern of invalidPatterns) {
    if (pattern.test(cleaned)) return '';
  }
  
  cleaned = cleaned.replace(/\s+/g, ' ');
  if (cleaned.length < 5 || /^\d+$/.test(cleaned)) return '';
  
  return cleaned;
}

// Procesar productos del JSON original
const processedOriginal = originalProducts.map((product, index) => {
  const raw = product.raw || {};
  
  const description = raw.description ? raw.description.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 500) : '';
  const techniques = raw.techniques ? raw.techniques.map(t => t.display_name || t.key).join(', ') : '';
  const files = raw.files ? raw.files.map(f => `${f.title || f.id} (${f.type})`).join(', ') : '';
  const additionalPrices = raw.files ? raw.files.filter(f => f.additional_price).map(f => `${f.title || f.id}: $${f.additional_price}`).join(', ') : '';
  
  // Extraer tallas y colores
  let sizes = '';
  let colors = '';
  if (raw.options && Array.isArray(raw.options)) {
    raw.options.forEach(option => {
      if (option.title && option.title.toLowerCase().includes('size')) {
        if (option.values && Array.isArray(option.values)) {
          sizes = option.values.join(', ');
        } else if (typeof option.values === 'object') {
          sizes = Object.values(option.values).join(', ');
        }
      }
      if (option.title && option.title.toLowerCase().includes('color')) {
        if (option.values && Array.isArray(option.values)) {
          colors = option.values.join(', ');
        } else if (typeof option.values === 'object') {
          colors = Object.values(option.values).join(', ');
        }
      }
    });
  }
  
  return {
    'Nº': index + 1,
    'ID': product.id,
    'Nombre': product.name || '',
    'Tipo': product.type || '',
    'Marca': product.brand || '',
    'Modelo': product.model || '',
    'Descripción': description,
    'Categoría Principal ID': raw.main_category_id || '',
    'Tipo de Producto': raw.type_name || '',
    'Título': raw.title || '',
    'Imagen': product.image || '',
    'Número de Variantes': raw.variant_count || 0,
    'Moneda': raw.currency || 'USD',
    'Descontinuado': raw.is_discontinued ? 'Sí' : 'No',
    'Tiempo Promedio de Cumplimiento': raw.avg_fulfillment_time || '',
    'País de Origen': raw.origin_country || '',
    'Técnicas de Impresión': techniques,
    'Archivos Disponibles': files,
    'Precios Adicionales': additionalPrices,
    'Tallas Disponibles': sizes,
    'Colores Disponibles': colors,
    'Dimensiones': raw.dimensions ? JSON.stringify(raw.dimensions) : '',
    'Opciones': raw.options ? JSON.stringify(raw.options) : '',
    'Fecha de Obtención': raw.fetchedAt || '',
    'Fuente': 'JSON Original',
    'URL': '',
    'Método': 'API'
  };
});

// Procesar productos escrapeados (solo los válidos)
const processedScraped = scrapedProducts
  .map(product => {
    const cleanedName = cleanProductName(product.name);
    return {
      ...product,
      cleanedName,
      isValid: cleanedName.length > 0
    };
  })
  .filter(product => product.isValid)
  .map((product, index) => ({
    'Nº': processedOriginal.length + index + 1,
    'ID': product.id,
    'Nombre': product.cleanedName,
    'Tipo': '',
    'Marca': '',
    'Modelo': '',
    'Descripción': '',
    'Categoría Principal ID': '',
    'Tipo de Producto': '',
    'Título': product.originalName || '',
    'Imagen': product.image || '',
    'Número de Variantes': 0,
    'Moneda': 'EUR',
    'Descontinuado': 'No',
    'Tiempo Promedio de Cumplimiento': '',
    'País de Origen': '',
    'Técnicas de Impresión': '',
    'Archivos Disponibles': '',
    'Precios Adicionales': '',
    'Tallas Disponibles': '',
    'Colores Disponibles': '',
    'Dimensiones': '',
    'Opciones': '',
    'Fecha de Obtención': product.scrapedAt || '',
    'Fuente': 'Web Scraping',
    'URL': product.url || '',
    'Método': product.method || 'Puppeteer'
  }));

// Combinar todos los productos
const allProducts = [...processedOriginal, ...processedScraped];

console.log(`\n📊 Resumen:`);
console.log(`   - Productos del JSON original: ${processedOriginal.length}`);
console.log(`   - Productos escrapeados válidos: ${processedScraped.length}`);
console.log(`   - Total productos combinados: ${allProducts.length}`);

// Crear workbook con múltiples hojas
const workbook = XLSX.utils.book_new();

// Hoja 1: Todos los productos combinados
const allProductsSheet = XLSX.utils.json_to_sheet(allProducts);
XLSX.utils.book_append_sheet(workbook, allProductsSheet, 'Catálogo Completo');

// Hoja 2: Solo productos del JSON original
const originalSheet = XLSX.utils.json_to_sheet(processedOriginal);
XLSX.utils.book_append_sheet(workbook, originalSheet, 'JSON Original');

// Hoja 3: Solo productos escrapeados
const scrapedSheet = XLSX.utils.json_to_sheet(processedScraped);
XLSX.utils.book_append_sheet(workbook, scrapedSheet, 'Web Scraping');

// Ajustar anchos de columna
const columnWidths = [
  { wch: 5 },   // Nº
  { wch: 15 },  // ID
  { wch: 50 },  // Nombre
  { wch: 15 },  // Tipo
  { wch: 15 },  // Marca
  { wch: 20 },  // Modelo
  { wch: 60 },  // Descripción
  { wch: 15 },  // Categoría Principal ID
  { wch: 20 },  // Tipo de Producto
  { wch: 40 },  // Título
  { wch: 50 },  // Imagen
  { wch: 15 },  // Número de Variantes
  { wch: 8 },   // Moneda
  { wch: 12 },  // Descontinuado
  { wch: 20 },  // Tiempo Promedio de Cumplimiento
  { wch: 20 },  // País de Origen
  { wch: 30 },  // Técnicas de Impresión
  { wch: 50 },  // Archivos Disponibles
  { wch: 40 },  // Precios Adicionales
  { wch: 20 },  // Tallas Disponibles
  { wch: 20 },  // Colores Disponibles
  { wch: 30 },  // Dimensiones
  { wch: 30 },  // Opciones
  { wch: 20 },  // Fecha de Obtención
  { wch: 15 },  // Fuente
  { wch: 60 },  // URL
  { wch: 15 }   // Método
];

allProductsSheet['!cols'] = columnWidths;
originalSheet['!cols'] = columnWidths;
scrapedSheet['!cols'] = columnWidths;

// Guardar el archivo Excel
const outputPath = path.join(__dirname, '../printful-complete-catalog.xlsx');
XLSX.writeFile(workbook, outputPath);

console.log(`\n✅ Archivo Excel completo creado: ${outputPath}`);
console.log(`📊 Total de productos: ${allProducts.length}`);
console.log(`📋 Hojas incluidas:`);
console.log(`   - Catálogo Completo (${allProducts.length} productos)`);
console.log(`   - JSON Original (${processedOriginal.length} productos)`);
console.log(`   - Web Scraping (${processedScraped.length} productos)`);

// Estadísticas finales
const stats = {
  total: allProducts.length,
  withImages: allProducts.filter(p => p.Imagen).length,
  withDescriptions: allProducts.filter(p => p.Descripción).length,
  withVariants: allProducts.filter(p => p['Número de Variantes'] > 0).length,
  fromOriginal: processedOriginal.length,
  fromScraped: processedScraped.length
};

console.log(`\n📈 Estadísticas finales:`);
console.log(`   - Productos con imágenes: ${stats.withImages}`);
console.log(`   - Productos con descripción: ${stats.withDescriptions}`);
console.log(`   - Productos con variantes: ${stats.withVariants}`);
console.log(`   - Del JSON original: ${stats.fromOriginal}`);
console.log(`   - Del web scraping: ${stats.fromScraped}`);

