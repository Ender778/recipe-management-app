"use client"

import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { ChatInterface } from "@/components/chat/chat-interface"
import { MessageCircle, Mail, BookOpen } from "lucide-react"
import Link from "next/link"

export function Navbar() {
  const { data: session } = useSession()

  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Recipe Manager
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {session ? (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/recipes">
                    <BookOpen className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Recipes</span>
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/invitations">
                    <Mail className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Invitations</span>
                  </Link>
                </Button>
                <div className="hidden md:block">
                  <ChatInterface
                    trigger={
                      <Button variant="outline" size="sm">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        AI Assistant
                      </Button>
                    }
                  />
                </div>
                <span className="text-sm text-gray-700">
                  Welcome, {session.user?.name || session.user?.email}
                </span>
                <Button
                  variant="outline"
                  onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <div className="space-x-2">
                <Button variant="ghost" asChild>
                  <Link href="/auth/signin">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}