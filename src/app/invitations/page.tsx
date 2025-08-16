"use client"

import { useState } from "react"
import { Navbar } from "@/components/navigation/navbar"
import { InvitationsList } from "@/components/invitations/invitations-list"
import { RecipeInviteModal } from "@/components/invitations/recipe-invite-modal"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"

export default function InvitationsPage() {
  const [showInviteModal, setShowInviteModal] = useState(false)

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Recipe Invitations</h1>
              <p className="text-gray-600">Manage recipe sharing invitations</p>
            </div>
            <Button onClick={() => setShowInviteModal(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite User
            </Button>
          </div>
          
          <InvitationsList />
          
          <RecipeInviteModal 
            isOpen={showInviteModal} 
            onClose={() => setShowInviteModal(false)} 
          />
        </div>
      </div>
    </>
  )
}
