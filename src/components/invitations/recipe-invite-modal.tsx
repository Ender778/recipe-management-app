"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface RecipeInviteModalProps {
  isOpen: boolean
  onClose: () => void
}

export function RecipeInviteModal({ isOpen, onClose }: RecipeInviteModalProps) {
  const [email, setEmail] = useState("")
  const [permission, setPermission] = useState<"READ" | "WRITE">("READ")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invitedUserEmail: email.trim(),
          permission: permission.toUpperCase()
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: `Recipe book invitation sent to ${email}`,
        })
        
        // Reset form and close modal
        setEmail("")
        setPermission("READ")
        onClose()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to send invitation",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error sending invitation:', error)
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite User to Recipe Book</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter user's email address"
              required
            />
            <p className="text-sm text-gray-500">
              This user will be invited to your recipe book and will see all your recipes.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="permission">Permission Level</Label>
            <Select value={permission} onValueChange={(value: "READ" | "WRITE") => setPermission(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="READ">Read Only - Can view all recipes</SelectItem>
                <SelectItem value="WRITE">Read & Write - Can view and edit all recipes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !email.trim()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Invitation
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
