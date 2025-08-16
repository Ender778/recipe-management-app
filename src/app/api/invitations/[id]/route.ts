import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { z } from "zod"
import { nanoid } from "nanoid"

const generateId = () => nanoid()

const updateInvitationSchema = z.object({
  action: z.enum(["accept", "decline", "revoke"])
})

// Accept, decline, or revoke book invitation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { action } = updateInvitationSchema.parse(body)

    // Get the invitation
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('BookInvitation')
      .select(`
        *,
        RecipeBook:bookId(name, description),
        InvitedBy:invitedById(id)
      `)
      .eq('id', resolvedParams.id)
      .single()

    if (invitationError || !invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
    }

    // Check permissions based on action
    if (action === "revoke") {
      // Only the person who sent the invitation can revoke it
      if (invitation.InvitedBy?.id !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
    } else {
      // Only the invited person can accept/decline
      if (invitation.invitedUserEmail !== session.user.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
    }

    // Check if invitation is still valid
    if (invitation.status !== "PENDING") {
      return NextResponse.json({ error: "Invitation is no longer pending" }, { status: 400 })
    }

    if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
      return NextResponse.json({ error: "Invitation has expired" }, { status: 400 })
    }

    let updatedInvitation

    if (action === "accept") {
      // Update invitation status and link to user
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('BookInvitation')
        .update({
          status: "ACCEPTED",
          invitedUserId: session.user.id
        })
        .eq('id', resolvedParams.id)
        .select()
        .single()

      if (updateError) {
        console.error("Error updating invitation:", updateError)
        return NextResponse.json({ error: "Failed to accept invitation" }, { status: 500 })
      }

      // Create book membership record
      const { error: membershipError } = await supabaseAdmin
        .from('BookMember')
        .insert({
          id: generateId(),
          bookId: invitation.bookId,
          userId: session.user.id,
          permission: invitation.permission
        })

      if (membershipError) {
        console.error("Error creating book membership:", membershipError)
        return NextResponse.json({ error: "Failed to create book access" }, { status: 500 })
      }

      updatedInvitation = updated
    } else if (action === "decline") {
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('BookInvitation')
        .update({ status: "DECLINED" })
        .eq('id', resolvedParams.id)
        .select()
        .single()

      if (updateError) {
        console.error("Error declining invitation:", updateError)
        return NextResponse.json({ error: "Failed to decline invitation" }, { status: 500 })
      }
      updatedInvitation = updated
    } else if (action === "revoke") {
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('BookInvitation')
        .update({ status: "REVOKED" })
        .eq('id', resolvedParams.id)
        .select()
        .single()

      if (updateError) {
        console.error("Error revoking invitation:", updateError)
        return NextResponse.json({ error: "Failed to revoke invitation" }, { status: 500 })
      }
      updatedInvitation = updated
    }

    return NextResponse.json(updatedInvitation)

  } catch (error) {
    console.error("Error updating invitation:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Delete book invitation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the invitation
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('BookInvitation')
      .select(`
        *,
        InvitedBy:invitedById(id)
      `)
      .eq('id', resolvedParams.id)
      .single()

    if (invitationError || !invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
    }

    // Check permissions - only the sender or receiver can delete
    if (invitation.InvitedBy?.id !== session.user.id && invitation.invitedUserEmail !== session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Delete invitation
    const { error: deleteError } = await supabaseAdmin
      .from('BookInvitation')
      .delete()
      .eq('id', resolvedParams.id)

    if (deleteError) {
      console.error("Error deleting invitation:", deleteError)
      return NextResponse.json({ error: "Failed to delete invitation" }, { status: 500 })
    }

    return NextResponse.json({ message: "Invitation deleted successfully" })

  } catch (error) {
    console.error("Error deleting invitation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
