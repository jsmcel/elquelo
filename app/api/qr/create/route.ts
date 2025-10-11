import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ensureUserProfile, generateQrCodeValue, buildDefaultDestination, generateUniqueDestinationUrl } from '@/lib/user-profile'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getAllPackages, getPackageConfig } from '@/lib/packages'


type MemberPayload = {
  name?: string
  title?: string
  destination_url?: string
  description?: string
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
    const body = await req.json()
    const {
      destination_url,
      title,
      description,
      members,
      group: groupName,
      eventDate, // Fecha del evento
      selectedPackages = [], // Paquetes seleccionados
    } = body

    const supabaseAuth = createRouteHandlerClient({ cookies })
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await ensureUserProfile(supabase, user)
    const defaultDestination = buildDefaultDestination()

    let groupId: string | null = null
    if (groupName && typeof groupName === 'string' && groupName.trim()) {
      const trimmedGroupName = groupName.trim()
      const { data: newGroup, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: trimmedGroupName,
          created_by: user.id,
          // event_date: eventDate || null, // TODO: Agregar columna event_date a groups
        })
        .select('id')
        .single()

      if (groupError || !newGroup) {
        console.error('Error creating group:', groupError)
        return NextResponse.json(
          { error: 'Failed to create group for QR batch' },
          { status: 500 }
        )
      }
      groupId = newGroup.id

      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: user.id,
          role: 'admin',
        })

      if (memberError) {
        console.error('Failed to add creator as group admin:', memberError)
        // Not returning an error here, as the group and QRs can still be created
      }
    }

    if (Array.isArray(members) && members.length > 0) {
      const baseUrl =
        typeof destination_url === 'string' && destination_url.trim()
          ? destination_url.trim()
          : defaultDestination

      const records = members.reduce((acc: any[], raw: MemberPayload, index: number) => {
        const memberName = (raw?.name ?? '').trim()
        const memberTitle = (raw?.title ?? '').trim()
        const finalTitle =
          memberTitle ||
          (groupName ? `${groupName} - ${memberName || 'Invitado'}` : memberName) ||
          `Invitado ${index + 1}`
        
        // Generate unique QR code first
        const qrCode = generateQrCodeValue()
        
        // Create unique destination URL for this specific QR
        const rawDestination =
          typeof raw?.destination_url === 'string' && raw.destination_url.trim()
            ? raw.destination_url.trim()
            : baseUrl
        const memberDestination = rawDestination || defaultDestination
        
        // Generate personalized destination URL with QR code as parameter
        const uniqueDestination = generateUniqueDestinationUrl(memberDestination, qrCode, memberName, groupName)
        
        const memberDescription = (raw?.description ?? description ?? '').trim()

        acc.push({
          code: qrCode,
          user_id: user.id,
          destination_url: uniqueDestination,
          title: finalTitle,
          description: memberDescription || null,
          group_id: groupId,
        })
        return acc
      }, [])

      if (records.length === 0) {
        return NextResponse.json(
          { error: 'Missing destination for QR creation' },
          { status: 400 }
        )
      }

      const { data, error } = await supabase
        .from('qrs')
        .insert(records)
        .select()

      if (error) {
        console.error('Error batch creating QRs:', error)
        return NextResponse.json(
          { error: 'Failed to create QR batch' },
          { status: 500 }
        )
      }

      // Save participants to database if group exists
      if (groupId && Array.isArray(members) && members.length > 0) {
        const participantsData = members.map((member: MemberPayload) => ({
          group_id: groupId,
          name: member.name || '',
          email: member.email || null,
          size: member.size || 'M',
          is_novio_novia: member.is_novio_novia || false,
        }))

        const { error: participantsError } = await supabase
          .from('participants')
          .insert(participantsData)

        if (participantsError) {
          console.error('Error creating participants:', participantsError)
          // Don't fail the entire request, just log the error
        }
      }

      // Create products for selected packages
      console.log('🔍 Selected packages:', selectedPackages)
      console.log('🔍 Data length:', data?.length)
      
      if (selectedPackages.length > 0 && data && data.length > 0) {
        console.log('✅ Creating products for', selectedPackages.length, 'packages and', data.length, 'participants')
        
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
        const variantPrices: Record<number, number> = {}
        
        if (allVariantIds.length > 0) {
          try {
            const priceResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/printful/variants/price`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ variantIds: allVariantIds })
            })
            
            if (priceResponse.ok) {
              const { prices } = await priceResponse.json()
              Object.assign(variantPrices, prices)
              console.log('✅ Real prices fetched:', variantPrices)
            }
          } catch (error) {
            console.error('❌ Error fetching real prices:', error)
          }
        }
        
        // Create design entries for each QR and selected packages
        const designData = data.map((qr: any) => {
          const allProducts: any[] = []
          
          // Get participant info to determine if they are novio/novia
          const participant = members.find((m: any) => m.name === qr.title || m.name === qr.description)
          const isNovioNovia = participant?.is_novio_novia || false
          
          // Add products from each selected package
          packagesToProcess.forEach(pkg => {
            // Skip novio/novia only packages if participant is not novio/novia
            if (pkg.onlyForNoviNovia && !isNovioNovia) {
              console.log(`⏭️ Skipping package ${pkg.id} for non-novio/novia participant`)
              return
            }
            
            pkg.products.forEach(product => {
              const variantId = product.defaultVariantId || 0
              const realPrice = variantPrices[variantId] || product.estimatedPrice || 0
              
              allProducts.push({
                id: crypto.randomUUID(),
                productId: product.productId,
                templateId: product.productId,
                variantId: variantId,
                productName: product.name,
                size: product.defaultSize || 'M',
                color: product.defaultColor || 'White',
                colorCode: product.defaultColorCode || '#FFFFFF',
                designsByPlacement: {},
                designMetadata: {},
                variantMockups: {},
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              })
            })
          })
          
          return {
            qr_code: qr.code,
            design_data: {
              type: 'default',
              text: qr.title || 'Mi QR',
              color: '#000000',
              font: 'Arial',
              size: 24,
              position: { x: 50, y: 50 },
              products: allProducts
            },
            product_size: 'M',
            product_color: 'White',
            product_gender: 'unisex',
            created_at: new Date().toISOString(),
          }
        })

        const { error: productsError } = await supabase
          .from('qr_designs')
          .insert(designData)

        if (productsError) {
          console.error('❌ Error creating products:', productsError)
          console.error('Error creating products:', productsError)
          // Don't fail the entire request, just log the error
        } else {
          console.log('✅ Successfully created', designData.length, 'design entries with camisetas')
          
          // Generate ONE generic mockup for all QRs using the first QR as template
          let genericMockupUrls: any = {}
          
          try {
            console.log('🎨 Generating generic mockup for all QRs...')
            
            // Generate a QR for the first QR to use as template
            const { generateStandardQR } = await import('@/lib/qr-generator')
            const templateQrUrl = `${process.env.QR_DOMAIN}/${data[0].code}`
            const templateQrDataUrl = await generateStandardQR(templateQrUrl)
            
            // Convert to public URL for Printful
            const base64Data = templateQrDataUrl.split(',')[1]
            const qrBuffer = Buffer.from(base64Data, 'base64')
            
            // Upload template QR to Supabase Storage
            const templateFileName = `template-qr.png`
            const templateFilePath = `designs/${templateFileName}`
            
            const { data: templateUploadData, error: templateUploadError } = await supabase.storage
              .from('designs')
              .upload(templateFilePath, qrBuffer, {
                contentType: 'image/png',
                upsert: true,
              })

            if (templateUploadError) {
              console.error(`❌ Error uploading template QR:`, templateUploadError)
              throw new Error('Failed to upload template QR')
            }

            // Get public URL for template QR
            const { data: templateUrlData } = supabase.storage
              .from('designs')
              .getPublicUrl(templateFilePath)
            
            const templateQrPublicUrl = templateUrlData.publicUrl
            console.log(`✅ Template QR uploaded:`, templateQrPublicUrl)
            
            // Request mockup with real QR
            const mockupResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/printful/mockup`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                productId: 71,
                variantIds: [4013],
                files: [{
                  placement: 'front',
                  imageUrl: templateQrPublicUrl,
                  position: {
                    top: 800,
                    left: 800,
                    width: 1800,
                    height: 1800,
                    areaWidth: 3600,
                    areaHeight: 4800,
                  }
                }]
              })
            })

            if (mockupResponse.ok) {
              const mockupData = await mockupResponse.json()
              const taskKey = mockupData.requestId
              console.log(`✅ Generic mockup task created:`, taskKey)
              
              // Poll for mockup completion (max 10 attempts, 2 seconds each)
              for (let attempt = 0; attempt < 10; attempt++) {
                await new Promise(resolve => setTimeout(resolve, 2000))
                
                const statusResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/printful/mockup?requestId=${taskKey}`)
                if (!statusResponse.ok) continue
                
                const statusData = await statusResponse.json()
                
                if (statusData.status === 'completed' && statusData.normalizedMockups) {
                  // Convert array format to object format expected by extractPrintfulSummary
                  const normalizedArray = statusData.normalizedMockups
                  genericMockupUrls = {}
                  
                  normalizedArray.forEach((mockup: any) => {
                    const variantId = mockup.variantId
                    const placement = mockup.placement
                    const url = mockup.url
                    
                    if (!genericMockupUrls[variantId]) {
                      genericMockupUrls[variantId] = {}
                    }
                    // Store as object with url property to match frontend expectations
                    genericMockupUrls[variantId][placement] = { url: url }
                  })
                  
                  console.log(`✅ Generic mockup completed:`, genericMockupUrls)
                  break
                }
                
                if (statusData.status === 'failed') {
                  console.error(`❌ Generic mockup generation failed`)
                  break
                }
              }
            } else {
              console.error(`❌ Failed to request generic mockup`)
            }
          } catch (error) {
            console.error(`❌ Error generating generic mockup:`, error)
          }
          
          // Now update all QRs with the same mockup and individual QR placements
          for (const qr of data) {
            try {
              console.log(`🎨 Processing QR: ${qr.code}`)
              
              // Generate QR image for this specific QR (use qr_url to match dashboard)
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
              
              // Update design data with QR placement and shared mockup
              console.log(`🔍 Generic mockup URLs for ${qr.code}:`, JSON.stringify(genericMockupUrls, null, 2))
              const updatedDesignData = {
                type: 'default',
                text: qr.title || 'Mi QR',
                color: '#000000',
                font: 'Arial',
                size: 24,
                position: { x: 50, y: 50 },
                variant_id: 4013,
                product_id: 71,
                products: [{
                  id: crypto.randomUUID(),
                  productId: 71,
                  templateId: 71,
                  variantId: 4013,
                  productName: 'Unisex Staple T-Shirt',
                  size: 'M',
                  color: 'White',
                  colorCode: '#FFFFFF',
                  designsByPlacement: {
                    front: qrPublicUrl
                  },
                  designMetadata: {
                    front: { width: 1800, height: 1800 }
                  },
                  variantMockups: genericMockupUrls && Object.keys(genericMockupUrls).length > 0 
                    ? genericMockupUrls 
                    : {
                        // Fallback: create a simple mockup structure if Printful fails
                        4013: {
                          front: qrPublicUrl // Use the QR as a simple mockup
                        }
                      },
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                }]
              }

              const { error: updateError } = await supabase
                .from('qr_designs')
                .update({ design_data: updatedDesignData })
                .eq('qr_code', qr.code)

              if (updateError) {
                console.error(`❌ Error updating design for ${qr.code}:`, updateError)
              } else {
                console.log(`✅ Design updated for ${qr.code}`)
              }
            } catch (error) {
              console.error(`❌ Error processing QR ${qr.code}:`, error)
            }
          }
        }
      }

      const responsePayload = (data ?? []).map((qr) => ({
        ...qr,
        qr_url: `${process.env.QR_DOMAIN}/${qr.code}`,
      }))

      return NextResponse.json({ success: true, qrs: responsePayload })
    }

    // Single QR creation
    const targetDestination =
      typeof destination_url === 'string' && destination_url.trim()
        ? destination_url.trim()
        : defaultDestination

    const qrCode = generateQrCodeValue()
    
    // Generate unique destination URL for single QR
    const uniqueDestination = generateUniqueDestinationUrl(
      targetDestination, 
      qrCode, 
      (title ?? '').trim() || 'Usuario', 
      groupName
    )

    const { data, error } = await supabase
      .from('qrs')
      .insert({
        code: qrCode,
        user_id: user.id,
        destination_url: uniqueDestination,
        title: (title ?? '').trim() || null,
        description: (description ?? '').trim() || null,
        group_id: groupId,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating QR:', error)
      return NextResponse.json({ error: 'Failed to create QR' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      qr: {
        ...data,
        qr_url: `${process.env.QR_DOMAIN}/${qrCode}`
      },
    })
  } catch (error) {
    console.error('Error creating QR:', error)
    return NextResponse.json({ error: 'Failed to create QR' }, { status: 500 })
  }
}

