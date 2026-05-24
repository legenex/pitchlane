import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// Cache client lookup to avoid repeated fetches
let cachedClientId = null;

export default function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [clientId, setClientId] = useState(cachedClientId);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me()
      .then(async (u) => {
        setUser(u);
        if (cachedClientId) {
          setClientId(cachedClientId);
          setLoading(false);
          return;
        }
        // Look up client by owner_user_id
        const clients = await base44.entities.Client.filter({ owner_user_id: u.id });
        const cid = clients[0]?.id || null;
        cachedClientId = cid;
        setClientId(cid);
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return { user, loading, clientId };
}