import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface Message {
  role: "user" | "assistant" | "system"
  content: string
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { messages }: { messages: Message[] } = await req.json()

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 })
    }

    // Get user's recipes to provide context to the AI
    const { data: userRecipes, error } = await supabaseAdmin
      .from('Recipe')
      .select(`
        *,
        RecipeTag(
          Tag(*)
        )
      `)
      .eq('userId', session.user.id)

    if (error) {
      console.error("Error fetching user recipes:", error)
      return NextResponse.json({ error: "Failed to fetch recipes" }, { status: 500 })
    }

    // Format recipes for AI context
    const recipesContext = (userRecipes || []).map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      prepTime: recipe.prepTime,
      cookTime: recipe.cookTime,
      servings: recipe.servings,
      tags: recipe.RecipeTag?.map((rt: { Tag: { name: string } }) => rt.Tag.name) || []
    }))

    // System message with context about the user's recipes
    const systemMessage: Message = {
      role: "system",
      content: `You are a helpful cooking assistant. You have access to the user's recipe collection and can help them:

1. Find recipes based on available ingredients
2. Suggest recipes based on cravings or preferences
3. Help create new recipes through conversation
4. Answer cooking questions
5. Provide cooking tips and substitutions

User's Recipe Collection:
${JSON.stringify(recipesContext, null, 2)}

When helping users find recipes, reference their actual recipes by title and ID. If they want to create a new recipe, guide them through the process and suggest they save it to their collection.

Be conversational, helpful, and enthusiastic about cooking. If a user asks about ingredients they have, suggest recipes from their collection that use those ingredients, or help them create something new.`
    }

    // Prepare messages for OpenAI
    const openAIMessages = [systemMessage, ...messages]

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: openAIMessages,
      max_tokens: 1000,
      temperature: 0.7,
    })

    const assistantMessage = completion.choices[0]?.message?.content

    if (!assistantMessage) {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 })
    }

    return NextResponse.json({
      message: assistantMessage,
      usage: completion.usage,
    })

  } catch (error) {
    console.error("Error in chat API:", error)
    
    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}