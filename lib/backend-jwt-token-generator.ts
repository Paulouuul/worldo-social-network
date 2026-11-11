// lib/backend-jwt-token-generator.ts
// Geração do JWT enviado ao backend Python, assinado com BACKEND_JWT_SECRET a partir da sessão do
// NextAuth.

import { SignJWT } from 'jose';
import { Session } from 'next-auth';

const JWT_SECRET = process.env.BACKEND_JWT_SECRET;
const JWT_ALGORITHM = process.env.BACKEND_JWT_ALGORITHM || 'HS256';
const TOKEN_EXPIRATION = process.env.BACKEND_TOKEN_EXPIRATION || '15m';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET não configurada no ambiente');
}

/**
 * Claims do token. O backend Python depende de id, publicId e email; nome e username usam o
 * prefixo do email em app/auth/dependencies.py.
 */
export interface BackendTokenPayload {
  id: string;
  publicId: string;
  email: string;
  provider: string;
}

/** Extrai as claims da sessão. Lança erro se faltar id ou email. */
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
 * Gera o JWT do backend (sub = id do usuário) com validade BACKEND_TOKEN_EXPIRATION (padrão
 * 15m).
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
