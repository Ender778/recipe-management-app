import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { nanoid } from "nanoid"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('image') as File
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 })
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const filename = `recipe_${nanoid()}.${fileExtension}`
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    console.log("Upload directory path:", uploadsDir)
    
    try {
      await mkdir(uploadsDir, { recursive: true })
      console.log("Directory created successfully")
    } catch (error) {
      console.log("Directory creation error (might already exist):", error)
    }

    // Save file
    const buffer = await file.arrayBuffer()
    const filePath = join(uploadsDir, filename)
    console.log("Saving file to:", filePath)
    
    try {
      await writeFile(filePath, Buffer.from(buffer))
      console.log("File saved successfully")
    } catch (writeError) {
      console.error("File write error:", writeError)
      throw writeError
    }

    // Return the public URL
    const url = `/uploads/${filename}`
    console.log("Returning URL:", url)
    
    return NextResponse.json({ url }, { status: 200 })

  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
