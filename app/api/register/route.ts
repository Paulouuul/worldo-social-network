import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';
import crypto from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);
const resend_email = process.env.RESEND_EMAIL;

// CONSTANTES DE VALIDAÇÃO
const MAX_NAME_LENGTH = 50;
const MIN_NAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 30;
const MIN_USERNAME_LENGTH = 3;
const MIN_PASSWORD_LENGTH = 6;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, username } = body;

    // 1. Validações Rápidas (Fail Fast)
    if (!email || !password || !username || !name) {
      return NextResponse.json(
        { success: false, error: 'Email, senha, nome e nome de usuário são obrigatórios' },
        { status: 400 },
      );
    }

    // ==========================================
    // 2. FORMATAÇÃO E SANITIZAÇÃO
    // ==========================================
    
    const formattedEmail = email.trim().toLowerCase();
    
    // Remove espaços no início/fim, força minúsculo, e destrói qualquer caractere que não seja a-z, 0-9 ou underline
    const formattedUsername = username
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '');
      
    // Remove espaços nas pontas e substitui espaços duplos/múltiplos no meio por um único espaço
    const formattedName = name
      .trim()
      .replace(/\s+/g, ' ');


    // ==========================================
    // 3. VALIDAÇÕES ESTRITAS
    // ==========================================

    // VALIDAÇÃO DE EMAIL
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formattedEmail)) {
      return NextResponse.json({ success: false, error: 'Email inválido' }, { status: 400 });
    }

    // VALIDAÇÃO DE USERNAME (Após formatação)
    if (
      formattedUsername.length < MIN_USERNAME_LENGTH || 
      formattedUsername.length > MAX_USERNAME_LENGTH
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `Username deve ter ${MIN_USERNAME_LENGTH}-${MAX_USERNAME_LENGTH} caracteres válidos (letras, números, underline).`,
        },
        { status: 400 },
      );
    }

    // VALIDAÇÃO DE NOME (Após formatação)
    if (formattedName.length < MIN_NAME_LENGTH) {
      return NextResponse.json(
        { success: false, error: `Nome deve ter pelo menos ${MIN_NAME_LENGTH} caracteres` },
        { status: 400 },
      );
    }
    if (formattedName.length > MAX_NAME_LENGTH) {
      return NextResponse.json(
        { success: false, error: `Nome deve ter no máximo ${MAX_NAME_LENGTH} caracteres` },
        { status: 400 },
      );
    }

    // VALIDAÇÃO DE SENHA
    const validatePassword = (pass: string) => {
      const errors = [];
      if (pass.length < MIN_PASSWORD_LENGTH) {
        errors.push(`pelo menos ${MIN_PASSWORD_LENGTH} caracteres`);
      }
      if (!/[A-Z]/.test(pass)) errors.push('pelo menos 1 letra maiúscula');
      if (!/[a-z]/.test(pass)) errors.push('pelo menos 1 letra minúscula');
      if (!/[0-9]/.test(pass)) errors.push('pelo menos 1 número');
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) {
        errors.push('pelo menos 1 caractere especial (!@#$%^&*)');
      }
      return errors;
    };

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      return NextResponse.json(
        { success: false, error: `Senha fraca: ${passwordErrors.join(', ')}` },
        { status: 400 },
      );
    }

    // ==========================================
    // 4. CONSULTA UNIFICADA (Evita Race Conditions)
    // ==========================================
    const existingUser = await prisma.users.findFirst({
      where: {
        OR: [{ email: formattedEmail }, { username: formattedUsername }],
      },
    });

    if (existingUser) {
      const field = existingUser.email === formattedEmail ? 'Email' : 'Este username';
      return NextResponse.json(
        { success: false, error: `${field} já está em uso.` },
        { status: 400 },
      );
    }

    // Preparação dos dados para inserção
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    const userPublicId = crypto.randomUUID();

    // ==========================================
    // 5. EXECUÇÃO ATÔMICA NO BANCO (Transaction)
    // ==========================================
    await prisma.$transaction(async (tx) => {
      await tx.users.create({
        data: {
          email: formattedEmail,
          password: hashedPassword,
          name: formattedName,
          username: formattedUsername,
          publicId: userPublicId,
          emailVerified: null,
        },
      });

      await tx.verification_tokens.create({
        data: {
          identifier: formattedEmail,
          token: verificationToken,
          expires: tokenExpires,
        },
      });
    });

    // ==========================================
    // 6. ENVIO DO E-MAIL DE VERIFICAÇÃO
    // ==========================================
    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${verificationToken}`;

    try {
      await resend.emails.send({
        from: `${resend_email}`,
        to: formattedEmail,
        subject: 'Verifique seu email - Worldo',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Bem-vindo ao WORDO! 🎉</h1>
            <p>Olá <strong>${formattedName || formattedEmail.split('@')[0]}</strong>,</p>
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
      });
    } catch (emailError) {
      console.error(
        'Falha ao enviar e-mail de registro, efetuando rollback dos dados:',
        emailError,
      );

      // Se o e-mail falhou, deletamos o usuário criado para que ele possa tentar novamente de imediato
      await prisma
        .$transaction([
          prisma.verification_tokens.deleteMany({ where: { token: verificationToken } }),
          prisma.users.delete({ where: { publicId: userPublicId } }),
        ])
        .catch(console.error);

      return NextResponse.json(
        {
          success: false,
          error: 'Não foi possível enviar o e-mail de ativação. Tente novamente mais tarde.',
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Usuário criado! Verifique seu email para fazer login.',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Erro no registro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao criar usuário' },
      { status: 500 },
    );
  }
}