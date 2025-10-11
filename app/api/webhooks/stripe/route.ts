import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = headers().get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object
        
        console.log('Processing checkout session completed:', session.id)
        
        // Actualizar orden existente (ya creada en checkout)
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .update({
            stripe_payment_intent_id: session.payment_intent,
            status: 'paid',
            total_amount: session.amount_total ? session.amount_total / 100 : 0,
            currency: session.currency,
            shipping_address: (session as any).shipping_details,
            updated_at: new Date().toISOString()
          })
          .eq('id', session.metadata?.order_id)
          .select()
          .single()

        if (orderError) {
          console.error('Error updating order:', orderError)
          return NextResponse.json({ error: 'Database error' }, { status: 500 })
        }

        console.log('Order updated successfully:', order.id)

        // CREAR LA DESPEDIDA (EVENTO) DESPUÉS DEL PAGO EXITOSO
        try {
          console.log('Creating despedida after successful payment...')
          
          // 1. Buscar el grupo al que pertenecen los QRs del usuario
          const { data: qrs, error: qrsError } = await supabase
            .from('qrs')
            .select('id, group_id')
            .eq('user_id', session.metadata?.user_id)
            .not('group_id', 'is', null)
            .limit(1)

          if (qrsError) {
            console.error('Error fetching QRs:', qrsError)
          } else if (qrs && qrs.length > 0) {
            const groupId = qrs[0].group_id
            
            // 2. Obtener información del grupo
            const { data: group, error: groupError } = await supabase
              .from('groups')
              .select('name, description')
              .eq('id', groupId)
              .single()

            if (groupError) {
              console.error('Error fetching group:', groupError)
            } else {
              // 3. Crear la despedida (evento) asociada al grupo
              const { data: event, error: eventError } = await supabase
                .from('events')
                .insert({
                  group_id: groupId,
                  order_id: session.metadata?.order_id,
                  name: group.name || `Despedida - ${new Date().toLocaleDateString()}`,
                  description: group.description || 'Despedida creada automáticamente después del pago',
                  event_date: session.metadata?.event_date || null, // Usar fecha de metadatos si está disponible
                  event_type: 'despedida',
                  organizer_name: session.customer_details?.name || 'Organizador',
                  organizer_email: session.customer_email || '',
                  is_active: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
                .select()
                .single()

              if (eventError) {
                console.error('Error creating event:', eventError)
              } else {
                console.log('Despedida created successfully:', event.id)
                
                // 4. Asociar el evento con la orden
                const { error: updateOrderError } = await supabase
                  .from('orders')
                  .update({ 
                    event_id: event.id,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', session.metadata?.order_id)

                if (updateOrderError) {
                  console.error('Error updating order with event_id:', updateOrderError)
                } else {
                  console.log('Order updated with event_id:', event.id)
                }
                
                // 5. Asociar todos los QRs del grupo con el evento
                const { error: updateQRsError } = await supabase
                  .from('qrs')
                  .update({ 
                    event_id: event.id,
                    updated_at: new Date().toISOString()
                  })
                  .eq('group_id', groupId)

                if (updateQRsError) {
                  console.error('Error updating QRs with event_id:', updateQRsError)
                } else {
                  console.log('QRs updated with event_id:', event.id)
                }
                
                // 6. Crear la relación del usuario con el evento en event_members
                const { error: memberError } = await supabase
                  .from('event_members')
                  .insert({
                    event_id: event.id,
                    user_id: session.metadata?.user_id,
                    role: 'owner',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  })

                if (memberError) {
                  console.error('Error creating event member:', memberError)
                } else {
                  console.log('Event member created successfully')
                }
              }
            }
          } else {
            console.error('No group found for user QRs')
          }
        } catch (despedidaError) {
          console.error('Error creating despedida:', despedidaError)
          // No fallar el webhook si la creación de la despedida falla
        }

        // Enviar pedido a Printful automáticamente
        try {
          const printfulResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/printful/orders`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId: session.metadata?.order_id
            })
          })

          if (printfulResponse.ok) {
            const printfulResult = await printfulResponse.json()
            console.log('Order sent to Printful successfully:', printfulResult.printfulOrderId)
          } else {
            console.error('Failed to send order to Printful')
          }
        } catch (printfulError) {
          console.error('Error sending to Printful:', printfulError)
          // No fallar el webhook si Printful falla
        }

        console.log('Order created successfully:', order.id)
        break

      case 'payment_intent.payment_failed':
        console.log('Payment failed:', event.data.object.id)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}