import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(_req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // First, get the group_ids the user is a member of
    const { data: memberOf, error: memberError } = await supabase
      .from('group_members')
      .select('group_id, role')
      .eq('user_id', user.id)

    if (memberError) {
      throw memberError
    }

    if (!memberOf || memberOf.length === 0) {
      return NextResponse.json({ success: true, groups: [] })
    }

    const groupIds = memberOf.map((m) => m.group_id)

    // Then, fetch the details of those groups
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('id, name, description, created_by, created_at')
      .in('id', groupIds)

    if (groupsError) {
      throw groupsError
    }
    
    // Add the user's role to each group object
    const groupsWithRoles = groups.map(group => {
        const memberInfo = memberOf.find(m => m.group_id === group.id);
        return {
            ...group,
            role: memberInfo?.role || 'member'
        }
    })

    return NextResponse.json({ success: true, groups: groupsWithRoles })
  } catch (error) {
    console.error('Error loading user groups:', error)
    return NextResponse.json({ error: 'Failed to load groups' }, { status: 500 })
  }
}
