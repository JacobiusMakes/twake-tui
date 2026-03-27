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
  const termWidth = stdout?.columns || 80;

  // Fixed: status bar = 1 line, drive = 6 lines, rest = top row
  const statusBarHeight = 1;
  const driveHeight = 6;
  const topHeight = Math.max(4, termHeight - driveHeight - statusBarHeight);

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

  // Chat gets 60%, Inbox gets 40% of terminal width
  const chatWidth = Math.floor(termWidth * 0.6);
  const inboxWidth = termWidth - chatWidth;

  return h(Box, { flexDirection: 'column', width: termWidth, height: termHeight, overflow: 'hidden' },
    // Top row: Chat (60%) + Inbox (40%) side by side
    h(Box, { flexDirection: 'row', height: topHeight, overflow: 'hidden' },
      h(ChatPane, {
        rooms: matrix.rooms,
        status: matrix.status,
        focused: focusedPane === 'chat',
        height: topHeight,
        width: chatWidth,
      }),
      h(InboxPane, {
        emails: jmap.emails,
        status: jmap.status,
        focused: focusedPane === 'inbox',
        height: topHeight,
        width: inboxWidth,
      })
    ),
    // Bottom row: Drive (full width, fixed height)
    h(Box, { height: driveHeight, overflow: 'hidden' },
      h(DrivePane, {
        files: cozy.files,
        status: cozy.status,
        focused: focusedPane === 'drive',
        height: driveHeight,
        width: termWidth,
      })
    ),
    // Status bar (exactly 1 line)
    h(StatusBar, {
      chatStatus: matrix.status,
      mailStatus: jmap.status,
      driveStatus: cozy.status,
      focusedPane,
      width: termWidth,
    })
  );
}
