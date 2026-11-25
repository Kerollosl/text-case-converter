const cases = [
  { id: "upper", title: "Uppercase" },
  { id: "lower", title: "Lowercase" },
  { id: "title", title: "Title case" },
  { id: "sentence", title: "Sentence case" },
  { id: "camel", title: "camelCase" },
  { id: "snake", title: "snake_case" },
  { id: "kebab", title: "kebab-case" },
];

const caseIds = new Set(cases.map((c) => c.id));

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "textCaseConverter",
      title: "Convert Case",
      contexts: ["selection"],
    });

    for (const c of cases) {
      if (c.id === "camel") {
        chrome.contextMenus.create({
          id: "codeSeparator",
          parentId: "textCaseConverter",
          type: "separator",
          contexts: ["selection"],
        });
      }
      chrome.contextMenus.create({
        id: c.id,
        parentId: "textCaseConverter",
        title: c.title,
        contexts: ["selection"],
      });
    }
  });
});

// The context-menu click and the keyboard command each grant activeTab for the
// current tab, so the converter is injected on demand instead of running on every page.
async function convertInTab(tabId, caseType, frameId) {
  const target = frameId ? { tabId, frameIds: [frameId] } : { tabId, allFrames: true };
  try {
    // Inject content.js only into frames that do not have it yet (repeat keypresses reuse it).
    const probe = await chrome.scripting.executeScript({
      target,
      func: () => typeof globalThis.__tccRun === "function",
    });
    const missing = probe.filter((r) => !r.result).map((r) => r.frameId);
    if (missing.length) {
      await chrome.scripting.executeScript({ target: { tabId, frameIds: missing }, files: ["content.js"] });
    }
    // Keyboard commands target every frame; only the focused one should convert.
    const requireFocus = !frameId;
    await chrome.scripting.executeScript({
      target,
      func: (type, focusOnly) => globalThis.__tccRun && globalThis.__tccRun(type, { requireFocus: focusOnly }),
      args: [caseType, requireFocus],
    });
  } catch (error) {
    // Restricted pages (chrome://, Web Store, PDF viewer) cannot be scripted.
    console.debug("Text Case Converter: cannot run on this page.", error);
  }
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!caseIds.has(info.menuItemId) || !tab) return;
  convertInTab(tab.id, info.menuItemId, info.frameId);
});

chrome.commands.onCommand.addListener((command, tab) => {
  if (!caseIds.has(command)) return;
  if (tab) return convertInTab(tab.id, command);
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) convertInTab(tabs[0].id, command);
  });
});

// Toolbar icon opens the About / shortcuts page.
chrome.action.onClicked.addListener(() => chrome.runtime.openOptionsPage());
