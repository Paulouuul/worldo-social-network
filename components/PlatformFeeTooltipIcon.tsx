export function PlatformFeeTooltipIcon() {
  return (
    <span className="group relative cursor-help inline-flex items-center justify-center w-3 h-3 rounded-full bg-slate-700 text-[8px] text-slate-300 font-bold">
      ?
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-48 p-2 bg-slate-800 border border-slate-700 rounded-lg text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center">
        Taxa mínima de <strong>1 moeda</strong>
      </span>
    </span>
  );
}
