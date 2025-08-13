"use client"

import { useSession } from "next-auth/react"
import { Navbar } from "@/components/navigation/navbar"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
  const { data: session, status } = useSession()

  if (status === "loading") {
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
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full text-center space-y-6">
            <h1 className="text-4xl font-bold text-gray-900">Recipe Manager</h1>
            <p className="text-lg text-gray-600">
              Organize your recipes and discover new ones with AI assistance
            </p>
            <div className="space-y-4">
              <Button asChild className="w-full">
                <Link href="/auth/signup">Get Started</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/auth/signin">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center space-y-6">
            <h1 className="text-4xl font-bold text-gray-900">Your Recipes</h1>
            <p className="text-lg text-gray-600">
              Welcome back! Start managing your recipe collection.
            </p>
            <div className="flex justify-center space-x-4">
              <Button asChild>
                <Link href="/recipes/new">Add New Recipe</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/recipes">View All Recipes</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
