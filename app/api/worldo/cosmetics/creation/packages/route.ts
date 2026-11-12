// app/api/worldo/cosmetics/creation/packages/route.ts
// Rota /api/worldo/cosmetics/creation/packages: pacotes de criação de moldura (quantidade ×
// custo) por raridade.

import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { Rarity } from '@prisma/client';

/**
 * GET /api/worldo/cosmetics/creation/packages — pacotes ativos de criação.
 *
 * - ?packageId=...: um pacote com pricePerUnit, multiplier e baseCost.
 * - ?rarity=...: lista da raridade com pricePerUnit e multiplier.
 * - sem filtros: pacotes agrupados por raridade.
 * O multiplier é o custo do pacote dividido pelo menor custo da mesma raridade.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rarityParam = searchParams.get('rarity');
    const packageId = searchParams.get('packageId');

    // Consulta de um pacote específico
    if (packageId) {
      // Pacote ativo solicitado
      const packageData = await prisma.cosmetic_creation_package.findUnique({
        where: {
          id: packageId,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          rarity: true,
          quantity: true,
          totalCost: true,
        },
      });

      if (!packageData) {
        return NextResponse.json(
          {
            error: 'Pacote não encontrado ou inativo',
          },
          { status: 404 },
        );
      }

      // Menor custo da raridade (baseCost) para calcular o multiplier
      const allPackages = await prisma.cosmetic_creation_package.findMany({
        where: {
          rarity: packageData.rarity,
          isActive: true,
        },
        select: {
          totalCost: true,
        },
        orderBy: {
          totalCost: 'asc',
        },
      });

      // Menor custo da raridade
      const baseCost = allPackages[0]?.totalCost || packageData.totalCost;

      // Preço por unidade (2 casas decimais)
      const pricePerUnit = Math.round((packageData.totalCost / packageData.quantity) * 100) / 100;

      // Quantas vezes o custo do pacote supera o menor custo da raridade
      const multiplier = Number((packageData.totalCost / baseCost).toFixed(2));

      // Pacote com pricePerUnit, multiplier e baseCost
      return NextResponse.json({
        package: {
          ...packageData,
          pricePerUnit,
          multiplier,
          baseCost,
        },
      });
    }

    // Listagem, opcionalmente filtrada por raridade
    let rarityFilter: Rarity | undefined;
    if (rarityParam && rarityParam !== '') {
      const validRarities = Object.values(Rarity);
      if (validRarities.includes(rarityParam as Rarity)) {
        rarityFilter = rarityParam as Rarity;
      } else {
        return NextResponse.json(
          { error: 'Raridade inválida. Valores permitidos: COMUM, RARO, EPICO, LENDARIO' },
          { status: 400 },
        );
      }
    }

    const whereClause: any = {
      isActive: true,
    };

    if (rarityFilter) {
      whereClause.rarity = rarityFilter;
    }

    const packages = await prisma.cosmetic_creation_package.findMany({
      where: whereClause,
      orderBy: [{ rarity: 'asc' }, { totalCost: 'asc' }],
    });

    // Menor custo por raridade (lista já ordenada por custo)
    const baseCosts: Record<string, number> = {};

    packages.forEach((pkg) => {
      if (!baseCosts[pkg.rarity]) {
        baseCosts[pkg.rarity] = pkg.totalCost;
      }
    });

    const packagesWithMultiplier = packages.map((pkg) => {
      const baseCost = baseCosts[pkg.rarity] || pkg.totalCost;
      const multiplier = Number((pkg.totalCost / baseCost).toFixed(2));
      const pricePerUnit = Math.round((pkg.totalCost / pkg.quantity) * 100) / 100;

      return {
        ...pkg,
        multiplier,
        pricePerUnit,
      };
    });

    // Sem filtro de raridade, a resposta vem agrupada
    if (!rarityFilter) {
      const grouped = packagesWithMultiplier.reduce(
        (acc, pkg) => {
          if (!acc[pkg.rarity]) {
            acc[pkg.rarity] = [];
          }
          acc[pkg.rarity].push(pkg);
          return acc;
        },
        {} as Record<string, typeof packagesWithMultiplier>,
      );

      return NextResponse.json(grouped);
    }

    return NextResponse.json(packagesWithMultiplier);
  } catch (error) {
    console.error('Erro ao buscar pacotes:', error);
    return NextResponse.json({ error: 'Erro interno ao buscar pacotes' }, { status: 500 });
  }
}
