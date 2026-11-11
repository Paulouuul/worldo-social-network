// app/api/auth/[...nextauth]/route.ts
// Rota /api/auth/* do NextAuth (login, logout, callbacks OAuth, sessão e CSRF).

import { handlers } from '@/auth';

/** Handlers GET e POST do NextAuth configurados em auth.ts. */
export const { GET, POST } = handlers;
