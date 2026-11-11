// auth.ts
// Configuração do NextAuth (Auth.js): provedores Google, GitHub e email/senha, adapter Prisma
// personalizado (gera username único) e sessão JWT que expõe apenas a identidade do usuário (id,
// publicId, email e provedor). Os dados de perfil vêm de /api/worldo/me.

import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL não configurada no .env');
}

const pool = new Pool({ connectionString: DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * Gera um username único a partir do email: user_<prefixo>_<8 hex> com no máximo 30 caracteres.
 *
 * Tenta até 5 sufixos aleatórios e, se todos existirem, usa user_<timestamp base36>.
 */
async function generateUniqueUsername(email: string): Promise<string> {
  const baseName = email
    .split('@')[0]
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  const uuid = crypto.randomUUID().substring(0, 8);

  // Espaço para o prefixo do email: 30 menos os 14 fixos de "user_" + "_" + 8 do uuid
  const FIXED_LENGTH = 5 + 1 + 8;
  const MAX_USERNAME_LENGTH = 30;
  const MAX_BASE_NAME_LENGTH = MAX_USERNAME_LENGTH - FIXED_LENGTH;

  let truncatedBase = baseName;
  if (truncatedBase.length > MAX_BASE_NAME_LENGTH) {
    truncatedBase = truncatedBase.substring(0, MAX_BASE_NAME_LENGTH);
  }

  let username = `user_${truncatedBase}_${uuid}`;

  // Se ainda passar do limite, usa apenas user_<uuid>
  if (username.length > MAX_USERNAME_LENGTH) {
    username = `user_${uuid}`;
  }

  // Até 5 tentativas com sufixos diferentes
  let attempts = 0;
  const MAX_ATTEMPTS = 5;

  while (attempts < MAX_ATTEMPTS) {
    const existing = await prisma.users.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!existing) {
      return username;
    }

    const newUuid = crypto.randomUUID().substring(0, 8);
    username = `user_${truncatedBase}_${newUuid}`;
    if (username.length > MAX_USERNAME_LENGTH) {
      username = `user_${newUuid}`;
    }
    attempts++;
  }

  // Último recurso: timestamp em base 36
  const timestamp = Date.now().toString(36).substring(0, 6);
  username = `user_${timestamp}`;
  if (username.length > MAX_USERNAME_LENGTH) {
    username = `u_${timestamp}`;
  }

  return username;
}

/** Adapter do NextAuth sobre o Prisma, mapeando a tabela users (com publicId e username). */
const customAdapter = {
  /** Cria o usuário vindo do OAuth com username gerado e a foto do provedor como avatar. */
  async createUser(user: any) {
    const username = await generateUniqueUsername(user.email);

    const newUser = await prisma.users.create({
      data: {
        email: user.email,
        name: user.name,
        username,
        avatar: user.image || user.avatar, // OAuth envia a foto em .image
        emailVerified: user.emailVerified,
      },
    });
    return {
      id: newUser.id,
      publicId: newUser.publicId,
      email: newUser.email,
      name: newUser.name,
      username: newUser.username,
      avatar: newUser.avatar,
      emailVerified: newUser.emailVerified,
    };
  },
  /** Busca o usuário pelo id. */
  async getUser(id: string) {
    const user = await prisma.users.findUnique({ where: { id } });
    return user
      ? {
          id: user.id,
          publicId: user.publicId,
          email: user.email,
          name: user.name,
          username: user.username,
          avatar: user.avatar,
          coverImage: user.coverImage,
          emailVerified: user.emailVerified,
        }
      : null;
  },
  /** Busca o usuário pelo email. */
  async getUserByEmail(email: string) {
    const user = await prisma.users.findUnique({ where: { email } });
    return user
      ? {
          id: user.id,
          publicId: user.publicId,
          email: user.email,
          name: user.name,
          username: user.username,
          avatar: user.avatar,
          coverImage: user.coverImage,
          emailVerified: user.emailVerified,
        }
      : null;
  },
  /** Busca o usuário vinculado à conta do provedor OAuth. */
  async getUserByAccount({ provider, providerAccountId }: any) {
    const account = await prisma.accounts.findFirst({
      where: { provider, providerAccountId },
      include: { users: true },
    });

    if (!account?.users) return null;

    return {
      id: account.users.id,
      publicId: account.users.publicId,
      email: account.users.email,
      name: account.users.name,
      username: account.users.username,
      avatar: account.users.avatar,
      coverImage: account.users.coverImage,
      emailVerified: account.users.emailVerified,
    };
  },
  /** Apaga o usuário. */
  async deleteUser(id: string) {
    await prisma.users.delete({ where: { id } });
  },
  /** Vincula uma conta OAuth (tokens do provedor) ao usuário. */
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
      },
    });
  },
  /** Grava um token de verificação. */
  async createVerificationToken(verificationToken: any) {
    return await prisma.verification_tokens.create({
      data: {
        identifier: verificationToken.identifier,
        token: verificationToken.token,
        expires: verificationToken.expires,
      },
    });
  },
  /** Consome (apaga e retorna) o token de verificação; null se não existir. */
  async useVerificationToken({ identifier, token }: any) {
    try {
      return await prisma.verification_tokens.delete({
        where: { identifier_token: { identifier, token } },
      });
    } catch (_err) {
      return null;
    }
  },
};

/** Instância do NextAuth: handlers da rota /api/auth, signIn, signOut e auth(). */
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
        password: { label: 'Senha', type: 'password' },
      },
      /**
       * Login por email e senha: exige usuário com senha, email verificado e senha correta
       * (bcrypt).
       */
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Credenciais inválidas');
        }

        const user = await prisma.users.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) {
          throw new Error('Usuário não encontrado');
        }

        if (!user.emailVerified) {
          throw new Error('Por favor, verifique seu email antes de fazer login');
        }

        const isValid = await bcrypt.compare(credentials.password as string, user.password);

        if (!isValid) {
          throw new Error('Senha inválida');
        }

        return {
          id: user.id,
          publicId: user.publicId,
          email: user.email,
          name: user.name,
          username: user.username,
        };
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  callbacks: {
    /**
     * Monta o JWT da sessão: no login grava id, publicId, email e provedor. Não consulta o
     * banco.
     */
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id as string;
        token.publicId = user.publicId;
        token.email = user.email ?? '';
        token.provider = account?.provider || 'credentials';
      }

      return token;
    },

    /** Expõe na sessão apenas id, publicId, email e provedor. */
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.publicId = token.publicId as string;
        session.user.email = token.email as string;
        session.user.provider = (token.provider as string) || 'credentials';
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
});
