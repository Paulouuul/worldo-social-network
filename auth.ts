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

async function generateUniqueUsername(email: string): Promise<string> {
  const baseName = email
    .split('@')[0]
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  const uuid = crypto.randomUUID().substring(0, 8);

  // Calcula o espaço disponível para o baseName
  // "user_" = 5 caracteres + "_" = 1 + uuid (8) = 14 caracteres fixos
  const FIXED_LENGTH = 5 + 1 + 8; // "user_" + "_" + uuid = 14
  const MAX_USERNAME_LENGTH = 30;
  const MAX_BASE_NAME_LENGTH = MAX_USERNAME_LENGTH - FIXED_LENGTH; // 30 - 14 = 16

  // Trunca o baseName se necessário
  let truncatedBase = baseName;
  if (truncatedBase.length > MAX_BASE_NAME_LENGTH) {
    truncatedBase = truncatedBase.substring(0, MAX_BASE_NAME_LENGTH);
  }

  let username = `user_${truncatedBase}_${uuid}`;

  // Fallback seguro: se ainda assim ultrapassar (caso raro), usa apenas user_uuid
  if (username.length > MAX_USERNAME_LENGTH) {
    username = `user_${uuid}`;
  }

  // Verifica duplicata (recursivo com limite para evitar loop infinito)
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

    // Gera novo UUID e tenta novamente
    const newUuid = crypto.randomUUID().substring(0, 8);
    username = `user_${truncatedBase}_${newUuid}`;
    if (username.length > MAX_USERNAME_LENGTH) {
      username = `user_${newUuid}`;
    }
    attempts++;
  }

  // Fallback final com timestamp
  const timestamp = Date.now().toString(36).substring(0, 6);
  username = `user_${timestamp}`;
  if (username.length > MAX_USERNAME_LENGTH) {
    username = `u_${timestamp}`;
  }

  return username;
}

const customAdapter = {
  async createUser(user: any) {
    const username = await generateUniqueUsername(user.email);

    const newUser = await prisma.users.create({
      data: {
        email: user.email,
        name: user.name,
        username,
        avatar: user.image || user.avatar, // Provedores OAuth usam .image por padrão
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
  async deleteUser(id: string) {
    await prisma.users.delete({ where: { id } });
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
      },
    });
  },
  async createVerificationToken(verificationToken: any) {
    return await prisma.verification_tokens.create({
      data: {
        identifier: verificationToken.identifier,
        token: verificationToken.token,
        expires: verificationToken.expires,
      },
    });
  },
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

const LEGACY_PROFILE_CLAIMS = [
  'name',
  'username',
  'avatar',
  'coverImage',
  'bio',
  'location',
  'website',
  'equippedFrame',
  'hasPassword',
  'isOAuth',
  'picture',
] as const;

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
    // A sessão guarda apenas identidade. Dados de perfil (nome, avatar, bio, moldura...)
    // vêm de /api/worldo/me via React Query (hook useMe), sem consultar o banco a cada auth().
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id as string;
        token.publicId = user.publicId;
        token.email = user.email ?? '';
        token.provider = account?.provider || 'credentials';
      }

      // Remove campos de perfil de tokens emitidos antes desta mudança
      for (const key of LEGACY_PROFILE_CLAIMS) delete (token as Record<string, unknown>)[key];

      return token;
    },

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
