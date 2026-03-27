/**
 * useCozy — React hook for Cozy Drive file listing
 *
 * Polls the Cozy instance every 30 seconds to fetch the root
 * directory listing. Mirrors the request pattern from twake-cli's `drive ls`.
 *
 * State:
 *   files    — Array of { id, name, type, size, updatedAt }
 *   status   — 'connecting' | 'connected' | 'error'
 *   error    — Error message string (if status === 'error')
 */

import { useState, useEffect, useRef } from 'react';

const USER_AGENT = 'twake-tui/0.1.0';
const POLL_INTERVAL = 30_000; // 30 seconds
const ROOT_DIR_ID = 'io.cozy.files.root-dir';

async function cozyFetch(cfg, endpoint) {
  const url = `${cfg.instanceUrl}${endpoint}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      'Content-Type': 'application/vnd.api+json',
      Accept: 'application/vnd.api+json',
      'User-Agent': USER_AGENT,
    },
  });

  if (!res.ok) {
    throw new Error(`Cozy ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '-';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function useCozy(config) {
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState('connecting');
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const cfg = config?.cozy;
    if (!cfg?.instanceUrl || !cfg?.token) {
      setStatus('error');
      setError('Not configured');
      return;
    }

    let cancelled = false;

    async function fetchFiles() {
      try {
        const data = await cozyFetch(cfg, `/files/${ROOT_DIR_ID}`);
        const contents = data.included || [];

        if (cancelled) return;

        setFiles(
          contents.map((item) => {
            const attrs = item.attributes || {};
            return {
              id: item.id,
              name: attrs.name || item.id,
              type: attrs.type === 'directory' ? 'directory' : 'file',
              size: formatBytes(attrs.size),
              updatedAt: attrs.updated_at || null,
            };
          })
        );
        setStatus('connected');
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setStatus('error');
        setError(err.message);
      }
    }

    fetchFiles();
    timerRef.current = setInterval(fetchFiles, POLL_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(timerRef.current);
    };
  }, [config?.cozy?.instanceUrl, config?.cozy?.token]);

  return { files, status, error };
}
