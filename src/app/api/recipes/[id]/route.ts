import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { z } from "zod"

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
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const { data: recipe, error } = await supabaseAdmin
      .from('Recipe')
      .select(`
        *,
        RecipeTag(
          Tag(*)
        )
      `)
      .eq('id', id)
      .eq('userId', session.user.id)
      .single()

    if (error || !recipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 })
    }

    // Transform data to match expected format
    const recipeWithTags = {
      ...recipe,
      tags: recipe.RecipeTag?.map((rt: { Tag: { name: string } }) => ({ tag: rt.Tag })) || []
    }

    return NextResponse.json(recipeWithTags)
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
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const data = updateRecipeSchema.parse(body)

    // Check if recipe exists and belongs to user
    const { data: existingRecipe } = await supabaseAdmin
      .from('Recipe')
      .select('id')
      .eq('id', id)
      .eq('userId', session.user.id)
      .single()

    if (!existingRecipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 })
    }

    // Update recipe
    const { data: recipe, error: updateError } = await supabaseAdmin
      .from('Recipe')
      .update({
        title: data.title,
        description: data.description,
        ingredients: data.ingredients,
        instructions: data.instructions,
        prepTime: data.prepTime,
        cookTime: data.cookTime,
        servings: data.servings,
        imageUrl: data.imageUrl || null,
        mealType: data.mealType,
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error("Recipe update error:", updateError)
      return NextResponse.json(
        { error: "Failed to update recipe" },
        { status: 500 }
      )
    }

    // Handle tags - remove existing ones and add new ones
    await supabaseAdmin
      .from('RecipeTag')
      .delete()
      .eq('recipeId', id)

    const recipeTags = []
    if (data.tags && data.tags.length > 0) {
      for (const tagName of data.tags) {
        // Create tag if it doesn't exist
        const { data: tag } = await supabaseAdmin
          .from('Tag')
          .upsert({ name: tagName }, { onConflict: 'name' })
          .select()
          .single()

        if (tag) {
          // Link recipe to tag
          await supabaseAdmin
            .from('RecipeTag')
            .insert({
              recipeId: id,
              tagId: tag.id
            })

          recipeTags.push({ tag })
        }
      }
    }

    // Return updated recipe with tags
    const updatedRecipe = {
      ...recipe,
      tags: recipeTags
    }

    return NextResponse.json(updatedRecipe)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      )
    }

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
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Check if recipe exists and belongs to user
    const { data: existingRecipe } = await supabaseAdmin
      .from('Recipe')
      .select('id')
      .eq('id', id)
      .eq('userId', session.user.id)
      .single()

    if (!existingRecipe) {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 })
    }

    // Delete recipe (tags will be deleted automatically due to cascade)
    const { error } = await supabaseAdmin
      .from('Recipe')
      .delete()
      .eq('id', id)

    if (error) {
      console.error("Recipe deletion error:", error)
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