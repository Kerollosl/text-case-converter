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
    await chrome.scripting.executeScript({ target, files: ["content.js"] });
    await chrome.scripting.executeScript({
      target,
      func: (type) => globalThis.__tccRun(type),
      args: [caseType],
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
