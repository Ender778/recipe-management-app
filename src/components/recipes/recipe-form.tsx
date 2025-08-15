"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface StructuredIngredient {
  quantity: string
  unit: string
  name: string
}

type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'DESSERT' | 'SNACK'

interface Recipe {
  id?: string
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
}

// Dropdown options
const QUANTITIES = [
  "1/4", "1/3", "1/2", "3/4", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
  "11", "12", "13", "14", "15", "16", "17", "18", "19", "20"
]

const UNITS = [
  "ea", "oz", "tsp", "tbsp", "cup", "pint", "qt", "gallon", "lb", "g", "kg", "ml", "l"
]

const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: 'BREAKFAST', label: 'Breakfast' },
  { value: 'LUNCH', label: 'Lunch' },
  { value: 'DINNER', label: 'Dinner' },
  { value: 'DESSERT', label: 'Dessert' },
  { value: 'SNACK', label: 'Snack' }
]

interface RecipeFormProps {
  recipe?: Recipe
  onSave?: () => void
}

// Helper function to parse existing ingredients
const parseIngredients = (ingredients: string[]): StructuredIngredient[] => {
  return ingredients.map(ing => {
    // Try to parse existing ingredients - this is a simple approach
    const parts = ing.trim().split(' ')
    if (parts.length >= 3) {
      return {
        quantity: parts[0],
        unit: parts[1],
        name: parts.slice(2).join(' ')
      }
    }
    return {
      quantity: "1",
      unit: "ea",
      name: ing || ""
    }
  })
}

// Helper function to convert structured ingredients back to strings
const formatIngredients = (structuredIngredients: StructuredIngredient[]): string[] => {
  return structuredIngredients
    .filter(ing => ing.name.trim() !== "") // Only include ingredients with names
    .map(ing => `${ing.quantity} ${ing.unit} ${ing.name}`.trim())
}

export function RecipeForm({ recipe, onSave }: RecipeFormProps) {
  const [formData, setFormData] = useState({
    title: recipe?.title || "",
    description: recipe?.description || "",
    instructions: recipe?.instructions || [""],
    prepTime: recipe?.prepTime || undefined,
    cookTime: recipe?.cookTime || undefined,
    servings: recipe?.servings || undefined,
    imageUrl: recipe?.imageUrl || "",
    mealType: recipe?.mealType || 'BREAKFAST' as MealType,
    tags: recipe?.tags?.map(t => t.tag.name) || [],
  })
  
  const [structuredIngredients, setStructuredIngredients] = useState<StructuredIngredient[]>(() => {
    if (recipe?.ingredients && recipe.ingredients.length > 0) {
      return parseIngredients(recipe.ingredients)
    }
    return [{ quantity: "1", unit: "ea", name: "" }]
  })
  
  const [newTag, setNewTag] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const addIngredient = () => {
    setStructuredIngredients(prev => [...prev, { quantity: "1", unit: "ea", name: "" }])
  }

  const removeIngredient = (index: number) => {
    setStructuredIngredients(prev => prev.filter((_, i) => i !== index))
  }

  const updateIngredient = (index: number, field: keyof StructuredIngredient, value: string) => {
    setStructuredIngredients(prev => 
      prev.map((ing, i) => 
        i === index ? { ...ing, [field]: value } : ing
      )
    )
  }

  const addInstruction = () => {
    setFormData(prev => ({
      ...prev,
      instructions: [...prev.instructions, ""]
    }))
  }

  const removeInstruction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index)
    }))
  }

  const updateInstruction = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.map((inst, i) => i === index ? value : inst)
    }))
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return

    setIsLoading(true)
    setError("")

    try {
      // Convert structured ingredients to strings and filter out empty ones
      const ingredients = formatIngredients(structuredIngredients)
      
      console.log("Submitting recipe with ingredients:", ingredients)
      console.log("Structured ingredients:", structuredIngredients)
      
      const cleanedData = {
        ...formData,
        ingredients,
        instructions: formData.instructions.filter(inst => inst.trim() !== ""),
        prepTime: formData.prepTime || undefined,
        cookTime: formData.cookTime || undefined,
        servings: formData.servings || undefined,
        imageUrl: formData.imageUrl || "",
      }

      console.log("Final data being sent:", cleanedData)

      const url = recipe?.id ? `/api/recipes/${recipe.id}` : "/api/recipes"
      const method = recipe?.id ? "PUT" : "POST"

      console.log("Making request to:", url, "with method:", method)

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanedData),
      })

      console.log("Response status:", response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log("Recipe created successfully:", result)
        if (onSave) {
          onSave()
        } else {
          router.push("/recipes")
        }
      } else {
        const data = await response.json()
        console.error("API Error:", data)
        setError(data.error || "Something went wrong")
      }
    } catch (error) {
      console.error("Submit error:", error)
      setError("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{recipe?.id ? "Edit Recipe" : "Create New Recipe"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mealType">Meal Type *</Label>
            <Select
              value={formData.mealType}
              onValueChange={(value) => setFormData(prev => ({ ...prev, mealType: value as MealType }))}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select meal type" />
              </SelectTrigger>
              <SelectContent>
                {MEAL_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prepTime">Prep Time (min)</Label>
              <Input
                id="prepTime"
                type="number"
                min="0"
                value={formData.prepTime || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, prepTime: e.target.value ? parseInt(e.target.value) : undefined }))}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cookTime">Cook Time (min)</Label>
              <Input
                id="cookTime"
                type="number"
                min="0"
                value={formData.cookTime || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, cookTime: e.target.value ? parseInt(e.target.value) : undefined }))}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="servings">Servings</Label>
              <Input
                id="servings"
                type="number"
                min="1"
                value={formData.servings || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, servings: e.target.value ? parseInt(e.target.value) : undefined }))}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Ingredients *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addIngredient} disabled={isLoading}>
                Add Ingredient
              </Button>
            </div>
            {structuredIngredients.map((ingredient, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="w-20">
                  <Label className="text-xs text-gray-500">Quantity</Label>
                  <Select
                    value={ingredient.quantity}
                    onValueChange={(value) => updateIngredient(index, 'quantity', value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Qty" />
                    </SelectTrigger>
                    <SelectContent>
                      {QUANTITIES.map((qty) => (
                        <SelectItem key={qty} value={qty}>
                          {qty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-24">
                  <Label className="text-xs text-gray-500">Unit</Label>
                  <Select
                    value={ingredient.unit}
                    onValueChange={(value) => updateIngredient(index, 'unit', value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-gray-500">Ingredient</Label>
                  <Input
                    value={ingredient.name}
                    onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                    placeholder="e.g., chicken breast, diced"
                    disabled={isLoading}
                  />
                </div>
                {structuredIngredients.length > 1 && (
                  <Button type="button" variant="outline" size="sm" onClick={() => removeIngredient(index)} disabled={isLoading}>
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Instructions *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addInstruction} disabled={isLoading}>
                Add Step
              </Button>
            </div>
            {formData.instructions.map((instruction, index) => (
              <div key={index} className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-sm text-gray-500">Step {index + 1}</Label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    value={instruction}
                    onChange={(e) => updateInstruction(index, e.target.value)}
                    placeholder={`Step ${index + 1}`}
                    disabled={isLoading}
                  />
                </div>
                {formData.instructions.length > 1 && (
                  <Button type="button" variant="outline" size="sm" onClick={() => removeInstruction(index)} disabled={isLoading}>
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag"
                disabled={isLoading}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag()
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addTag} disabled={isLoading}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                  {tag} ×
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : recipe?.id ? "Update Recipe" : "Create Recipe"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}