/**
 * App — Main layout component for twake-tui
 *
 * Arranges three data panes in a split layout:
 *   ┌─── Chat ───────────┬─── Inbox ──────────┐
 *   │                     │                     │
 *   ├─── Drive ───────────┴────────────────────┤
 *   │                                           │
 *   └───────────────────────────────────────────┘
 *     twake-tui v0.1.0 | Chat: ✓ Mail: ✓ Drive: ✓
 *
 * Tab cycles focus between panes (Chat -> Inbox -> Drive).
 */

import React, { useState, useMemo } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import { loadConfig } from './config.js';
import { useMatrix } from './hooks/useMatrix.js';
import { useJmap } from './hooks/useJmap.js';
import { useCozy } from './hooks/useCozy.js';
import { ChatPane } from './components/ChatPane.js';
import { InboxPane } from './components/InboxPane.js';
import { DrivePane } from './components/DrivePane.js';
import { StatusBar } from './components/StatusBar.js';

const h = React.createElement;
const PANES = ['chat', 'inbox', 'drive'];

export default function App() {
  const { stdout } = useStdout();
  const termHeight = stdout?.rows || 24;

  // Top row panes share ~70% of height, drive gets ~25%, status bar gets 1 line
  const topHeight = Math.floor((termHeight - 4) * 0.7);
  const bottomHeight = Math.floor((termHeight - 4) * 0.3);

  const [focusedIdx, setFocusedIdx] = useState(0);

  // Load config once at mount
  const config = useMemo(() => loadConfig(), []);

  // Service hooks — each handles its own connection lifecycle
  const matrix = useMatrix(config);
  const jmap = useJmap(config);
  const cozy = useCozy(config);

  // Tab cycles focus
  useInput((input, key) => {
    if (key.tab) {
      setFocusedIdx((prev) => (prev + 1) % PANES.length);
    }
  });

  const focusedPane = PANES[focusedIdx];

  // Show setup instructions if nothing is configured
  if (!config) {
    return h(Box, { flexDirection: 'column', padding: 1 },
      h(Text, { bold: true, color: 'cyan' }, 'twake-tui v0.1.0'),
      h(Text, null, ''),
      h(Text, { color: 'red' }, 'No twake-cli configuration found.'),
      h(Text, null, ''),
      h(Text, null, 'Install and configure twake-cli first:'),
      h(Text, { color: 'gray' }, '  npm install -g @linagora/twake-cli'),
      h(Text, { color: 'gray' }, '  twake auth login'),
      h(Text, null, ''),
      h(Text, { color: 'gray' }, 'Config location: ~/Library/Preferences/twake-cli-nodejs/config.json')
    );
  }

  return h(Box, { flexDirection: 'column', height: termHeight },
    // Top row: Chat + Inbox side by side
    h(Box, { flexDirection: 'row', height: topHeight },
      h(ChatPane, {
        rooms: matrix.rooms,
        status: matrix.status,
        focused: focusedPane === 'chat',
        height: topHeight,
      }),
      h(InboxPane, {
        emails: jmap.emails,
        status: jmap.status,
        focused: focusedPane === 'inbox',
        height: topHeight,
      })
    ),
    // Bottom row: Drive (full width)
    h(Box, { height: bottomHeight },
      h(DrivePane, {
        files: cozy.files,
        status: cozy.status,
        focused: focusedPane === 'drive',
        height: bottomHeight,
      })
    ),
    // Status bar
    h(StatusBar, {
      chatStatus: matrix.status,
      mailStatus: jmap.status,
      driveStatus: cozy.status,
      focusedPane,
    })
  );
}
