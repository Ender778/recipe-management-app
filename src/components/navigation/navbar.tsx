"use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { ChatInterface } from "@/components/chat/chat-interface"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { MessageCircle, Mail, BookOpen, Tag, Menu } from "lucide-react"
import Link from "next/link"

export function Navbar() {
  const { data: session } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Recipe Manager
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-4">
            {session ? (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/recipes">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Recipes
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/tags">
                    <Tag className="h-4 w-4 mr-2" />
                    Tags
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/invitations">
                    <Mail className="h-4 w-4 mr-2" />
                    Invitations
                  </Link>
                </Button>
                <ChatInterface
                  trigger={
                    <Button variant="outline" size="sm">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      AI Assistant
                    </Button>
                  }
                />
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

          {/* Mobile Navigation */}
          <div className="lg:hidden flex items-center space-x-2">
            {session ? (
              <>
                <span className="text-sm text-gray-700 truncate max-w-[120px]">
                  {session.user?.name || session.user?.email}
                </span>
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Menu className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="gap-2">
                    <SheetHeader className="border-b">
                      <SheetTitle>Recipe Book</SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col space-y-4">
                      <Button variant="ghost" asChild className="justify-start" onClick={() => setMobileMenuOpen(false)}>
                        <Link href="/recipes">
                          <BookOpen className="h-4 w-4 mr-3" />
                          Recipes
                        </Link>
                      </Button>
                      <Button variant="ghost" asChild className="justify-start" onClick={() => setMobileMenuOpen(false)}>
                        <Link href="/tags">
                          <Tag className="h-4 w-4 mr-3" />
                          Tags
                        </Link>
                      </Button>
                      <Button variant="ghost" asChild className="justify-start" onClick={() => setMobileMenuOpen(false)}>
                        <Link href="/invitations">
                          <Mail className="h-4 w-4 mr-3" />
                          Invitations
                        </Link>
                      </Button>
                      <div className="pt-6 border-t px-4">
                        <ChatInterface
                          trigger={
                            <Button variant="outline" className="w-full justify-start">
                              <MessageCircle className="h-4 w-4 mr-3" />
                              AI Assistant
                            </Button>
                          }
                        />
                      </div>
                      <div className="px-4">
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => {
                            setMobileMenuOpen(false)
                            signOut({ callbackUrl: "/auth/signin" })
                          }}
                        >
                          Sign Out
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </>
            ) : (
              <div className="space-x-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/auth/signin">Sign In</Link>
                </Button>
                <Button size="sm" asChild>
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