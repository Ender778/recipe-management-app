"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navigation/navbar"
import { RecipeCard } from "@/components/recipes/recipe-card"
import { RecipeListItem } from "@/components/recipes/recipe-list-item"
import { ChatInterface } from "@/components/chat/chat-interface"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Search, Plus, X, MessageCircle, LayoutGrid, List } from "lucide-react"
import Link from "next/link"

type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'DESSERT' | 'SNACK'

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
  mealType: MealType
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
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')
  const [sortByMealType, setSortByMealType] = useState(false)

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

  const filterRecipes = useCallback(() => {
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
  }, [recipes, searchTerm, selectedTags])

  useEffect(() => {
    filterRecipes()
  }, [filterRecipes])


  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const getSortedRecipes = () => {
    if (!sortByMealType) {
      // Alphabetical sorting
      return [...filteredRecipes].sort((a, b) => a.title.localeCompare(b.title))
    } else {
      // Group by meal type, then sort alphabetically within each group
      const mealTypeOrder: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'DESSERT', 'SNACK']
      return [...filteredRecipes].sort((a, b) => {
        const mealTypeComparison = mealTypeOrder.indexOf(a.mealType) - mealTypeOrder.indexOf(b.mealType)
        if (mealTypeComparison !== 0) {
          return mealTypeComparison
        }
        return a.title.localeCompare(b.title)
      })
    }
  }

  const getGroupedRecipes = () => {
    if (!sortByMealType) {
      return { ungrouped: getSortedRecipes() }
    }

    const grouped: Record<string, Recipe[]> = {}
    const mealTypeOrder: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'DESSERT', 'SNACK']
    
    // Initialize groups
    mealTypeOrder.forEach(mealType => {
      grouped[mealType] = []
    })

    // Group recipes
    getSortedRecipes().forEach(recipe => {
      grouped[recipe.mealType].push(recipe)
    })

    return grouped
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

            {/* View and Sort Controls */}
            <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-lg border border-gray-200">
              {/* View Type Filter - Desktop/Tablet Only */}
              <div className="hidden md:flex items-center space-x-2">
                <Label className="text-sm font-medium text-gray-700">View:</Label>
                <div className="flex border rounded-lg">
                  <Button
                    variant={viewMode === 'card' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('card')}
                    className="rounded-r-none"
                  >
                    <LayoutGrid className="h-4 w-4 mr-1" />
                    Cards
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-l-none border-l"
                  >
                    <List className="h-4 w-4 mr-1" />
                    List
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Label className="text-sm font-medium text-gray-700">Sort:</Label>
                <Button
                  variant={sortByMealType ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortByMealType(!sortByMealType)}
                >
                  {sortByMealType ? 'Meal Type Sections' : 'Alphabetical'}
                </Button>
              </div>
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

          {/* Recipes Display */}
          {filteredRecipes.length > 0 ? (
            <div>
              {sortByMealType ? (
                // Meal Type Sections View
                Object.entries(getGroupedRecipes()).map(([mealType, mealRecipes]) => {
                  if (mealType === 'ungrouped' || mealRecipes.length === 0) return null
                  
                  return (
                    <div key={mealType} className="mb-8">
                      <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                        {mealType.charAt(0) + mealType.slice(1).toLowerCase()} ({mealRecipes.length})
                      </h2>
                      {/* Mobile List View */}
                      <div className="md:hidden space-y-4 flex flex-col">
                        {mealRecipes.map((recipe) => (
                          <RecipeListItem
                            key={recipe.id}
                            recipe={recipe}
                          />
                        ))}
                      </div>
                      
                      {/* Desktop View - respects viewMode toggle */}
                      <div className="hidden md:block">
                        {viewMode === 'card' ? (
                          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {mealRecipes.map((recipe) => (
                              <RecipeCard
                                key={recipe.id}
                                recipe={recipe}
                                  />
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-4 flex flex-col">
                            {mealRecipes.map((recipe) => (
                              <RecipeListItem
                                key={recipe.id}
                                recipe={recipe}
                                  />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              ) : (
                // Standard View (List on mobile, viewMode toggle on desktop)
                <>
                  {/* Mobile List View */}
                  <div className="md:hidden space-y-4 flex flex-col">
                    {getSortedRecipes().map((recipe) => (
                      <RecipeListItem
                        key={recipe.id}
                        recipe={recipe}
                      />
                    ))}
                  </div>
                  
                  {/* Desktop View - respects viewMode toggle */}
                  <div className="hidden md:block">
                    {viewMode === 'card' ? (
                      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {getSortedRecipes().map((recipe) => (
                          <RecipeCard
                            key={recipe.id}
                            recipe={recipe}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4 flex flex-col">
                        {getSortedRecipes().map((recipe) => (
                          <RecipeListItem
                            key={recipe.id}
                            recipe={recipe}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
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
                <MessageCircle className="h-5 w-5 md:mr-2" />
                <span className="hidden md:inline">Recipe Assistant</span>
              </Button>
            }
          />
        </div>
      </div>
    </>
  )
}