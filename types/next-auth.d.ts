import { DefaultUser, DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface User extends DefaultUser {
    publicId: string;
    username?: string | null;
    avatar?: string | null;
    equippedProfileFrameId?: string | null;
  }

  interface Session extends DefaultSession {
    user: {
      publicId: string;
      username?: string | null;
      avatar?: string | null;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    publicId: string;
    avatar?: string | null;
  }
}
