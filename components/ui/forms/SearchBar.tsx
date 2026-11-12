// components/ui/forms/SearchBar.tsx
// Campo de busca com botão de buscar (lupa), busca ao pressionar Enter e botão de limpar.

'use client';

import { Search, X } from 'lucide-react';

/** Propriedades da busca. `value` é o texto digitado; a busca só é aplicada em `onSearch`. */
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/** Busca controlada: aplica o termo ao clicar na lupa ou pressionar Enter; o X limpa texto e termo. */
export function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder = 'Buscar...',
  className = '',
}: SearchBarProps) {
  /** Limpa o campo e a busca aplicada. */
  const clear = () => {
    onChange('');
    onSearch('');
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => onSearch(value)}
        aria-label="Buscar"
        className="absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-slate-700 transition z-10"
      >
        <Search className="w-4 h-4 text-slate-500" />
      </button>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSearch(value)}
        className="w-full pl-10 pr-10 py-2.5 bg-slate-900/50 border border-slate-800 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition text-slate-200 placeholder:text-slate-500 text-sm"
      />
      {value && (
        <button
          type="button"
          onClick={clear}
          aria-label="Limpar busca"
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-slate-700 transition z-10"
        >
          <X className="w-4 h-4 text-slate-500" />
        </button>
      )}
    </div>
  );
}
