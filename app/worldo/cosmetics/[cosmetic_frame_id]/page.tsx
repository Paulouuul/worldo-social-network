// app/worldo/cosmetics/[cosmetic_frame_id]/page.tsx
// Página /worldo/cosmetics/[cosmetic_frame_id]: detalhes de uma moldura (criador, estatísticas,
// ofertas à venda e avaliações).
'use client';

import { useState } from 'react';
import { PrimaryButton, buttonClass } from '@/components/ui/buttons/PrimaryButton';
import { SelectInput, TextInput } from '@/components/ui/forms/FormField';
import { useQuery } from '@tanstack/react-query';
import { fetchJson } from '@/lib/api/fetcher';
import { cachePolicy, qk } from '@/lib/query/queryKeys';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ClientImage } from '@/components/ui/media/ClientImage';
import { Star, ShoppingBag, Users, Coins, User } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/feedback/Loading';
import { FeedbackMessage } from '@/components/ui/feedback/FeedbackMessage';
import { Breadcrumb } from '@/components/ui/navigation/Breadcrumb';

/** Moldura retornada por /api/worldo/cosmetics/[id]. */
interface FrameData {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  rarity: string;
  stock: number;
  soldCount: number;
  createdAt: string;
  creator: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
  };
  listings: {
    id: string;
    quantity: number;
    priceCoins: number;
    seller: { id: string; name: string; username: string; avatar: string | null };
  }[];
  reviews: {
    id: string;
    rating: number;
    title: string | null;
    comment: string;
    createdAt: string;
    user: { name: string; username: string; avatar: string | null };
    likes: number;
  }[];
  stats: {
    totalSold: number;
    totalInCirculation: number;
    totalEquipped: number;
    averageRating: number;
    totalReviews: number;
    ratingDistribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
  };
  cheapestListing: {
    id: string;
    priceCoins: number;
    quantity: number;
    seller: { name: string };
  } | null;
  hasActiveListing: boolean;
  totalListings: number;
}

