import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { promises as fs } from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'

interface User {
  id: string
  name: string
  email: string
  password: string
  createdAt: string
}

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json')

// Read users from file
async function readUsers(): Promise<User[]> {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    // If file doesn't exist, return empty array
    return []
  }
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Check demo user first
          if (credentials.email === 'demo@example.com' && credentials.password === 'demo123') {
            return {
              id: '1',
              email: 'demo@example.com',
              name: 'Demo User'
            }
          }

          // Check registered users
          const users = await readUsers()
          const user = users.find(u => u.email.toLowerCase() === credentials.email.toLowerCase())
          
          if (user && await bcrypt.compare(credentials.password, user.password)) {
            return {
              id: user.id,
              email: user.email,
              name: user.name
            }
          }
        } catch (error) {
          console.error('Auth error:', error)
        }

        return null
      }
    })
  ],
  pages: {
    signIn: '/',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
      }
      return session
    }
  }
})

export { handler as GET, handler as POST }
