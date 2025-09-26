interface PrintfulProduct {
  id: number
  name: string
  type: string
  brand: string
  model: string
  image: string
  variant_count: number
  currency: string
  price: string
  in_stock: boolean
}

interface PrintfulVariant {
  id: number
  product_id: number
  name: string
  size: string
  color: string
  color_code: string
  image: string
  price: string
  in_stock: boolean
}

interface PrintfulOrder {
  id: number
  external_id: string
  status: string
  shipping: string
  created: number
  updated: number
  recipient: {
    name: string
    company: string
    address1: string
    address2: string
    city: string
    state_code: string
    country_code: string
    zip: string
    phone: string
    email: string
  }
  items: Array<{
    variant_id: number
    quantity: number
    price: string
    retail_price: string
    name: string
    product: {
      variant_id: number
      product_id: number
      image: string
      name: string
    }
    files: Array<{
      id: number
      type: string
      hash: string
      url: string
      filename: string
      mime_type: string
      size: number
      width: number
      height: number
      dpi: number
      status: string
      created: number
      thumbnail_url: string
      preview_url: string
      visible: boolean
    }>
  }>
  costs: {
    currency: string
    subtotal: string
    discount: string
    shipping: string
    digitization: string
    additional_fee: string
    fulfillment_fee: string
    tax: string
    total: string
  }
  retail_costs: {
    currency: string
    subtotal: string
    discount: string
    shipping: string
    tax: string
    total: string
  }
  shipments: Array<{
    id: number
    carrier: string
    service: string
    tracking_number: string
    tracking_url: string
    created: number
    ship_date: string
    shipped_at: number
    reshipment: boolean
    reshipment_reason: string
  }>
  gift: {
    subject: string
    message: string
  }
}

class PrintfulAPI {
  private apiKey: string
  private baseURL = 'https://api.printful.com'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`Printful API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async getProducts(): Promise<PrintfulProduct[]> {
    const response = await this.request('/products')
    return response.result
  }

  async getProduct(productId: number): Promise<PrintfulProduct> {
    const response = await this.request(`/products/${productId}`)
    return response.result
  }

  async getProductVariants(productId: number): Promise<PrintfulVariant[]> {
    const response = await this.request(`/products/${productId}/variants`)
    return response.result
  }

  async createOrder(orderData: {
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
      email: string
    }
    items: Array<{
      variant_id: number
      quantity: number
      retail_price?: string
      name?: string
      files: Array<{
        type: string
        url: string
        position: {
          area_width: number
          area_height: number
          width: number
          height: number
          top: number
          left: number
        }
      }>
    }>
    retail_costs?: {
      currency: string
      subtotal: string
      discount: string
      shipping: string
      tax: string
    }
  }): Promise<PrintfulOrder> {
    const response = await this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    })
    return response.result
  }

  async getOrder(orderId: number): Promise<PrintfulOrder> {
    const response = await this.request(`/orders/${orderId}`)
    return response.result
  }

  async updateOrder(orderId: number, orderData: Partial<PrintfulOrder>): Promise<PrintfulOrder> {
    const response = await this.request(`/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify(orderData),
    })
    return response.result
  }

  async confirmOrder(orderId: number): Promise<PrintfulOrder> {
    const response = await this.request(`/orders/${orderId}/confirm`, {
      method: 'POST',
    })
    return response.result
  }

  async cancelOrder(orderId: number, reason: string): Promise<PrintfulOrder> {
    const response = await this.request(`/orders/${orderId}/cancel`, {
      method: 'DELETE',
      body: JSON.stringify({ reason }),
    })
    return response.result
  }

  async getShippingRates(recipient: {
    country_code: string
    state_code?: string
    city?: string
    zip: string
  }, items: Array<{
    variant_id: number
    quantity: number
  }>): Promise<Array<{
    id: string
    name: string
    rate: string
    currency: string
    minDeliveryDays: number
    maxDeliveryDays: number
  }>> {
    const response = await this.request('/shipping/rates', {
      method: 'POST',
      body: JSON.stringify({ recipient, items }),
    })
    return response.result
  }
}

export const printful = new PrintfulAPI(process.env.PRINTFUL_API_KEY!)
export type { PrintfulProduct, PrintfulVariant, PrintfulOrder }
