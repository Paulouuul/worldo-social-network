'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useCoinStore } from '@/stores/coinStore';
import { redirect } from 'next/navigation';
import { formatFullNumber } from '@/lib/format-utils';

import {
  Coins,
  ShieldCheck,
  Zap,
  CreditCard,
  Loader2,
  Store,
  Sparkles,
  Flame,
  TrendingUp,
  Package,
  Gem,
  Rocket,
  Star,
  Crown,
} from 'lucide-react';

interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  priceReal: number;
  bonusCoins: number;
  popular?: boolean;
  bestValue?: boolean;
}

export default function CoinsPage() {
  const { status } = useSession();

  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const { balance, fetchBalance } = useCoinStore();
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const hasFetched = useRef(false);

  // Controle estrito de requisições de API
  useEffect(() => {
    if (status === 'authenticated' && !hasFetched.current) {
      hasFetched.current = true;

      fetch('/api/coins/packages')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            const packagesWithValue = data.map((pkg: CoinPackage) => {
              const totalCoins = pkg.coins + pkg.bonusCoins;
              const valueForMoney = totalCoins / pkg.priceReal;
              return { ...pkg, valueForMoney };
            });

            // Encontra o melhor custo-benefício
            const sortedByValue = [...packagesWithValue].sort(
              (a, b) => b.valueForMoney - a.valueForMoney,
            );
            const bestValueIds = sortedByValue.slice(0, 2).map((p) => p.id); // top 2

            // Define o mais popular como o segundo mais barato
            const sortedByPrice = [...packagesWithValue].sort((a, b) => a.priceReal - b.priceReal);
            const popularPackage = sortedByPrice[1];

            const enhancedPackages = data.map((pkg: CoinPackage) => ({
              ...pkg,
              popular: pkg.id === popularPackage?.id,
              bestValue: bestValueIds.includes(pkg.id) && pkg.id !== popularPackage?.id,
            }));

            setPackages(enhancedPackages);
          }
        })
        .catch((err) => console.error('Erro ao buscar pacotes:', err));

      fetchBalance();
    }
  }, [status]);

  useEffect(() => {
    if (status === 'authenticated') {
      const interval = setInterval(() => {
        fetchBalance();
      }, 5000); // Atualiza a cada 5 segundos

      return () => clearInterval(interval);
    }
  }, [status, fetchBalance]);

  const handleBuyClick = (pkg: CoinPackage) => {
    setSelectedPackage(pkg);
    setShowConfirmModal(true);
  };

  const confirmPurchase = async () => {
    if (!selectedPackage) return;

    setBuyingId(selectedPackage.id);
    setShowConfirmModal(false);

    try {
      const res = await fetch('/api/coins/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: selectedPackage.id }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Erro ao processar checkout:', err);
    } finally {
      setBuyingId(null);
      setSelectedPackage(null);
    }
  };

  const getCoinsPerReal = (pkg: CoinPackage) => {
    const totalCoins = pkg.coins + pkg.bonusCoins;
    return pkg.priceReal > 0 ? (totalCoins / pkg.priceReal).toFixed(0) : '0';
  };

  const getPackageIcon = (index: number) => {
    const icons = [
      <Coins className="w-12 h-12 text-amber-400" />,
      <Zap className="w-12 h-12 text-blue-400" />,
      <Star className="w-12 h-12 text-red-300" />,
      <Gem className="w-12 h-12 text-purple-400" />,
      <Crown className="w-12 h-12 text-yellow-500" />,
      <Rocket className="w-12 h-12 text-cyan-300" />,
    ];
    return icons[index % icons.length];
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm font-medium animate-pulse tracking-wide">
            Carregando loja com segurança...
          </p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-12 antialiased selection:bg-blue-500/30">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header Hero Card */}
        <div className="relative rounded-3xl border border-slate-800 bg-slate-900/50 p-8 md:p-12 text-center overflow-hidden backdrop-blur-md shadow-2xl">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute -top-12 -right-12 w-96 h-96 bg-purple-600 rounded-full blur-[120px]"></div>
            <div className="absolute -bottom-12 -left-12 w-96 h-96 bg-blue-600 rounded-full blur-[120px]"></div>
          </div>

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-xs md:text-sm font-medium text-blue-400 tracking-wide backdrop-blur-sm">
              <Store className="w-4 h-4" />
              <span>LOJA OFICIAL DE ATIVOS</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-linear-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Adquira suas Moedas
            </h1>

            <p className="text-base md:text-lg text-slate-400 max-w-md mx-auto font-normal leading-relaxed">
              Desbloqueie recursos exclusivos, impulsione seu progresso e eleve sua experiência
              agora mesmo.
            </p>

            {/* Widget de Saldo Atual */}
            <div className="pt-4 inline-block">
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-1.5 backdrop-blur-md shadow-inner">
                <div className="flex items-center gap-4 px-6 py-3 bg-linear-to-r from-blue-950/30 to-purple-950/30 rounded-xl">
                  <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                    <Coins className="w-6 h-6 text-amber-400 animate-pulse" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                      Seu Saldo Atual
                    </p>
                    <p className="text-2xl md:text-3xl font-black text-white tracking-tight">
                      {formatFullNumber(balance)}
                      <span className="text-sm font-medium text-slate-400 ml-1.5">moedas</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grid de Pacotes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {packages.map((pkg, index) => (
            <div
              key={pkg.id}
              className={`relative rounded-2xl transition-all duration-300 group flex flex-col h-full ${
                pkg.popular
                  ? 'border-2 border-amber-500/50 bg-slate-900/80 shadow-[0_0_30px_rgba(245,158,11,0.05)]'
                  : 'border border-slate-800 bg-slate-900/30 hover:border-slate-700/80 hover:bg-slate-900/50 shadow-xl'
              }`}
            >
              {/* Badges Flutuantes */}
              {pkg.popular && (
                <div className="absolute -top-3.5 right-6 z-20">
                  <span className="bg-linear-to-r from-amber-500 to-orange-500 text-slate-950 px-3 py-1 rounded-full text-[11px] font-black tracking-wider uppercase shadow-lg flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 fill-slate-950" /> MAIS POPULAR
                  </span>
                </div>
              )}
              {pkg.bestValue && !pkg.popular && (
                <div className="absolute -top-3.5 left-6 z-20">
                  <span className="bg-linear-to-r from-emerald-500 to-teal-500 text-slate-950 px-3 py-1 rounded-full text-[11px] font-black tracking-wider uppercase shadow-lg flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" /> MELHOR CUSTO
                  </span>
                </div>
              )}

              <div className="p-8 flex flex-col grow items-center text-center space-y-6">
                {/* Ícone com Efeito Radial de Fundo */}
                <div className="relative p-4 rounded-full bg-slate-950/50 border border-slate-800/50 group-hover:scale-110 transition-transform duration-300">
                  <div className="absolute inset-0 bg-slate-400/5 blur-xl rounded-full"></div>
                  {getPackageIcon(index)}
                </div>

                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-white tracking-tight">{pkg.name}</h2>
                </div>

                {/* Display de Moedas */}
                <div className="w-full bg-slate-950/40 rounded-xl p-4 border border-slate-800/40 space-y-2">
                  <div className="flex items-center justify-center gap-2.5">
                    <span className="text-3xl font-black text-white tracking-tight">
                      {formatFullNumber(pkg.coins)}
                    </span>
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                      Moedas
                    </span>
                  </div>

                  {pkg.bonusCoins > 0 && (
                    <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-500/20">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>+{formatFullNumber(pkg.bonusCoins)} BÔNUS</span>
                    </div>
                  )}
                </div>

                {/* Preço */}
                <div className="pt-2">
                  <p className="text-4xl font-black text-white tracking-tight">
                    <span className="text-sm font-medium text-slate-500 mr-1">R$</span>
                    {pkg.priceReal.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium mt-1.5 tracking-wide">
                    Equivale a ~{getCoinsPerReal(pkg)} moedas por real
                  </p>
                </div>

                {/* Botão de Compra */}
                <button
                  onClick={() => handleBuyClick(pkg)}
                  disabled={buyingId !== null}
                  className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 mt-auto flex items-center justify-center gap-2 ${
                    pkg.popular
                      ? 'bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 shadow-lg shadow-orange-500/10 active:scale-[0.98]'
                      : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700/50 active:scale-[0.98]'
                  } disabled:opacity-50 disabled:pointer-events-none`}
                >
                  {buyingId === pkg.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-current" />
                      <span>Processando...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 text-current" />
                      <span>Comprar Agora</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Seção de Benefícios Extra */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/20 p-8 md:p-12 backdrop-blur-sm">
          <h3 className="text-xl font-bold text-center text-white mb-10 flex items-center justify-center gap-2.5 tracking-tight">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <span>Garantia e Segurança da Plataforma</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-white font-bold text-base tracking-tight">
                Ambiente 100% Seguro
              </h4>
              <p className="text-slate-400 text-xs leading-relaxed max-w-xs">
                Criptografia de ponta a ponta processada via Stripe, referência mundial em segurança
                financeira.
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
                <Zap className="w-6 h-6" />
              </div>
              <h4 className="text-white font-bold text-base tracking-tight">Entrega Instantânea</h4>
              <p className="text-slate-400 text-xs leading-relaxed max-w-xs">
                Sem filas ou validações manuais. O saldo é atualizado em sua conta segundos após a
                aprovação.
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-400">
                <CreditCard className="w-6 h-6" />
              </div>
              <h4 className="text-white font-bold text-base tracking-tight">
                Pagamento com Débito e Débito
              </h4>
              <p className="text-slate-400 text-xs leading-relaxed max-w-xs">
                Pagamento rápido e seguro com cartões das principais bandeiras.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação Modernizado */}
      {showConfirmModal && selectedPackage && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl transition-all">
            <div className="p-6 md:p-8 text-center space-y-6">
              <div className="mx-auto w-14 h-14 bg-blue-500/10 rounded-full border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Package className="w-6 h-6" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white tracking-tight">Confirmar Pedido</h3>
                <p className="text-sm text-slate-400 leading-relaxed px-4">
                  Você escolheu o pacote{' '}
                  <strong className="text-blue-400 font-semibold">{selectedPackage.name}</strong>.
                  Revise os dados abaixo:
                </p>
              </div>

              {/* Box de Resumo da Fatura */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-sm divide-y divide-slate-800/80 space-y-3">
                <div className="flex justify-between items-center pb-3">
                  <span className="text-slate-400 font-medium">Moedas Inclusas:</span>
                  <span className="text-white font-bold flex items-center gap-1.5">
                    {formatFullNumber(selectedPackage.coins)}
                  </span>
                </div>
                {selectedPackage.bonusCoins > 0 && (
                  <div className="flex justify-between items-center py-3 text-emerald-400 font-semibold">
                    <span>Bônus Adicional:</span>
                    <span>+{selectedPackage.bonusCoins.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 font-medium">
                  <span className="text-slate-400">Valor Total:</span>
                  <span className="text-white font-black text-lg">
                    R${' '}
                    {selectedPackage.priceReal.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              {/* Actions do Modal */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="w-full sm:order-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-semibold text-sm transition-colors border border-slate-700/50"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmPurchase}
                  className="w-full sm:order-2 bg-linear-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-500/10 transition-colors"
                >
                  Ir para o Pagamento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
