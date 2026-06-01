// worldo-social-network/app/api/auth/token/route.ts
import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    // 🔥 Usar raw: true para obter o JWT bruto
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET,
      raw: true  // ← Isso retorna o JWT real
    })
    
    if (!token) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    
    // Token é o JWT
    return NextResponse.json({ token })
  } catch (error) {
    console.error('Erro ao obter token:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}