/**
 * useJmap — React hook for JMAP email polling
 *
 * Polls the Twake Mail JMAP endpoint every 30 seconds to fetch
 * inbox messages. Mirrors the request pattern from twake-cli's `mail inbox`.
 *
 * State:
 *   emails   — Array of { id, from, subject, receivedAt, preview }
 *   status   — 'connecting' | 'connected' | 'error'
 *   error    — Error message string (if status === 'error')
 */

import { useState, useEffect, useRef } from 'react';
import { createHash } from 'crypto';

const USER_AGENT = 'twake-tui/0.1.0';
const POLL_INTERVAL = 30_000; // 30 seconds

/**
 * Derive JMAP accountId from a JWT bearer token.
 * TMail uses SHA-256(email) as the accountId.
 */
function getAccountIdFromToken(token) {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString()
    );
    const email = payload.email || payload.sub;
    if (!email) return null;
    return createHash('sha256').update(email).digest('hex');
  } catch {
    return null;
  }
}

async function jmapRequest(cfg, accountId, methodCalls) {
  const using = [
    'urn:ietf:params:jmap:core',
    'urn:ietf:params:jmap:mail',
  ];

  const calls = methodCalls.map(([method, args, callId]) => [
    method,
    { accountId, ...args },
    callId,
  ]);

  const res = await fetch(cfg.sessionUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.bearerToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json;jmapVersion=rfc-8621',
      'User-Agent': USER_AGENT,
    },
    body: JSON.stringify({ using, methodCalls: calls }),
  });

  if (!res.ok) {
    throw new Error(`JMAP ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  return data.methodResponses;
}

export function useJmap(config) {
  const [emails, setEmails] = useState([]);
  const [status, setStatus] = useState('connecting');
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const cfg = config?.jmap;
    if (!cfg?.sessionUrl || !cfg?.bearerToken) {
      setStatus('error');
      setError('Not configured');
      return;
    }

    // Resolve accountId — stored in config, or derive from JWT
    const accountId = cfg.accountId || getAccountIdFromToken(cfg.bearerToken);
    if (!accountId) {
      setStatus('error');
      setError('Cannot determine accountId');
      return;
    }

    let cancelled = false;

    async function fetchInbox() {
      try {
        // Step 1: Get mailboxes to find Inbox ID
        const mbResponses = await jmapRequest(cfg, accountId, [
          ['Mailbox/get', { properties: ['id', 'name', 'role'] }, 'boxes'],
        ]);

        const boxes =
          mbResponses.find((r) => r[2] === 'boxes')?.[1]?.list || [];
        const inbox = boxes.find((b) => b.role === 'inbox');

        if (!inbox) {
          setEmails([]);
          setStatus('connected');
          return;
        }

        // Step 2: Query + fetch emails
        const responses = await jmapRequest(cfg, accountId, [
          [
            'Email/query',
            {
              filter: { inMailbox: inbox.id },
              sort: [{ property: 'receivedAt', isAscending: false }],
              limit: 20,
            },
            'emailIds',
          ],
          [
            'Email/get',
            {
              '#ids': {
                resultOf: 'emailIds',
                name: 'Email/query',
                path: '/ids',
              },
              properties: ['id', 'from', 'subject', 'receivedAt', 'preview'],
            },
            'emails',
          ],
        ]);

        if (cancelled) return;

        const emailResponse = responses.find((r) => r[2] === 'emails');
        const list = emailResponse?.[1]?.list || [];

        setEmails(
          list.map((e) => ({
            id: e.id,
            from: e.from?.[0]?.email || e.from?.[0]?.name || 'unknown',
            subject: e.subject || '(no subject)',
            receivedAt: e.receivedAt,
            preview: e.preview || '',
          }))
        );
        setStatus('connected');
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setStatus('error');
        setError(err.message);
      }
    }

    fetchInbox();
    timerRef.current = setInterval(fetchInbox, POLL_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(timerRef.current);
    };
  }, [config?.jmap?.sessionUrl, config?.jmap?.bearerToken]);

  return { emails, status, error };
}
