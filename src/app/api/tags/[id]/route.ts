import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { z } from "zod"

const updateTagSchema = z.object({
  name: z.string().min(1, "Tag name is required"),
  color: z.string().optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: tag, error } = await supabaseAdmin
      .from('Tag')
      .select('*')
      .eq('id', resolvedParams.id)
      .single()

    if (error || !tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 })
    }

    return NextResponse.json(tag)
  } catch (error) {
    console.error("Error fetching tag:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const result = updateTagSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid tag data", issues: result.error.issues },
        { status: 400 }
      )
    }

    const { name, color } = result.data

    // Check if another tag with this name already exists
    const { data: existingTag, error: checkError } = await supabaseAdmin
      .from('Tag')
      .select('id')
      .eq('name', name)
      .neq('id', resolvedParams.id)
      .single()

    if (existingTag) {
      return NextResponse.json(
        { error: "Tag name already exists" },
        { status: 409 }
      )
    }

    // Update tag
    const { data: tag, error: updateError } = await supabaseAdmin
      .from('Tag')
      .update({
        name,
        color,
      })
      .eq('id', resolvedParams.id)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating tag:", updateError)
      return NextResponse.json(
        { error: "Failed to update tag" },
        { status: 500 }
      )
    }

    return NextResponse.json(tag)
  } catch (error) {
    console.error("Error updating tag:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if tag is in use
    const { data: tagUsage, error: usageError } = await supabaseAdmin
      .from('RecipeTag')
      .select('recipeId')
      .eq('tagId', resolvedParams.id)
      .limit(1)

    if (usageError) {
      console.error("Error checking tag usage:", usageError)
      return NextResponse.json(
        { error: "Failed to check tag usage" },
        { status: 500 }
      )
    }

    if (tagUsage && tagUsage.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete tag that is being used by recipes" },
        { status: 409 }
      )
    }

    // Delete tag
    const { error: deleteError } = await supabaseAdmin
      .from('Tag')
      .delete()
      .eq('id', resolvedParams.id)

    if (deleteError) {
      console.error("Error deleting tag:", deleteError)
      return NextResponse.json(
        { error: "Failed to delete tag" },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: "Tag deleted successfully" })
  } catch (error) {
    console.error("Error deleting tag:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
