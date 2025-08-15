"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { Navbar } from "@/components/navigation/navbar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Clock, Users, Edit, Trash2, ArrowLeft, ChevronUp, ChevronDown } from "lucide-react"
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

// Function to scale ingredient quantities
const scaleIngredient = (ingredient: string, originalServings: number, newServings: number): string => {
  if (originalServings === 0 || newServings === originalServings) return ingredient
  
  const multiplier = newServings / originalServings
  
  // Try to parse the ingredient string: "quantity unit name"
  const parts = ingredient.trim().split(' ')
  if (parts.length < 2) return ingredient
  
  const quantityStr = parts[0]
  
  // Handle fractions like "1/2", "3/4", etc.
  let quantity: number
  if (quantityStr.includes('/')) {
    const [numerator, denominator] = quantityStr.split('/').map(Number)
    quantity = numerator / denominator
  } else {
    quantity = parseFloat(quantityStr)
  }
  
  if (isNaN(quantity)) return ingredient
  
  const scaledQuantity = quantity * multiplier
  
  // Format the scaled quantity nicely
  const formatQuantity = (num: number): string => {
    // Handle common fractions
    const fractions: { [key: string]: string } = {
      '0.25': '1/4',
      '0.33': '1/3', 
      '0.333': '1/3',
      '0.5': '1/2',
      '0.67': '2/3',
      '0.667': '2/3',
      '0.75': '3/4'
    }
    
    const rounded = Math.round(num * 1000) / 1000
    const fracStr = fractions[rounded.toString()]
    
    if (fracStr) return fracStr
    
    // For other numbers, round to reasonable precision
    if (rounded < 1) {
      return rounded.toString()
    } else if (rounded % 1 === 0) {
      return rounded.toString()
    } else {
      return rounded.toFixed(1).replace(/\.0$/, '')
    }
  }
  
  const formattedQuantity = formatQuantity(scaledQuantity)
  
  // Reconstruct the ingredient string
  return [formattedQuantity, ...parts.slice(1)].join(' ')
}

// Generate serving options (1-12)
const SERVING_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1)

export default function RecipePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [currentServings, setCurrentServings] = useState<number>(1)
  const [expandedSteps, setExpandedSteps] = useState<string[]>([])
  const [allExpanded, setAllExpanded] = useState(true)

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

  useEffect(() => {
    if (recipe?.servings) {
      setCurrentServings(recipe.servings)
    }
  }, [recipe])

  // Initialize expanded steps when recipe loads
  useEffect(() => {
    if (recipe?.instructions) {
      const allStepValues = recipe.instructions.map((_, index) => `step-${index}`)
      setExpandedSteps(allStepValues)
    }
  }, [recipe])

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

  const handleDelete = async () => {
    if (!recipe || !confirm("Are you sure you want to delete this recipe?")) return

    try {
      const response = await fetch(`/api/recipes/${recipe.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        router.push("/recipes")
      } else {
        alert("Failed to delete recipe")
      }
    } catch (error) {
      console.error("Error deleting recipe:", error)
      alert("Failed to delete recipe")
    }
  }

  const toggleAllSteps = () => {
    if (!recipe) return
    
    if (allExpanded) {
      // Collapse all
      setExpandedSteps([])
      setAllExpanded(false)
    } else {
      // Expand all
      const allStepValues = recipe.instructions.map((_, index) => `step-${index}`)
      setExpandedSteps(allStepValues)
      setAllExpanded(true)
    }
  }

  const handleAccordionChange = (value: string[]) => {
    setExpandedSteps(value)
    setAllExpanded(value.length === recipe?.instructions.length)
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

  if (error) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-red-600 mb-4">{error}</p>
            <Button asChild>
              <Link href="/recipes">Back to Recipes</Link>
            </Button>
          </div>
        </div>
      </>
    )
  }

  if (!recipe) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-lg">Recipe not found</div>
        </div>
      </>
    )
  }

  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0)

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Button variant="ghost" asChild className="mb-4">
              <Link href="/recipes">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Recipes
              </Link>
            </Button>

            {/* Mobile Layout */}
            <div className="md:hidden">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{recipe.title}</h1>
              {recipe.description && (
                <p className="text-lg text-gray-600 mb-4">{recipe.description}</p>
              )}
              <div className="flex space-x-2 mb-4">
                <Button asChild size="sm" className="h-8 px-3 text-sm">
                  <Link href={`/recipes/${recipe.id}/edit`}>
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Link>
                </Button>
                <Button variant="destructive" onClick={handleDelete} size="sm" className="h-8 px-3 text-sm">
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:flex justify-between items-start">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">{recipe.title}</h1>
                {recipe.description && (
                  <p className="text-lg text-gray-600 mb-4">{recipe.description}</p>
                )}
              </div>
              <div className="flex space-x-2 ml-4">
                <Button asChild>
                  <Link href={`/recipes/${recipe.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>

            {/* Recipe Info */}
            <div className="flex items-center space-x-6 text-gray-600 mb-6">
              {recipe.prepTime && (
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>Prep: {recipe.prepTime} min</span>
                </div>
              )}
              {recipe.cookTime && (
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>Cook: {recipe.cookTime} min</span>
                </div>
              )}
              {totalTime > 0 && (
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>Total: {totalTime} min</span>
                </div>
              )}
              {recipe.servings && (
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{recipe.servings} servings</span>
                </div>
              )}
            </div>

            {/* Tags */}
            {recipe.tags && recipe.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {recipe.tags.map((recipeTag) => (
                  <Badge key={recipeTag.tag.name} variant="secondary">
                    {recipeTag.tag.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {recipe.imageUrl && (
            <div className="mb-8">
              <img
                src={recipe.imageUrl}
                alt={recipe.title}
                className="w-full h-96 object-cover rounded-lg"
              />
            </div>
          )}

          {/* Ingredients - Full Width with 2 Columns */}
          <Card className="mb-8">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Ingredients</CardTitle>
              {recipe.servings && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Servings:</span>
                  <Select
                    value={currentServings.toString()}
                    onValueChange={(value) => setCurrentServings(parseInt(value))}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVING_OPTIONS.map((servings) => (
                        <SelectItem key={servings} value={servings.toString()}>
                          {servings}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-start">
                    <span className="w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                    <span>
                      {recipe.servings 
                        ? scaleIngredient(ingredient, recipe.servings, currentServings)
                        : ingredient
                      }
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Instructions - Full Width with Accordion */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Instructions</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleAllSteps}
                  className="flex items-center gap-2"
                >
                  {allExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Collapse All
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Expand All
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion 
                type="multiple" 
                className="w-full"
                value={expandedSteps}
                onValueChange={handleAccordionChange}
              >
                {recipe.instructions.map((instruction, index) => (
                  <AccordionItem key={index} value={`step-${index}`}>
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                          {index + 1}
                        </span>
                        <span>Step {index + 1}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="ml-9 leading-relaxed">{instruction}</div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}