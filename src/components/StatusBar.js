/**
 * StatusBar — Bottom bar showing connection status for all services
 *
 * Layout:
 *   twake-tui v0.1.0 | Chat: [check] Mail: [check] Drive: [x] | Ctrl+C quit
 */

import React from 'react';
import { Box, Text } from 'ink';

const h = React.createElement;

function ServiceIndicator({ name, status }) {
  let icon, color;
  switch (status) {
    case 'connected':
      icon = '\u2713';
      color = 'green';
      break;
    case 'connecting':
      icon = '\u25CB';
      color = 'yellow';
      break;
    default:
      icon = '\u2717';
      color = 'red';
      break;
  }

  return h(Text, null,
    `${name}: `,
    h(Text, { color }, icon)
  );
}

export function StatusBar({ chatStatus, mailStatus, driveStatus, focusedPane, width }) {
  // Use a fixed width if the terminal is narrow — drop help text to fit
  const narrow = (width || 80) < 60;

  return h(Box, { height: 1, width: '100%', paddingX: 1, overflow: 'hidden', flexShrink: 0 },
    h(Box, { gap: 1, overflow: 'hidden', flexShrink: 0 },
      h(Text, { bold: true, color: 'cyan', wrap: 'truncate' }, 'twake-tui'),
      h(Text, { color: 'gray' }, '|'),
      h(ServiceIndicator, { name: 'Chat', status: chatStatus }),
      h(ServiceIndicator, { name: 'Mail', status: mailStatus }),
      h(ServiceIndicator, { name: 'Drive', status: driveStatus })
    ),
    !narrow && h(Box, { gap: 1, marginLeft: 1, overflow: 'hidden', flexShrink: 1 },
      h(Text, { color: 'gray' }, '|'),
      h(Text, { color: 'gray', wrap: 'truncate' }, 'Tab: switch'),
      h(Text, { color: 'gray', dimColor: true, wrap: 'truncate' }, `[${focusedPane}]`),
      h(Text, { color: 'gray', wrap: 'truncate' }, '| Ctrl+C quit')
    )
  );
}
