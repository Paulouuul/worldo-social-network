// app/worldo/perfil/edit/page.tsx
// Página /worldo/perfil/edit: edição do perfil (nome, username, bio, localização, site, avatar e
// capa). Os dados iniciais vêm de useMe() e o envio vai para o backend Python.
'use client';

import { useRef, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import { useMe, type Me } from '@/hooks/queries/useMe';
import { qk } from '@/lib/query/queryKeys';
import { useRouter } from 'next/navigation';
import { ClientImage } from '@/components/ui/media/ClientImage';
import { backendApiCall } from '@/lib/api/backendApiClient';
import { FeedbackMessage } from '@/components/ui/feedback/FeedbackMessage';

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
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/feedback/Loading';
import { PrimaryButton } from '@/components/ui/buttons/PrimaryButton';
import { FieldError, FieldLabel, TextArea, TextInput } from '@/components/ui/forms/FormField';

/** Formato aceito para o site (http/https, domínio, localhost ou IP, porta e caminho opcionais). */
const URL_REGEX =
  /^(https?:\/\/)?(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}\.?|localhost|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::\d+)?(?:\/?|[/?]\S+)$/;

/**
 * Formulário de edição com validação por campo e prévia das imagens. Após salvar, atualiza o
 * cache do perfil (useMe) e do perfil público.
 */
