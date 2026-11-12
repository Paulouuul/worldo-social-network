// app/worldo/coins/page.tsx
// Página /worldo/coins: loja de pacotes de moedas com saldo atual, destaques (mais popular e
// melhor custo-benefício) e compra via Stripe Checkout.
'use client';

import { useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useCoinBalance } from '@/hooks/queries/useWallet';
import { useCoinPackages } from '@/hooks/queries/useCatalog';
import { formatFullNumber } from '@/lib/utils/formatUtils';

import {
  Coins,
  ShieldCheck,
  Zap,
  CreditCard,
  Store,
  Sparkles,
  Flame,
  TrendingUp,
  Package,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/feedback/Loading';
import { Spinner } from '@/components/ui/feedback/Spinner';
import { Modal } from '@/components/ui/overlays/Modal';

/** Pacote de moedas exibido na loja. */
interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  priceReal: number;
  bonusCoins: number;
  popular?: boolean;
  bestValue?: boolean;
}

/**
 * Lista os pacotes (sem cache, pois exibem preço) e o saldo atual; a compra redireciona ao
 * Stripe.
 */
export default function CoinsPage() {
  const { status } = useSession();

  const { data: balance = 0 } = useCoinBalance();
  const { data: rawPackages } = useCoinPackages<CoinPackage>();
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Destaques: top 2 custo-benefício e "mais popular" (segundo mais barato)
  const packages = useMemo<CoinPackage[]>(() => {
    if (!Array.isArray(rawPackages) || rawPackages.length === 0) return [];

    // Moedas (com bônus) por real
    const valueOf = (pkg: CoinPackage) => (pkg.coins + pkg.bonusCoins) / pkg.priceReal;
    const bestValueIds = [...rawPackages]
      .sort((a, b) => valueOf(b) - valueOf(a))
      .slice(0, 2)
      .map((p) => p.id);
    const popularPackage = [...rawPackages].sort((a, b) => a.priceReal - b.priceReal)[1];

    return rawPackages.map((pkg) => ({
      ...pkg,
      popular: pkg.id === popularPackage?.id,
      bestValue: bestValueIds.includes(pkg.id) && pkg.id !== popularPackage?.id,
    }));
  }, [rawPackages]);

  /** Abre a confirmação de compra do pacote. */
  const handleBuyClick = (pkg: CoinPackage) => {
    setSelectedPackage(pkg);
    setShowConfirmModal(true);
  };

  /** Cria a sessão de checkout do Stripe e redireciona para a URL de pagamento. */
  const confirmPurchase = async () => {
    if (!selectedPackage) return;

    setBuyingId(selectedPackage.id);
    setShowConfirmModal(false);

    try {
      const res = await fetch('/api/worldo/coins/buy', {
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

  /** Moedas (com bônus) por real do pacote. */
  const getCoinsPerReal = (pkg: CoinPackage) => {
    const totalCoins = pkg.coins + pkg.bonusCoins;
    return pkg.priceReal > 0 ? (totalCoins / pkg.priceReal).toFixed(0) : '0';
  };

  /** Ícone de moeda com cor fixa para os 5 primeiros pacotes e cor gerada (HSL) para os demais. */
  const getPackageIcon = (index: number) => {
    // Cores fixas dos primeiros pacotes
    const specialColors = [
      'text-amber-400',
      'text-blue-400',
      'text-red-400',
      'text-purple-400',
      'text-emerald-400',
    ];

    if (index < specialColors.length) {
      return <Coins className={`w-12 h-12 ${specialColors[index]}`} />;
    }

    // Demais pacotes: cor HSL derivada do índice
    const hue = (index * 37) % 360;
    const saturation = 75 + (index % 15);
    const lightness = 55 + (index % 10);

    return (
      <Coins
        className="w-12 h-12 transition-colors duration-300"
        style={{
          color: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
        }}
      />
    );
  };

  if (status === 'loading') {
    return <LoadingSpinner text="Carregando loja com segurança..." withBackground fullScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-12 antialiased selection:bg-blue-500/30">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Cabeçalho */}
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
                      <Spinner />
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

        {/* Benefícios */}
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

      {/* Modal de confirmação */}
      {showConfirmModal && selectedPackage && (
        <Modal panelClassName="max-w-md overflow-hidden">
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

            {/* Ações do modal */}
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
        </Modal>
      )}
    </div>
  );
}
