'use client'

import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="flex items-center justify-center gap-2.5 w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider bg-slate-800/50 border border-white/[0.06] hover:border-rose-500/30 hover:bg-rose-500/10 text-slate-300 hover:text-rose-400 transition-all duration-300 shadow-lg active:scale-[0.98] group"
    >
      <LogOut className="w-5 h-5 transition-transform group-hover:translate-x-1" />
      <span>Sair</span>
    </button>
  )
}