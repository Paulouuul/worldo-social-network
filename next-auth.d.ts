import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT as DefaultJWT } from 'next-auth/jwt';
import { Rarity } from '@/constants/cosmeticRarity';

// Interface para o Frame equipado
interface EquippedFrame {
  id: string;
  name: string;
  imageUrl: string;
  rarity: Rarity;
}

declare module 'next-auth' {
  /**
   * Estende o objeto `user` retornado no callback `session` e no `authorize`
   */
  interface User extends DefaultUser {
    id: string;
    publicId: string;
    username: string;
    name: string;
    avatar?: string | null;
    coverImage?: string | null;
    bio?: string | null;
    location?: string | null;
    website?: string | null;
    equippedFrame?: EquippedFrame | null;
    hasPassword?: boolean;
    isOAuth?: boolean;
    provider?: string | null;
  }

  /**
   * Estende o objeto `session` retornado pelo hook `useSession`, `auth()`, etc.
   */
  interface Session {
    user: {
      id: string;
      publicId: string;
      username: string;
      name: string;
      avatar?: string | null;
      coverImage?: string | null;
      bio?: string | null;
      location?: string | null;
      website?: string | null;
      equippedFrame?: EquippedFrame | null;
      isOAuth: boolean;
      hasPassword: boolean;
      provider: string | null;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  /**
   * Estende o objeto `token` compartilhado entre os callbacks `jwt` e `session`
   */
  interface JWT extends DefaultJWT {
    id: string;
    publicId: string;
    username: string;
    name: string;
    avatar?: string | null;
    coverImage?: string | null;
    bio?: string | null;
    location?: string | null;
    website?: string | null;
    equippedFrame?: EquippedFrame | null;
    isOAuth: boolean;
    hasPassword: boolean;
    provider: string | null;
  }
}
