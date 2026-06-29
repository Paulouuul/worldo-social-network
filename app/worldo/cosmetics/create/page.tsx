'use client';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useCoinStore } from '@/stores/coinStore';
import { useRouter, redirect } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ClientImage } from '@/components/ClientImage';
import { backendApiCall } from '@/lib/backendApiClient';
import { AvatarWithFrame } from '@/components/AvatarWithFrame';
import { getRarityDesigns, RARITY, Rarity, VALID_RARITIES } from '@/constants/cosmeticRarity';
import { formatPrice } from '@/lib/format-utils';
import {
  Sparkles,
  FileText,
  Layers,
  Package,
  UploadCloud,
  Check,
  Coins,
  X,
  Image as ImageIcon,
  AlertTriangle,
} from 'lucide-react';

interface FormData {
  name: string;
  description: string;
  rarity: Rarity;
  stock: number;
}
interface CreationPackage {
  id: string;
  name: string;
  rarity: Rarity;
  quantity: number;
  multiplier: number;
  pricePerUnit: number;
  totalCost: number;
  isActive: boolean;
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-100">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      <span className="ml-3 text-purple-300 font-medium">Carregando portal...</span>
    </div>
  );
}

export default function CreateCosmeticPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Store de moedas conectada
  const { balance: userCoins, fetchBalance, updateBalance } = useCoinStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    rarity: RARITY.COMUM as Rarity,
    stock: 10,
  });

  const [packages, setPackages] = useState<CreationPackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');

  const imageInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const [avatarUrl, setAvatarUrl] = useState('/default-avatar.png');
  const rarityDesigns = getRarityDesigns('static');
  const currentStyle = useMemo(
    () => rarityDesigns[formData.rarity] || rarityDesigns.COMUM,
    [formData.rarity, rarityDesigns],
  );

  const MAX_NAME_LENGTH = 50;
  const MAX_DESCRIPTION_LENGTH = 500;
  const [errors, setErrors] = useState({
    name: '',
    description: '',
  });

  const validateName = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return 'Nome é obrigatório';
    }
    if (trimmed.length < 3) {
      return 'Nome deve ter pelo menos 3 caracteres';
    }
    if (trimmed.length > MAX_NAME_LENGTH) {
      return `Nome deve ter no máximo ${MAX_NAME_LENGTH} caracteres`;
    }
    return '';
  };

  const validateDescription = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length > MAX_DESCRIPTION_LENGTH) {
      return `Descrição deve ter no máximo ${MAX_DESCRIPTION_LENGTH} caracteres`;
    }
    return '';
  };
  
  const hasErrors = errors.name !== '' || errors.description !== '';

  // Busca o saldo atualizado quando a sessão estiver autenticada
  useEffect(() => {
    if (status === 'authenticated') {
      fetchBalance();
    }
  }, [status, fetchBalance]);

  useEffect(() => {
    if (!formData.rarity) return;

    fetch(`/api/cosmetics/creation/packages?rarity=${formData.rarity}`)
      .then((res) => res.json())
      .then((data) => {
        setPackages(data);
        if (data.length > 0) {
          setSelectedPackageId(data[0].id);
          setFormData((prev) => ({ ...prev, stock: data[0].quantity }));
        } else {
          setSelectedPackageId('');
        }
      })
      .catch((err) => console.error('Erro ao buscar pacotes:', err));
  }, [formData.rarity]);

  const currentPackage = useMemo(() => {
    return packages.find((pkg) => pkg.id === selectedPackageId) || null;
  }, [packages, selectedPackageId]);

  const creationCost = useMemo(() => {
    return currentPackage?.totalCost || 0;
  }, [currentPackage]);

  // Checagem de saldo insuficiente
  const hasInsufficientCoins = userCoins < creationCost;

  const activePackageColor = useMemo(() => {
    const colors: Record<string, string> = {
      [RARITY.COMUM]: 'from-emerald-950/40 to-slate-900/40 border-emerald-500/50 text-emerald-200',
      [RARITY.RARO]: 'from-blue-950/40 to-slate-900/40 border-blue-500/50 text-blue-200',
      [RARITY.EPICO]: 'from-purple-950/40 to-slate-900/40 border-purple-500/50 text-purple-200',
      [RARITY.LENDARIO]: 'from-amber-950/40 to-slate-900/40 border-amber-500/50 text-amber-200',
    };
    return colors[formData.rarity] || 'from-purple-950/40 to-slate-900/40 border-purple-500/50';
  }, [formData.rarity]);

  useEffect(() => {
    const handleDoubleClick = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener('dblclick', handleDoubleClick);
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';

    return () => {
      document.removeEventListener('dblclick', handleDoubleClick);
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    };
  }, []);

  // Fetch das informações do usuário para atualizar avatar
  useEffect(() => {
    if (!session?.user) return;

    if (session.user.avatar) {
      setAvatarUrl(session.user.avatar);
    }

    if (!session.user.publicId) return;

    const controller = new AbortController();

    fetch(`/api/user/${session.user.publicId}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (data?.avatar) setAvatarUrl(data.avatar);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') console.error(err);
      });

    return () => controller.abort();
  }, [session]);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    };
  }, [imagePreview, thumbnailPreview]);

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jfif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Formato não suportado.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    const gifLimit = 3 * 1024 * 1024;

    if (file.type === 'image/gif' && file.size > gifLimit) {
      setError('GIF muito grande para moldura. Máximo: 3MB');
      return;
    }

    if (file.size > maxSize) {
      setError(`Arquivo muito grande. Máximo ${maxSize / 1024 / 1024}MB.`);
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError('');
  }, []);

  const handleThumbnailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jfif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Formato não suportado.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const maxSize = 2 * 1024 * 1024;
    const gifLimit = 1 * 1024 * 1024;

    if (file.type === 'image/gif' && file.size > gifLimit) {
      setError(`GIF muito grande para miniatura. Máximo: 1MB`);
      return;
    }

    if (file.size > maxSize) {
      setError(`Miniatura muito grande. Máximo ${maxSize / 1024 / 1024}MB.`);
      return;
    }

    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
    setError('');
  }, []);

  const handleRemoveThumbnail = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (thumbnailPreview) {
        URL.revokeObjectURL(thumbnailPreview);
      }
      setThumbnailFile(null);
      setThumbnailPreview('');
      if (thumbnailInputRef.current) {
        thumbnailInputRef.current.value = '';
      }
    },
    [thumbnailPreview],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (loading) return;
      
      const nameError = validateName(formData.name);
      if (nameError) {
        setError(nameError);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // Validação da descrição
      const descError = validateDescription(formData.description);
      if (descError) {
        setError(descError);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      
      setLoading(true);
      setError('');
      setSuccess('');

      // Validação de saldo imediata no front-end
      if (hasInsufficientCoins) {
        setError(
          `Saldo insuficiente. Você precisa de ${creationCost} moedas, mas possui apenas ${userCoins}.`,
        );
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setLoading(false);
        return;
      }

      if (!imageFile) {
        setError('Selecione uma imagem para a moldura');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setLoading(false);
        return;
      }

      if (!selectedPackageId) {
        setError('Selecione um pacote de distribuição válido.');
        setLoading(false);
        return;
      }

      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);
      submitData.append('packageId', selectedPackageId);
      submitData.append('image', imageFile);

      if (thumbnailFile) {
        submitData.append('thumbnail', thumbnailFile);
      }

      try {
        const res = await backendApiCall('/cosmetics/creation/create', {
          method: 'POST',
          body: submitData,
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.detail || 'Erro ao criar moldura');
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setLoading(false);
          return;
        } else {
          setSuccess(data.message || 'Moldura criada com sucesso!');
          // Débito otimista na store
          updateBalance(userCoins - creationCost);
          setTimeout(() => {
            router.push('/worldo/cosmetics/inventory');
          }, 1500);
        }
      } catch (error) {
        console.error('Erro ao criar moldura:', error);
        setError('Erro ao conectar com o servidor');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setLoading(false);
      }
    },
    [
      imageFile,
      thumbnailFile,
      formData,
      selectedPackageId,
      router,
      loading,
      hasInsufficientCoins,
      userCoins,
      creationCost,
      updateBalance,
    ],
  );

  const handlePackageSelect = useCallback(
    (id: string, quantity: number) => () => {
      setSelectedPackageId(id);
      setFormData((prev) => ({ ...prev, stock: quantity }));
    },
    [],
  );

  if (status === 'unauthenticated') {
    redirect('/login');
  }

  if (status === 'loading') {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 select-none">
      <div
        className={`bg-slate-900/60 backdrop-blur-xl rounded-2xl overflow-hidden border ${currentStyle.borderClass} shadow-2xl transition-all duration-500`}
      >
        <div
          className={`relative h-36 bg-linear-to-r ${currentStyle.gradientHeader} flex flex-col items-center justify-center border-b ${currentStyle.borderClass} px-4 text-center transition-all duration-500`}
        >
          <div
            className={`absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] ${currentStyle.bgAlpha} opacity-60 transition-all duration-500`}
          />
          <h1
            className={`text-3xl font-extrabold text-transparent bg-clip-text bg-linear-to-r ${currentStyle.gradientText} flex items-center gap-2 z-10 tracking-wide transition-all duration-500`}
          >
            <Sparkles className={`w-6 h-6 ${currentStyle.textClass} animate-pulse`} />
            FORJAR NOVA MOLDURA
          </h1>
          <p className="text-slate-400 text-sm mt-2 z-10 max-w-md">
            Crie artefatos exclusivos para customização cosmética e distribua na rede.
          </p>
        </div>

        <div className="p-8">
          {error && (
            <div className="bg-red-500/10 text-red-400 p-4 rounded-xl mb-6 text-sm border border-red-500/20 flex items-center gap-2">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 text-emerald-400 p-4 rounded-xl mb-6 text-sm border border-emerald-500/20 flex items-center gap-2">
              {success}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <form onSubmit={handleSubmit} className="space-y-6 lg:col-span-7">
              {/* Nome da Moldura */}
              <div>
                <label className="flex items-center gap-2 text-slate-300 mb-2 font-semibold text-sm tracking-wide uppercase">
                  <FileText className={`w-4 h-4 ${currentStyle.textClass}`} /> Nome da Moldura
                  <span className="text-xs text-slate-500 font-normal ml-auto">
                    {formData.name.length}/{MAX_NAME_LENGTH}
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData((prev) => ({ ...prev, name: value }));
                    setErrors((prev) => ({ ...prev, name: validateName(value) }));
                  }}
                  className={`w-full bg-slate-950/80 border rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none transition-all ${
                    errors.name 
                      ? 'border-red-500/50 focus:ring-red-500/50' 
                      : 'border-slate-800 focus:ring-1'
                  } ${currentStyle.focusRing}`}
                  required
                  placeholder="Ex: Singularidade Estelar"
                  maxLength={MAX_NAME_LENGTH}
                />
                {errors.name && (
                  <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Descrição do Artefato */}
              <div>
                <label className="flex items-center gap-2 text-slate-300 mb-2 font-semibold text-sm tracking-wide uppercase">
                  <FileText className={`w-4 h-4 ${currentStyle.textClass}`} /> Descrição do Artefato
                  <span className="text-xs text-slate-500 font-normal ml-auto">
                    {formData.description.length}/{MAX_DESCRIPTION_LENGTH}
                  </span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData((prev) => ({ ...prev, description: value }));
                    setErrors((prev) => ({ ...prev, description: validateDescription(value) }));
                  }}
                  className={`w-full bg-slate-950/80 border rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none transition-all resize-none ${
                    errors.description 
                      ? 'border-red-500/50 focus:ring-red-500/50' 
                      : 'border-slate-800 focus:ring-1'
                  } ${currentStyle.focusRing}`}
                  rows={3}
                  placeholder="Descreva a história ou efeitos visuais desta moldura..."
                  maxLength={MAX_DESCRIPTION_LENGTH}
                />
                {errors.description && (
                  <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {errors.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-slate-300 mb-2 font-semibold text-sm tracking-wide uppercase">
                    <Layers className={`w-4 h-4 ${currentStyle.textClass}`} /> Nível de Raridade
                  </label>
                  <select
                    value={formData.rarity}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (VALID_RARITIES.includes(value as Rarity)) {
                        setFormData((prev) => ({ ...prev, rarity: value as Rarity }));
                      }
                    }}
                    className={`w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none ${currentStyle.focusRing} focus:ring-1 transition-all cursor-pointer`}
                  >
                    <option value={RARITY.COMUM}>🟢 Comum</option>
                    <option value={RARITY.RARO}>🔵 Raro</option>
                    <option value={RARITY.EPICO}>🟣 Épico</option>
                    <option value={RARITY.LENDARIO}>🟠 Lendário</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-slate-300 mb-2 font-semibold text-sm tracking-wide uppercase">
                    <Package className={`w-4 h-4 ${currentStyle.textClass}`} /> Lote de Upload
                  </label>
                  <div className="bg-slate-950/40 border border-slate-800 rounded-xl px-4 py-3 text-slate-400 text-sm flex items-center h-11.5">
                    {currentPackage ? `${currentPackage.quantity} Unidades` : 'Selecione um pacote'}
                  </div>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-slate-300 mb-3 font-semibold text-sm tracking-wide uppercase">
                  <Package className={`w-4 h-4 ${currentStyle.textClass}`} /> Seleção do Pacote de
                  Distribuição
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {packages.map((pkg) => {
                    const isSelected = selectedPackageId === pkg.id;
                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={handlePackageSelect(pkg.id, pkg.quantity)}
                        className={`relative text-left p-4 rounded-xl border transition-all duration-200 bg-linear-to-br hover:border-purple-500/50 select-none ${
                          isSelected
                            ? `${activePackageColor} ring-1 ring-purple-500/30 shadow-lg border-transparent`
                            : 'from-slate-950/40 to-slate-900/40 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div
                              className={`font-bold text-sm tracking-wide ${isSelected ? 'text-white' : 'text-slate-200'}`}
                            >
                              {pkg.name}
                            </div>
                            <div className="text-xs mt-0.5 opacity-80">{pkg.quantity} Unidades</div>
                            <div className="text-[11px] mt-2 opacity-60 italic">
                              Multiplicador de Custo: {pkg.multiplier}x
                            </div>
                          </div>
                          {isSelected && (
                            <div className="p-1 bg-purple-500/30 rounded-full text-white">
                              <Check className="w-3 h-3" strokeWidth={3} />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                  {packages.length === 0 && (
                    <p className="text-slate-500 text-xs col-span-2 italic">
                      Nenhum pacote disponível para esta raridade.
                    </p>
                  )}
                </div>
              </div>

              {/* Uploads de Arquivos Dinâmicos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-slate-300 mb-2 font-semibold text-sm tracking-wide uppercase">
                    <ImageIcon className={`w-4 h-4 ${currentStyle.textClass}`} /> Camada da Moldura
                  </label>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/gif,image/jfif"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className={`flex flex-col items-center justify-center gap-2 border border-dashed border-slate-800 hover:${currentStyle.borderClass} rounded-xl p-4 bg-slate-950/40 text-slate-300 text-sm font-medium transition-all cursor-pointer text-center group min-h-22.5 select-none`}
                  >
                    <UploadCloud className="w-5 h-5 text-slate-500 group-hover:text-purple-400 transition-colors" />
                    <span>{imageFile ? 'Alterar Ativo Principal' : 'Carregar Moldura'}</span>
                  </label>
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                    Recomendado PNG transparente. A arte pode extrapolar as dimensões do avatar.
                  </p>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-slate-300 mb-2 font-semibold text-sm tracking-wide uppercase">
                    <ImageIcon className={`w-4 h-4 ${currentStyle.textClass}`} /> Miniatura
                    (Opcional)
                  </label>
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/jfif"
                    onChange={handleThumbnailChange}
                    className="hidden"
                    id="thumbnail-upload"
                    disabled={!imageFile}
                  />

                  <div className="relative">
                    <label
                      htmlFor={imageFile ? 'thumbnail-upload' : undefined}
                      className={`flex flex-col items-center justify-center gap-2 border border-dashed rounded-xl p-4 bg-slate-950/40 text-sm font-medium transition-all text-center group min-h-22.5 select-none ${
                        imageFile
                          ? `border-slate-800 hover:${currentStyle.borderClass} text-slate-300 cursor-pointer`
                          : 'border-slate-900/20 text-slate-600 cursor-not-allowed opacity-40 select-none'
                      }`}
                    >
                      <UploadCloud
                        className={`w-5 h-5 transition-colors ${imageFile ? 'text-slate-500 group-hover:text-purple-400' : 'text-slate-700'}`}
                      />
                      <span>
                        {!imageFile
                          ? 'Aguardando Moldura...'
                          : thumbnailFile
                            ? 'Alterar Miniatura'
                            : 'Carregar Miniatura'}
                      </span>
                    </label>

                    {thumbnailFile && (
                      <button
                        type="button"
                        onClick={handleRemoveThumbnail}
                        className="absolute top-2 right-2 p-1.5 bg-red-500/10 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-lg border border-red-500/20 transition-all z-20"
                        title="Remover Miniatura"
                      >
                        <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                    {!imageFile
                      ? '⚠️ Faça o upload da moldura principal para liberar esta opção.'
                      : 'Imagem utilizada para exibição em feeds, inventário e listagens da loja.'}
                  </p>
                </div>
              </div>

              {/* Tabela de Custos Atualizada */}
              <div
                className={`bg-slate-950/60 rounded-xl p-5 border ${currentStyle.borderClass} space-y-3 transition-all duration-500`}
              >
                <div className="flex justify-between items-center text-sm text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-slate-500" /> Custo Base ({formData.rarity})
                  </span>
                  <span className="font-semibold text-slate-200">
                    {formatPrice(currentPackage?.pricePerUnit || 0)} (Unidade)
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-slate-500" /> Multiplicador do Lote
                  </span>
                  <span className="font-semibold text-slate-200">
                    {currentPackage
                      ? `${currentPackage.multiplier}x (${currentPackage.name})`
                      : '1x'}
                  </span>
                </div>

                {/* Linha separadora + Saldo do Usuário vs Custo Final */}
                <div className="border-t border-slate-800/80 my-2 pt-3 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-400">Seu Saldo</span>
                    <span
                      className={`text-sm font-bold ${hasInsufficientCoins ? 'text-red-400' : 'text-slate-400'}`}
                    >
                      {formatPrice(userCoins)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-sm font-semibold ${currentStyle.textClass} transition-colors duration-500`}
                    >
                      Custo de Emissão do Contrato
                    </span>
                    <span
                      className={`text-xl font-black text-transparent bg-clip-text bg-linear-to-r ${currentStyle.gradientText} transition-all duration-500`}
                    >
                      {formatPrice(creationCost)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading || hasInsufficientCoins || hasErrors}
                  className={`${
                    hasInsufficientCoins || hasErrors
                      ? 'bg-red-950/40 text-red-500 border border-red-500/20 cursor-not-allowed opacity-70'
                      : `bg-linear-to-r ${currentStyle.buttonSubmit} text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`
                  } font-semibold text-sm px-6 py-3.5 rounded-xl transition-all flex-1 text-center tracking-wide select-none`}
                >
                  {loading
                    ? 'FORJANDO ATIVO...'
                    : hasErrors
                      ? 'CORRIGIR CAMPOS'
                      : hasInsufficientCoins
                        ? 'SALDO INSUFICIENTE'
                        : 'CONFIRMAR CRIAÇÃO'}
                </button>
                <Link
                  href="/worldo/cosmetics/marketplace"
                  className="bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-slate-200 font-semibold text-sm px-6 py-3.5 rounded-xl transition-all flex items-center justify-center gap-1.5 sm:flex-1 text-center select-none"
                >
                  <X className="w-4 h-4" /> CANCELAR
                </Link>
              </div>
            </form>

            <div className="lg:col-span-5 lg:sticky lg:top-8 space-y-4">
              <div
                className={`bg-slate-950/40 rounded-2xl p-8 border ${currentStyle.borderClass} text-center transition-all duration-500`}
              >
                <h3 className="text-sm font-semibold tracking-wider text-slate-400 uppercase mb-10 flex items-center justify-center gap-2">
                  <Sparkles className={`w-4 h-4 ${currentStyle.textClass}`} />
                  Preview de Cosmético
                </h3>

                {imagePreview ? (
                  <div className="flex flex-col md:flex-row flex-wrap gap-6">
                    <div className="flex-1 bg-slate-950/60 rounded-xl p-8 border border-slate-900 shadow-xl flex flex-col items-center justify-between gap-6">
                      <div className="relative min-h-40 flex items-center justify-center">
                        <AvatarWithFrame
                          avatarUrl={avatarUrl && avatarUrl !== 'None' ? avatarUrl : null}
                          name={session?.user?.name}
                          frameUrl={imagePreview}
                          rarity={formData.rarity}
                          size="md"
                          priority
                        />
                      </div>
                      <div
                        className={`bg-purple-500/10 px-4 py-1.5 rounded-full border ${currentStyle.borderClass} shadow-sm backdrop-blur-md`}
                      >
                        <p
                          className={`text-xs font-semibold tracking-wider ${currentStyle.textClass} uppercase`}
                        >
                          Preview de Moldura
                        </p>
                      </div>
                    </div>

                    {thumbnailPreview && (
                      <div className="flex-1 bg-slate-950/60 rounded-xl p-8 border border-slate-900 shadow-xl flex flex-col items-center justify-between gap-6">
                        <div className="relative group mx-auto">
                          <div
                            className={`absolute -inset-1 rounded-xl bg-linear-to-r ${currentStyle.glow} opacity-20 group-hover:opacity-40 transition-opacity duration-300 blur`}
                          ></div>
                          <div
                            className={`relative w-32 h-32 rounded-xl overflow-hidden border shadow-inner bg-slate-900/80 flex items-center justify-center z-10 ${currentStyle.borderClass}`}
                          >
                            <ClientImage
                              src={thumbnailPreview}
                              alt="Miniatura"
                              fill
                              className="object-cover"
                            />
                          </div>
                        </div>
                        <div
                          className={`bg-purple-500/10 px-4 py-1.5 rounded-full border ${currentStyle.borderClass} shadow-sm backdrop-blur-md`}
                        >
                          <p
                            className={`text-xs font-semibold tracking-wider ${currentStyle.textClass} uppercase`}
                          >
                            Preview de Miniatura
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-950/60 rounded-xl p-16 border border-slate-900 flex flex-col items-center justify-center min-h-90">
                    <div className="w-20 h-20 rounded-2xl bg-slate-900 flex items-center justify-center border border-slate-800 text-slate-600 mb-6 shadow-inner">
                      <ImageIcon className="w-10 h-10" />
                    </div>
                    <p className="text-slate-500 text-sm max-w-60 leading-relaxed mx-auto">
                      Selecione uma imagem para visualizar como o cosmético ficará depois de sua
                      criação.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}