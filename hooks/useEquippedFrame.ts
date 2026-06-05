// hooks/useEquippedFrame.ts
import { useState, useEffect } from 'react';

export const useEquippedFrame = (frameId: string | null) => {
  const [frameData, setFrameData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!frameId) {
      setLoading(false);
      return;
    }

    const fetchFrame = async () => {
      try {
        const res = await fetch(`/api/cosmetics/${frameId}`);
        const data = await res.json();
        setFrameData(data);
      } catch (err) {
        console.error('Erro ao carregar moldura', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFrame();
  }, [frameId]);

  return { frameData, loading };
};
