document.getElementById("version").textContent = chrome.runtime.getManifest().version;

document.getElementById("open-shortcuts").addEventListener("click", () => {
  chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
});

chrome.commands.getAll().then((commands) => {
  const list = document.getElementById("shortcuts");
  for (const c of commands) {
    if (!c.description) continue;
    const li = document.createElement("li");
    const label = document.createElement("span");
    label.textContent = c.description.replace("Convert selected text to ", "");
    const key = document.createElement("kbd");
    key.textContent = c.shortcut || "Not set";
    li.append(label, key);
    list.append(li);
  }
});
