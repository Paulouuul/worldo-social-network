import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { Resend } from 'resend'
import crypto from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    // Validar campos obrigatórios
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Email inválido' },
        { status: 400 }
      )
    }

    // Validar tamanho da senha
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Verificar se usuário já existe
    const existingUser = await prisma.users.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Usuário já existe com este email' },
        { status: 400 }
      )
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10)

    // Gerar token de verificação
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas

    // Criar usuário no banco
    const user = await prisma.users.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email.split('@')[0],
        publicId: crypto.randomUUID(),
        emailVerified: null, // Inicialmente não verificado
      }
    })

    // Criar token de verificação no banco
    await prisma.verification_tokens.create({
      data: {
        identifier: email,
        token: verificationToken,
        expires: tokenExpires,
      }
    })

    // Construir link de verificação
    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${verificationToken}`

    // Enviar email de verificação
    await resend.emails.send({
      from: 'onboarding@resend.dev', // Use seu domínio depois
      to: email,
      subject: 'Verifique seu email - Marketplace Social',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Bem-vindo ao Marketplace Social! 🎉</h1>
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