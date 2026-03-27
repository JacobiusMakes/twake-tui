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

export function InboxPane({ emails, status, focused, height, width }) {
  // Inner width: subtract 2 for border + 2 for paddingX
  const innerWidth = Math.max(10, (width || 32) - 4);

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
    body = visible.map((email) => {
      // Envelope icon = 2 chars, date ~6 chars, space + from + space = dynamic
      const dateStr = formatDate(email.receivedAt);
      const fromMax = Math.min(16, Math.floor(innerWidth * 0.25));
      const subjectMax = Math.max(8, innerWidth - fromMax - dateStr.length - 5);
      return h(Box, { key: email.id },
        h(Text, { color: 'yellow' }, '\u2709 '),
        h(Text, { bold: true }, truncate(email.subject, subjectMax)),
        h(Text, { color: 'gray' }, ` ${truncate(email.from, fromMax)} ${dateStr}`)
      );
    });
  }

  return h(Box, {
    flexDirection: 'column',
    borderStyle: 'single',
    borderColor,
    paddingX: 1,
    width,
    height,
    overflow: 'hidden',
    flexShrink: 0,
  }, header, ...(Array.isArray(body) ? body : [body]));
}