/** Detalhe da moldura; estoque e preços das ofertas são buscados sem cache. */
export default function CosmeticDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [buyQuantity, setBuyQuantity] = useState(1);
  const [selectedListing, setSelectedListing] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  const frameId = params.cosmetic_frame_id as string;

  // Estoque e preços das ofertas: sempre buscados do servidor, sem cache
  const frameQuery = useQuery({
    queryKey: qk.cosmetics.frame(frameId),
    queryFn: ({ signal }) => fetchJson<FrameData>(`/api/worldo/cosmetics/${frameId}`, { signal }),
    ...cachePolicy.critical,
  });
  const frame = frameQuery.data ?? null;
  const loading = frameQuery.isPending;

  /**
   * Envia a compra da oferta selecionada para POST /api/worldo/cosmetics/buy, rota que não
   * existe no projeto (a compra do marketplace é feita pelo carrinho/checkout).
   */
  const handleBuy = async () => {
    if (!selectedListing) return;
    try {
      const res = await fetch('/api/worldo/cosmetics/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: selectedListing,
          quantity: buyQuantity,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: 'success', message: 'Compra realizada com sucesso!' });
        router.push('/inventory');
      } else {
        setFeedback({ type: 'error', message: data.error || 'Erro na compra' });
      }
    } catch (_err) {
      setFeedback({ type: 'error', message: 'Erro ao processar compra' });
    }
  };

  /** Classes de borda e fundo da raridade. */
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'COMUM':
        return 'border-green-500/30 bg-green-500/5';
      case 'RARO':
        return 'border-blue-500/30 bg-blue-500/5';
      case 'EPICO':
        return 'border-purple-500/30 bg-purple-500/5';
      case 'LENDARIO':
        return 'border-amber-500/30 bg-amber-500/5';
      default:
        return 'border-gray-500/30 bg-gray-500/5';
    }
  };

  /** Classe de cor do texto da raridade. */
  const getRarityTextColor = (rarity: string) => {
    switch (rarity) {
      case 'COMUM':
        return 'text-green-400';
      case 'RARO':
        return 'text-blue-400';
      case 'EPICO':
        return 'text-purple-400';
      case 'LENDARIO':
        return 'text-amber-400';
      default:
        return 'text-gray-400';
    }
  };

  /** Renderiza 5 estrelas preenchidas até a nota informada. */
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return <LoadingSpinner text="Carregando moldura..." />;
  }

  if (!frame) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Moldura não encontrada</p>
        <Link
          href="/worldo/cosmetics/marketplace"
          className={`${buttonClass.primary} w-fit mx-auto mt-4`}
        >
          Voltar ao Marketplace
        </Link>
      </div>
    );
  }

  const cheapest = frame.cheapestListing;
  const rarityColor = getRarityColor(frame.rarity);
  const rarityTextColor = getRarityTextColor(frame.rarity);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <Breadcrumb current={frame.name} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Imagem */}
        <div className={`rounded-2xl overflow-hidden border-2 p-6 ${rarityColor}`}>
          <div className="relative aspect-square">
            <ClientImage
              src={frame.imageUrl}
              alt={frame.name}
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Informações */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{frame.name}</h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${rarityColor} ${rarityTextColor}`}
              >
                {frame.rarity}
              </span>
            </div>
            <p className="text-gray-400">{frame.description}</p>
          </div>

          {/* Criador */}
          <div className="flex items-center gap-3 p-4 bg-slate-800/30 rounded-xl">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-purple-600 flex items-center justify-center">
              {frame.creator.avatar ? (
                <ClientImage
                  src={frame.creator.avatar}
                  alt=""
                  width={40}
                  height={40}
                  className="object-cover"
                />
              ) : (
                <User className="w-5 h-5" />
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500">Criado por</p>
              <Link
                href={`/worldo/perfil/${frame.creator.username}`}
                className="font-medium hover:text-purple-400 transition"
              >
                {frame.creator.name}
              </Link>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-slate-800/30 rounded-xl">
              <ShoppingBag className="w-5 h-5 mx-auto mb-1 text-purple-400" />
              <p className="text-2xl font-bold">{frame.stats.totalSold}</p>
              <p className="text-xs text-gray-500">vendidos</p>
            </div>
            <div className="text-center p-3 bg-slate-800/30 rounded-xl">
              <Users className="w-5 h-5 mx-auto mb-1 text-purple-400" />
              <p className="text-2xl font-bold">{frame.stats.totalInCirculation}</p>
              <p className="text-xs text-gray-500">em circulação</p>
            </div>
            <div className="text-center p-3 bg-slate-800/30 rounded-xl">
              <Star className="w-5 h-5 mx-auto mb-1 text-yellow-400" />
              <p className="text-2xl font-bold">{frame.stats.averageRating.toFixed(1)}</p>
              <p className="text-xs text-gray-500">({frame.stats.totalReviews} avaliações)</p>
            </div>
          </div>

          {/* Resultado da compra */}
          {feedback && <FeedbackMessage type={feedback.type} message={feedback.message} />}

          {/* Preço e compra */}
          {cheapest && (
            <div className="p-6 bg-linear-to-r from-purple-900/20 to-indigo-900/20 rounded-2xl border border-purple-500/30">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-400">Melhor oferta</p>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold text-purple-400">
                      {cheapest.priceCoins}
                    </span>
                    <Coins className="w-6 h-6 text-purple-400" />
                  </div>
                  <p className="text-xs text-gray-500">de {cheapest.seller.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Disponível</p>
                  <p className="text-xl font-bold">{frame.totalListings} anúncios</p>
                </div>
              </div>

              {session ? (
                <div className="space-y-3">
                  <SelectInput
                    value={selectedListing || ''}
                    onChange={(e) => setSelectedListing(e.target.value)}
                  >
                    <option value="">Selecione um vendedor</option>
                    {frame.listings.map((listing) => (
                      <option key={listing.id} value={listing.id}>
                        {listing.seller.name} - {listing.priceCoins} 🪙 ({listing.quantity} unid.)
                      </option>
                    ))}
                  </SelectInput>
                  <TextInput
                    type="number"
                    min="1"
                    value={buyQuantity}
                    onChange={(e) => setBuyQuantity(parseInt(e.target.value) || 1)}
                    placeholder="Quantidade"
                  />
                  <PrimaryButton onClick={handleBuy}>Comprar agora</PrimaryButton>
                </div>
              ) : (
                <Link href="/login" className={`${buttonClass.primary} w-full`}>
                  Entre para comprar
                </Link>
              )}
            </div>
          )}

          {!frame.hasActiveListing && (
            <div className="p-6 bg-slate-800/30 rounded-2xl text-center">
              <p className="text-gray-400">Nenhum anúncio disponível no momento</p>
              <Link
                href="/worldo/cosmetics/marketplace"
                className={`${buttonClass.secondary} w-fit mx-auto mt-3`}
              >
                Ver outras molduras
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Avaliações */}
      {frame.reviews.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-4">⭐ Avaliações ({frame.stats.totalReviews})</h2>
          <div className="space-y-4">
            {frame.reviews.map((review) => (
              <div key={review.id} className="p-4 bg-slate-800/30 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-purple-600">
                      {review.user.avatar ? (
                        <ClientImage
                          src={review.user.avatar}
                          alt=""
                          width={32}
                          height={32}
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm">
                          {review.user.name?.[0]}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{review.user.name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  {renderStars(review.rating)}
                </div>
                {review.title && <p className="font-medium mt-2">{review.title}</p>}
                <p className="text-gray-400 text-sm mt-1">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
