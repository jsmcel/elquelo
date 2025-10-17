import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ensureUserProfile, generateQrCodeValue, buildDefaultDestination, generateUniqueDestinationUrl } from '@/lib/user-profile'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getAllPackages } from '@/lib/packages'

type MemberPayload = {
  name?: string
  email?: string
  size?: string
  is_novio_novia?: boolean
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabaseClient = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await ensureUserProfile(supabase, user)

    const body = await req.json()
    const { 
      destination_url, 
      title, 
      description, 
      groupId,
      members = [],
      selectedPackages = [],
      eventDate
    } = body

    // Validate required fields
    if (!eventDate) {
      return NextResponse.json({ 
        error: 'La fecha del evento es obligatoria' 
      }, { status: 400 })
    }

    const defaultDestination = buildDefaultDestination()
    const groupName = 'Mi Grupo'

    // Multiple QRs creation
    if (members && members.length > 0) {
      console.log('🔍 Selected packages:', selectedPackages)
      console.log('🔍 Members length:', members.length)
      
      if (selectedPackages.length > 0 && members && members.length > 0) {
        console.log('✅ Creating products for', selectedPackages.length, 'packages and', members.length, 'participants')
        
        // Get all variant IDs from selected packages
        const allVariantIds: number[] = []
        const packagesToProcess = getAllPackages().filter(pkg => selectedPackages.includes(pkg.id))
        
        packagesToProcess.forEach(pkg => {
          pkg.products.forEach(product => {
            if (product.defaultVariantId && product.defaultVariantId !== 0) {
              allVariantIds.push(product.defaultVariantId)
            }
          })
        })
        
        // Get real prices from Printful API
        let pricesData = []
        try {
          const printfulPrices = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/printful/prices`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ variantIds: allVariantIds })
          })
          
          if (printfulPrices.ok) {
            const responseText = await printfulPrices.text()
            if (responseText.trim()) {
              pricesData = JSON.parse(responseText)
            }
          } else {
            console.error('❌ Printful prices API failed:', printfulPrices.status, printfulPrices.statusText)
          }
        } catch (error) {
          console.error('❌ Error fetching Printful prices:', error)
          pricesData = [] // Fallback to empty array
        }
        console.log('💰 Printful prices:', pricesData)
        
        // Create QRs for each member
        const qrPromises = members.map(async (member: MemberPayload) => {
          const qrCode = generateQrCodeValue()
          const targetDestination = destination_url || defaultDestination
          const uniqueDestination = generateUniqueDestinationUrl(
            targetDestination,
            qrCode,
            member.name || 'Usuario',
            groupName
          )

          return supabase
            .from('qrs')
            .insert({
              code: qrCode,
              user_id: user.id,
              destination_url: uniqueDestination,
              title: member.name || null,
              description: member.email || null,
              group_id: groupId,
            })
            .select()
            .single()
        })

        const qrResults = await Promise.all(qrPromises)
        const data = qrResults.map(result => result.data).filter(Boolean)
        const errors = qrResults.filter(result => result.error).map(result => result.error)

        if (errors.length > 0) {
          console.error('Some QR creation errors:', errors)
        }

        // Create design data for each QR
        const designData = data.map((qr) => {
          const participant = members.find((m: MemberPayload) => {
            const memberName = m.name || ''
            const qrTitle = qr.title || ''
            const qrDescription = qr.description || ''
            return memberName === qrTitle || 
                   memberName === qrDescription ||
                   qrTitle.includes(memberName) ||
                   qrDescription.includes(memberName)
          })
          const participantSize = participant?.size || 'M'

          // Create products based on selected packages
          const products: any[] = []
          packagesToProcess.forEach(pkg => {
            // Check if this package is only for novio/novia
            const isNovioNoviaPackage = pkg.onlyForNoviNovia === true
            const isParticipantNovioNovia = participant?.is_novio_novia === true
            
            // Skip this package if it's only for novio/novia but participant is not novio/novia
            if (isNovioNoviaPackage && !isParticipantNovioNovia) {
              console.log(`⏭️  Skipping package ${pkg.id} for participant ${participant?.name} (not novio/novia)`)
              return
            }
            
            // Novios/novias get ALL packages (both regular and exclusive)
            // Only skip if package is exclusive to novio/novia but participant is not novio/novia
            
            console.log(`✅ Adding package ${pkg.id} for participant ${participant?.name} (novio/novia: ${isParticipantNovioNovia})`)
            
            pkg.products.forEach(product => {
              if (product.defaultVariantId && product.defaultVariantId !== 0) {
                const variantPrice = pricesData.find((p: any) => p.variantId === product.defaultVariantId)
                products.push({
                  id: crypto.randomUUID(),
                  productId: product.productId,
                  templateId: product.productId,
                  variantId: product.defaultVariantId,
                  productName: product.name,
                  size: participantSize,
                  color: variantPrice?.color || 'White',
                  colorCode: variantPrice?.colorCode || '#FFFFFF',
                  price: variantPrice?.price || 0,
                  currency: variantPrice?.currency || 'USD',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                })
              }
            })
          })

          // If no products were added, add a default t-shirt
          if (products.length === 0) {
            console.log(`⚠️  No products added for participant ${participant?.name}, adding default t-shirt`)
            products.push({
              id: crypto.randomUUID(),
              productId: 71,
              templateId: 71,
              variantId: 4013,
              productName: 'Unisex Staple T-Shirt',
              size: participantSize,
              color: 'White',
              colorCode: '#FFFFFF',
              price: 0,
              currency: 'USD',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
          }

          return {
            qr_code: qr.code,
            design_data: {
              version: '2.0',
              type: 'default',
              text: qr.title || 'Mi QR',
              color: '#000000',
              font: 'Arial',
              size: 24,
              position: { x: 50, y: 50 },
              qrCode: qr.code,
              lastUpdated: new Date().toISOString(),
              variant_id: products.length > 0 ? products[0].variantId : 4013,
              product_id: products.length > 0 ? products[0].productId : 71,
              products: products,
              event_date: eventDate,
              participant_size: participantSize,
            }
          }
        })

        const { error: productsError } = await supabase
          .from('qr_designs')
          .insert(designData)

        if (productsError) {
          console.error('❌ Error creating products:', productsError)
        } else {
          console.log('✅ Successfully created', designData.length, 'design entries')
        }
        
        // Start background mockup generation (don't await)
        generateMockupsInBackground(data, members, selectedPackages).catch(error => {
          console.error('❌ Background mockup generation failed:', error)
        })
        
        // Return success response
        return NextResponse.json({
          success: true,
          message: 'QRs creados exitosamente. Los mockups aparecerán en unos minutos.',
          data: data,
          mockupsGenerating: true
        })
      } else {
        // No packages selected - return error
        return NextResponse.json({ 
          error: 'Debes seleccionar al menos un paquete' 
        }, { status: 400 })
      }
    }
  } catch (error) {
    console.error('Error in QR creation:', error)
    return NextResponse.json({ error: 'Error in QR creation' }, { status: 500 })
  }
}

// Background function to generate mockups
async function generateMockupsInBackground(data: any[], members: any[], selectedPackages: string[]) {
  try {
    console.log('🎨 Starting background mockup generation for', data.length, 'QRs')
    
    // Create Supabase client for background processing
    const supabase = createRouteHandlerClient({ cookies: () => new Map() })
    
    // Get packages to process
    const packagesToProcess = getAllPackages().filter(pkg => selectedPackages.includes(pkg.id))
    
    // Generate individual mockups for each QR
    for (const qr of data) {
      try {
        console.log(`🎨 Processing QR: ${qr.code}`)
        
        // Generate QR image for this specific QR
        const { generateStandardQR } = await import('@/lib/qr-generator')
        const qrUrl = `${process.env.QR_DOMAIN}/${qr.code}`
        const qrDataUrl = await generateStandardQR(qrUrl)
        
        // Convert data URL to Buffer
        const base64Data = qrDataUrl.split(',')[1]
        const qrBuffer = Buffer.from(base64Data, 'base64')
        
        // Upload QR to Supabase Storage
        const fileName = `${qr.code}-front-qr.png`
        const filePath = `designs/${fileName}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('designs')
          .upload(filePath, qrBuffer, {
            contentType: 'image/png',
            upsert: true,
          })

        if (uploadError) {
          console.error(`❌ Error uploading QR for ${qr.code}:`, uploadError)
          continue
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('designs')
          .getPublicUrl(filePath)
        
        const qrPublicUrl = urlData.publicUrl
        console.log(`✅ QR uploaded for ${qr.code}:`, qrPublicUrl)
        
        // Get design data for this QR
        const { data: designRecord, error: designFetchError } = await supabase
          .from('qr_designs')
          .select('design_data')
          .eq('qr_code', qr.code)
          .single()

        if (designFetchError) {
          console.error('❌ Error fetching design for ' + qr.code + ':', designFetchError)
          continue
        }

        const existingDesignData = designRecord?.design_data || {}
        const existingProducts = Array.isArray(existingDesignData?.products)
          ? existingDesignData.products
          : []

        // Find participant for this QR
        const participant = members.find((m: any) => {
          const memberName = m.name || ''
          const qrTitle = qr.title || ''
          const qrDescription = qr.description || ''
          return memberName === qrTitle || 
                 memberName === qrDescription ||
                 qrTitle.includes(memberName) ||
                 qrDescription.includes(memberName)
        })

        // Generate mockups for each product of this QR
        for (const product of existingProducts) {
          try {
            console.log(`🎨 Generating mockup for product ${product.productId}, variant ${product.variantId}`)
            
            // Request mockup with this specific QR
            const mockupResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/printful/mockup`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                productId: product.productId,
                variantIds: [product.variantId],
                files: [{
                  placement: 'front',
                  imageUrl: qrPublicUrl,
                  position: {
                    top: 600,
                    left: 600,
                    width: product.designMetadata?.front?.width || 1800,
                    height: product.designMetadata?.front?.height || 1800,
                    areaWidth: 3600,
                    areaHeight: 4800,
                  }
                }]
              })
            })

            if (mockupResponse.ok) {
              const mockupData = await mockupResponse.json()
              const taskKey = mockupData.requestId
              console.log(`✅ Mockup task created for product ${product.productId}:`, taskKey)
              
              // Poll for mockup completion (max 10 attempts, 2 seconds each)
              for (let attempt = 0; attempt < 10; attempt++) {
                await new Promise(resolve => setTimeout(resolve, 2000))
                
                const statusResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/printful/mockup?requestId=${taskKey}`)
                if (!statusResponse.ok) continue
                
                const statusData = await statusResponse.json()
                
                if (statusData.status === 'completed' && statusData.normalizedMockups) {
                  // Update the product with the real mockup
                  const normalizedArray = statusData.normalizedMockups
                  const productMockups: any = {}
                  
                  normalizedArray.forEach((mockup: any) => {
                    const variantId = mockup.variantId
                    const placement = mockup.placement
                    const url = mockup.url
                    
                    if (!productMockups[variantId]) {
                      productMockups[variantId] = {}
                    }
                    productMockups[variantId][placement] = { url: url }
                  })
                  
                  // Update the design data with the real mockup
                  const updatedProducts = existingProducts.map((p: any) => 
                    p.id === product.id 
                      ? { 
                          ...p, 
                          variantMockups: {
                            ...(p.variantMockups || {}),
                            ...productMockups
                          }
                        }
                      : p
                  )
                  
                  const updatedDesignData = {
                    ...existingDesignData,
                    products: updatedProducts
                  }
                  
                  await supabase
                    .from('qr_designs')
                    .update({ design_data: updatedDesignData })
                    .eq('qr_code', qr.code)
                  
                  console.log(`✅ Real mockup generated for product ${product.productId}, variant ${product.variantId}`)
                  break
                }
                
                if (statusData.status === 'failed') {
                  console.error(`❌ Mockup generation failed for product ${product.productId}:`, statusData.error)
                  break
                }
              }
            } else {
              console.error(`❌ Failed to request mockup for product ${product.productId}`)
            }
          } catch (error) {
            console.error(`❌ Error generating mockup for product ${product.productId}:`, error)
          }
        }
      } catch (error) {
        console.error(`❌ Error processing QR ${qr.code}:`, error)
      }
    }
    
    console.log('✅ Background mockup generation completed for all QRs')
  } catch (error) {
    console.error('❌ Error in background mockup generation:', error)
  }
}
