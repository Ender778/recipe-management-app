"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { Navbar } from "@/components/navigation/navbar"
import { RecipeForm } from "@/components/recipes/recipe-form"

interface Recipe {
  id: string
  title: string
  description?: string
  ingredients: string[]
  instructions: string[]
  prepTime?: number
  cookTime?: number
  servings?: number
  imageUrl?: string
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'DESSERT' | 'SNACK'
  tags?: Array<{ tag: { name: string } }>
  createdAt: string
  updatedAt: string
}

export default function EditRecipePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (status !== "loading" && !session) {
      router.push("/auth/signin")
    }
  }, [session, status, router])

  useEffect(() => {
    if (session && params.id) {
      fetchRecipe()
    }
  }, [session, params.id])

  const fetchRecipe = async () => {
    try {
      const response = await fetch(`/api/recipes/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setRecipe(data)
      } else if (response.status === 404) {
        setError("Recipe not found")
      } else {
        setError("Failed to load recipe")
      }
    } catch (error) {
      console.error("Error fetching recipe:", error)
      setError("Failed to load recipe")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = () => {
    router.push(`/recipes/${params.id}`)
  }

  if (status === "loading" || loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-lg">Loading...</div>
        </div>
      </>
    )
  }

  if (!session) {
    return null
  }

  if (error || !recipe) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-red-600 mb-4">{error || "Recipe not found"}</p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <RecipeForm recipe={recipe} onSave={handleSave} />
        </div>
      </div>
    </>
  )
}