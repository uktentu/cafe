export const runtime = 'edge'
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import type { StaffRole } from '@/types/database'


import { getConfig } from '@/lib/config'

export async function POST(request: Request) {
  if (!getConfig().features.staffAccounts) {
    return NextResponse.json({ error: 'Staff accounts feature is not enabled for this tier' }, { status: 403 })
  }
  try {
    const { email, role, name, businessId } = await request.json() as {
      email: string
      role: StaffRole
      name: string
      businessId: string
    }

    if (!email || !role || !businessId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Verify the requester using standard server client
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Check if requester is owner of the business
    const { data: requesterStaff, error: staffError } = await supabase
      .from('staff_accounts')
      .select('role')
      .eq('business_id', businessId)
      .eq('user_id', user.id)
      .single()

    if (staffError || !requesterStaff || requesterStaff.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden: Only owners can invite staff' }, { status: 403 })
    }

    // 3. Init Admin Client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // 4. Invite user via Auth API
    // Note: If user exists, this will send an invite email anyway (or we can just use the existing ID)
    // Actually, `inviteUserByEmail` works for new users and returns user object.
    // Let's use inviteUserByEmail. We pass a redirect to CMS login.
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email)

    if (inviteError) {
      // If user already exists in Auth, inviteUserByEmail might fail or return the existing user.
      // We will try to fetch the user by email just in case.
      console.error('Invite error:', inviteError)
      return NextResponse.json({ error: inviteError.message }, { status: 400 })
    }

    const invitedUserId = inviteData.user.id

    // 5. Insert into staff_accounts
    const { error: insertError } = await supabaseAdmin
      .from('staff_accounts')
      .upsert({
        business_id: businessId,
        user_id: invitedUserId,
        role,
        name: name || null,
      }, { onConflict: 'business_id, user_id' })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
