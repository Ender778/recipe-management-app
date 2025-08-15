import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { z } from "zod"

const createRecipeSchema = z.object({
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

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search")
    const tags = searchParams.get("tags")?.split(",").filter(Boolean)

    let query = supabaseAdmin
      .from('Recipe')
      .select(`
        *,
        RecipeTag(
          Tag(*)
        )
      `)
      .eq('userId', session.user.id)
      .order('updatedAt', { ascending: false })

    // Apply search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data: recipes, error } = await query

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json(
        { error: "Failed to fetch recipes" },
        { status: 500 }
      )
    }

    // Transform the data to match our expected format
    const transformedRecipes = recipes?.map(recipe => ({
      ...recipe,
      tags: recipe.RecipeTag?.map((rt: { Tag: { name: string } }) => ({ tag: rt.Tag })) || []
    })) || []

    // Apply tag filter if needed (client-side for now)
    let filteredRecipes = transformedRecipes
    if (tags && tags.length > 0) {
      filteredRecipes = transformedRecipes.filter(recipe =>
        recipe.tags.some((recipeTag: { tag: { name: string } }) => 
          tags.includes(recipeTag.tag.name)
        )
      )
    }

    return NextResponse.json(filteredRecipes)
  } catch (error) {
    console.error("Error fetching recipes:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const data = createRecipeSchema.parse(body)

    // Create the recipe
    const { data: recipe, error: recipeError } = await supabaseAdmin
      .from('Recipe')
      .insert({
        title: data.title,
        description: data.description,
        ingredients: data.ingredients,
        instructions: data.instructions,
        prepTime: data.prepTime,
        cookTime: data.cookTime,
        servings: data.servings,
        imageUrl: data.imageUrl || null,
        mealType: data.mealType,
        userId: session.user.id,
      })
      .select()
      .single()

    if (recipeError) {
      console.error("Recipe creation error:", recipeError)
      return NextResponse.json(
        { error: "Failed to create recipe" },
        { status: 500 }
      )
    }

    // Handle tags if provided
    const recipeTags = []
    if (data.tags && data.tags.length > 0) {
      for (const tagName of data.tags) {
        // Create tag if it doesn't exist
        const { data: tag, error: tagError } = await supabaseAdmin
          .from('Tag')
          .upsert(
            { name: tagName },
            { onConflict: 'name' }
          )
          .select()
          .single()

        if (!tagError && tag) {
          // Link recipe to tag
          const { error: linkError } = await supabaseAdmin
            .from('RecipeTag')
            .insert({
              recipeId: recipe.id,
              tagId: tag.id
            })

          if (!linkError) {
            recipeTags.push({ tag })
          }
        }
      }
    }

    // Return recipe with tags
    const recipeWithTags = {
      ...recipe,
      tags: recipeTags
    }

    return NextResponse.json(recipeWithTags, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error creating recipe:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}