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

function sendConvert(tabId, caseType) {
  chrome.tabs.sendMessage(tabId, {
    action: "convertCase",
    caseType,
  }).catch(() => {
    // Content script not available on this page (chrome://, edge://, etc.)
  });
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!caseIds.has(info.menuItemId)) return;
  sendConvert(tab.id, info.menuItemId);
});

// Keyboard shortcut support
chrome.commands.onCommand.addListener((command) => {
  if (!caseIds.has(command)) return;
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) sendConvert(tabs[0].id, command);
  });
});
