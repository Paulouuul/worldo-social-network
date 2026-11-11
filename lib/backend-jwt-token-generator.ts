// lib/backend-jwt-token-generator.ts
import { SignJWT } from 'jose';
import { Session } from 'next-auth';

// Configurações
const JWT_SECRET = process.env.BACKEND_JWT_SECRET;
const JWT_ALGORITHM = process.env.BACKEND_JWT_ALGORITHM || 'HS256';
const TOKEN_EXPIRATION = process.env.BACKEND_TOKEN_EXPIRATION || '15m';

// Validação da secret
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET não configurada no ambiente');
}

// Dados do token. O backend Python só depende de id/publicId/email
// (nome e username caem no prefixo do email em app/auth/dependencies.py).
export interface BackendTokenPayload {
  id: string;
  publicId: string;
  email: string;
  provider: string;
}

function extractUserFromSession(session: Session): BackendTokenPayload {
  const user = session?.user;

  if (!user?.id || !user.email) {
    throw new Error('Sessão não contém todos os campos obrigatórios do usuário');
  }

  return {
    id: user.id,
    publicId: user.publicId,
    email: user.email,
    provider: user.provider || 'credentials',
  };
}

/**
 * Gera um token JWT para comunicação com o backend a partir da sessão do NextAuth
 * @param session - Sessão retornada por auth()
 * @returns Token JWT assinado
 */
export async function generateJwtToken(session: Session): Promise<string> {
  const userData = extractUserFromSession(session);

  return new SignJWT({ ...userData })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRATION)
    .setSubject(userData.id)
    .sign(new TextEncoder().encode(JWT_SECRET));
}
