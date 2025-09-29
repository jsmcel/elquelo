import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// GET all members of a group
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

    // RLS policy will ensure the user is a member of the group and can view other members.
    const { data: members, error } = await supabase
      .from('group_members')
      .select(`
        user_id,
        role,
        users (
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('group_id', params.groupId)

    if (error) {
      return NextResponse.json({ error: 'Group not found or access denied' }, { status: 404 })
    }

    return NextResponse.json({ success: true, members })
  } catch (error) {
    console.error(`Error fetching members for group ${params.groupId}:`, error)
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
  }
}

// POST to add a new member to a group
export async function POST(
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

    const { email, role = 'member' } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400 })
    }

    // RLS policy on group_members ensures only an admin can add new members.

    // Find the user by email
    const { data: userToAdd, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (userError || !userToAdd) {
      return NextResponse.json({ error: 'User with that email not found' }, { status: 404 })
    }

    const { data: newMember, error: insertError } = await supabase
      .from('group_members')
      .insert({
        group_id: params.groupId,
        user_id: userToAdd.id,
        role,
      })
      .select()
      .single()

    if (insertError) {
        if (insertError.code === '23505') { // unique_violation
            return NextResponse.json({ error: 'User is already a member of this group' }, { status: 409 })
        }
      // This will also catch the RLS error if the current user is not an admin
      return NextResponse.json({ error: 'Failed to add member. You may not have permission.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, member: newMember })
  } catch (error) {
    console.error(`Error adding member to group ${params.groupId}:`, error)
    return NextResponse.json({ error: 'Failed to add member' }, { status: 500 })
  }
}
