"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Users, Edit, Trash2 } from "lucide-react"
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

interface RecipeCardProps {
  recipe: Recipe
  onDelete?: (id: string) => void
}

export function RecipeCard({ recipe, onDelete }: RecipeCardProps) {
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0)

  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
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
        <div className="flex justify-between items-start">
          <CardTitle className="line-clamp-2 text-lg">{recipe.title}</CardTitle>
          <div className="flex space-x-1 ml-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/recipes/${recipe.id}/edit`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(recipe.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
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
            <div className="flex items-center space-x-1">
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

        <div className="pt-2">
          <Button asChild className="w-full">
            <Link href={`/recipes/${recipe.id}`}>View Recipe</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}