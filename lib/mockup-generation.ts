import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { Buffer } from 'node:buffer'

type CookieStore = Parameters<typeof createRouteHandlerClient>[0]['cookies']

type GenerateParams = {
  qrs: Array<Record<string, any>>
  cookieStore: CookieStore
  appUrl: string
}

export type MockupResult = {
  qrCode: string
  productsProcessed: number
  mockupsCompleted: number
  errors: string[]
}

async function uploadQrImage({
  supabase,
  qrCode,
  imageData,
}: {
  supabase: ReturnType<typeof createRouteHandlerClient>
  qrCode: string
  imageData: string
}) {
  const base64Data = imageData.split(',')[1]
  const qrBuffer = Buffer.from(base64Data, 'base64')
  const fileName = `${qrCode}-front-qr.png`
  const filePath = `designs/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('designs')
    .upload(filePath, qrBuffer, {
      contentType: 'image/png',
      upsert: true,
    })

  if (uploadError) {
    throw new Error(uploadError.message)
  }

  const { data: urlData } = supabase.storage.from('designs').getPublicUrl(filePath)
  return urlData.publicUrl
}

export async function generateMockupsForQrs({
  qrs,
  cookieStore,
  appUrl,
}: GenerateParams): Promise<MockupResult[]> {
  if (!qrs.length) {
    return []
  }

  const supabase = createRouteHandlerClient({ cookies: cookieStore })
  const results: MockupResult[] = []

  for (const qr of qrs) {
    const result: MockupResult = {
      qrCode: qr.code,
      productsProcessed: 0,
      mockupsCompleted: 0,
      errors: [],
    }

    try {
      const { generateStandardQR } = await import('@/lib/qr-generator')
      const qrUrl = `${appUrl}/qr/${qr.code}`
      const dataUrl = await generateStandardQR(qrUrl)
      const publicUrl = await uploadQrImage({ supabase, qrCode: qr.code, imageData: dataUrl })

      const { data: designRecord, error: designFetchError } = await supabase
        .from('qr_designs')
        .select('design_data')
        .eq('qr_code', qr.code)
        .single()

      if (designFetchError) {
        result.errors.push(`design fetch failed: ${designFetchError.message}`)
        results.push(result)
        continue
      }

      const designData = designRecord?.design_data || {}
      const products: any[] = Array.isArray(designData?.products) ? designData.products : []

      for (const product of products) {
        result.productsProcessed += 1

        try {
          const response = await fetch(`${appUrl}/api/printful/mockup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productId: product.productId,
              variantIds: [product.variantId],
              files: [
                {
                  placement: 'front',
                  imageUrl: publicUrl,
                  position: {
                    top: 600,
                    left: 600,
                    width: product?.designMetadata?.front?.width || 1800,
                    height: product?.designMetadata?.front?.height || 1800,
                    areaWidth: 3600,
                    areaHeight: 4800,
                  },
                },
              ],
            }),
          })

          if (!response.ok) {
            result.errors.push(`mockup request failed for product ${product.productId}`)
            continue
          }

          const { requestId } = await response.json()

          let completed = false
          for (let attempt = 0; attempt < 10; attempt++) {
            await new Promise((resolve) => setTimeout(resolve, 2000))
            const statusResponse = await fetch(
              `${appUrl}/api/printful/mockup?requestId=${encodeURIComponent(requestId)}`
            )
            if (!statusResponse.ok) {
              continue
            }

            const statusData = await statusResponse.json()
            if (statusData.status === 'completed' && Array.isArray(statusData.normalizedMockups)) {
              result.mockupsCompleted += 1

              const normalizedArray = statusData.normalizedMockups
              const productMockups: Record<string, Record<string, { url: string }>> = {}
              normalizedArray.forEach((entry: any) => {
                if (!entry?.placement || !entry?.url) {
                  return
                }
                const variantId = entry.variantId
                const placement = entry.placement
                if (!productMockups[variantId]) {
                  productMockups[variantId] = {}
                }
                productMockups[variantId][placement] = { url: entry.url }
              })

              const updatedProducts = products.map((existing) =>
                existing.id === product.id
                  ? {
                      ...existing,
                      variantMockups: {
                        ...(existing.variantMockups || {}),
                        ...productMockups,
                      },
                    }
                  : existing
              )

              await supabase
                .from('qr_designs')
                .update({ design_data: { ...designData, products: updatedProducts } })
                .eq('qr_code', qr.code)

              completed = true
              break
            }

            if (statusData.status === 'failed') {
              result.errors.push(`mockup failed for product ${product.productId}`)
              break
            }
          }

          if (!completed) {
            result.errors.push(`timeout for product ${product.productId}`)
          }
        } catch (error) {
          result.errors.push(`unexpected error for product ${product.productId}: ${String(error)}`)
        }
      }
    } catch (error) {
      result.errors.push(`processing error: ${String(error)}`)
    }

    results.push(result)
  }

  return results
}

