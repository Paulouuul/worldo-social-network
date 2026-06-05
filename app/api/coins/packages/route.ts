import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// Configura o Next.js para fazer o cache desta rota por até 1 hora (3600 segundos)
// Sempre que você mudar um pacote no banco, o painel atualizará em até 1 hora,
// ou você pode forçar a limpeza do cache sob demanda usando revalidatePath()
export const revalidate = 3600;

export async function GET() {
  try {
    const packages = await prisma.coin_package.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    // Adiciona cabeçalhos HTTP para que o navegador/CDN também ajudem no cache
    return NextResponse.json(packages, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('Erro ao buscar pacotes:', error);
    return NextResponse.json({ error: 'Erro ao buscar pacotes' }, { status: 500 });
  }
}
