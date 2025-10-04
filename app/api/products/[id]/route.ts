import { NextRequest, NextResponse } from 'next/server'
import { PrintfulAPI } from '@/lib/printful'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const apiKey = process.env.PRINTFUL_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Printful API key no configurada' }, { status: 500 })
    }

    const productId = parseInt(params.id)
    if (isNaN(productId)) {
      return NextResponse.json({ error: 'ID de producto inválido' }, { status: 400 })
    }

    const printfulClient = new PrintfulAPI(apiKey)

    // Obtener información del producto
    const product = await printfulClient.getProductById(productId)
    
    if (!product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    // Obtener variantes del producto
    const variants = await printfulClient.getProductVariantsById(productId)

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        type: product.type,
        brand: product.brand,
        model: product.model,
        image: product.image,
        description: product.description,
        type_name: product.type_name,
        title: product.title,
        variant_count: product.variant_count,
        currency: product.currency,
        options: product.options || [],
        dimensions: product.dimensions,
        is_discontinued: product.is_discontinued,
        avg_fulfillment_time: product.avg_fulfillment_time,
        techniques: product.techniques || [],
        files: product.files || [],
        origin_country: product.origin_country,
        main_category_id: product.main_category_id
      },
      variants: variants || []
    })

  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json({ 
      error: 'Error al obtener el producto',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}


