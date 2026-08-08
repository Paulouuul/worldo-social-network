import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  text?: string;
  withBackground?: boolean;
  fullScreen?: boolean; // Opcional: tela cheia
}

export function LoadingSpinner({
  text = 'Carregando...',
  withBackground = false,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const heightClass = fullScreen ? 'min-h-screen' : 'min-h-[60vh]';

  return (
    <div
      className={`${heightClass} flex flex-col items-center justify-center text-slate-400 
      ${withBackground ? 'bg-slate-950' : ''}`}
    >
      <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-4" />
      <p className="text-sm font-medium text-purple-300 uppercase tracking-wider">{text}</p>
    </div>
  );
}
