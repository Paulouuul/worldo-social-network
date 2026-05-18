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

    // Validar campos obrigatórios
    if (!email || !password || !username || !name) {
      return NextResponse.json(
        { success: false, error: 'Email, senha, nome e nome de usuário são obrigatórios' },
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

    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { success: false, error: 'Username deve ter 3-30 caracteres e conter apenas letras, números e underline' },
        { status: 400 }
      )
    }


  const validatePassword = (pass: string) => {
    const errors = []
    
    if (pass.length < 6) {
      errors.push('pelo menos 6 caracteres')
    }
    if (pass.length > 50) {
      errors.push('no máximo 50 caracteres')
    }
    if (!/[A-Z]/.test(pass)) {
      errors.push('pelo menos 1 letra maiúscula')
    }
    if (!/[a-z]/.test(pass)) {
      errors.push('pelo menos 1 letra minúscula')
    }
    if (!/[0-9]/.test(pass)) {
      errors.push('pelo menos 1 número')
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) {
      errors.push('pelo menos 1 caractere especial (!@#$%^&* etc)')
    }
    
    return errors
  }

  var errors_password = validatePassword(password);
    // Validar tamanho da senha
    if (errors_password.length > 0) {
      return NextResponse.json(
        { success: false, error: `Senha fraca: ${errors_password.join(', ')}`},
        { status: 400 }
      )
    }

    if (name && (name.length < 2 || name.length > 100)) {
      return NextResponse.json(
        { success: false, error: 'Nome deve ter entre 2 e 100 caracteres' },
        { status: 400 }
      )
    }

    // Verificar se usuário já existe
    const existingUserEmail = await prisma.users.findUnique({
      where: { email }
    })

    if (existingUserEmail) {
      return NextResponse.json(
        { success: false, error: 'Usuário já existe com este email' },
        { status: 400 }
      )
    }

    const existingUsername = await prisma.users.findUnique({
      where: { username }
    })

    if (existingUsername) {
      return NextResponse.json(
        { success: false, error: 'Este username já está em uso' },
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
        name: name,
        username: username,
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