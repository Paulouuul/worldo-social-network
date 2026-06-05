import { DefaultUser } from 'next-auth';

declare module 'next-auth' {
  interface User {
    publicId: string;
    username?: string | null;
    avatar?: string | null;
    equippedProfileFrameId?: string | null;
  }

  interface Session {
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
