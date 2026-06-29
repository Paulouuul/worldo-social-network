'use client';

import { useRef, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ClientImage } from '@/components/ClientImage';
import { backendApiCall } from '@/lib/backendApiClient';
import { redirect } from 'next/navigation';
import {
  Sparkles,
  User,
  AtSign,
  FileText,
  MapPin,
  Link2,
  Upload,
  Trash2,
  Save,
  X,
  Image as ImageIcon,
  AlertTriangle,
} from 'lucide-react';

export default function EditProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // CONSTANTES DE VALIDAÇÃO
  const MAX_NAME_LENGTH = 50;
  const MIN_NAME_LENGTH = 3;
  const MAX_USERNAME_LENGTH = 30;
  const MIN_USERNAME_LENGTH = 3;
  const MAX_BIO_LENGTH = 500;
  const MAX_LOCATION_LENGTH = 100;
  const MAX_WEBSITE_LENGTH = 200;

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    bio: '',
    location: '',
    website: '',
    avatar: '',
    coverImage: '',
  });

  // ESTADOS DE ERRO POR CAMPO
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    username: '',
    bio: '',
    location: '',
    website: '',
  });

  // FUNÇÕES DE VALIDAÇÃO
  const validateName = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return 'Nome é obrigatório';
    if (trimmed.length < MIN_NAME_LENGTH) return `Nome deve ter pelo menos ${MIN_NAME_LENGTH} caracteres`;
    if (trimmed.length > MAX_NAME_LENGTH) return `Nome deve ter no máximo ${MAX_NAME_LENGTH} caracteres`;
    return '';
  };

  const validateUsername = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return 'Username é obrigatório';
    if (trimmed.length < MIN_USERNAME_LENGTH) return `Username deve ter pelo menos ${MIN_USERNAME_LENGTH} caracteres`;
    if (trimmed.length > MAX_USERNAME_LENGTH) return `Username deve ter no máximo ${MAX_USERNAME_LENGTH} caracteres`;
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      return 'Username deve conter apenas letras, números e underscore';
    }
    return '';
  };

  const validateBio = (value: string) => {
    if (value.length > MAX_BIO_LENGTH) return `Bio deve ter no máximo ${MAX_BIO_LENGTH} caracteres`;
    return '';
  };

  const validateLocation = (value: string) => {
    if (value.length > MAX_LOCATION_LENGTH) return `Localização deve ter no máximo ${MAX_LOCATION_LENGTH} caracteres`;
    return '';
  };

  const validateWebsite = (value: string) => {
    if (value.length > MAX_WEBSITE_LENGTH) return `Website deve ter no máximo ${MAX_WEBSITE_LENGTH} caracteres`;
    if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
      return 'Website deve começar com http:// ou https://';
    }
    return '';
  };

  // Verifica se todos os campos obrigatórios estão preenchidos
  const isFormFilled = formData.name && formData.username;

  // Verifica se há erros em algum campo (apenas para validação, não afeta o botão)

  // Estados para o Avatar
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Estados para o Cover
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [removeCover, setRemoveCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (session?.user && !hasLoaded.current) {
      hasLoaded.current = true;
      setFormData({
        name: session.user.name || '',
        username: session.user.username || '',
        bio: session.user.bio || '',
        location: session.user.location || '',
        website: session.user.website || '',
        avatar: session.user.avatar || '',
        coverImage: session.user.coverImage || '',
      });
      setAvatarPreview(session.user.avatar || '');
      setCoverPreview(session.user.coverImage || '');
    }
  }, [session]);

  if (status === 'unauthenticated') {
    redirect('/login');
  }

  if (status === 'loading' || !session?.user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
        <span className="ml-3 mt-4 text-purple-300 font-medium text-sm">
          Sincronizando terminal...
        </span>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jfif', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError(`Formato de ${type} não suportado.`);
      return;
    }

    const maxSize = type === 'avatar' ? 5 * 1024 * 1024 : 8 * 1024 * 1024;

    if (file.type === 'image/gif') {
      const gifLimit = type === 'avatar' ? 3 : 5;
      if (file.size > gifLimit * 1024 * 1024) {
        setError(`GIF muito grande para ${type}. Máximo: ${gifLimit}MB`);
        return;
      }
    }

    if (file.size > maxSize) {
      setError(`Arquivo de ${type} muito grande. Máximo ${maxSize / 1024 / 1024}MB.`);
      return;
    }

    if (type === 'avatar') {
      if (avatarPreview && avatarPreview.startsWith('blob:')) URL.revokeObjectURL(avatarPreview);
      setAvatarFile(file);
      setRemoveAvatar(false);
      setAvatarPreview(URL.createObjectURL(file));
    } else {
      if (coverPreview && coverPreview.startsWith('blob:')) URL.revokeObjectURL(coverPreview);
      setCoverFile(file);
      setRemoveCover(false);
      setCoverPreview(URL.createObjectURL(file));
    }
    setError('');
  };

  const handleRemoveAvatar = () => {
    if (avatarPreview.startsWith('blob:')) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(null);
    setRemoveAvatar(true);
    setAvatarPreview('');
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  const handleRemoveCover = () => {
    if (coverPreview.startsWith('blob:')) URL.revokeObjectURL(coverPreview);
    setCoverFile(null);
    setRemoveCover(true);
    setCoverPreview('');
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (!session?.user.publicId) {
      router.replace('login');
    }
    e.preventDefault();
    
    // VALIDAÇÃO ANTES DE ENVIAR
    const nameError = validateName(formData.name);
    const usernameError = validateUsername(formData.username);
    const bioError = validateBio(formData.bio);
    const locationError = validateLocation(formData.location);
    const websiteError = validateWebsite(formData.website);

    setFieldErrors({
      name: nameError,
      username: usernameError,
      bio: bioError,
      location: locationError,
      website: websiteError,
    });

    if (nameError || usernameError || bioError || locationError || websiteError) {
      setError('Corrija os campos destacados antes de salvar');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('username', formData.username.trim());
      submitData.append('bio', formData.bio);
      submitData.append('location', formData.location);
      submitData.append('website', formData.website);

      if (avatarFile) submitData.append('avatar', avatarFile);
      if (removeAvatar) submitData.append('removeAvatar', 'true');

      if (coverFile) submitData.append('cover', coverFile);
      if (removeCover) submitData.append('removeCover', 'true');
      
      const res = await backendApiCall('/profile/update', {
        method: 'PUT',
        body: submitData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || 'Erro ao atualizar perfil');
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // REVERSÃO NA UI
        if (avatarFile || removeAvatar) {
          if (avatarPreview.startsWith('blob:')) URL.revokeObjectURL(avatarPreview);
          setAvatarFile(null);
          setRemoveAvatar(false);
          setAvatarPreview(formData.avatar || '');
          if (avatarInputRef.current) avatarInputRef.current.value = '';
        }

        if (coverFile || removeCover) {
          if (coverPreview.startsWith('blob:')) URL.revokeObjectURL(coverPreview);
          setCoverFile(null);
          setRemoveCover(false);
          setCoverPreview(formData.coverImage || '');
          if (coverInputRef.current) coverInputRef.current.value = '';
        }
      } else {
        setSuccess('Perfil atualizado com sucesso!');
        window.scrollTo({ top: 0, behavior: 'smooth' });

        const updatedUser = {
          name: data.user?.name ?? formData.name,
          username: data.user?.username ?? formData.username,
          bio: data.user?.bio ?? '',
          location: data.user?.location ?? '',
          website: data.user?.website ?? '',
          avatar: data.user?.avatar ?? formData.avatar,
          coverImage: data.user?.coverImage ?? formData.coverImage,
        };
        
        setFormData(updatedUser);

        await update({
          user: updatedUser,
        });

        setAvatarFile(null);
        setRemoveAvatar(false);
        setCoverFile(null);
        setRemoveCover(false);

        setTimeout(() => {
          setSuccess('');
        }, 1500);
      }
    } catch (_err) {
      setError('Erro ao conectar com o servidor');
      if (avatarPreview.startsWith('blob:')) URL.revokeObjectURL(avatarPreview);
      if (coverPreview.startsWith('blob:')) URL.revokeObjectURL(coverPreview);
      setAvatarFile(null);
      setCoverFile(null);
      setRemoveAvatar(false);
      setRemoveCover(false);
      setAvatarPreview(formData.avatar || '');
      setCoverPreview(formData.coverImage || '');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (session?.user?.publicId) {
      router.push(`/worldo/perfil/${session.user?.publicId}`);
    } else {
      router.replace('/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 relative overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-purple-900/10 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-purple-500/20 to-transparent" />

      <div className="max-w-2xl w-full bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-800/80 shadow-2xl p-8 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8 border-b border-slate-800/60 pb-5">
          <div className="bg-purple-500/10 p-2.5 rounded-xl border border-purple-500/20">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-purple-400 via-pink-400 to-indigo-400 tracking-wide uppercase">
              Modificar Perfil
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              Ajuste suas informações públicas e credenciais de exibição
            </p>
          </div>
        </div>

        {/* Alertas */}
        {error && (
          <div className="bg-red-500/10 text-red-400 p-3 rounded-xl mb-6 text-xs border border-red-500/20 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-xl mb-6 text-xs border border-emerald-500/20 flex items-center gap-2">
            <span className="leading-relaxed">{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SEÇÃO: Imagem de Capa (Cover) */}
          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/50">
            <label className="flex items-center gap-1.5 text-slate-300 mb-3 font-semibold text-xs tracking-wide uppercase">
              <ImageIcon className="w-3.5 h-3.5 text-purple-400" /> Capa do Perfil / Banner
            </label>

            <div className="space-y-4">
              <div className="relative w-full h-36 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center group shadow-inner">
                {coverPreview && coverPreview !== 'None' ? (
                  <ClientImage
                    src={coverPreview}
                    alt="Cover Preview"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="text-slate-600 flex flex-col items-center gap-1">
                    <ImageIcon className="w-8 h-8 stroke-[1.5]" />
                    <span className="text-[10px] uppercase tracking-wider font-medium">
                      Sem imagem de capa
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/jfif"
                    onChange={(e) => handleFileChange(e, 'cover')}
                    className="hidden"
                    id="cover-upload"
                    disabled={loading}
                  />
                  <label
                    htmlFor="cover-upload"
                    className="cursor-pointer inline-flex items-center gap-1.5 bg-slate-950 border border-slate-800 hover:bg-slate-900/80 text-slate-300 hover:text-white py-2 px-3.5 rounded-xl transition text-xs font-semibold"
                  >
                    <Upload className="w-3.5 h-3.5 text-purple-400" /> Transmitir Capa
                  </label>

                  {coverPreview && coverPreview !== 'None' && !removeCover && (
                    <button
                      type="button"
                      onClick={handleRemoveCover}
                      className="inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 py-2 px-3.5 rounded-xl transition text-xs font-semibold"
                      disabled={loading}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remover
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-500">Máximo: 8MB (GIFs: 5MB)</p>
              </div>
            </div>
          </div>

          {/* SEÇÃO: Avatar de Rede */}
          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/50">
            <label className="flex items-center gap-1.5 text-slate-300 mb-3 font-semibold text-xs tracking-wide uppercase">
              Avatar de Rede
            </label>
            <div className="flex items-center gap-5">
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-purple-500/30 bg-slate-950 shrink-0 shadow-inner">
                {avatarPreview && avatarPreview !== 'None' ? (
                  <ClientImage
                    src={avatarPreview}
                    alt="Avatar Preview"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl text-white font-black">
                    ?
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/jfif"
                  onChange={(e) => handleFileChange(e, 'avatar')}
                  className="hidden"
                  id="avatar-upload"
                  disabled={loading}
                />

                <div className="flex flex-wrap items-center gap-2">
                  <label
                    htmlFor="avatar-upload"
                    className="cursor-pointer inline-flex items-center gap-1.5 bg-slate-950 border border-slate-800 hover:bg-slate-900/80 text-slate-300 hover:text-white py-2 px-3.5 rounded-xl transition text-xs font-semibold"
                  >
                    <Upload className="w-3.5 h-3.5 text-purple-400" /> Transmitir foto
                  </label>

                  {avatarPreview && avatarPreview !== 'None' && !removeAvatar && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 py-2 px-3.5 rounded-xl transition text-xs font-semibold"
                      disabled={loading}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remover
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Máximo: 5MB (GIFs: 3MB).
                </p>
              </div>
            </div>
          </div>

          {/* Grid de Inputs de Texto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Username */}
            <div>
              <label className="flex items-center gap-1.5 text-slate-300 mb-1.5 font-semibold text-xs tracking-wide uppercase">
                <AtSign className="w-3.5 h-3.5 text-purple-400" /> Usuário de Acesso
                <span className="text-[10px] text-slate-500 font-normal ml-auto">
                  {formData.username.length}/{MAX_USERNAME_LENGTH}
                </span>
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => {
                  const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                  setFormData({ ...formData, username: value });
                  setFieldErrors({ ...fieldErrors, username: validateUsername(value) });
                }}
                className={`w-full bg-slate-950/80 border rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none transition-all text-sm ${
                  fieldErrors.username
                    ? 'border-red-500/50 focus:ring-red-500/50'
                    : 'border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30'
                }`}
                required
                disabled={loading}
                placeholder="usuario_123"
                maxLength={MAX_USERNAME_LENGTH}
              />
              {fieldErrors.username && (
                <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {fieldErrors.username}
                </p>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="flex items-center gap-1.5 text-slate-300 mb-1.5 font-semibold text-xs tracking-wide uppercase">
                <User className="w-3.5 h-3.5 text-purple-400" /> Nome de Exibição
                <span className="text-[10px] text-slate-500 font-normal ml-auto">
                  {formData.name.length}/{MAX_NAME_LENGTH}
                </span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ ...formData, name: value });
                  setFieldErrors({ ...fieldErrors, name: validateName(value) });
                }}
                className={`w-full bg-slate-950/80 border rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none transition-all text-sm ${
                  fieldErrors.name
                    ? 'border-red-500/50 focus:ring-red-500/50'
                    : 'border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30'
                }`}
                required
                disabled={loading}
                placeholder="Seu nome"
                maxLength={MAX_NAME_LENGTH}
              />
              {fieldErrors.name && (
                <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {fieldErrors.name}
                </p>
              )}
            </div>
          </div>

          {/* Biografia */}
          <div>
            <label className="flex items-center gap-1.5 text-slate-300 mb-1.5 font-semibold text-xs tracking-wide uppercase">
              <FileText className="w-3.5 h-3.5 text-purple-400" /> Biografia da Entidade
              <span className="text-[10px] text-slate-500 font-normal ml-auto">
                {formData.bio.length}/{MAX_BIO_LENGTH}
              </span>
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => {
                const value = e.target.value;
                setFormData({ ...formData, bio: value });
                setFieldErrors({ ...fieldErrors, bio: validateBio(value) });
              }}
              className={`w-full bg-slate-950/80 border rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none transition-all text-sm resize-none ${
                fieldErrors.bio
                  ? 'border-red-500/50 focus:ring-red-500/50'
                  : 'border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30'
              }`}
              disabled={loading}
              rows={3}
              placeholder="Fale um pouco sobre sua trajetória na rede..."
              maxLength={MAX_BIO_LENGTH}
            />
            {fieldErrors.bio && (
              <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {fieldErrors.bio}
              </p>
            )}
          </div>

          {/* Localização e Website */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Location */}
            <div>
              <label className="flex items-center gap-1.5 text-slate-300 mb-1.5 font-semibold text-xs tracking-wide uppercase">
                <MapPin className="w-3.5 h-3.5 text-purple-400" /> Coordenadas / Localização
                <span className="text-[10px] text-slate-500 font-normal ml-auto">
                  {formData.location.length}/{MAX_LOCATION_LENGTH}
                </span>
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ ...formData, location: value });
                  setFieldErrors({ ...fieldErrors, location: validateLocation(value) });
                }}
                className={`w-full bg-slate-950/80 border rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none transition-all text-sm ${
                  fieldErrors.location
                    ? 'border-red-500/50 focus:ring-red-500/50'
                    : 'border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30'
                }`}
                disabled={loading}
                placeholder="Cidade, Estado ou Planeta"
                maxLength={MAX_LOCATION_LENGTH}
              />
              {fieldErrors.location && (
                <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {fieldErrors.location}
                </p>
              )}
            </div>

            {/* Website */}
            <div>
              <label className="flex items-center gap-1.5 text-slate-300 mb-1.5 font-semibold text-xs tracking-wide uppercase">
                <Link2 className="w-3.5 h-3.5 text-purple-400" /> Link de Hipertexto
                <span className="text-[10px] text-slate-500 font-normal ml-auto">
                  {formData.website.length}/{MAX_WEBSITE_LENGTH}
                </span>
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ ...formData, website: value });
                  setFieldErrors({ ...fieldErrors, website: validateWebsite(value) });
                }}
                className={`w-full bg-slate-950/80 border rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none transition-all text-sm ${
                  fieldErrors.website
                    ? 'border-red-500/50 focus:ring-red-500/50'
                    : 'border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30'
                }`}
                disabled={loading}
                placeholder="https://seusite.com"
                maxLength={MAX_WEBSITE_LENGTH}
              />
              {fieldErrors.website && (
                <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {fieldErrors.website}
                </p>
              )}
            </div>
          </div>

          {/* Ações de Envio */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-800/60">
            <button
              type="submit"
              disabled={loading || !isFormFilled}
              className="flex-1 order-2 sm:order-1 font-semibold text-sm py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 tracking-wide bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  <span>Atualizando Cadeia...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Salvar Sincronização</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 order-1 sm:order-2 bg-slate-950 border border-slate-800 hover:bg-slate-900/80 text-slate-400 hover:text-slate-200 font-semibold text-sm py-3 px-4 rounded-xl transition flex items-center justify-center gap-2"
              disabled={loading}
            >
              <X className="w-4 h-4" />
              <span>Finalizar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}