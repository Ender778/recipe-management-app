"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

interface RecipeCardProps {
  recipe: Recipe
  onDelete?: (id: string) => void
}

export function RecipeCard({ recipe, onDelete }: RecipeCardProps) {
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
      <Card className="h-full flex flex-col hover:shadow-md transition-shadow cursor-pointer relative">
        <Badge className={`${getMealTypeBadgeColor(recipe.mealType)} text-xs absolute top-3 right-3 z-10`}>
          {recipe.mealType.charAt(0) + recipe.mealType.slice(1).toLowerCase()}
        </Badge>
        
        {recipe.imageUrl && (
          <div className="aspect-video relative overflow-hidden rounded-t-lg">
            <img
              src={recipe.imageUrl}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <CardHeader className="flex-1">
          <CardTitle className="line-clamp-2 text-lg">{recipe.title}</CardTitle>
          
          {recipe.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mt-2">
              {recipe.description}
            </p>
          )}
        </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
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
        </div>

        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
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
      </CardContent>
      </Card>
    </Link>
  )
}