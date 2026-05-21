import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { Resend } from 'resend'
import crypto from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, username } = body

    // 1. Validações Rápidas (Fail Fast)
    if (!email || !password || !username || !name) {
      return NextResponse.json(
        { success: false, error: 'Email, senha, nome e nome de usuário são obrigatórios' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: 'Email inválido' }, { status: 400 })
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { success: false, error: 'Username deve ter 3-30 caracteres e conter apenas letras, números e underline' },
        { status: 400 }
      )
    }

    if (name.length < 2 || name.length > 100) {
      return NextResponse.json({ success: false, error: 'Nome deve ter entre 2 e 100 caracteres' }, { status: 400 })
    }

    // Validação de Senha Forte
    const validatePassword = (pass: string) => {
      const errors = []
      if (pass.length < 6) errors.push('pelo menos 6 caracteres')
      if (pass.length > 50) errors.push('no máximo 50 caracteres')
      if (!/[A-Z]/.test(pass)) errors.push('pelo menos 1 letra maiúscula')
      if (!/[a-z]/.test(pass)) errors.push('pelo menos 1 letra minúscula')
      if (!/[0-9]/.test(pass)) errors.push('pelo menos 1 número')
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) errors.push('pelo menos 1 caractere especial')
      return errors
    }

    const passwordErrors = validatePassword(password)
    if (passwordErrors.length > 0) {
      return NextResponse.json(
        { success: false, error: `Senha fraca: ${passwordErrors.join(', ')}` },
        { status: 400 }
      )
    }

    // 2. Consulta Unificada (Evita múltiplas idas ao banco e reduz race conditions)
    const existingUser = await prisma.users.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() }
        ]
      }
    })

    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? 'Email' : 'Este username'
      return NextResponse.json(
        { success: false, error: `${field} já está em uso.` },
        { status: 400 }
      )
    }

    // Preparação dos dados para inserção
    const hashedPassword = await bcrypt.hash(password, 10)
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
    const userPublicId = crypto.randomUUID()

    // 3. Execução Atômica no Banco de Dados
    await prisma.$transaction(async (tx) => {
      await tx.users.create({
        data: {
          email: email.toLowerCase(), // Normalizar e-mail em lowercase ajuda no login posterior
          password: hashedPassword,
          name: name.trim(),
          username: username.toLowerCase().trim(), // Normalizar username evita duplicados por caixa alta/baixa
          publicId: userPublicId,
          emailVerified: null,
        }
      })

      await tx.verification_tokens.create({
        data: {
          identifier: email.toLowerCase(),
          token: verificationToken,
          expires: tokenExpires,
        }
      })
    })

    // 4. Envio do E-mail fora da transação do banco (Evita travar conexões)
    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${verificationToken}`

    try {
      await resend.emails.send({
        from: 'onboarding@resend.dev', // Lembre-se de alterar para seu domínio em produção
        to: email.toLowerCase(),
        subject: 'Verifique seu email - Marketplace Social',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Bem-vindo ao WORDO! 🎉</h1>
            <p>Olá <strong>${name || email.split('@')[0]}</strong>,</p>
            <p>Por favor, verifique seu email clicando no link abaixo:</p>
            <a href="${verificationLink}" 
               style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
              Verificar Email
            </a>
            <p>Ou copie o link abaixo no seu navegador:</p>
            <p style="background-color: #f3f4f6; padding: 10px; border-radius: 6px; word-break: break-all;">
              ${verificationLink}
            </p>
            <p>Este link expira em <strong>24 horas</strong>.</p>
            <hr style="margin: 20px 0;" />
            <p style="color: #666; font-size: 12px;">
              Se você não criou uma conta, ignore este email.
            </p>
          </div>
        `,
      })
    } catch (emailError) {
      console.error('Falha ao enviar e-mail de registro, efetuando rollback dos dados:', emailError)
      
      // Se o e-mail falhou, deletamos o usuário criado para que ele possa tentar novamente de imediato
      await prisma.$transaction([
        prisma.verification_tokens.deleteMany({ where: { token: verificationToken } }),
        prisma.users.delete({ where: { publicId: userPublicId } })
      ]).catch(console.error)

      return NextResponse.json(
        { success: false, error: 'Não foi possível enviar o e-mail de ativação. Tente novamente mais tarde.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Usuário criado! Verifique seu email para fazer login.',
    }, { status: 201 })

  } catch (error) {
    console.error('Erro no registro:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno ao criar usuário' },
      { status: 500 }
    )
  }
}