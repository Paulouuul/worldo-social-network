// lib/realtime-python-token-generator.ts
import { SignJWT } from 'jose';
import { Session } from 'next-auth';

// Configurações
const JWT_SECRET = process.env.REALTIME_JWT_SECRET;
const JWT_ALGORITHM = process.env.REALTIME_JWT_ALGORITHM || 'HS256';
const TOKEN_EXPIRATION = process.env.REALTIME_TOKEN_EXPIRATION || '15m';

// Validação da secret
if (!JWT_SECRET) {
  throw new Error('REALTIME_JWT_SECRET não configurada no ambiente');
}

// Interface para os dados do token
export interface PythonTokenPayload {
  id: string;
  publicId: string;
  email: string;
  name: string;
  username: string;
  avatar?: string | null;
  coverImage?: string | null;
  bio?: string;
  location?: string;
  website?: string;
  provider?: string;
  isOAuth: boolean;
  hasPassword: boolean;
  equippedFrame?: any;
}

/**
 * Extrai os dados do usuário da sessão do NextAuth
 * @param session - Sessão completa do NextAuth
 * @returns Dados formatados para o token Python
 */
function extractUserFromSession(session: Session): PythonTokenPayload {
  if (!session?.user) {
    throw new Error('Sessão não contém dados de usuário');
  }

  const user = session.user;

  if (!user.id || !user.email || !user.name || !user.username) {
    throw new Error('Sessão não contém todos os campos obrigatórios do usuário');
  }

  return {
    id: user.id as string,
    publicId: user.publicId as string,
    name: user.name as string,
    username: user.username as string,
    email: user.email as string,
    avatar: user.avatar as string,
    coverImage: user.coverImage as string,
    bio: (user.bio as string) || '',
    location: (user.location as string) || '',
    website: (user.website as string) || '',
    equippedFrame: user.equippedFrame as any,
    provider: (user.provider as string) || 'credentials',
    isOAuth: (user.isOAuth as boolean) ?? false,
    hasPassword: (user.hasPassword as boolean) ?? true,
  };
}

/**
 * Gera um token JWT para comunicação com o backend Python a partir da sessão completa
 * @param session - Sessão completa do NextAuth (retornada por auth())
 * @returns Token JWT assinado
 */
export async function generatePythonTokenFromSession(session: Session): Promise<string> {
  if (!session?.user) {
    throw new Error('Sessão inválida ou usuário não autenticado');
  }

  const userData = extractUserFromSession(session);

  const secretBuffer = new TextEncoder().encode(JWT_SECRET);

  const token = await new SignJWT({
    // Dados obrigatórios
    id: userData.id,
    publicId: userData.publicId,
    email: userData.email,
    name: userData.name,
    username: userData.username,

    // Dados opcionais
    avatar: userData.avatar || null,
    coverImage: userData.coverImage || null,
    bio: userData.bio || '',
    location: userData.location || '',
    website: userData.website || '',
    equippedFrame: userData.equippedFrame || null,
    provider: userData.provider || 'credentials',
    isOAuth: userData.isOAuth ?? false,
    hasPassword: userData.hasPassword ?? true,
  })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRATION)
    .setSubject(userData.id)
    .sign(secretBuffer);

  return token;
}

/**
 * Versão alternativa que aceita session ou user data (flexível)
 * @param sessionOrUser - Sessão completa OU dados do usuário diretamente
 * @returns Token JWT assinado
 */
export async function generatePythonToken(
  sessionOrUser: Session | PythonTokenPayload,
): Promise<string> {
  let userData: PythonTokenPayload;

  // Verifica se é uma sessão do NextAuth (tem a propriedade 'user')
  if ('user' in sessionOrUser && sessionOrUser.user) {
    userData = extractUserFromSession(sessionOrUser as Session);
  } else {
    // Assume que é o payload direto
    userData = sessionOrUser as PythonTokenPayload;
  }

  const secretBuffer = new TextEncoder().encode(JWT_SECRET);

  const token = await new SignJWT({
    id: userData.id,
    publicId: userData.publicId,
    email: userData.email,
    name: userData.name,
    username: userData.username,
    avatar: userData.avatar || null,
    coverImage: userData.coverImage || null,
    bio: userData.bio || '',
    location: userData.location || '',
    website: userData.website || '',
    provider: userData.provider || 'credentials',
    isOAuth: userData.isOAuth ?? false,
    hasPassword: userData.hasPassword ?? true,
    equippedFrame: userData.equippedFrame || null,
  })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRATION)
    .setSubject(userData.id)
    .sign(secretBuffer);

  return token;
}

/**
 * Decodifica e valida um token Python (útil para debug)
 */
export async function verifyPythonToken(token: string): Promise<PythonTokenPayload | null> {
  try {
    const { payload } = await import('jose').then((jose) =>
      jose.jwtVerify(token, new TextEncoder().encode(JWT_SECRET)),
    );
    return payload as unknown as PythonTokenPayload;
  } catch (error) {
    console.error('Erro ao validar token Python:', error);
    return null;
  }
}
