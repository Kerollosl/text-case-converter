# Chrome Web Store listing: Text Case Converter

Placeholders to resolve before submitting: `TODO_PRIVACY_URL` and `TODO_SUPPORT_URL` (both appear as links in `options.html`; Chrome rejects non-URL placeholders in the manifest, so `homepage_url`/`author` are omitted until the real values exist).

## Short description (132 characters or fewer)
Convert selected text to UPPER, lower, Title, Sentence, camelCase, snake_case or kebab-case from the right-click menu or a shortcut.

## Long description
Select text on any page or in any text field, then right-click and choose Convert Case, or press a shortcut.

Cases: UPPERCASE, lowercase, Title Case, Sentence case, camelCase, snake_case, kebab-case.

- Works in text boxes, rich-text editors and ordinary page text, including accented and non-Latin letters.
- Rich-text editors keep your formatting and undo history.
- Shortcuts (change them any time at chrome://extensions/shortcuts): Windows/Linux Alt+Shift+U / L / T / S for upper, lower, title, sentence; Mac Control+Shift+U / L / T / S. camelCase, snake_case and kebab-case are in the right-click menu.
- A small confirmation toast follows light and dark mode.

It runs only when you pick a conversion, only on the tab you are using, and only on the text you selected. No data is collected or sent anywhere.

## Single purpose
Change the letter case of the text the user has selected.

## Permission justifications
- `contextMenus`: adds the "Convert Case" right-click menu for selected text.
- `activeTab`: when you click a menu item or press a shortcut, Chrome grants temporary access to that tab so the converter can read and replace the selected text. There is no always-on access to any site.
- `scripting`: injects the bundled converter (`content.js`) into the current tab at that moment. No remote code.
- No host permissions and no content scripts run automatically on pages.

## Privacy answers
- Data collected: none. Nothing is stored and there are no network requests.
- Data sold or transferred: none.
- Remote code: no.
- Certify: not used or transferred for purposes unrelated to the single purpose; not used for creditworthiness or lending.

## Privacy policy text (host at TODO_PRIVACY_URL)
Text Case Converter does not collect, store, transmit or sell any data. When you choose a conversion, the extension reads only your current text selection in the active tab, changes its capitalisation locally in your browser, and discards it. It makes no network requests and uses no analytics, cookies or remote code. Contact: TODO_SUPPORT_URL.

## Store assets (owner follow-up)
- Screenshots 1280x800: right-click menu on selected text; before/after in a text field; the About page.
- Promo tile 440x280.
- Icons at 16/48/128 (replaced the previous plain blue squares with an "A" / "Aa" mark).
