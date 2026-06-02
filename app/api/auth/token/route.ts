// worldo-social-network/app/api/auth/token/route.ts
import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { generatePythonToken } from "@/lib/realtime-python-token-generator";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    // 2. Gera o token JWT para o Python
    const pythonToken = await generatePythonToken(session);
    
    // Token é o JWT
    return NextResponse.json({ pythonToken })
  } catch (error) {
    console.error('Erro ao obter token:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}