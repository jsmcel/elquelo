interface PrintfulProduct {
  id: number
  name: string
  sku: string
  price: string
}

interface PrintfulVariant {
  id: number
  product_id: number
  name: string
  size: string
  color: string
  sku: string
}

interface PrintfulOrder {
  external_id: string
  shipping: string
  recipient: {
    name: string
    company?: string
    address1: string
    address2?: string
    city: string
    state_code?: string
    country_code: string
    zip: string
    phone?: string
    email?: string
  }
  items: Array<{
    variant_id: number
    quantity: number
    retail_price?: string
    name?: string
    files?: Array<{
      url: string
      type: string
    }>
  }>
  retail_costs?: {
    currency: string
    subtotal: string
    discount: string
    shipping: string
    tax: string
    total: string
  }
}

interface PrintfulResponse {
  code: number
  result?: any
  error?: {
    code: number
    message: string
  }
}

class PrintfulAPI {
  private apiKey: string
  private baseUrl = 'https://api.printful.com'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  private async request(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', data?: any): Promise<PrintfulResponse> {
    const url = `${this.baseUrl}${endpoint}`
    
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    })

    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(`Printful API Error: ${result.error?.message || 'Unknown error'}`)
    }

    return result
  }

  // Obtener productos disponibles
  async getProducts(): Promise<PrintfulProduct[]> {
    const response = await this.request('/products')
    return response.result || []
  }

  // Obtener variantes de un producto
  async getProductVariants(productId: number): Promise<PrintfulVariant[]> {
    const response = await this.request(`/products/${productId}/variants`)
    return response.result || []
  }

  // Crear orden en Printful
  async createOrder(order: PrintfulOrder): Promise<any> {
    const response = await this.request('/orders', 'POST', order)
    return response.result
  }

  // Obtener estado de una orden
  async getOrderStatus(externalId: string): Promise<any> {
    const response = await this.request(`/orders/@${externalId}`)
    return response.result
  }

  // Cancelar orden
  async cancelOrder(externalId: string): Promise<any> {
    const response = await this.request(`/orders/@${externalId}`, 'DELETE')
    return response.result
  }

  // Obtener información de envío
  async getShippingRates(recipient: any, items: any[]): Promise<any> {
    const response = await this.request('/shipping/rates', 'POST', {
      recipient,
      items
    })
    return response.result
  }

  // Obtener todos los productos del catálogo con paginación
  async getCatalogProducts(limit: number = 100, offset: number = 0): Promise<any> {
    const response = await this.request(`/products?limit=${limit}&offset=${offset}`)
    return response
  }

  // Obtener un producto específico por ID
  async getProductById(productId: number): Promise<any> {
    const response = await this.request(`/products/${productId}`)
    return response.result
  }

  // Obtener todas las variantes de un producto específico
  async getProductVariantsById(productId: number): Promise<any> {
    const response = await this.request(`/products/${productId}/variants`)
    return response.result
  }
}

// Función helper para mapear datos de nuestro sistema a Printful
export function mapOrderToPrintful(orderData: any, designData: any): PrintfulOrder {
  return {
    external_id: orderData.id,
    shipping: 'STANDARD', // O calcular basado en la dirección
    recipient: {
      name: orderData.shipping_address?.name || 'Cliente',
      address1: orderData.shipping_address?.line1 || '',
      city: orderData.shipping_address?.city || '',
      country_code: orderData.shipping_address?.country || 'ES',
      zip: orderData.shipping_address?.postal_code || '',
      phone: orderData.shipping_address?.phone || '',
      email: orderData.customer_email || '',
    },
    items: orderData.items.map((item: any) => ({
      variant_id: getPrintfulVariantId(item.size, item.color, item.gender),
      quantity: item.quantity,
      retail_price: item.price.toString(),
      name: `Camiseta personalizada - QR ${item.qr_code}`,
      files: designData.imageUrl ? [{
        url: designData.imageUrl,
        type: 'default'
      }] : []
    })),
    retail_costs: {
      currency: 'EUR',
      subtotal: orderData.total_amount.toString(),
      discount: '0.00',
      shipping: '0.00',
      tax: '0.00',
      total: orderData.total_amount.toString()
    }
  }
}

// Mapear tallas, colores y géneros a IDs de Printful
function getPrintfulVariantId(size: string, color: string, gender: string): number {
  // Estos IDs son ejemplos - necesitas obtener los reales de tu cuenta de Printful
  const variantMap: Record<string, number> = {
    // Tallas Unisex
    'XS-unisex-white': 4011,
    'S-unisex-white': 4012,
    'M-unisex-white': 4013,
    'L-unisex-white': 4014,
    'XL-unisex-white': 4015,
    'XXL-unisex-white': 4016,
    
    // Tallas Chica
    'XS-chica-white': 4021,
    'S-chica-white': 4022,
    'M-chica-white': 4023,
    'L-chica-white': 4024,
    'XL-chica-white': 4025,
    
    // Tallas Chico
    'XS-chico-white': 4031,
    'S-chico-white': 4032,
    'M-chico-white': 4033,
    'L-chico-white': 4034,
    'XL-chico-white': 4035,
    'XXL-chico-white': 4036,
  }

  const key = `${size}-${gender}-${color}`
  return variantMap[key] || 4013 // Default: M unisex white
}

export { PrintfulAPI }
export type { PrintfulOrder, PrintfulProduct, PrintfulVariant }