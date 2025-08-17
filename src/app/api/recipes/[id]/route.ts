import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { z } from "zod"
import { nanoid } from "nanoid"

const generateId = () => nanoid()

const updateRecipeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  ingredients: z.array(z.string().min(1, "Ingredient cannot be empty")),
  instructions: z.array(z.string().min(1, "Instruction cannot be empty")),
  prepTime: z.number().min(0).optional(),
  cookTime: z.number().min(0).optional(),
  servings: z.number().min(1).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  mealType: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'DESSERT', 'SNACK']),
  tags: z.array(z.string()).optional(),
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

    // Get recipe with book information
    const { data: recipe, error: recipeError } = await supabaseAdmin
      .from('Recipe')
      .select(`
        *,
        RecipeTag(
          Tag(*)
        ),
        CreatedBy:createdBy(name, email),
        RecipeBook:bookId(name)
      `)
      .eq('id', resolvedParams.id)
      .single()

    if (recipeError || !recipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 })
    }

    // Check if user has access to the recipe's book
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('BookMember')
      .select('permission')
      .eq('bookId', recipe.bookId)
      .eq('userId', session.user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 })
    }

    // Transform the data to match our expected format
    const transformedRecipe = {
      ...recipe,
      tags: recipe.RecipeTag?.map((rt: { Tag: { name: string } }) => ({ tag: rt.Tag })) || [],
      createdByUser: recipe.CreatedBy,
      bookName: recipe.RecipeBook?.name
    }

    return NextResponse.json(transformedRecipe)
  } catch (error) {
    console.error("Error fetching recipe:", error)
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

    // Get recipe with book information first
    const { data: recipe, error: recipeError } = await supabaseAdmin
      .from('Recipe')
      .select('bookId')
      .eq('id', resolvedParams.id)
      .single()

    if (recipeError || !recipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 })
    }

    // Check if user has write access to the recipe's book
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('BookMember')
      .select('permission')
      .eq('bookId', recipe.bookId)
      .eq('userId', session.user.id)
      .single()

    if (membershipError || !membership || membership.permission !== 'WRITE') {
      return NextResponse.json({ error: "You don't have permission to edit this recipe" }, { status: 403 })
    }

    const body = await req.json()
    const result = updateRecipeSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid recipe data", issues: result.error.issues },
        { status: 400 }
      )
    }

    const { title, description, ingredients, instructions, prepTime, cookTime, servings, mealType, imageUrl, tags } = result.data

    // Update recipe
    const { data: updatedRecipe, error: updateError } = await supabaseAdmin
      .from('Recipe')
      .update({
        title,
        description,
        ingredients,
        instructions,
        prepTime,
        cookTime,
        servings,
        mealType,
        imageUrl,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', resolvedParams.id)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating recipe:", updateError)
      return NextResponse.json(
        { error: "Failed to update recipe" },
        { status: 500 }
      )
    }

    // Delete existing tags
    await supabaseAdmin
      .from('RecipeTag')
      .delete()
      .eq('recipeId', resolvedParams.id)

    // Handle tags if provided
    if (tags && tags.length > 0) {
      for (const tagName of tags) {
        // First, ensure the tag exists (upsert)
        const { data: tag, error: tagError } = await supabaseAdmin
          .from('Tag')
          .upsert({ 
            id: generateId(),
            name: tagName 
          }, { onConflict: 'name' })
          .select()
          .single()

        if (tagError) {
          console.error("Error creating/fetching tag:", tagError)
          continue // Skip this tag if there's an error
        }

        // Link the tag to the recipe
        const { error: linkError } = await supabaseAdmin
          .from('RecipeTag')
          .insert({
            recipeId: updatedRecipe.id,
            tagId: tag.id
          })

        if (linkError) {
          console.error("Error linking tag to recipe:", linkError)
        }
      }
    }

    // Fetch the complete recipe with tags and creator info
    const { data: completeRecipe, error: fetchError } = await supabaseAdmin
      .from('Recipe')
      .select(`
        *,
        RecipeTag(
          Tag(*)
        ),
        CreatedBy:createdBy(name, email),
        RecipeBook:bookId(name)
      `)
      .eq('id', updatedRecipe.id)
      .single()

    if (fetchError) {
      console.error("Error fetching complete recipe:", fetchError)
      return NextResponse.json(updatedRecipe) // Return basic recipe if tag fetch fails
    }

    // Transform the data
    const transformedRecipe = {
      ...completeRecipe,
      tags: completeRecipe.RecipeTag?.map((rt: { Tag: { name: string } }) => ({ tag: rt.Tag })) || [],
      createdByUser: completeRecipe.CreatedBy,
      bookName: completeRecipe.RecipeBook?.name
    }

    return NextResponse.json(transformedRecipe)
  } catch (error) {
    console.error("Error updating recipe:", error)
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

    // Get recipe with book information first
    const { data: recipe, error: recipeError } = await supabaseAdmin
      .from('Recipe')
      .select('bookId')
      .eq('id', resolvedParams.id)
      .single()

    if (recipeError || !recipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 })
    }

    // Check if user has write access to the recipe's book
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('BookMember')
      .select('permission')
      .eq('bookId', recipe.bookId)
      .eq('userId', session.user.id)
      .single()

    if (membershipError || !membership || membership.permission !== 'WRITE') {
      return NextResponse.json({ error: "You don't have permission to delete this recipe" }, { status: 403 })
    }

    // Delete recipe tags first (foreign key constraint)
    await supabaseAdmin
      .from('RecipeTag')
      .delete()
      .eq('recipeId', resolvedParams.id)

    // Delete the recipe
    const { error } = await supabaseAdmin
      .from('Recipe')
      .delete()
      .eq('id', resolvedParams.id)

    if (error) {
      console.error("Error deleting recipe:", error)
      return NextResponse.json(
        { error: "Failed to delete recipe" },
        { status: 500 }
      )
    }
    return NextResponse.json({ message: "Recipe deleted successfully" })
  } catch (error) {
    console.error("Error deleting recipe:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}