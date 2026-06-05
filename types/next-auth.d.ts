import { DefaultUser, DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface User extends DefaultUser {
    publicId: string;
    username: string;
    avatar?: string | null;
    coverImage?: string | null;
    bio?: string | null;
    location?: string | null;
    website?: string | null;
    equippedFrame?: any;
    hasPassword?: boolean;
    isOAuth?: boolean;
    provider?: string;
  }

  interface Session extends DefaultSession {
    user: {
      id: string;
      publicId: string;
      username: string;
      avatar?: string | null;
      coverImage?: string | null;
      bio?: string | null;
      location?: string | null;
      website?: string | null;
      equippedFrame?: any;
      provider?: string;
      isOAuth?: boolean;
      hasPassword?: boolean;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    publicId: string;
    name: string;
    username: string;
    email: string;
    avatar?: string | null;
    coverImage?: string | null;
    bio?: string;
    location?: string;
    website?: string;
    equippedFrame?: any;
    hasPassword?: boolean;
    isOAuth?: boolean;
    provider?: string;
  }
}
