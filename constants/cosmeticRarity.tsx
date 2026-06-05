import React from 'react';
import { Sparkles, Orbit, Shield, Layers } from 'lucide-react';

export type RarityLayoutVariant = 'bottom-10' | 'bottom-2' | 'static';

export type RarityDesign = {
  cardClass: string;
  borderClass: string;
  textClass: string;
  bgAlpha: string;
  focusRing: string;
  glow: string;
  gradientHeader: string;
  gradientText: string;
  buttonSubmit: string;
  badge: React.ReactNode;
  bgDecoration?: React.ReactNode;
};

export const getRarityDesigns = (variant: RarityLayoutVariant): Record<string, RarityDesign> => {
  // Helpers para lidar com as diferenças de tamanho e posição
  const isStatic = variant === 'static';
  const pointerEvents = isStatic ? ' pointer-events-none' : '';

  // Classes base das badges que mudam dependendo da variante
  const getPositionClass = () => {
    if (variant === 'bottom-10')
      return 'absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center whitespace-nowrap z-20';
    if (variant === 'bottom-2')
      return 'absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center whitespace-nowrap z-20';
    return 'flex items-center justify-center whitespace-nowrap z-20';
  };

  const positionBase = getPositionClass();

  // Tamanhos que diferem entre as versões absolutas e a versão estática
  const iconLg = isStatic ? 'w-3 h-3' : 'w-2.5 h-2.5';
  const iconSm = isStatic ? 'w-3 h-3' : 'w-2 h-2';

  const textLendario = isStatic ? 'gap-1 text-[10px] px-3 py-1' : 'gap-1 text-[8px] px-2.5 py-0.5';
  const textEpico = isStatic ? 'gap-1 text-[10px] px-3 py-1' : 'gap-1 text-[8px] px-2 py-0.5';
  const textMenor = isStatic ? 'gap-1 text-[10px] px-2 py-1' : 'gap-0.5 text-[8px] px-1.5 py-0.5';

  return {
    LENDARIO: {
      cardClass:
        'border-amber-500/40 bg-gradient-to-b from-amber-950/40 via-slate-950 to-slate-950 shadow-[inset_0_0_20px_rgba(245,158,11,0.05)] hover:border-amber-400/80 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]',
      borderClass: 'border-amber-400/70 shadow-[0_0_15px_rgba(245,158,11,0.25)]',
      textClass:
        'text-amber-400 font-black tracking-wider uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]',
      bgAlpha: 'from-amber-900/20 via-transparent to-transparent',
      focusRing: 'focus:border-amber-500 focus:ring-amber-500/30',
      glow: 'drop-shadow-[0_10px_20px_rgba(245,158,11,0.4)]',
      gradientHeader: 'from-slate-950 via-amber-950/40 to-yellow-950/20',
      gradientText: 'from-amber-400 via-orange-400 to-yellow-400',
      buttonSubmit:
        'from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-900/20',
      badge: (
        <span
          className={`${positionBase} ${textLendario} bg-linear-to-r from-amber-600 to-yellow-500 text-slate-950 font-black rounded-full uppercase tracking-widest shadow-[0_0_10px_rgba(245,158,11,0.4)] border border-amber-300/60`}
        >
          <Sparkles className={`${iconLg} animate-spin`} style={{ animationDuration: '4s' }} />{' '}
          Lendário
        </span>
      ),
      bgDecoration: (
        <>
          <div
            className={`absolute -inset-10 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.08)_0%,transparent_60%)] animate-pulse${pointerEvents}`}
          />
          <div
            className={`absolute top-0 left-0 w-full h-0.5 bg-linear-to-r from-transparent via-amber-400/60 to-transparent${pointerEvents}`}
          />
        </>
      ),
    },
    EPICO: {
      cardClass:
        'border-purple-500/40 bg-gradient-to-br from-purple-900/30 via-slate-950 to-slate-950 shadow-[inset_0_0_15px_rgba(168,85,247,0.05)] hover:border-purple-400/80 hover:shadow-[0_0_15px_rgba(168,85,247,0.15)]',
      borderClass: 'border-purple-400/60 shadow-[0_0_10px_rgba(168,85,247,0.2)]',
      textClass: 'text-purple-300 font-extrabold tracking-wide',
      bgAlpha: 'from-purple-900/20 via-transparent to-transparent',
      focusRing: 'focus:border-purple-500 focus:ring-purple-500/30',
      glow: 'drop-shadow-[0_10px_20px_rgba(147,51,234,0.3)]',
      gradientHeader: 'from-purple-950/60 via-indigo-950/40 to-slate-950',
      gradientText: 'from-purple-400 via-pink-400 to-indigo-400',
      buttonSubmit:
        'from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-900/20',
      badge: (
        <span
          className={`${positionBase} ${textEpico} bg-purple-900/90 text-purple-200 font-black rounded-md uppercase tracking-wider shadow-sm border border-purple-400/50 backdrop-blur-md`}
        >
          <Orbit className={`${iconLg} animate-pulse`} /> Épico
        </span>
      ),
      bgDecoration: (
        <div
          className={`absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(168,85,247,0.08)_0%,transparent_70%)]${pointerEvents}`}
        />
      ),
    },
    RARO: {
      cardClass:
        'border-cyan-700/50 bg-gradient-to-b from-cyan-950/20 to-slate-950 hover:border-cyan-400/60 hover:shadow-[0_0_12px_rgba(6,182,212,0.1)]',
      borderClass: 'border-cyan-500/50',
      textClass: 'text-cyan-400 font-bold',
      bgAlpha: 'from-blue-900/20 via-transparent to-transparent',
      focusRing: 'focus:border-blue-500 focus:ring-blue-500/30',
      glow: 'drop-shadow-[0_10px_20px_rgba(59,130,246,0.3)]',
      gradientHeader: 'from-slate-950 via-blue-950/50 to-slate-950',
      gradientText: 'from-blue-400 via-cyan-400 to-indigo-400',
      buttonSubmit:
        'from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-900/20',
      badge: (
        <span
          className={`${positionBase} ${textMenor} bg-cyan-950/90 text-cyan-300 font-bold rounded uppercase tracking-wide border border-cyan-600/40`}
        >
          <Shield className={iconSm} /> Raro
        </span>
      ),
    },
    COMUM: {
      cardClass: 'border-slate-800/80 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-900/60',
      borderClass: 'border-slate-700/80',
      textClass: 'text-slate-400 font-medium',
      bgAlpha: 'from-slate-950/20 via-transparent to-transparent',
      focusRing: 'focus:border-slate-500 focus:ring-slate-500/30',
      glow: 'drop-shadow-[0_10px_20px_rgba(148,163,184,0.15)]',
      gradientHeader: 'from-slate-950 via-slate-900/40 to-slate-950',
      gradientText: 'from-slate-300 via-slate-400 to-slate-500',
      buttonSubmit:
        'from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 shadow-slate-900/20',
      badge: (
        <span
          className={`${positionBase} ${textMenor} bg-slate-900/90 text-slate-400 font-medium rounded uppercase tracking-wide border border-slate-700/50`}
        >
          <Layers className={iconSm} /> Comum
        </span>
      ),
    },
  };
};
