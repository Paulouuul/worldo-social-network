// components/UserAvatar.tsx
'use client';

import { AvatarWithFrame } from './AvatarWithFrame';
import { useEquippedFrame } from '@/hooks/useEquippedFrame';

export const UserAvatar = ({ user, size = 'md' }: { user: any; size?: 'sm' | 'smsm' | 'md' | 'lg' | 'full' }) => {
  const { frameData } = useEquippedFrame(user.equippedProfileFrameId);

  return (
    <AvatarWithFrame 
      avatarUrl={user.avatar} 
      // Se a API da moldura retorna 'imageUrl' ou 'image', ajuste aqui:
      frameUrl={frameData?.imageUrl || '/default-frame.png'} 
      size={size}
      // Você pode passar o glow do banco se houver na API de cosmetics
      glowClass={frameData?.glowClass} 
    />
  );
};