// components/ProfileBio.tsx
// Bio do perfil com opção de expandir/recolher textos longos.
'use client';

import { useState } from 'react';

/** Propriedades da bio. */
interface ProfileBioProps {
  bio: string;
}

/** Exibe a bio truncada em 60 caracteres com botão "Ler mais/Ver menos". */
export function ProfileBio({ bio }: ProfileBioProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Limite de caracteres antes de truncar
  const MAX_LENGTH = 60;
  const shouldTruncate = bio.length > MAX_LENGTH;

  return (
    <div className="bg-slate-950/30 border border-slate-800/40 px-3 py-1.5 rounded-lg w-fit max-w-full">
      <div className="flex-1 min-w-0">
        <p className="text-slate-400 text-xs leading-relaxed whitespace-pre-wrap wrap-break-word inline">
          &ldquo;
          {shouldTruncate && !isExpanded ? `${bio.slice(0, MAX_LENGTH).trim()}...` : bio}
          &rdquo;
        </p>

        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-1 text-[10px] font-bold text-purple-400 hover:text-purple-300 transition-colors uppercase tracking-wider active:scale-95 inline-flex items-center gap-1"
          >
            {isExpanded ? 'Ver menos' : 'Ler mais'}
          </button>
        )}
      </div>
    </div>
  );
}
