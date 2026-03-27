#!/usr/bin/env node

/**
 * twake-tui — Terminal dashboard for Twake Workplace
 *
 * Renders a split-pane view with real-time chat, inbox, and drive.
 * Reads credentials from twake-cli's config (no separate auth needed).
 *
 * Usage:
 *   npx twake-tui
 *   twake-tui        (if installed globally)
 */

import React from 'react';
import { render } from 'ink';
import App from '../src/app.js';

render(React.createElement(App));
