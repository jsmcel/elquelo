const fs = require('fs');
const XLSX = require('xlsx');
const path = require('path');

// Leer el archivo JSON escrapeado
const jsonPath = path.join(__dirname, '../mocks/printful-puppeteer-catalog.json');
console.log('Leyendo archivo JSON escrapeado:', jsonPath);

const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const products = jsonData.products;

console.log(`Encontrados ${products.length} productos escrapeados`);

// Función para limpiar y validar nombres de productos
function cleanProductName(name) {
  if (!name || typeof name !== 'string') return '';
  
  // Limpiar el nombre
  let cleaned = name.trim();
  
  // Filtrar nombres que no son productos reales
  const invalidPatterns = [
    /^talla/i,
    /^s\s*-\s*xl$/i,
    /^xs\s*-\s*xxl$/i,
    /^\d+\s*-\s*\d+$/,
    /^€?\d+\.?\d*$/,
    /^con\s+vat/i,
    /^reseñas/i,
    /^puntuación/i,
    /^estrellas/i,
    /^\d+\s*estrellas/i,
    /^ver\s+más/i,
    /^cargar\s+más/i,
    /^mostrar\s+más/i,
    /^siguiente/i,
    /^anterior/i,
    /^página/i,
    /^\d+$/,
    /^[€$]\d+/,
    /^€?\d+\.?\d*\s*€?$/,
    /^\d+\s*€?$/
  ];
  
  for (const pattern of invalidPatterns) {
    if (pattern.test(cleaned)) {
      return '';
    }
  }
  
  // Limpiar caracteres extraños
  cleaned = cleaned.replace(/\s+/g, ' ');
  cleaned = cleaned.replace(/[^\w\s|]/g, ' ');
  cleaned = cleaned.trim();
  
  // Debe tener al menos 5 caracteres y no ser solo números
  if (cleaned.length < 5 || /^\d+$/.test(cleaned)) {
    return '';
  }
  
  return cleaned;
}

// Filtrar y limpiar productos
const cleanedProducts = products
  .map(product => {
    const cleanedName = cleanProductName(product.name);
    return {
      ...product,
      originalName: product.name,
      name: cleanedName,
      isValid: cleanedName.length > 0
    };
  })
  .filter(product => product.isValid);

console.log(`Productos válidos después de limpiar: ${cleanedProducts.length}`);

// Preparar los datos para Excel
const excelData = cleanedProducts.map((product, index) => {
  return {
    'Nº': index + 1,
    'ID': product.id,
    'Nombre Limpiado': product.name,
    'Nombre Original': product.originalName,
    'Precio': product.price || '',
    'Imagen': product.image || '',
    'URL': product.url || '',
    'Método': product.method || '',
    'Selector': product.selector || '',
    'Fecha de Escrapeo': product.scrapedAt || '',
    'Fuente': jsonData.source || '',
    'URL Base': jsonData.baseUrl || ''
  };
});

// Crear un nuevo workbook
const workbook = XLSX.utils.book_new();

// Crear una hoja de trabajo
const worksheet = XLSX.utils.json_to_sheet(excelData);

// Ajustar el ancho de las columnas
const columnWidths = [
  { wch: 5 },   // Nº
  { wch: 15 },  // ID
  { wch: 50 },  // Nombre Limpiado
  { wch: 50 },  // Nombre Original
  { wch: 15 },  // Precio
  { wch: 60 },  // Imagen
  { wch: 60 },  // URL
  { wch: 15 },  // Método
  { wch: 20 },  // Selector
  { wch: 25 },  // Fecha de Escrapeo
  { wch: 30 },  // Fuente
  { wch: 40 }   // URL Base
];

worksheet['!cols'] = columnWidths;

// Agregar la hoja al workbook
XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos Limpiados');

// Guardar el archivo Excel
const outputPath = path.join(__dirname, '../printful-products-clean.xlsx');
XLSX.writeFile(workbook, outputPath);

console.log(`✅ Archivo Excel limpio creado: ${outputPath}`);
console.log(`📊 Total de productos válidos: ${cleanedProducts.length}`);
console.log(`📊 Productos filtrados: ${products.length - cleanedProducts.length}`);

// Mostrar estadísticas adicionales
const stats = {
  totalOriginal: products.length,
  validProducts: cleanedProducts.length,
  filteredOut: products.length - cleanedProducts.length,
  withImages: cleanedProducts.filter(p => p.image).length,
  withPrices: cleanedProducts.filter(p => p.price).length,
  withUrls: cleanedProducts.filter(p => p.url).length,
  withRealIds: cleanedProducts.filter(p => p.id && !p.id.startsWith('scraped_') && !p.id.startsWith('link_')).length
};

console.log('\n📈 Estadísticas:');
console.log(`   - Productos originales: ${stats.totalOriginal}`);
console.log(`   - Productos válidos: ${stats.validProducts}`);
console.log(`   - Productos filtrados: ${stats.filteredOut}`);
console.log(`   - Con imágenes: ${stats.withImages}`);
console.log(`   - Con precios: ${stats.withPrices}`);
console.log(`   - Con URLs: ${stats.withUrls}`);
console.log(`   - Con IDs reales: ${stats.withRealIds}`);

// Mostrar algunos ejemplos de productos limpios
console.log('\n🔍 Ejemplos de productos válidos:');
cleanedProducts.slice(0, 10).forEach((product, index) => {
  console.log(`   ${index + 1}. ${product.name} (${product.id})`);
});

// Mostrar algunos productos filtrados
const filteredProducts = products.filter(p => !cleanProductName(p.name));
if (filteredProducts.length > 0) {
  console.log('\n❌ Ejemplos de productos filtrados:');
  filteredProducts.slice(0, 5).forEach((product, index) => {
    console.log(`   ${index + 1}. "${product.name}" (filtrado)`);
  });
}


