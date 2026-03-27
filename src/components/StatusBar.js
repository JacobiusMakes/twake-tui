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

export function StatusBar({ chatStatus, mailStatus, driveStatus, focusedPane }) {
  return h(Box, { paddingX: 1, justifyContent: 'space-between' },
    h(Box, { gap: 1 },
      h(Text, { bold: true, color: 'cyan' }, 'twake-tui'),
      h(Text, { color: 'gray' }, 'v0.1.0'),
      h(Text, { color: 'gray' }, '|'),
      h(ServiceIndicator, { name: 'Chat', status: chatStatus }),
      h(ServiceIndicator, { name: 'Mail', status: mailStatus }),
      h(ServiceIndicator, { name: 'Drive', status: driveStatus })
    ),
    h(Box, { gap: 1 },
      h(Text, { color: 'gray' }, '|'),
      h(Text, { color: 'gray' }, 'Tab: switch pane'),
      h(Text, { color: 'gray' }, '|'),
      h(Text, { color: 'gray', dimColor: true }, `[${focusedPane}]`),
      h(Text, { color: 'gray' }, '|'),
      h(Text, { color: 'gray' }, 'Ctrl+C quit')
    )
  );
}
