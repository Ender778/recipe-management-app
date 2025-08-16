"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Mail, Share2, User, UserPlus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface InviteUserModalProps {
  isOpen: boolean
  onClose: () => void
  recipeId: string
  recipeTitle: string
}

type Permission = "READ" | "WRITE"

export function InviteUserModal({ isOpen, onClose, recipeId, recipeTitle }: InviteUserModalProps) {
  const [email, setEmail] = useState("")
  const [permission, setPermission] = useState<Permission>("READ")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          recipeId,
          invitedUserEmail: email.trim().toLowerCase(),
          permission
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send invitation")
      }

      toast({
        title: "Invitation Sent!",
        description: `${email} has been invited to access "${recipeTitle}" with ${permission.toLowerCase()} permissions.`
      })

      // Reset form and close modal
      setEmail("")
      setPermission("READ")
      onClose()

    } catch (error) {
      console.error("Error sending invitation:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send invitation",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setEmail("")
      setPermission("READ")
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite User
          </DialogTitle>
          <DialogDescription>
            Share &quot;{recipeTitle}&quot; with another user by sending them an invitation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="permission" className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Permission Level
            </Label>
            <Select value={permission} onValueChange={(value) => setPermission(value as Permission)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="READ">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Read Only</div>
                      <div className="text-xs text-gray-500">Can view the recipe</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="WRITE">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Full Access</div>
                      <div className="text-xs text-gray-500">Can view and edit the recipe</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
