/**
 * DrivePane — Displays root directory files from Twake Drive
 *
 * Shows files and folders fetched via the useCozy hook.
 * Polls every 30 seconds for changes.
 *
 * Layout:
 *   [folder] Administrative/   [folder] Photos/   [file] readme.txt
 */

import React from 'react';
import { Box, Text } from 'ink';

const h = React.createElement;

function truncate(str, len) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len - 1) + '\u2026' : str;
}

export function DrivePane({ files, status, focused, height, width }) {
  // Inner width: subtract 2 for border + 2 for paddingX
  const innerWidth = Math.max(10, (width || 80) - 4);
  const borderColor = focused ? 'cyan' : 'gray';

  // Separate directories and files, directories first
  const dirs = files.filter((f) => f.type === 'directory');
  const regularFiles = files.filter((f) => f.type !== 'directory');
  const sorted = [...dirs, ...regularFiles];

  const availableLines = Math.max(1, (height || 5) - 2);
  // Dynamically calculate items per row and item width based on pane width
  const itemWidth = Math.max(16, Math.min(28, Math.floor(innerWidth / 3)));
  const itemsPerRow = Math.max(1, Math.floor(innerWidth / (itemWidth + 2)));
  const nameMaxLen = Math.max(6, itemWidth - 4); // leave room for icon + slash
  const rows = [];
  for (let i = 0; i < sorted.length && rows.length < availableLines; i += itemsPerRow) {
    rows.push(sorted.slice(i, i + itemsPerRow));
  }

  // Header
  const headerStatus = status === 'connected'
    ? h(Text, { color: 'green' }, `${files.length} item${files.length !== 1 ? 's' : ''}`)
    : status === 'connecting'
      ? h(Text, { color: 'yellow' }, 'loading...')
      : h(Text, { color: 'red' }, 'disconnected');

  const header = h(Box, null,
    h(Text, { bold: true, color: focused ? 'cyan' : 'white' }, 'Drive'),
    h(Text, { color: 'gray' }, ' '),
    headerStatus
  );

  // File grid
  let body;
  if (rows.length === 0) {
    body = h(Text, { color: 'gray', dimColor: true },
      status === 'connecting' ? 'Loading files...' : 'No files'
    );
  } else {
    body = rows.map((row, rowIdx) =>
      h(Box, { key: rowIdx, gap: 2 },
        ...row.map((file) =>
          h(Box, { key: file.id, width: itemWidth },
            file.type === 'directory'
              ? h(React.Fragment, null,
                  h(Text, { color: 'blue' }, '\uD83D\uDCC1 '),
                  h(Text, { color: 'blue', bold: true }, `${truncate(file.name, nameMaxLen)}/`)
                )
              : h(React.Fragment, null,
                  h(Text, { color: 'white' }, '\uD83D\uDCC4 '),
                  h(Text, null, truncate(file.name, nameMaxLen))
                )
          )
        )
      )
    );
  }

  return h(Box, {
    flexDirection: 'column',
    borderStyle: 'single',
    borderColor,
    paddingX: 1,
    width: '100%',
    height,
    overflow: 'hidden',
    flexShrink: 0,
  }, header, ...(Array.isArray(body) ? body : [body]));
}
