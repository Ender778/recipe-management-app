"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, Edit, Trash2 } from "lucide-react"
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

interface RecipeListItemProps {
  recipe: Recipe
  onDelete?: (id: string) => void
}

export function RecipeListItem({ recipe, onDelete }: RecipeListItemProps) {
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0)
  
  const getMealTypeBadgeColor = (mealType: MealType) => {
    switch (mealType) {
      case 'BREAKFAST': return 'bg-yellow-100 text-yellow-800'
      case 'LUNCH': return 'bg-green-100 text-green-800'
      case 'DINNER': return 'bg-blue-100 text-blue-800'
      case 'DESSERT': return 'bg-pink-100 text-pink-800'
      case 'SNACK': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Link href={`/recipes/${recipe.id}`}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow relative cursor-pointer">
        <Badge className={`${getMealTypeBadgeColor(recipe.mealType)} text-xs absolute top-4 right-4 z-10`}>
          {recipe.mealType.charAt(0) + recipe.mealType.slice(1).toLowerCase()}
        </Badge>
        
        <div className="pr-16">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{recipe.title}</h3>
          
          {recipe.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {recipe.description}
            </p>
          )}
          
          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
            {totalTime > 0 && (
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{totalTime} min</span>
              </div>
            )}
            {recipe.servings && (
              <div className="hidden md:flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>{recipe.servings} servings</span>
              </div>
            )}
            <span className="hidden md:inline">{recipe.ingredients.length} ingredients</span>
          </div>

          {recipe.tags && recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {recipe.tags.slice(0, 3).map((recipeTag) => (
                <Badge key={recipeTag.tag.name} variant="secondary" className="text-xs">
                  {recipeTag.tag.name}
                </Badge>
              ))}
              {recipe.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{recipe.tags.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
