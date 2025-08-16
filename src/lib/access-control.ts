import { supabaseAdmin } from "./supabase"

export async function checkBookAccess(bookId: string, userId: string): Promise<{ hasAccess: boolean; permission?: "READ" | "WRITE" }> {
  try {
    const { data: membership, error } = await supabaseAdmin
      .from('BookMember')
      .select('permission')
      .eq('bookId', bookId)
      .eq('userId', userId)
      .single()

    if (error || !membership) {
      return { hasAccess: false }
    }

    return { hasAccess: true, permission: membership.permission }
  } catch (error) {
    console.error("Error checking book access:", error)
    return { hasAccess: false }
  }
}

export async function checkRecipeAccess(recipeId: string, userId: string): Promise<boolean> {
  try {
    // Get recipe's book ID
    const { data: recipe, error: recipeError } = await supabaseAdmin
      .from('Recipe')
      .select('bookId')
      .eq('id', recipeId)
      .single()

    if (recipeError || !recipe) {
      return false
    }

    // Check if user has access to the book
    const bookAccess = await checkBookAccess(recipe.bookId, userId)
    return bookAccess.hasAccess
  } catch (error) {
    console.error("Error checking recipe access:", error)
    return false
  }
}

export async function requireRecipeAccess(
  recipeId: string, 
  userId: string, 
  permission: "READ" | "WRITE"
): Promise<{ success: true } | { success: false; error: string; status: number }> {
  try {
    // Get recipe's book ID
    const { data: recipe, error: recipeError } = await supabaseAdmin
      .from('Recipe')
      .select('bookId')
      .eq('id', recipeId)
      .single()

    if (recipeError || !recipe) {
      return { success: false, error: "Recipe not found", status: 404 }
    }

    // Check book access
    const bookAccess = await checkBookAccess(recipe.bookId, userId)
    
    if (!bookAccess.hasAccess) {
      return { success: false, error: "You don't have access to this recipe", status: 403 }
    }

    // Check permission level
    if (permission === "WRITE" && bookAccess.permission === "READ") {
      return { success: false, error: "You don't have write access to this recipe", status: 403 }
    }

    return { success: true }
  } catch (error) {
    console.error("Error checking recipe access:", error)
    return { success: false, error: "Internal server error", status: 500 }
  }
}

export async function getUserAccessibleRecipes(userId: string) {
  try {
    // Get all books user is a member of
    const { data: userBooks, error: booksError } = await supabaseAdmin
      .from('BookMember')
      .select('bookId, permission')
      .eq('userId', userId)

    if (booksError || !userBooks || userBooks.length === 0) {
      return []
    }

    const bookIds = userBooks.map(book => book.bookId)
    const bookPermissions = userBooks.reduce((acc, book) => {
      acc[book.bookId] = book.permission
      return acc
    }, {} as Record<string, string>)

    // Get all recipes from user's books
    const { data: recipes, error: recipesError } = await supabaseAdmin
      .from('Recipe')
      .select(`
        *,
        RecipeTag(
          Tag(*)
        ),
        CreatedBy:createdBy(name, email),
        RecipeBook:bookId(name)
      `)
      .in('bookId', bookIds)
      .order('updatedAt', { ascending: false })

    if (recipesError) {
      console.error("Error fetching accessible recipes:", recipesError)
      return []
    }

    // Transform recipes with permission and ownership info
    const transformedRecipes = (recipes || []).map(recipe => ({
      ...recipe,
      tags: recipe.RecipeTag?.map((rt: { Tag: { name: string } }) => ({ tag: rt.Tag })) || [],
      createdByUser: recipe.CreatedBy,
      bookName: recipe.RecipeBook?.name,
      permission: bookPermissions[recipe.bookId],
      isOwner: recipe.createdBy === userId
    }))

    return transformedRecipes
  } catch (error) {
    console.error("Error getting accessible recipes:", error)
    return []
  }
}

export async function requireBookAccess(
  bookId: string,
  userId: string,
  permission: "READ" | "WRITE"
): Promise<{ success: true } | { success: false; error: string; status: number }> {
  try {
    const bookAccess = await checkBookAccess(bookId, userId)
    
    if (!bookAccess.hasAccess) {
      return { success: false, error: "You don't have access to this recipe book", status: 403 }
    }

    // Check permission level
    if (permission === "WRITE" && bookAccess.permission === "READ") {
      return { success: false, error: "You don't have write access to this recipe book", status: 403 }
    }

    return { success: true }
  } catch (error) {
    console.error("Error checking book access:", error)
    return { success: false, error: "Internal server error", status: 500 }
  }
}
