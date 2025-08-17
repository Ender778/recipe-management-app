import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { z } from "zod"
import { nanoid } from "nanoid"

const generateId = () => nanoid()

const createTagSchema = z.object({
  name: z.string().min(1, "Tag name is required"),
  color: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: tags, error } = await supabaseAdmin
      .from('Tag')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error("Error fetching tags:", error)
      return NextResponse.json(
        { error: "Failed to fetch tags" },
        { status: 500 }
      )
    }

    return NextResponse.json(tags || [])
  } catch (error) {
    console.error("Error fetching tags:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const result = createTagSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid tag data", issues: result.error.issues },
        { status: 400 }
      )
    }

    const { name, color } = result.data

    // Check if tag already exists
    const { data: existingTag, error: checkError } = await supabaseAdmin
      .from('Tag')
      .select('id')
      .eq('name', name)
      .single()

    if (existingTag) {
      return NextResponse.json(
        { error: "Tag already exists" },
        { status: 409 }
      )
    }

    // Create tag
    const { data: tag, error: tagError } = await supabaseAdmin
      .from('Tag')
      .insert({
        id: generateId(),
        name,
        color,
      })
      .select()
      .single()

    if (tagError) {
      console.error("Error creating tag:", tagError)
      return NextResponse.json(
        { error: "Failed to create tag" },
        { status: 500 }
      )
    }

    return NextResponse.json(tag, { status: 201 })
  } catch (error) {
    console.error("Error creating tag:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
