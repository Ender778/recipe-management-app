import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { z } from "zod"
import { nanoid } from "nanoid"

const generateId = () => nanoid()

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
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search")
    const tags = searchParams.get("tags")?.split(",").filter(Boolean)
    const createdBy = searchParams.get("createdBy") // Filter by recipe creator

    // Get all recipe books that the user is a member of
    const { data: userBooks, error: booksError } = await supabaseAdmin
      .from('BookMember')
      .select('bookId')
      .eq('userId', session.user.id)

    if (booksError) {
      console.error("Error fetching user books:", booksError)
      return NextResponse.json({ error: "Failed to fetch user books" }, { status: 500 })
    }

    if (!userBooks || userBooks.length === 0) {
      return NextResponse.json([])
    }

    const bookIds = userBooks.map(book => book.bookId)

    // Build query for recipes in user's books
    let query = supabaseAdmin
      .from('Recipe')
      .select(`
        *,
        RecipeTag(*,Tag(*)),
        CreatedBy:createdBy(name, email),
        RecipeBook:bookId(name)
      `)
      .in('bookId', bookIds)
      .order('updatedAt', { ascending: false })

    // Apply search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Apply creator filter
    if (createdBy) {
      query = query.eq('createdBy', createdBy)
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
    const transformedRecipes = recipes?.map(recipe => {
      console.log("Recipe tags raw data for recipe:", recipe.title, recipe.RecipeTag)
      const tags = recipe.RecipeTag?.map((rt: { Tag: unknown }) => {
        console.log("Processing recipe tag:", rt)
        return { tag: rt.Tag }
      }) || []
      console.log("Final transformed tags for", recipe.title, ":", tags)
      return {
        ...recipe,
        tags,
        createdByUser: recipe.CreatedBy,
        bookName: recipe.RecipeBook?.name
      }
    }) || []

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
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const result = createRecipeSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid recipe data", issues: result.error.issues },
        { status: 400 }
      )
    }

    const { title, description, ingredients, instructions, prepTime, cookTime, servings, mealType, imageUrl, tags } = result.data

    // Get user's default recipe book (or first book they're a member of with WRITE permission)
    const { data: userBooks, error: booksError } = await supabaseAdmin
      .from('BookMember')
      .select('bookId, permission')
      .eq('userId', session.user.id)
      .eq('permission', 'WRITE')
      .limit(1)

    if (booksError || !userBooks || userBooks.length === 0) {
      console.error("Error fetching user books:", booksError)
      return NextResponse.json(
        { error: "You don't have permission to create recipes in any book" },
        { status: 403 }
      )
    }

    const bookId = userBooks[0].bookId

    // Create recipe
    const { data: recipe, error: recipeError } = await supabaseAdmin
      .from('Recipe')
      .insert({
        id: generateId(),
        title,
        description,
        ingredients,
        instructions,
        prepTime,
        cookTime,
        servings,
        mealType,
        imageUrl,
        userId: session.user.id, // Keep for backward compatibility
        bookId,
        createdBy: session.user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single()

    if (recipeError) {
      console.error("Error creating recipe:", recipeError)
      return NextResponse.json(
        { error: "Failed to create recipe" },
        { status: 500 }
      )
    }

    // Handle tags if provided
    if (tags && tags.length > 0) {
      console.log("Processing tags:", tags)
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
          console.error("Error creating/fetching tag:", tagError, tagName)
          continue // Skip this tag if there's an error
        }

        console.log("Tag created/found:", tag)

        // Link the tag to the recipe
        const { error: linkError } = await supabaseAdmin
          .from('RecipeTag')
          .insert({
            recipeId: recipe.id,
            tagId: tag.id
          })

        if (linkError) {
          console.error("Error linking tag to recipe:", linkError)
        } else {
          console.log("Tag linked successfully:", tagName)
        }
      }
    }

    // Fetch the complete recipe with tags and creator info
    const { data: completeRecipe, error: fetchError } = await supabaseAdmin
      .from('Recipe')
      .select(`
        *,
        RecipeTag(*,Tag(*)),
        CreatedBy:createdBy(name, email),
        RecipeBook:bookId(name)
      `)
      .eq('id', recipe.id)
      .single()

    if (fetchError) {
      console.error("Error fetching complete recipe:", fetchError)
      return NextResponse.json(recipe) // Return basic recipe if tag fetch fails
    }

    // Transform the data
    const transformedRecipe = {
      ...completeRecipe,
      tags: completeRecipe.RecipeTag?.map((rt: { Tag: { name: string } }) => ({ tag: rt.Tag })) || [],
      createdByUser: completeRecipe.CreatedBy,
      bookName: completeRecipe.RecipeBook?.name
    }

    return NextResponse.json(transformedRecipe, { status: 201 })
  } catch (error) {
    console.error("Error creating recipe:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}