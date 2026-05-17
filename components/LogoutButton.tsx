'use client'

import { signOut } from 'next-auth/react'

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      className="btn-primary bg-red-600 hover:bg-red-700"
    >
        <i className="bi bi-box-arrow-right"></i>
    </button>
  )
}