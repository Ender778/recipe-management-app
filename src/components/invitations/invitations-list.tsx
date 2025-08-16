"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Check, X, User, Clock, Eye, Edit, Mail, BookOpen, Trash2 } from "lucide-react"

// Remove old interface - now using BookInvitation only

interface BookInvitation {
  id: string
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED'
  permission: 'READ' | 'WRITE'
  createdAt: string
  expiresAt?: string
  invitedUserEmail: string
  RecipeBook?: {
    name: string
    description?: string
  }
  InvitedBy?: {
    name?: string
    email: string
  }
  InvitedUser?: {
    name?: string
    email: string
  }
}

export function InvitationsList() {
  const [sentInvitations, setSentInvitations] = useState<BookInvitation[]>([])
  const [receivedInvitations, setReceivedInvitations] = useState<BookInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchInvitations = useCallback(async () => {
    try {
      const response = await fetch("/api/invitations")
      if (response.ok) {
        const data = await response.json()
        setSentInvitations(data.sent || [])
        setReceivedInvitations(data.received || [])
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch invitations",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error fetching invitations:", error)
      toast({
        title: "Error",
        description: "Failed to fetch invitations",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchInvitations()
  }, [fetchInvitations])

  const handleInvitationAction = async (invitationId: string, action: "accept" | "decline" | "revoke") => {
    try {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      })

      if (response.ok) {
        await fetchInvitations() // Refresh the list
        toast({
          title: "Success",
          description: `Invitation ${action}${action.endsWith('e') ? 'd' : 'ed'} successfully`
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || `Failed to ${action} invitation`,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error(`Error ${action}ing invitation:`, error)
      toast({
        title: "Error",
        description: `Failed to ${action} invitation`,
        variant: "destructive"
      })
    }
  }

  const deleteInvitation = async (invitationId: string) => {
    if (!confirm("Are you sure you want to delete this invitation?")) return

    try {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        await fetchInvitations()
        toast({
          title: "Success",
          description: "Invitation deleted successfully"
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to delete invitation",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error deleting invitation:", error)
      toast({
        title: "Error",
        description: "Failed to delete invitation",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="text-yellow-600"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>
      case "ACCEPTED":
        return <Badge variant="default" className="bg-green-100 text-green-800"><Check className="h-3 w-3 mr-1" /> Accepted</Badge>
      case "DECLINED":
        return <Badge variant="outline" className="text-red-600"><X className="h-3 w-3 mr-1" /> Declined</Badge>
      case "REVOKED":
        return <Badge variant="outline" className="text-gray-600"><X className="h-3 w-3 mr-1" /> Revoked</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPermissionIcon = (permission: string) => {
    return permission === "WRITE" ? <Edit className="h-3 w-3" /> : <Eye className="h-3 w-3" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading invitations...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      <Tabs defaultValue="received" className="space-y-4">
        <TabsList>
          <TabsTrigger value="received">Received ({receivedInvitations.length})</TabsTrigger>
          <TabsTrigger value="sent">Sent ({sentInvitations.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="space-y-4">
          {receivedInvitations.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No recipe invitations received
              </CardContent>
            </Card>
          ) : (
            receivedInvitations.map((invitation) => (
              <Card key={invitation.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      {invitation.RecipeBook?.name || "Recipe Book"}
                    </CardTitle>
                    {getStatusBadge(invitation.status)}
                  </div>
                  <div className="flex flex-col gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      From: {invitation.InvitedBy?.name || invitation.InvitedBy?.email}
                    </div>
                    <div className="flex items-center gap-1">
                      {getPermissionIcon(invitation.permission)}
                      {invitation.permission === "WRITE" ? "Full Access" : "Read Only"}
                    </div>
                    {invitation.RecipeBook?.description && (
                      <p className="text-gray-500">{invitation.RecipeBook.description}</p>
                    )}
                  </div>
                </CardHeader>
                {invitation.status === "PENDING" && (
                  <CardContent>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleInvitationAction(invitation.id, "accept")}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                      <Button 
                        onClick={() => handleInvitationAction(invitation.id, "decline")}
                        variant="outline" 
                        size="sm"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-4">
          {sentInvitations.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No recipe invitations sent
              </CardContent>
            </Card>
          ) : (
            sentInvitations.map((invitation) => (
              <Card key={invitation.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      {invitation.RecipeBook?.name || "Recipe Book"}
                    </CardTitle>
                    {getStatusBadge(invitation.status)}
                  </div>
                  <div className="flex flex-col gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      To: {invitation.InvitedUser?.name || invitation.InvitedUser?.email || invitation.invitedUserEmail}
                    </div>
                    <div className="flex items-center gap-1">
                      {getPermissionIcon(invitation.permission)}
                      {invitation.permission === "WRITE" ? "Full Access" : "Read Only"}
                    </div>
                    {invitation.RecipeBook?.description && (
                      <p className="text-gray-500">{invitation.RecipeBook.description}</p>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    {invitation.status === "PENDING" && (
                      <Button 
                        onClick={() => handleInvitationAction(invitation.id, "revoke")}
                        variant="outline" 
                        size="sm"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Revoke
                      </Button>
                    )}
                    <Button 
                      onClick={() => deleteInvitation(invitation.id)}
                      variant="outline" 
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
