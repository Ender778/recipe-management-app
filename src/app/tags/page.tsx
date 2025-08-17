"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navigation/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Edit, Trash2, Search } from "lucide-react"

interface Tag {
  id: string
  name: string
  color?: string
}

export default function TagsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null)
  const [formData, setFormData] = useState({ name: "", color: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (status !== "loading" && !session) {
      router.push("/auth/signin")
    }
  }, [session, status, router])

  useEffect(() => {
    if (session) {
      fetchTags()
    }
  }, [session])

  const fetchTags = async () => {
    try {
      const response = await fetch("/api/tags")
      if (response.ok) {
        const data = await response.json()
        setTags(data)
      } else {
        setError("Failed to fetch tags")
      }
    } catch (error) {
      console.error("Error fetching tags:", error)
      setError("Error fetching tags")
    } finally {
      setLoading(false)
    }
  }

  const createTag = async () => {
    if (!formData.name.trim()) return

    setIsSubmitting(true)
    setError("")

    try {
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          color: formData.color || undefined,
        }),
      })

      if (response.ok) {
        const newTag = await response.json()
        setTags(prev => [...prev, newTag])
        setFormData({ name: "", color: "" })
        setShowCreateDialog(false)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to create tag")
      }
    } catch (error) {
      console.error("Error creating tag:", error)
      setError("Error creating tag")
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateTag = async () => {
    if (!selectedTag || !formData.name.trim()) return

    setIsSubmitting(true)
    setError("")

    try {
      const response = await fetch(`/api/tags/${selectedTag.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          color: formData.color || undefined,
        }),
      })

      if (response.ok) {
        const updatedTag = await response.json()
        setTags(prev => prev.map(tag => tag.id === selectedTag.id ? updatedTag : tag))
        setFormData({ name: "", color: "" })
        setSelectedTag(null)
        setShowEditDialog(false)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to update tag")
      }
    } catch (error) {
      console.error("Error updating tag:", error)
      setError("Error updating tag")
    } finally {
      setIsSubmitting(false)
    }
  }

  const deleteTag = async () => {
    if (!selectedTag) return

    setIsSubmitting(true)
    setError("")

    try {
      const response = await fetch(`/api/tags/${selectedTag.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setTags(prev => prev.filter(tag => tag.id !== selectedTag.id))
        setSelectedTag(null)
        setShowDeleteDialog(false)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to delete tag")
      }
    } catch (error) {
      console.error("Error deleting tag:", error)
      setError("Error deleting tag")
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditDialog = (tag: Tag) => {
    setSelectedTag(tag)
    setFormData({ name: tag.name, color: tag.color || "" })
    setShowEditDialog(true)
  }

  const openDeleteDialog = (tag: Tag) => {
    setSelectedTag(tag)
    setShowDeleteDialog(true)
  }

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tags</h1>
              <p className="text-gray-600 mt-1">Manage recipe tags</p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Tag
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm mb-6">
              {error}
            </div>
          )}

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tags Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTags.map((tag) => (
              <Card key={tag.id} className="p-2">
                <CardHeader className="gap-0">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="truncate max-w-[180px]">
                      {tag.name}
                    </Badge>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(tag)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(tag)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          {filteredTags.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {tags.length === 0 ? "No tags created yet." : "No tags match your search."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Tag Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Tag</DialogTitle>
            <DialogDescription>
              Add a new tag that can be used across recipes.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="create-name">Tag Name</Label>
              <Input
                id="create-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter tag name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createTag} disabled={isSubmitting || !formData.name.trim()}>
              {isSubmitting ? "Creating..." : "Create Tag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Tag Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
            <DialogDescription>
              Update the tag name.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Tag Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter tag name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={updateTag} disabled={isSubmitting || !formData.name.trim()}>
              {isSubmitting ? "Updating..." : "Update Tag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Tag Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tag</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the tag &quot;{selectedTag?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteTag} disabled={isSubmitting}>
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
