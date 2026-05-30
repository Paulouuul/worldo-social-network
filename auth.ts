import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL não configurada no .env')
}

const pool = new Pool({ connectionString: DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function generateUniqueUsername(email: string): Promise<string> {
  const baseName = email.split('@')[0]
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
  
  const uuid = crypto.randomUUID().substring(0, 8)
  let username = `user_${baseName}_${uuid}`
  
  if (username.length > 30) {
    username = `user_${uuid}`
  }
  
  const existing = await prisma.users.findUnique({
    where: { username },
    select: { id: true }
  })
  
  if (existing) {
    return generateUniqueUsername(email)
  }
  
  return username
}

const customAdapter = {
  async createUser(user: any) {
    const username = await generateUniqueUsername(user.email)
    
    const newUser = await prisma.users.create({
      data: {
        email: user.email,
        name: user.name,
        username,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
      }
    })
    return {
      id: newUser.id,
      publicId: newUser.publicId,
      email: newUser.email,
      name: newUser.name,
      username: newUser.username,
      avatar: newUser.avatar,
      emailVerified: newUser.emailVerified,
    }
  },
  async getUser(id: string) {
    const user = await prisma.users.findUnique({ where: { id } })
    return user ? {
      id: user.id,
      publicId: user.publicId,
      email: user.email,
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      coverImage: user.coverImage,
      emailVerified: user.emailVerified,
    } : null
  },
  async getUserByEmail(email: string) {
    const user = await prisma.users.findUnique({ where: { email } })
    return user ? {
      id: user.id,
      publicId: user.publicId,
      email: user.email,
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      coverImage: user.coverImage,
      emailVerified: user.emailVerified,
    } : null
  },
  async getUserByAccount({ provider, providerAccountId }: any) {
    const account = await prisma.accounts.findFirst({
      where: { provider, providerAccountId },
      include: { users: true }
    })

    if (!account?.users) return null
    
    return {
      id: account.users.id,
      publicId: account.users.publicId,
      email: account.users.email,
      name: account.users.name,
      username: account.users.username,
      avatar: account.users.avatar,
      coverImage: account.users.coverImage,
      emailVerified: account.users.emailVerified,
    }
  },
  // async updateUser(user: any) {
  //   const updated = await prisma.users.update({
  //     where: { id: user.id },
  //     data: {
  //       name: user.name,
  //       avatar: user.avatar,
  //       emailVerified: user.emailVerified,
  //     }
  //   })
  //   return {
  //     id: updated.id,
  //     publicId: updated.publicId,
  //     email: updated.email,
  //     name: updated.name,
  //     avatar: updated.avatar,
  //     emailVerified: updated.emailVerified,
  //   }
  // },
  async deleteUser(id: string) {
    await prisma.users.delete({ where: { id } })
  },
  async linkAccount(account: any) {
    await prisma.accounts.create({
      data: {
        userId: account.userId,
        type: account.type,
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        refresh_token: account.refresh_token,
        access_token: account.access_token,
        expires_at: account.expires_at,
        token_type: account.token_type,
        scope: account.scope,
        id_token: account.id_token,
        session_state: account.session_state,
      }
    })
  },
  async createVerificationToken(verificationToken: any) {
    return await prisma.verification_tokens.create({
      data: {
        identifier: verificationToken.identifier,
        token: verificationToken.token,
        expires: verificationToken.expires,
      }
    })
  },
  async useVerificationToken({ identifier, token }: any) {
    try {
      return await prisma.verification_tokens.delete({
        where: { identifier_token: { identifier, token } }
      })
    } catch (error) {
      return null
    }
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: customAdapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: { params: { scope: 'read:user user:email' } },
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Credenciais inválidas')
        }

        const user = await prisma.users.findUnique({
          where: { email: credentials.email as string }
        })

        if (!user || !user.password) {
          throw new Error('Usuário não encontrado')
        }

        if (!user.emailVerified) {
          throw new Error('Por favor, verifique seu email antes de fazer login')
        }

        const isValid = await bcrypt.compare(credentials.password as string, user.password)

        if (!isValid) {
          throw new Error('Senha inválida')
        }

        return {
          id: user.id,
          publicId: user.publicId,
          email: user.email,
          name: user.name,
          username: user.username,
          avatar: user.avatar,
          equippedProfileFrameId: user.equippedProfileFrameId,
          // Otimização: Passamos para o passo JWT saber que viemos de credenciais válidas
          hasPassword: true,
          isOAuth: false,
          provider: 'credentials'
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async signIn({ user, account, profile }) {
     return true
    },

    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        const dbUser = await prisma.users.findUnique({
          where: { id: user.id },
          include: { equippedFrame: true, accounts: true }
        })

        token.id = user.id
        token.publicId = user.publicId
        token.name = dbUser?.name || user.name  
        token.username = dbUser?.username || user.username  
        token.email = dbUser?.email || user.email  
        token.avatar = dbUser?.avatar || user.avatar  
        token.coverImage = dbUser?.coverImage  
        token.equippedFrame = dbUser?.equippedFrame
        token.bio = dbUser?.bio || ''
        token.location = dbUser?.location || ''
        token.website = dbUser?.website || ''


        // CORREÇÃO: Define com precisão o provedor usado NESTE login atual
        if (account) {
          token.provider = account.provider
          token.isOAuth = account.provider !== 'credentials'
          token.hasPassword = dbUser ? !!dbUser.password : !!(user.hasPassword)
        } else if (dbUser) {
          // Fallback de segurança baseado no estado do banco
          token.hasPassword = !!dbUser.password
          token.isOAuth = dbUser.accounts.length > 0
          token.provider = dbUser.accounts[0]?.provider || null
        }
      }

      if (trigger === 'update' && session?.user) {
        if (session.user.name) token.name = session.user.name
        if (session.user.avatar) token.avatar = session.user.avatar
        if (session.user.coverImage) token.coverImage = session.user.coverImage
        if (session.user.equippedFrame) token.equippedFrame = session.user.equippedFrame
        if (session.user.email) token.email = session.user.email

        if (session.user.username) token.username = session.user.username
        if (session.user.bio) token.bio = session.user.bio
        if (session.user.location) token.location = session.user.location
        if (session.user.website) token.website = session.user.website
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.publicId = token.publicId as string
        session.user.name = token.name as string
        session.user.username = token.username as string
        session.user.email = token.email as string
        session.user.avatar = token.avatar as string
        session.user.coverImage = token.coverImage as string
        session.user.equippedFrame = token.equippedFrame
        session.user.isOAuth = token.isOAuth
        session.user.hasPassword = token.hasPassword
        session.user.provider = token.provider
        session.user.bio = token.bio as string || ''
        session.user.location = token.location as string || ''
        session.user.website = token.website as string || ''
      }
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
})