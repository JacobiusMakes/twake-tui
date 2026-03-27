/**
 * InboxPane — Displays recent emails from Twake Mail
 *
 * Shows inbox messages fetched via the useJmap hook.
 * Polls every 30 seconds for new mail.
 *
 * Layout:
 *   [envelope] Subject line here
 *   [envelope] Another email subject
 */

import React from 'react';
import { Box, Text } from 'ink';

const h = React.createElement;

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  // Show time if today, otherwise show date
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function truncate(str, len) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len - 1) + '\u2026' : str;
}

export function InboxPane({ emails, status, focused, height }) {
  const availableLines = Math.max(1, (height || 12) - 2);
  const visible = emails.slice(0, availableLines);

  const borderColor = focused ? 'cyan' : 'gray';

  // Header
  const headerStatus = status === 'connected'
    ? h(Text, { color: 'green' }, `${emails.length} message${emails.length !== 1 ? 's' : ''}`)
    : status === 'connecting'
      ? h(Text, { color: 'yellow' }, 'loading...')
      : h(Text, { color: 'red' }, 'disconnected');

  const header = h(Box, null,
    h(Text, { bold: true, color: focused ? 'cyan' : 'white' }, 'Inbox'),
    h(Text, { color: 'gray' }, ' '),
    headerStatus
  );

  // Email list
  let body;
  if (visible.length === 0) {
    body = h(Text, { color: 'gray', dimColor: true },
      status === 'connecting' ? 'Fetching emails...' : 'Inbox is empty'
    );
  } else {
    body = visible.map((email) =>
      h(Box, { key: email.id },
        h(Text, { color: 'yellow' }, '\u2709 '),
        h(Text, { bold: true }, truncate(email.subject, 28)),
        h(Text, { color: 'gray' }, ` ${truncate(email.from, 16)} ${formatDate(email.receivedAt)}`)
      )
    );
  }

  return h(Box, {
    flexDirection: 'column',
    borderStyle: 'single',
    borderColor,
    paddingX: 1,
    flexGrow: 1,
    flexBasis: '50%',
  }, header, ...(Array.isArray(body) ? body : [body]));
}
