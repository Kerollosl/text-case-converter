# Text Case Converter — Chrome Extension

MV3 Chrome Extension that converts selected text on any page to various cases (UPPER, lower, Title, camelCase, etc.).

## Files

| File | Purpose |
|------|---------|
| `content.js` | Converter; injected on demand by `background.js` via `scripting.executeScript` (activeTab), not a manifest content script |
| `options.html/.css/.js` | About / shortcuts page |
| `scripts/package.sh` | Builds the store zip (shipping files only) |
| `background.js` | Service worker — handles context menu registration |
| `manifest.json` | MV3 extension manifest |
| `TextCaseConverter.gs` | Google Apps Script version (standalone, same logic, for Sheets/Docs use) |

## Architecture

- Right-click context menu on selected text → background service worker receives menu click or keyboard command (both grant `activeTab`) → injects `content.js` and calls `__tccRun(caseType)` → it replaces `window.getSelection()` text
- `TextCaseConverter.gs` is a **separate artifact** for Google Sheets/Docs — it is not loaded by the extension. It mirrors the same conversion functions for use via Apps Script.

## Development

```bash
# Load unpacked in Chrome:
# chrome://extensions/ → Developer mode → Load unpacked → select this folder
# No build step — plain JS
```

## Adding a New Case Type

1. Add the conversion function to `content.js`
2. Register the context menu item in `background.js` (`chrome.contextMenus.create`)
3. Mirror the function in `TextCaseConverter.gs` if it should be available in Sheets/Docs