export default function EditProfilePage() {
  const { data: session, status } = useSession();
  const { data: me } = useMe();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Limites de validação
  const MAX_NAME_LENGTH = 50;
  const MIN_NAME_LENGTH = 3;
  const MAX_USERNAME_LENGTH = 30;
  const MIN_USERNAME_LENGTH = 3;
  const MAX_BIO_LENGTH = 500;
  const MAX_LOCATION_LENGTH = 30;
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

  // Erro de validação de cada campo
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    username: '',
    bio: '',
    location: '',
    website: '',
  });

  /** Valida o nome de exibição: 3–50 caracteres. */
  const validateName = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return 'Nome é obrigatório';
    if (trimmed.length < MIN_NAME_LENGTH)
      return `Nome deve ter pelo menos ${MIN_NAME_LENGTH} caracteres`;
    if (trimmed.length > MAX_NAME_LENGTH)
      return `Nome deve ter no máximo ${MAX_NAME_LENGTH} caracteres`;
    return '';
  };

  /** Valida o username: 3–30 caracteres com letras, números e underscore. */
  const validateUsername = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return 'Username é obrigatório';
    if (trimmed.length < MIN_USERNAME_LENGTH)
      return `Username deve ter pelo menos ${MIN_USERNAME_LENGTH} caracteres`;
    if (trimmed.length > MAX_USERNAME_LENGTH)
      return `Username deve ter no máximo ${MAX_USERNAME_LENGTH} caracteres`;
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      return 'Username deve conter apenas letras, números e underscore';
    }
    return '';
  };

  /** Valida a bio: até 500 caracteres. */
  const validateBio = (value: string) => {
    if (value.length > MAX_BIO_LENGTH) return `Bio deve ter no máximo ${MAX_BIO_LENGTH} caracteres`;
    return '';
  };

  /** Valida a localização: até 30 caracteres. */
  const validateLocation = (value: string) => {
    if (value.length > MAX_LOCATION_LENGTH)
      return `Localização deve ter no máximo ${MAX_LOCATION_LENGTH} caracteres`;
    return '';
  };

  /**
   * Valida o site (opcional): até 200 caracteres e formato de URL, assumindo https:// quando
   * ausente.
   */
  const validateWebsite = (value: string) => {
    if (!value) return '';

    if (value.length > MAX_WEBSITE_LENGTH)
      return `Website deve ter no máximo ${MAX_WEBSITE_LENGTH} caracteres`;

    let testUrl = value;
    if (!testUrl.startsWith('http://') && !testUrl.startsWith('https://')) {
      testUrl = `https://${testUrl}`;
    }

    if (!URL_REGEX.test(testUrl)) {
      return 'URL inválida.';
    }
    return '';
  };

  // Campos obrigatórios preenchidos
  const isFormFilled = formData.name && formData.username;

  // Algum campo com erro (desabilita o botão de salvar)
  const hasErrors = Object.values(fieldErrors).some((errorMsg) => errorMsg !== '');

  /** Impede digitar espaços no campo. */
  const handleKeyDownNoSpaces = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ') {
      e.preventDefault();
    }
  };

  // Avatar: arquivo novo, prévia e remoção
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Capa: arquivo novo, prévia e remoção
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [removeCover, setRemoveCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (me && !hasLoaded.current) {
      hasLoaded.current = true;
      setFormData({
        name: me.name || '',
        username: me.username || '',
        bio: me.bio || '',
        location: me.location || '',
        website: me.website || '',
        avatar: me.avatar || '',
        coverImage: me.coverImage || '',
      });
      setAvatarPreview(me.avatar || '');
      setCoverPreview(me.coverImage || '');
    }
  }, [me]);

  if (status === 'loading' || !session?.user || !me) {
    return <LoadingSpinner text="Carregando terminal de perfil..." withBackground fullScreen />;
  }

  /** Valida o arquivo de avatar (até 5MB, GIF 3MB) ou capa (até 8MB, GIF 5MB) e mostra a prévia. */
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

  /** Marca o avatar para remoção e limpa a prévia. */
  const handleRemoveAvatar = () => {
    if (avatarPreview.startsWith('blob:')) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(null);
    setRemoveAvatar(true);
    setAvatarPreview('');
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  /** Marca a capa para remoção e limpa a prévia. */
  const handleRemoveCover = () => {
    if (coverPreview.startsWith('blob:')) URL.revokeObjectURL(coverPreview);
    setCoverFile(null);
    setRemoveCover(true);
    setCoverPreview('');
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  /**
   * Valida os campos e envia o FormData para /profile/update no backend. Em erro, desfaz as
   * prévias de imagem; em sucesso, atualiza o formulário e o cache do perfil.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    if (!session?.user.publicId) {
      router.replace('login');
    }
    e.preventDefault();

    // Valida todos os campos antes de enviar
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

        // Desfaz as prévias de imagem enviadas
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

        // Atualiza o cache do perfil (Header, inventário etc. reagem na hora) e revalida no servidor
        queryClient.setQueryData<Me>(qk.me(), (old) =>
          old
            ? {
                ...old,
                ...updatedUser,
                avatar: updatedUser.avatar || null,
                coverImage: updatedUser.coverImage || null,
              }
            : old,
        );
        queryClient.invalidateQueries({ queryKey: qk.me() });
        queryClient.invalidateQueries({ queryKey: qk.user(me.publicId) });

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

  /** Volta para o perfil público do usuário (ou para /login sem sessão). */
  const handleCancel = () => {
    if (session?.user?.publicId) {
      router.push(`/worldo/perfil/${session.user?.publicId}`);
    } else {
      router.replace('/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 relative overflow-hidden flex items-center justify-center">
      <div className="glow-backdrop" />
      <div className="hairline-top" />

      <div className="max-w-2xl w-full bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-800/80 shadow-2xl p-8 relative z-10">
        {/* Cabeçalho */}
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
        <FeedbackMessage type="error" message={error} className="mb-6" />

        <FeedbackMessage type="success" message={success} className="mb-6" />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Imagem de capa */}
          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/50">
            <FieldLabel icon={ImageIcon} loose>
              Capa do Perfil / Banner
            </FieldLabel>

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

          {/* Avatar */}
          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/50">
            <FieldLabel loose>Avatar de Rede</FieldLabel>
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

          {/* Campos de texto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Username */}
            <div>
              <FieldLabel
                icon={AtSign}
                counter={{ value: formData.username.length, max: MAX_USERNAME_LENGTH }}
              >
                Nome de Usuário *
              </FieldLabel>
              <TextInput
                type="text"
                value={formData.username}
                onKeyDown={handleKeyDownNoSpaces}
                onChange={(e) => {
                  const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                  setFormData({ ...formData, username: value });
                  setFieldErrors({ ...fieldErrors, username: validateUsername(value) });
                }}
                hasError={!!fieldErrors.username}
                required
                disabled={loading}
                placeholder="usuario_123"
                maxLength={MAX_USERNAME_LENGTH}
              />
              <FieldError message={fieldErrors.username} />
            </div>

            {/* Nome de exibição */}
            <div>
              <FieldLabel
                icon={User}
                counter={{ value: formData.name.length, max: MAX_NAME_LENGTH }}
              >
                Nome de Exibição *
              </FieldLabel>
              <TextInput
                type="text"
                value={formData.name}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ ...formData, name: value });
                  setFieldErrors({ ...fieldErrors, name: validateName(value) });
                }}
                onBlur={() => {
                  const trimmed = formData.name.trim().replace(/\s+/g, ' ');
                  if (trimmed !== formData.name) {
                    setFormData({ ...formData, name: trimmed });
                    setFieldErrors({ ...fieldErrors, name: validateName(trimmed) });
                  }
                }}
                hasError={!!fieldErrors.name}
                required
                disabled={loading}
                placeholder="Seu nome"
                maxLength={MAX_NAME_LENGTH}
              />
              <FieldError message={fieldErrors.name} />
            </div>
          </div>

          {/* Biografia */}
          <div>
            <FieldLabel
              icon={FileText}
              counter={{ value: formData.bio.length, max: MAX_BIO_LENGTH }}
            >
              Biografia da Entidade
            </FieldLabel>
            <TextArea
              value={formData.bio}
              onChange={(e) => {
                const value = e.target.value;
                setFormData({ ...formData, bio: value });
                setFieldErrors({ ...fieldErrors, bio: validateBio(value) });
              }}
              hasError={!!fieldErrors.bio}
              onBlur={() => {
                const trimmed = formData.bio.trim();
                if (trimmed !== formData.bio) {
                  setFormData({ ...formData, bio: trimmed });
                  setFieldErrors({ ...fieldErrors, bio: validateBio(trimmed) });
                }
              }}
              disabled={loading}
              rows={3}
              placeholder="Fale um pouco sobre sua trajetória na rede..."
              maxLength={MAX_BIO_LENGTH}
            />
            <FieldError message={fieldErrors.bio} />
          </div>

          {/* Localização e Website */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Localização */}
            <div>
              <FieldLabel
                icon={MapPin}
                counter={{ value: formData.location.length, max: MAX_LOCATION_LENGTH }}
              >
                Coordenadas / Localização
              </FieldLabel>
              <TextInput
                type="text"
                value={formData.location}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ ...formData, location: value });
                  setFieldErrors({ ...fieldErrors, location: validateLocation(value) });
                }}
                hasError={!!fieldErrors.location}
                disabled={loading}
                placeholder="Cidade, Estado ou Planeta"
                maxLength={MAX_LOCATION_LENGTH}
              />
              <FieldError message={fieldErrors.location} />
            </div>

            {/* Site */}
            <div>
              <FieldLabel
                icon={Link2}
                counter={{ value: formData.website.length, max: MAX_WEBSITE_LENGTH }}
              >
                Link de Hipertexto
              </FieldLabel>
              <TextInput
                type="text"
                value={formData.website}
                onKeyDown={handleKeyDownNoSpaces}
                onChange={(e) => {
                  const value = e.target.value.replace(/\s/g, '');
                  setFormData({ ...formData, website: value });
                  setFieldErrors({ ...fieldErrors, website: validateWebsite(value) });
                }}
                onBlur={() => {
                  let value = formData.website.trim();

                  if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
                    value = `https://${value}`;
                    setFormData({ ...formData, website: value });
                    setFieldErrors({ ...fieldErrors, website: validateWebsite(value) });
                  }
                }}
                hasError={!!fieldErrors.website}
                disabled={loading}
                placeholder="https://seusite.com"
                maxLength={MAX_WEBSITE_LENGTH}
              />
              <FieldError message={fieldErrors.website} />
            </div>
          </div>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-800/60">
            <PrimaryButton
              type="submit"
              disabled={loading || !isFormFilled || hasErrors}
              loading={loading}
              loadingText="Atualizando Cadeia..."
              icon={Save}
              className="flex-1 order-2 sm:order-1"
            >
              Salvar Sincronização
            </PrimaryButton>

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
