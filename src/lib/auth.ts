import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { supabaseAdmin } from "./supabase"
import type { JWT } from "next-auth/jwt"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const authOptions: any = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const { data: user, error } = await supabaseAdmin
          .from('User')
          .select('*')
          .eq('email', credentials.email)
          .single()

        if (error || !user) {
          return null
        }

        if (!user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      }
    })
  ],
  session: {
    strategy: "jwt" as const
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, user }: { token: JWT; user?: any }) {
      if (user) {
        return {
          ...token,
          id: user.id,
        }
      }
      return token
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: { session: any; token: JWT }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
        },
      }
    },
  },
}