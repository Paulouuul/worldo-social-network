// app/api/cosmetics/creation/packages/route.ts
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { Rarity } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const rarityParam = searchParams.get('rarity');
    const packageId = searchParams.get('packageId');

    // Se tem packageId, busca UM pacote específico
    if (packageId) {
      // 1. Buscar o pacote específico
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

      // 2. Buscar TODOS os pacotes da mesma raridade para calcular o baseCost
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

      // 3. Calcular o baseCost (menor totalCost da raridade)
      const baseCost = allPackages[0]?.totalCost || packageData.totalCost;

      // 4. Calcular o preço por unidade
      const pricePerUnit = Math.round((packageData.totalCost / packageData.quantity) * 100) / 100;

      // 5. Calcular o multiplier
      const multiplier = Number((packageData.totalCost / baseCost).toFixed(2));

      // 6. Retornar os dados do pacote com pricePerUnit e multiplier
      return NextResponse.json({
        package: {
          ...packageData,
          pricePerUnit,
          multiplier,
          baseCost,
        },
      });
    }

    // Se NÃO tem packageId, busca todos os pacotes (com filtro de rarity)
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

    // CALCULAR O BASE COST POR RARIDADE (menor totalCost)
    const baseCosts: Record<string, number> = {};

    packages.forEach((pkg) => {
      if (!baseCosts[pkg.rarity]) {
        baseCosts[pkg.rarity] = pkg.totalCost;
      }
    });

    // CALCULAR O MULTIPLIER PARA CADA PACOTE
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

    // Se não especificou rarity, retorna agrupado
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
