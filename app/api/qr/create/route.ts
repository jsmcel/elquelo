import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ensureUserProfile, generateQrCodeValue, buildDefaultDestination, generateUniqueDestinationUrl } from '@/lib/user-profile'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'


type MemberPayload = {
  name?: string
  title?: string
  destination_url?: string
  description?: string
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

      const responsePayload = (data ?? []).map((qr) => ({
        ...qr,
        qr_url: `${process.env.QR_DOMAIN}/${qr.code}`,
      }))

      return NextResponse.json({ success: true, qrs: responsePayload })
    }

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

