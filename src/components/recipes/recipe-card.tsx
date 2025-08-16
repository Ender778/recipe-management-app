"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

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
}

export function RecipeCard({ recipe }: RecipeCardProps) {
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

  const getStockImage = (mealType: MealType) => {
    switch (mealType) {
      case 'BREAKFAST': return 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&h=600&fit=crop&crop=center'
      case 'LUNCH': return 'https://images.unsplash.com/photo-1546554137-f86b9593a222?w=800&h=600&fit=crop&crop=center'
      case 'DINNER': return 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&h=600&fit=crop&crop=center'
      case 'DESSERT': return 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&h=600&fit=crop&crop=center'
      case 'SNACK': return 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=800&h=600&fit=crop&crop=center'
      default: return 'https://images.unsplash.com/photo-1546554137-f86b9593a222?w=800&h=600&fit=crop&crop=center'
    }
  }

  return (
    <Link href={`/recipes/${recipe.id}`}>
      <Card className="h-full flex flex-col hover:shadow-md transition-shadow cursor-pointer overflow-hidden p-0">
        {/* Banner-style meal type tag */}
        <div className={`${getMealTypeBadgeColor(recipe.mealType)} text-xs font-medium text-center`}>
          <div className="py-1">{recipe.mealType.charAt(0) + recipe.mealType.slice(1).toLowerCase()}</div>
          <div>
            <div className="aspect-video relative overflow-hidden">
              <Image
                src={recipe.imageUrl || getStockImage(recipe.mealType)}
                alt={recipe.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          </div>
        </div>



        <CardHeader className="flex-1 px-4 pt-1">
          <CardTitle className="line-clamp-2 text-lg">{recipe.title}</CardTitle>

          {recipe.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mt-2">
              {recipe.description}
            </p>
          )}
        </CardHeader>

        <CardContent className="px-4 pb-4">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            {totalTime > 0 && (
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{totalTime} min</span>
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