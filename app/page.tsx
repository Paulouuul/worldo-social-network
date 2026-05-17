export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
      <h1 className="text-4xl font-bold text-center mb-8">
        ✨ Bem-vindo à WORLDO ✨
      </h1>
      <p className="text-center text-lg">
        Projeto E-commerce Full-stack com Next.js + Prisma + Stripe
      </p>
      
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="card-highlight p-6 rounded-lg shadow-md backdrop-blur-sm">
          <h2 className="text-xl font-semibold mb-2">🚀 Next.js 14</h2>
          <p>App Router + Server Components + SSR/SSG</p>
        </div>
        <div className="card-highlight p-6 rounded-lg shadow-md backdrop-blur-sm">
          <h2 className="text-xl font-semibold mb-2">💾 Prisma ORM</h2>
          <p>Type-safe queries + Migrations + PostgreSQL</p>
        </div>
        <div className="card-highlight p-6 rounded-lg shadow-md backdrop-blur-sm">
          <h2 className="text-xl font-semibold mb-2">💳 Stripe</h2>
          <p>Pagamentos seguros + Webhooks + Checkout</p>
        </div>
      </div>
    </div>
  )
}