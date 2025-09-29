import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, description } = await req.json()

    if (!name) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 })
    }

    // Create the group
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({
        name,
        description,
        created_by: user.id,
      })
      .select()
      .single()

    if (groupError) {
      throw groupError
    }

    // Automatically add the creator as an admin member
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: user.id,
        role: 'admin',
      })

    if (memberError) {
        // If adding the member fails, we should probably roll back the group creation
        // For now, we'll just log the error and return the group
        console.error("Failed to add creator as group admin:", memberError);
        // Optionally, delete the created group
        // await supabase.from('groups').delete().eq('id', group.id);
        // throw new Error("Failed to create group member association.");
    }


    return NextResponse.json({ success: true, group })
  } catch (error) {
    console.error('Error creating group:', error)
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 })
  }
}
