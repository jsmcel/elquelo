const fs = require('fs');
const XLSX = require('xlsx');
const path = require('path');

// Leer el archivo JSON escrapeado
const jsonPath = path.join(__dirname, '../mocks/printful-puppeteer-catalog.json');
console.log('Leyendo archivo JSON escrapeado:', jsonPath);

const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const products = jsonData.products;

console.log(`Encontrados ${products.length} productos escrapeados`);

// Preparar los datos para Excel
const excelData = products.map((product, index) => {
  return {
    'Nº': index + 1,
    'ID': product.id,
    'Nombre': product.name || '',
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
  { wch: 50 },  // Nombre
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
XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos Escrapeados');

// Guardar el archivo Excel
const outputPath = path.join(__dirname, '../printful-scraped-products.xlsx');
XLSX.writeFile(workbook, outputPath);

console.log(`✅ Archivo Excel creado exitosamente: ${outputPath}`);
console.log(`📊 Total de productos procesados: ${products.length}`);
console.log(`📅 Fecha de escrapeo: ${jsonData.scrapedAt || 'No disponible'}`);
console.log(`🔗 Fuente: ${jsonData.source || 'No disponible'}`);

// Mostrar estadísticas adicionales
const stats = {
  totalProducts: products.length,
  withImages: products.filter(p => p.image).length,
  withPrices: products.filter(p => p.price).length,
  withUrls: products.filter(p => p.url).length,
  uniqueSelectors: [...new Set(products.map(p => p.selector).filter(Boolean))].length
};

console.log('\n📈 Estadísticas:');
console.log(`   - Productos con imágenes: ${stats.withImages}`);
console.log(`   - Productos con precios: ${stats.withPrices}`);
console.log(`   - Productos con URLs: ${stats.withUrls}`);
console.log(`   - Selectores únicos usados: ${stats.uniqueSelectors}`);

// Mostrar algunos ejemplos de productos
console.log('\n🔍 Ejemplos de productos encontrados:');
products.slice(0, 5).forEach((product, index) => {
  console.log(`   ${index + 1}. ${product.name} (${product.id})`);
});


