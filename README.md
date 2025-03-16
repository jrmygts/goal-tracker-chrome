# Whimdoughs🥖 - Goal Tracker Chrome Extension

A goal-setting and time-tracking tool that helps you stay focused.

## Manifest V3 Migration

This extension has been updated from Manifest V2 to Manifest V3 to align with Chrome's current extension platform requirements. The following changes were made:

### Key Changes

1. **Manifest File Updates**:
   - Updated `manifest_version` from 2 to 3
   - Changed `browser_action` to `action`
   - Replaced background scripts with a service worker
   - Updated `web_accessible_resources` format
   - Moved `activeTab` permission to `host_permissions`

2. **Background Scripts to Service Worker**:
   - Combined `background.js` and `storage.js` into a single `service-worker.js`
   - Added proper cleanup with `chrome.runtime.onSuspend` listener
   - Improved interval management for timers

3. **Message Handling**:
   - Updated all message handling to use Promises instead of callbacks
   - Improved error handling throughout the codebase
   - Added proper try/catch blocks for async operations

4. **Content Script Updates**:
   - Updated DOM manipulation for better compatibility
   - Improved event listener management
   - Enhanced error handling for cross-origin communication

## Features

- Set and track goals with a built-in timer
- Pause and resume goal tracking
- View completed goals history
- New tab page integration
- Persistent monitoring window on web pages

## Installation

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension directory

## Usage

- Click the extension icon to open the popup
- Set a goal and start tracking
- Use the new tab page for a focused goal-setting experience
- Monitor your progress with the persistent window on web pages

## License

[MIT License](LICENSE) 