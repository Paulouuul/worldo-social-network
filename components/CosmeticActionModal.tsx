'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { AvatarWithFrame } from '@/components/AvatarWithFrame';
import { getRarityDesigns } from '@/constants/cosmeticRarity';
import {
  Tag,
  Store,
  Edit2,
  MinusCircle,
  X,
  AlertTriangle,
  Loader2,
  Coins,
  Box,
  ExternalLink,
  ArrowLeft,
} from 'lucide-react';

// ==========================================
// TIPAGENS
// ==========================================
type ModalMode = 'sell' | 'view' | 'edit' | 'remove' | null;

interface GroupedItem {
  id: string;
  frameId: string;
  isListed: boolean;
  resalePrice: number | null;
  listingId?: string | null;
  count: number;
  frame: {
    id: string;
    name: string;
    description: string;
    thumbnailUrl: string;
    imageUrl: string;
    rarity: string;
    stock: number;
  };
}

interface CosmeticActionModalProps {
  item: GroupedItem;
  mode: NonNullable<ModalMode>;
  onClose: () => void;
  onSuccess: () => void;
  avatarUrl: string;
}

const rarityDesigns = getRarityDesigns('bottom-10');

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export function CosmeticActionModal({
  item,
  mode,
  onClose,
  onSuccess,
  avatarUrl,
}: CosmeticActionModalProps) {
  const { data: session } = useSession();

  const [currentMode, setCurrentMode] = useState<NonNullable<ModalMode>>(mode);
  const [quantity, setQuantity] = useState(mode === 'sell' ? 1 : item.count);
  const [price, setPrice] = useState(item.resalePrice || (item.frame.stock > 0 ? 100 : 50));

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const rarityConfig = useMemo(() => {
    return rarityDesigns[item.frame.rarity?.toUpperCase()] || rarityDesigns.COMUM;
  }, [item]);

  // Limpa mensagens de sucesso sozinhas
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // ==========================================
  // FUNÇÕES DE API
  // ==========================================
  const handleSell = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity > item.count) {
      setErrorMessage(`Você possui apenas ${item.count} unidades desta moldura.`);
      return;
    }
    if (price <= 0) {
      setErrorMessage('O preço precisa ser maior que zero.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/cosmetics/listings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frameId: item.frameId, quantity, priceCoins: price }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage('Anúncio publicado no mercado!');
        onSuccess();
        setTimeout(onClose, 1500);
      } else {
        setErrorMessage(data.error || 'Erro na validação do anúncio.');
      }
    } catch (_err) {
      setErrorMessage('Erro de comunicação com o servidor.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item.listingId) return;

    setSubmitting(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/cosmetics/listings/update-price', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: item.listingId, priceCoins: price }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage('Preço atualizado com sucesso!');
        onSuccess();
        setTimeout(() => setCurrentMode('view'), 1000);
      } else {
        setErrorMessage(data.error || 'Erro ao atualizar preço');
      }
    } catch (_err) {
      setErrorMessage('Erro de comunicação com o servidor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveItems = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item.listingId) return;

    setSubmitting(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/cosmetics/listings/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: item.listingId, quantity }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(`${quantity} unidade(s) retiradas do mercado!`);
        onSuccess();
        if (quantity >= item.count) {
          setTimeout(onClose, 1500);
        } else {
          setTimeout(() => setCurrentMode('view'), 1500);
        }
      } else {
        setErrorMessage(data.error || 'Erro ao remover do mercado');
      }
    } catch (_err) {
      setErrorMessage('Erro de comunicação com o servidor');
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // RENDERIZAÇÃO
  // ==========================================
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-200">
      <div
        className={`bg-slate-900 border ${rarityConfig.borderClass} rounded-2xl max-w-md w-full shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[95vh] sm:max-h-[90vh]`}
      >
        {/* HEADER */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-800/60 flex items-center justify-between bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-2">
            {currentMode === 'sell' && (
              <>
                <Tag className="w-4 h-4 text-purple-400 shrink-0" />
                <h2 className="text-xs sm:text-sm font-black text-slate-200 uppercase tracking-wider truncate">
                  Criar Ordem de Venda
                </h2>
              </>
            )}
            {currentMode === 'view' && (
              <>
                <Store className="w-4 h-4 text-emerald-400 shrink-0" />
                <h2 className="text-xs sm:text-sm font-black text-slate-200 uppercase tracking-wider truncate">
                  Detalhes do Anúncio
                </h2>
              </>
            )}
            {currentMode === 'edit' && (
              <>
                <Edit2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <h2 className="text-xs sm:text-sm font-black text-slate-200 uppercase tracking-wider truncate">
                  Editar Preço
                </h2>
              </>
            )}
            {currentMode === 'remove' && (
              <>
                <MinusCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <h2 className="text-xs sm:text-sm font-black text-slate-200 uppercase tracking-wider truncate">
                  Retirar do Mercado
                </h2>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition p-1 shrink-0"
            disabled={submitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTEÚDO SCROLLÁVEL */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5">
          {/* MENSAGENS DE FEEDBACK */}
          {errorMessage && (
            <div className="bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl p-3 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl p-3 text-xs flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block shrink-0 mt-1.5 animate-ping" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* IMAGEM E INFOS BASE */}
          <div className="flex flex-col items-center justify-center w-full mb-6">
            <AvatarWithFrame
              avatarUrl={avatarUrl}
              name={session?.user?.name || 'Usuário'}
              frameUrl={item.frame.imageUrl}
              className="w-28 h-28 md:w-36 md:h-36"
              rarity={item.frame.rarity}
              priority
            />
          </div>

          <div className="text-center mb-4">
            <h3 className={`font-bold text-lg ${rarityConfig.textClass}`}>{item.frame.name}</h3>
            <p
              className={`text-xs font-semibold tracking-wider uppercase ${rarityConfig.textClass}`}
            >
              {item.frame.rarity}
            </p>
            <br />
          </div>

          {/* MODO: VER (VIEW) */}
          {currentMode === 'view' && (
            <div className="space-y-4 sm:space-y-5 animate-in slide-in-from-right-4 duration-200">
              <div className="bg-slate-950/50 rounded-xl p-3 sm:p-4 border border-slate-800/50 flex flex-col gap-2 sm:gap-3 shadow-inner">
                <div className="flex justify-between items-center border-b border-slate-800/50 pb-2">
                  <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Preço Unitário:
                  </span>
                  <span className="text-sm font-black text-amber-500 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {item.resalePrice}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Rendimento Previsto:
                  </span>
                  <span className="text-sm sm:text-base font-black text-emerald-400 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4" />{' '}
                    {(item.resalePrice || 0) * item.count}
                  </span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                <button
                  onClick={() => {
                    setCurrentMode('edit');
                    setPrice(item.resalePrice || 100);
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="flex-1 bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 hover:border-indigo-500 text-indigo-300 hover:text-white font-semibold text-sm py-3 sm:py-3 px-4 rounded-xl transition-[transform,border-color,background-color,box-shadow] flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-4 h-4" /> Editar Preço
                </button>
                <button
                  onClick={() => {
                    setCurrentMode('remove');
                    setQuantity(item.count);
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="flex-1 bg-rose-600/20 hover:bg-rose-600 border border-rose-500/30 hover:border-rose-500 text-rose-300 hover:text-white font-semibold text-sm py-3 sm:py-3 px-4 rounded-xl transition-[transform,border-color,background-color,box-shadow] flex items-center justify-center gap-2"
                >
                  <MinusCircle className="w-4 h-4" /> Retirar Lote
                </button>
              </div>
              {item.listingId && (
                <Link
                  href={`/worldo/cosmetics/marketplace/${item.listingId}`}
                  className="flex items-center justify-center gap-2 w-full bg-purple-600/20 hover:bg-purple-600 border border-purple-500/30 hover:border-purple-500 text-purple-300 hover:text-white font-semibold text-sm py-3 px-4 rounded-xl transition-all duration-200"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ver anúncio público
                </Link>
              )}
            </div>
          )}

          {/* MODO: VENDER (SELL) */}
          {currentMode === 'sell' && (
            <form
              onSubmit={handleSell}
              className="space-y-4 animate-in slide-in-from-right-4 duration-200"
            >
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Box className="w-3 h-3 text-emerald-400" /> Qtd. a Listar
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={item.count}
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.min(parseInt(e.target.value) || 1, item.count))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-slate-200 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-[transform,border-color,background-color,box-shadow] text-sm font-semibold"
                    disabled={submitting}
                    required
                  />
                </div>
                <div>
                  <label className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Coins className="w-3 h-3 text-amber-500" /> Preço Un.
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={price}
                    onChange={(e) => setPrice(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 text-amber-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-[transform,border-color,background-color,box-shadow] text-sm font-bold"
                    disabled={submitting}
                    required
                  />
                </div>
              </div>
              <div className="bg-purple-500/5 border border-purple-500/10 rounded-xl p-3 sm:p-3.5 flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium text-[10px] sm:text-xs">
                  Rendimento Total:
                </span>
                <span className="font-black text-purple-400 text-sm flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4" />{' '}
                  {new Intl.NumberFormat('pt-BR').format(quantity * price)}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-slate-800/60">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm py-3 px-4 rounded-xl transition-[transform,border-color,background-color,box-shadow] shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Store className="w-4 h-4" /> Anunciar no Mercado
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="flex-1 bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 text-slate-300 font-semibold text-sm py-3 px-4 rounded-xl transition flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" /> Cancelar
                </button>
              </div>
            </form>
          )}

          {/* MODO: EDITAR (EDIT) */}
          {currentMode === 'edit' && (
            <form
              onSubmit={handleUpdatePrice}
              className="space-y-4 animate-in slide-in-from-left-4 duration-200"
            >
              <div>
                <label className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Coins className="w-3 h-3 text-amber-500" /> Novo Preço Unitário
                </label>
                <input
                  type="number"
                  min="1"
                  value={price}
                  onChange={(e) => setPrice(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-amber-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-[transform,border-color,background-color,box-shadow] text-sm font-bold"
                  disabled={submitting}
                  required
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-slate-800/60">
                <button
                  type="submit"
                  disabled={submitting || price === item.resalePrice}
                  className="flex-[1.5] bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm py-3 px-4 rounded-xl transition-[transform,border-color,background-color,box-shadow] shadow-lg shadow-indigo-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Alteração'}
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentMode('view')}
                  disabled={submitting}
                  className="flex-1 bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 text-slate-300 font-semibold text-sm py-3 px-4 rounded-xl transition flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Voltar
                </button>
              </div>
            </form>
          )}

          {/* MODO: REMOVER (REMOVE) */}
          {currentMode === 'remove' && (
            <form
              onSubmit={handleRemoveItems}
              className="space-y-4 animate-in slide-in-from-right-4 duration-200"
            >
              <div>
                <label className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Box className="w-3 h-3" /> Qtd. a Retirar para o Cofre
                </label>
                <input
                  type="number"
                  min="1"
                  max={item.count}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.min(parseInt(e.target.value) || 1, item.count))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-[transform,border-color,background-color,box-shadow] text-sm font-bold"
                  disabled={submitting}
                  required
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-slate-800/60">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-[1.5] bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm py-3 px-4 rounded-xl transition-[transform,border-color,background-color,box-shadow] shadow-lg shadow-rose-900/20 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Retirada'}
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentMode('view')}
                  disabled={submitting}
                  className="flex-1 bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 text-slate-300 font-semibold text-sm py-3 px-4 rounded-xl transition flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Voltar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
