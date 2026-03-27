/**
 * useMatrix — React hook for real-time Matrix /sync
 *
 * Long-polls the Matrix homeserver to stream chat messages from all
 * joined rooms. Mirrors the sync loop from twake-cli's `chat listen`.
 *
 * State:
 *   rooms    — Map of roomId → { name, messages[] }
 *   status   — 'connecting' | 'connected' | 'error'
 *   error    — Error message string (if status === 'error')
 */

import { useState, useEffect, useRef } from 'react';

const USER_AGENT = 'twake-tui/0.1.0';

async function matrixFetch(cfg, endpoint, options = {}) {
  const url = `${cfg.homeserver}/_matrix/client/v3${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${cfg.accessToken}`,
      'Content-Type': 'application/json',
      'User-Agent': USER_AGENT,
      ...options.headers,
    },
    signal: options.signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Matrix ${res.status}: ${err.error || res.statusText}`);
  }
  return res.json();
}

export function useMatrix(config) {
  const [rooms, setRooms] = useState(new Map());
  const [status, setStatus] = useState('connecting');
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  useEffect(() => {
    const cfg = config?.matrix;
    if (!cfg?.homeserver || !cfg?.accessToken) {
      setStatus('error');
      setError('Not configured');
      return;
    }

    const abort = new AbortController();
    abortRef.current = abort;

    let since = '';
    let running = true;

    async function fetchRoomNames(roomIds) {
      const names = new Map();
      await Promise.all(
        roomIds.map(async (roomId) => {
          try {
            const state = await matrixFetch(
              cfg,
              `/rooms/${encodeURIComponent(roomId)}/state/m.room.name`,
              { signal: abort.signal }
            );
            names.set(roomId, state.name || roomId.slice(0, 20));
          } catch {
            names.set(roomId, roomId.slice(0, 20));
          }
        })
      );
      return names;
    }

    async function syncLoop() {
      try {
        // Initial sync — get rooms and a since token
        const initial = await matrixFetch(
          cfg,
          '/sync?timeout=0&filter={"room":{"timeline":{"limit":5}}}',
          { signal: abort.signal }
        );
        since = initial.next_batch;

        // Build initial room state
        const joinedRooms = Object.keys(initial.rooms?.join || {});
        const names = await fetchRoomNames(joinedRooms);

        const roomMap = new Map();
        for (const roomId of joinedRooms) {
          const timeline = initial.rooms.join[roomId]?.timeline?.events || [];
          const messages = timeline
            .filter((e) => e.type === 'm.room.message' && e.content?.body)
            .map((e) => ({
              id: e.event_id,
              sender: e.sender.split(':')[0].replace('@', ''),
              body: e.content.body,
              time: new Date(e.origin_server_ts),
            }));

          roomMap.set(roomId, {
            name: names.get(roomId) || roomId,
            messages,
          });
        }

        setRooms(new Map(roomMap));
        setStatus('connected');
        setError(null);

        // Long-poll loop
        while (running && !abort.signal.aborted) {
          try {
            const sync = await matrixFetch(
              cfg,
              `/sync?since=${since}&timeout=30000&filter={"room":{"timeline":{"limit":50}}}`,
              { signal: abort.signal }
            );
            since = sync.next_batch;

            const joinedData = sync.rooms?.join || {};
            let changed = false;

            for (const [roomId, roomData] of Object.entries(joinedData)) {
              const events = roomData.timeline?.events || [];
              const newMessages = events
                .filter((e) => e.type === 'm.room.message' && e.content?.body)
                .map((e) => ({
                  id: e.event_id,
                  sender: e.sender.split(':')[0].replace('@', ''),
                  body: e.content.body,
                  time: new Date(e.origin_server_ts),
                }));

              if (newMessages.length > 0) {
                changed = true;
                const existing = roomMap.get(roomId);
                if (existing) {
                  existing.messages.push(...newMessages);
                  // Keep last 100 messages per room
                  if (existing.messages.length > 100) {
                    existing.messages = existing.messages.slice(-100);
                  }
                } else {
                  const newNames = await fetchRoomNames([roomId]);
                  roomMap.set(roomId, {
                    name: newNames.get(roomId) || roomId,
                    messages: newMessages,
                  });
                }
              }
            }

            if (changed) {
              setRooms(new Map(roomMap));
            }
          } catch (err) {
            if (abort.signal.aborted) break;
            // Transient sync error — retry after delay
            setError(err.message);
            await new Promise((r) => setTimeout(r, 5000));
            setError(null);
          }
        }
      } catch (err) {
        if (!abort.signal.aborted) {
          setStatus('error');
          setError(err.message);
        }
      }
    }

    syncLoop();

    return () => {
      running = false;
      abort.abort();
    };
  }, [config?.matrix?.homeserver, config?.matrix?.accessToken]);

  return { rooms, status, error };
}
