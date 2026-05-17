import { DefaultUser } from 'next-auth'

declare module 'next-auth' {
  interface User {
    publicId: string  // ← Adiciona publicId ao tipo User
  }
  
  interface Session {
    user: {
      publicId: string  // ← Adiciona publicId ao tipo Session
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    publicId: string  // ← Adiciona publicId ao tipo JWT
  }
}