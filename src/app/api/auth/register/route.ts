import { NextRequest, NextResponse } from 'next/server'
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

// Ensure data directory exists
async function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), 'data')
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

// Read users from file
async function readUsers(): Promise<User[]> {
  try {
    await ensureDataDirectory()
    const data = await fs.readFile(USERS_FILE, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    // If file doesn't exist, return empty array
    return []
  }
}

// Write users to file
async function writeUsers(users: User[]) {
  await ensureDataDirectory()
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2))
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Read existing users
    const users = await readUsers()

    // Check if user already exists
    const existingUser = users.find(user => user.email.toLowerCase() === email.toLowerCase())
    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create new user
    const newUser: User = {
      id: Date.now().toString(),
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date().toISOString()
    }

    // Add user to list and save
    users.push(newUser)
    await writeUsers(users)

    console.log(`New user registered: ${email}`)

    return NextResponse.json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        createdAt: newUser.createdAt
      }
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
