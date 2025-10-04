const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Función para hacer delay entre requests
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Función para limpiar texto
function cleanText(text) {
  return text ? text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim() : '';
}

// Función principal de scraping
async function scrapePrintfulCatalog() {
  let browser;
  
  try {
    console.log('🚀 Iniciando scraping de Printful...');
    
    // Configurar Puppeteer
    browser = await puppeteer.launch({
      headless: true, // Cambiar a false para ver el navegador
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Configurar user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    const allProducts = [];
    let pageNum = 1;
    let hasMorePages = true;
    
    // URL base de productos de Printful
    const baseUrl = 'https://www.printful.com/products';
    
    while (hasMorePages) {
      try {
        console.log(`📄 Escrapeando página ${pageNum}...`);
        
        const url = pageNum === 1 ? baseUrl : `${baseUrl}?page=${pageNum}`;
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Esperar a que los productos se carguen
        await page.waitForSelector('.product-card, .product-item, [data-testid="product-card"]', { timeout: 10000 });
        
        // Extraer productos de la página actual
        const pageProducts = await page.evaluate(() => {
          const products = [];
          
          // Intentar diferentes selectores para encontrar productos
          const productSelectors = [
            '.product-card',
            '.product-item', 
            '[data-testid="product-card"]',
            '.catalog-item',
            '.product-tile'
          ];
          
          let productElements = [];
          for (const selector of productSelectors) {
            productElements = document.querySelectorAll(selector);
            if (productElements.length > 0) break;
          }
          
          productElements.forEach((element, index) => {
            try {
              // Extraer información del producto
              const nameElement = element.querySelector('h3, .product-title, .product-name, [data-testid="product-title"]');
              const priceElement = element.querySelector('.price, .product-price, [data-testid="price"]');
              const imageElement = element.querySelector('img');
              const linkElement = element.querySelector('a');
              
              const product = {
                id: index + 1,
                name: nameElement ? nameElement.textContent.trim() : '',
                price: priceElement ? priceElement.textContent.trim() : '',
                image: imageElement ? imageElement.src || imageElement.getAttribute('data-src') : '',
                url: linkElement ? linkElement.href : '',
                scrapedAt: new Date().toISOString()
              };
              
              if (product.name) {
                products.push(product);
              }
            } catch (error) {
              console.error('Error procesando producto:', error);
            }
          });
          
          return products;
        });
        
        console.log(`✅ Página ${pageNum}: ${pageProducts.length} productos encontrados`);
        
        if (pageProducts.length === 0) {
          console.log('📄 No se encontraron más productos. Finalizando...');
          hasMorePages = false;
        } else {
          allProducts.push(...pageProducts);
          pageNum++;
          
          // Delay entre páginas para ser respetuosos
          await delay(2000);
          
          // Límite de seguridad para evitar bucles infinitos
          if (pageNum > 100) {
            console.log('⚠️ Límite de páginas alcanzado (100)');
            hasMorePages = false;
          }
        }
        
      } catch (error) {
        console.error(`❌ Error en página ${pageNum}:`, error.message);
        
        // Si hay error, intentar una vez más después de un delay
        await delay(5000);
        
        // Si falla dos veces seguidas, parar
        if (pageNum > 1) {
          console.log('🛑 Deteniendo scraping debido a errores consecutivos');
          hasMorePages = false;
        }
      }
    }
    
    console.log(`\n🎉 Scraping completado! Total de productos: ${allProducts.length}`);
    
    // Guardar resultados
    const outputData = {
      scrapedAt: new Date().toISOString(),
      source: 'web-scraping',
      totalProducts: allProducts.length,
      baseUrl: baseUrl,
      products: allProducts
    };
    
    const outputPath = path.join(__dirname, '../mocks/printful-scraped-catalog.json');
    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf8');
    
    console.log(`💾 Catálogo guardado en: ${outputPath}`);
    
    // Estadísticas
    const uniqueNames = [...new Set(allProducts.map(p => p.name).filter(Boolean))];
    const withImages = allProducts.filter(p => p.image).length;
    
    console.log(`\n📈 Estadísticas:`);
    console.log(`   - Productos únicos: ${uniqueNames.length}`);
    console.log(`   - Con imágenes: ${withImages}`);
    console.log(`   - Páginas procesadas: ${pageNum - 1}`);
    
    return allProducts;
    
  } catch (error) {
    console.error('❌ Error general en scraping:', error);
    return [];
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Función alternativa usando fetch (más rápido pero menos robusto)
async function scrapeWithFetch() {
  console.log('🌐 Intentando scraping con fetch...');
  
  try {
    // Intentar obtener la página principal
    const response = await fetch('https://www.printful.com/products', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // Buscar patrones de productos en el HTML
    const productMatches = html.match(/data-product-id="(\d+)"/g) || [];
    const nameMatches = html.match(/data-product-name="([^"]+)"/g) || [];
    
    console.log(`📊 Encontrados ${productMatches.length} productos en HTML`);
    
    // Crear productos básicos
    const products = productMatches.map((match, index) => {
      const idMatch = match.match(/data-product-id="(\d+)"/);
      const nameMatch = nameMatches[index]?.match(/data-product-name="([^"]+)"/);
      
      return {
        id: idMatch ? parseInt(idMatch[1]) : index + 1,
        name: nameMatch ? decodeURIComponent(nameMatch[1]) : `Producto ${index + 1}`,
        scrapedAt: new Date().toISOString(),
        method: 'fetch'
      };
    });
    
    return products;
    
  } catch (error) {
    console.error('❌ Error en scraping con fetch:', error.message);
    return [];
  }
}

// Función principal
async function main() {
  console.log('🎯 Iniciando scraping de Printful...\n');
  
  // Intentar primero con fetch (más rápido)
  let products = await scrapeWithFetch();
  
  // Si no funciona o obtenemos pocos productos, usar Puppeteer
  if (products.length < 10) {
    console.log('\n🔄 Pocos productos encontrados con fetch, intentando con Puppeteer...');
    products = await scrapePrintfulCatalog();
  }
  
  if (products.length > 0) {
    console.log(`\n✅ Scraping exitoso! ${products.length} productos obtenidos`);
  } else {
    console.log('\n❌ No se pudieron obtener productos');
  }
}

// Ejecutar
main().catch(console.error);


