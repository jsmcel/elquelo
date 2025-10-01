onst PRINTFUL_BASE_URL = process.env.PRINTFUL_API_BASE || 'https://api.printful.com'

export interface PrintfulClientOptions {
  apiKey?: string
  storeId?: string
}

export class PrintfulClient {
  private apiKey: string
  private storeId?: string
  private baseUrl: string

  constructor(options?: PrintfulClientOptions) {
    const apiKey = options?.apiKey ?? process.env.PRINTFUL_API_KEY
    if (!apiKey) {
      throw new Error('PRINTFUL_API_KEY is not set')
    }
    this.apiKey = apiKey
    this.storeId = options?.storeId ?? process.env.PRINTFUL_STORE_ID ?? undefined
    this.baseUrl = PRINTFUL_BASE_URL
  }

  private buildHeaders(extra?: Record<string, string>) {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }
    if (this.storeId) {
      headers['X-PF-Store-Id'] = this.storeId
    }
    if (extra) {
      Object.assign(headers, extra)
    }
    return headers
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), init.signal ? 0 : 15000)

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers: this.buildHeaders(init.headers as Record<string, string> | undefined),
        signal: init.signal ?? controller.signal,
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`Printful error ${response.status}: ${text}`)
      }

      if (response.status === 204) {
        return {} as T
      }

      return (await response.json()) as T
    } finally {
      clearTimeout(timeout)
    }
  }

  getProduct(productId: number | string) {
    return this.request(`/products/${productId}`)
  }

  createMockupTask(productId: number | string, payload: any) {
    return this.request(`/mockup-generator/create-task/${productId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  getMockupTask(taskKey: string) {
    return this.request(`/mockup-generator/task?task_key=${encodeURIComponent(taskKey)}`)
  }

  getPrintfiles(productId: number | string) {
    return this.request(`/mockup-generator/printfiles/${productId}`)
  }
}

