/**
 * ChatPane — Displays real-time chat messages from Matrix rooms
 *
 * Shows the most recent messages across all joined rooms.
 * Messages stream in via the useMatrix hook's long-poll sync.
 *
 * Layout:
 *   #room-name
 *   [10:30] sender: message body
 *   [10:31] sender: another message
 */

import React from 'react';
import { Box, Text } from 'ink';

const h = React.createElement;

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function ChatPane({ rooms, status, focused, height }) {
  // Merge all messages from all rooms, sort by time, show recent ones
  const allMessages = [];

  for (const [roomId, room] of rooms) {
    for (const msg of room.messages) {
      allMessages.push({
        ...msg,
        roomName: room.name,
        roomId,
      });
    }
  }

  allMessages.sort((a, b) => a.time - b.time);

  // Reserve lines for header + room name
  const availableLines = Math.max(1, (height || 12) - 3);
  const visible = allMessages.slice(-availableLines);

  // Pick the most recent room name to display as header context
  const activeRoom =
    visible.length > 0 ? visible[visible.length - 1].roomName : '(no rooms)';

  const borderColor = focused ? 'cyan' : 'gray';

  // Header line
  const headerContent = status === 'connected'
    ? h(Text, { color: 'green' }, activeRoom)
    : status === 'connecting'
      ? h(Text, { color: 'yellow' }, 'connecting...')
      : h(Text, { color: 'red' }, 'disconnected');

  const header = h(Box, null,
    h(Text, { bold: true, color: focused ? 'cyan' : 'white' }, 'Chat'),
    h(Text, { color: 'gray' }, ' '),
    headerContent
  );

  // Message lines
  let body;
  if (visible.length === 0) {
    body = h(Text, { color: 'gray', dimColor: true },
      status === 'connecting' ? 'Syncing with Matrix...' : 'No messages yet'
    );
  } else {
    body = visible.map((msg, i) =>
      h(Box, { key: msg.id || i },
        h(Text, { color: 'gray' }, `[${formatTime(msg.time)}]`),
        h(Text, { color: 'cyan', bold: true }, ` ${msg.sender}`),
        h(Text, null, `: ${msg.body}`)
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
