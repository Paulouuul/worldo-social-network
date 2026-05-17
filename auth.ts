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

const pool = new Pool({
  connectionString: DATABASE_URL,
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })
const customAdapter = {
  async createUser(user: any) {
    const newUser = await prisma.users.create({
      data: {
        email: user.email,
        name: user.name,
        image: user.image,
        emailVerified: user.emailVerified,
      }
    })
    return {
      id: newUser.id,
      publicId: newUser.publicId,
      email: newUser.email,
      name: newUser.name,
      image: newUser.image,
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
      image: user.image,
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
      image: user.image,
      emailVerified: user.emailVerified,
    } : null
  },
  async getUserByAccount({ provider, providerAccountId }: any) {
    const account = await prisma.accounts.findFirst({
      where: { provider, providerAccountId },
      include: { users: true }
    })
    return account?.users ? {
      id: account.users.id,
      publicId: account.users.publicId,
      email: account.users.email,
      name: account.users.name,
      image: account.users.image,
      emailVerified: account.users.emailVerified,
    } : null
  },
  async updateUser(user: any) {
    const updated = await prisma.users.update({
      where: { id: user.id },
      data: {
        name: user.name,
        image: user.image,
        emailVerified: user.emailVerified,
      }
    })
    return {
      id: updated.id,
      publicId: updated.publicId,
      email: updated.email,
      name: updated.name,
      image: updated.image,
      emailVerified: updated.emailVerified,
    }
  },
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
          image: user.image,
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
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
      token.id = user.id
      token.publicId = user.publicId
      token.name = user.name
      token.email = user.email
      token.image = user.image
    }
    
    // Quando o perfil é atualizado (trigger = 'update')
    if (trigger === 'update' && session?.user) {
      if (session.user.name) token.name = session.user.name
      if (session.user.image) token.image = session.user.image
    }
    
    return token
  },
  async session({ session, token }) {
    if (session.user) {
      session.user.id = token.id as string
      session.user.publicId = token.publicId as string
      session.user.name = token.name as string
      session.user.email = token.email as string
      session.user.image = token.image as string
    }
    return session
  }
},
  secret: process.env.NEXTAUTH_SECRET,
})