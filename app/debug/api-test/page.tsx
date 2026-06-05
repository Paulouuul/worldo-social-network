// worldo-social-network/app/debug/api-test/page.tsx
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function ApiTestPage() {
  const { data: session } = useSession();
  const [results, setResults] = useState<any>({});

  const testDebug = async () => {
    // 1. Buscar token
    const tokenRes = await fetch('/api/auth/token');
    const data = await tokenRes.json();
    const token = data.pythonToken || data.token;

    console.log('Token obtido:', token);
    console.log('Token length:', token?.length);

    // 2. Testar endpoint debug-token
    const debugRes = await fetch('http://localhost:8000/test/auth/debug-token', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const debugData = await debugRes.json();

    // 3. Testar endpoint debug-jwt
    const jwtRes = await fetch('http://localhost:8000/test/auth/debug-jwt', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const jwtData = await jwtRes.json();

    setResults({ debug: debugData, jwt: jwtData, tokenPreview: token?.substring(0, 100) });
  };

  if (!session) {
    return <div className="p-8">Faça login primeiro</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Autenticação</h1>

      <button onClick={testDebug} className="bg-purple-600 text-white px-4 py-2 rounded mb-4">
        Testar
      </button>

      {results.tokenPreview && (
        <div className="bg-slate-800 p-4 rounded mb-4">
          <h3 className="text-white mb-2">Token Preview:</h3>
          <code className="text-xs text-green-400 break-all">{results.tokenPreview}</code>
        </div>
      )}

      {results.debug && (
        <div className="bg-slate-800 p-4 rounded mb-4">
          <h3 className="text-white mb-2">Debug Token:</h3>
          <pre className="text-xs text-slate-400">{JSON.stringify(results.debug, null, 2)}</pre>
        </div>
      )}

      {results.jwt && (
        <div className="bg-slate-800 p-4 rounded">
          <h3 className="text-white mb-2">Debug JWT:</h3>
          <pre className="text-xs text-slate-400">{JSON.stringify(results.jwt, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
