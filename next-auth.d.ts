import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT as DefaultJWT } from 'next-auth/jwt';

// A sessão guarda apenas identidade. Dados de perfil vêm de useMe() (/api/worldo/me).

declare module 'next-auth' {
  /**
   * Usuário retornado pelo adapter e pelo `authorize`
   */
  interface User extends DefaultUser {
    id: string;
    publicId: string;
    username: string;
    name: string;
    avatar?: string | null;
    coverImage?: string | null;
  }

  /**
   * Objeto `session` retornado por `useSession`, `auth()`, etc.
   */
  interface Session {
    user: {
      id: string;
      publicId: string;
      email: string;
      provider: string;
    } & Omit<DefaultSession['user'], 'name' | 'image'>;
  }
}

declare module 'next-auth/jwt' {
  /**
   * Token compartilhado entre os callbacks `jwt` e `session`
   */
  interface JWT extends DefaultJWT {
    id: string;
    publicId: string;
    email: string;
    provider: string;
  }
}
