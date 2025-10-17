import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ensureUserProfile, generateQrCodeValue, buildDefaultDestination, generateUniqueDestinationUrl } from '@/lib/user-profile'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getAllPackages } from '@/lib/packages'
import { generateMockupsForQrs } from '@/lib/mockup-generation'

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
      console.log('ðŸ” Selected packages:', selectedPackages)
      console.log('ðŸ” Members length:', members.length)
      
      if (selectedPackages.length > 0 && members && members.length > 0) {
        console.log('âœ… Creating products for', selectedPackages.length, 'packages and', members.length, 'participants')
        
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
            console.error('âŒ Printful prices API failed:', printfulPrices.status, printfulPrices.statusText)
          }
        } catch (error) {
          console.error('âŒ Error fetching Printful prices:', error)
          pricesData = [] // Fallback to empty array
        }
        console.log('ðŸ’° Printful prices:', pricesData)
        
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
              console.log(`â­ï¸  Skipping package ${pkg.id} for participant ${participant?.name} (not novio/novia)`)
              return
            }
            
            // Novios/novias get ALL packages (both regular and exclusive)
            // Only skip if package is exclusive to novio/novia but participant is not novio/novia
            
            console.log(`âœ… Adding package ${pkg.id} for participant ${participant?.name} (novio/novia: ${isParticipantNovioNovia})`)
            
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
            console.log(`âš ï¸  No products added for participant ${participant?.name}, adding default t-shirt`)
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
          console.error('âŒ Error creating products:', productsError)
        } else {
          console.log('âœ… Successfully created', designData.length, 'design entries')
        }
        
        const pendingMockupCodes = data.map((item) => item?.code).filter(Boolean) as string[]

        // Opción 1: inline (bloqueante) si está activado por entorno
        if (
          pendingMockupCodes.length &&
          process.env.MOCKUP_AUTOGENERATE_MODE === 'inline' &&
          process.env.NEXT_PUBLIC_APP_URL
        ) {
          try {
            await generateMockupsForQrs({
              qrs: data,
              cookieStore: () => cookieStore,
              appUrl: process.env.NEXT_PUBLIC_APP_URL,
            })
          } catch (error) {
            console.error('Inline mockup generation failed:', error)
          }
        } else if (pendingMockupCodes.length && process.env.NEXT_PUBLIC_APP_URL) {
          // Opción 2: desencadenar en background (no bloqueante) siempre que haya códigos
          // Pasamos las cookies del request para mantener el contexto de usuario
          try {
            // No esperamos a que termine; solo disparamos la tarea
            fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/mockups/generate`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Cookie: req.headers.get('cookie') || '',
              },
              body: JSON.stringify({ qrCodes: pendingMockupCodes }),
            }).catch((err) => console.error('Failed to trigger background mockup generation:', err))
          } catch (err) {
            console.error('Error scheduling background mockup generation:', err)
          }
        }

        return NextResponse.json({
          success: true,
          message: 'QRs creados exitosamente. Genera los mockups oficiales cuando quieras desde el panel.',
          data,
          pendingMockupCodes,
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



