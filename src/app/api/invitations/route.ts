import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { z } from "zod"
import { nanoid } from "nanoid"

const generateId = () => nanoid()

const createBookInvitationSchema = z.object({
  invitedUserEmail: z.string().email(),
  permission: z.enum(["READ", "WRITE"])
})

// Send book invitation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { invitedUserEmail, permission } = createBookInvitationSchema.parse(body)

    // Get user's default book (first book with WRITE permission)
    const { data: userBooks, error: booksError } = await supabaseAdmin
      .from('BookMember')
      .select('bookId, permission')
      .eq('userId', session.user.id)
      .eq('permission', 'WRITE')
      .limit(1)

    if (booksError || !userBooks || userBooks.length === 0) {
      return NextResponse.json({ error: "You don't have a recipe book to invite users to" }, { status: 403 })
    }

    const bookId = userBooks[0].bookId

    // Check if invitation already exists
    const { data: existingInvitation } = await supabaseAdmin
      .from('BookInvitation')
      .select('id')
      .eq('bookId', bookId)
      .eq('invitedUserEmail', invitedUserEmail)
      .eq('status', 'PENDING')
      .single()

    if (existingInvitation) {
      return NextResponse.json({ error: "Invitation already sent to this user" }, { status: 400 })
    }

    // Create invitation
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('BookInvitation')
      .insert({
        id: generateId(),
        bookId,
        invitedById: session.user.id,
        invitedUserEmail,
        permission,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      })
      .select(`
        *,
        RecipeBook:bookId(name, description),
        InvitedBy:invitedById(name, email)
      `)
      .single()

    if (invitationError) {
      console.error("Invitation creation error:", invitationError)
      return NextResponse.json({ error: "Failed to create invitation" }, { status: 500 })
    }

    return NextResponse.json(invitation, { status: 201 })

  } catch (error) {
    console.error("Error creating invitation:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Get user's invitations (sent and received)
export async function GET() {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get invitations received by the user
    const { data: receivedInvitations, error: receivedError } = await supabaseAdmin
      .from('BookInvitation')
      .select(`
        *,
        RecipeBook:bookId(name, description),
        InvitedBy:invitedById(name, email)
      `)
      .eq('invitedUserEmail', session.user.email)
      .order('createdAt', { ascending: false })

    if (receivedError) {
      console.error("Error fetching received invitations:", receivedError)
      return NextResponse.json({ error: "Failed to fetch received invitations" }, { status: 500 })
    }

    // Get invitations sent by the user  
    const { data: sentInvitations, error: sentError } = await supabaseAdmin
      .from('BookInvitation')
      .select(`
        *,
        RecipeBook:bookId(name, description),
        InvitedUser:invitedUserId(name, email)
      `)
      .eq('invitedById', session.user.id)
      .order('createdAt', { ascending: false })

    if (sentError) {
      console.error("Error fetching sent invitations:", sentError)
      return NextResponse.json({ error: "Failed to fetch sent invitations" }, { status: 500 })
    }

    return NextResponse.json({
      received: receivedInvitations || [],
      sent: sentInvitations || []
    })
  } catch (error) {
    console.error("Error fetching invitations:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
