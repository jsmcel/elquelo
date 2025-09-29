import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// GET a specific group
export async function GET(
  _req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: group, error } = await supabase
      .from('groups')
      .select('*')
      .eq('id', params.groupId)
      .single()

    if (error) {
      // The RLS policy will handle whether the user can see the group or not.
      // If the group doesn't exist or the user doesn't have access, PostgREST returns an error.
      return NextResponse.json({ error: 'Group not found or access denied' }, { status: 404 })
    }

    return NextResponse.json({ success: true, group })
  } catch (error) {
    console.error(`Error fetching group ${params.groupId}:`, error)
    return NextResponse.json({ error: 'Failed to fetch group' }, { status: 500 })
  }
}

// UPDATE a specific group
export async function PUT(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, description } = await req.json()

    const { data: group, error } = await supabase
      .from('groups')
      .update({ name, description })
      .eq('id', params.groupId)
      .select()
      .single()

    if (error) {
        // RLS policy ensures only admins can update.
        return NextResponse.json({ error: 'Group not found or permission denied' }, { status: 404 })
    }

    return NextResponse.json({ success: true, group })
  } catch (error) {
    console.error(`Error updating group ${params.groupId}:`, error)
    return NextResponse.json({ error: 'Failed to update group' }, { status: 500 })
  }
}

// DELETE a specific group
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // RLS policy should ensure only the group creator or an admin can delete.
    // Let's add an explicit check here to be safe, only the original creator can delete.
    const { data: groupData, error: fetchError } = await supabase
        .from('groups')
        .select('created_by')
        .eq('id', params.groupId)
        .single();

    if (fetchError || !groupData) {
        return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (groupData.created_by !== user.id) {
        return NextResponse.json({ error: 'Only the group creator can delete the group' }, { status: 403 });
    }

    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', params.groupId)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Error deleting group ${params.groupId}:`, error)
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 })
  }
}
