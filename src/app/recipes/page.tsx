"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navigation/navbar"
import { RecipeCard } from "@/components/recipes/recipe-card"
import { ChatInterface } from "@/components/chat/chat-interface"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Search, Plus, X, MessageCircle } from "lucide-react"
import Link from "next/link"

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
  tags?: Array<{ tag: { name: string } }>
  createdAt: string
  updatedAt: string
}

export default function RecipesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])

  useEffect(() => {
    if (status !== "loading" && !session) {
      router.push("/auth/signin")
    }
  }, [session, status, router])

  useEffect(() => {
    if (session) {
      fetchRecipes()
    }
  }, [session])

  useEffect(() => {
    filterRecipes()
  }, [recipes, searchTerm, selectedTags])

  const fetchRecipes = async () => {
    try {
      console.log("Fetching recipes...")
      const response = await fetch("/api/recipes")
      console.log("Recipes response status:", response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log("Recipes fetched:", data)
        console.log("Number of recipes:", data.length)
        setRecipes(data)
        
        // Extract unique tags
        const tags = new Set<string>()
        data.forEach((recipe: Recipe) => {
          recipe.tags?.forEach(recipeTag => {
            tags.add(recipeTag.tag.name)
          })
        })
        setAvailableTags(Array.from(tags))
      } else {
        const errorData = await response.json()
        console.error("Failed to fetch recipes:", errorData)
      }
    } catch (error) {
      console.error("Error fetching recipes:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterRecipes = () => {
    let filtered = recipes

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(recipe =>
        recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.ingredients.some(ing => ing.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(recipe =>
        selectedTags.some(tag =>
          recipe.tags?.some(recipeTag => recipeTag.tag.name === tag)
        )
      )
    }

    setFilteredRecipes(filtered)
  }

  const handleDeleteRecipe = async (recipeId: string) => {
    if (!confirm("Are you sure you want to delete this recipe?")) return

    try {
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setRecipes(prev => prev.filter(recipe => recipe.id !== recipeId))
      } else {
        alert("Failed to delete recipe")
      }
    } catch (error) {
      console.error("Error deleting recipe:", error)
      alert("Failed to delete recipe")
    }
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
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

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Recipes</h1>
              <p className="text-gray-600 mt-1">
                {filteredRecipes.length} of {recipes.length} recipes
              </p>
            </div>
            <Button asChild>
              <Link href="/recipes/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Recipe
              </Link>
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search recipes by title, description, or ingredients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Tag Filters */}
            {availableTags.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">Filter by tags:</div>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                      {selectedTags.includes(tag) && (
                        <X className="h-3 w-3 ml-1" />
                      )}
                    </Badge>
                  ))}
                </div>
                {selectedTags.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTags([])}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Recipes Grid */}
          {filteredRecipes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onDelete={handleDeleteRecipe}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-4">
                {recipes.length === 0
                  ? "No recipes found. Create your first recipe!"
                  : "No recipes match your search criteria."}
              </p>
              {recipes.length === 0 && (
                <Button asChild>
                  <Link href="/recipes/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Recipe
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Floating Chat Button */}
        <div className="fixed bottom-6 right-6 z-50">
          <ChatInterface
            trigger={
              <Button size="lg" className="rounded-full shadow-lg">
                <MessageCircle className="h-5 w-5 mr-2" />
                Recipe Assistant
              </Button>
            }
          />
        </div>
      </div>
    </>
  )
}