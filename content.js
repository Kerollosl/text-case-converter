chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action !== "convertCase") return;
  const caseType = msg.caseType;

  // Words that stay lowercase in title case (AP style)
  const TITLE_MINOR = new Set([
    "a", "an", "the", "and", "but", "or", "nor", "for", "yet", "so",
    "at", "by", "in", "of", "on", "to", "up", "as", "is", "if", "it",
    "vs", "via"
  ]);

  const toTitleCase = (s) =>
    s.replace(/\w\S*/g, (w, offset) => {
      // Always capitalize the first and last word
      if (offset === 0 || offset + w.length === s.length) {
        return w[0].toUpperCase() + w.slice(1).toLowerCase();
      }
      if (TITLE_MINOR.has(w.toLowerCase())) {
        return w.toLowerCase();
      }
      return w[0].toUpperCase() + w.slice(1).toLowerCase();
    });

  const toSentenceCase = (s) =>
    s
      .toLowerCase()
      .replace(/(^\s*|[.!?]\s+|\n\s*)(\w)/g, (_, pre, ch) => pre + ch.toUpperCase());

  const toWords = (s) =>
    s
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/[_\-]+/g, " ")
      .split(/\s+/)
      .filter(Boolean);

  const converters = {
    upper: (s) => s.toUpperCase(),
    lower: (s) => s.toLowerCase(),
    title: toTitleCase,
    sentence: toSentenceCase,
    camel: (s) => {
      const w = toWords(s);
      if (!w.length) return s;
      return w[0].toLowerCase() + w.slice(1).map((x) => x[0].toUpperCase() + x.slice(1).toLowerCase()).join("");
    },
    snake: (s) => {
      const w = toWords(s);
      return w.length ? w.join("_").toLowerCase() : s;
    },
    kebab: (s) => {
      const w = toWords(s);
      return w.length ? w.join("-").toLowerCase() : s;
    },
  };

  const el = document.activeElement;
  const isInput =
    el &&
    (el.tagName === "TEXTAREA" ||
      (el.tagName === "INPUT" && /^(text|search|url|email|tel)$/i.test(el.type)));

  let converted;

  if (isInput) {
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = el.value.substring(start, end);
    if (!selected) return;
    converted = converters[caseType](selected);
    if (converted === selected) return showToast("No changes needed");
    const before = el.value.substring(0, start);
    const after = el.value.substring(end);
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(el), 'value'
    ).set;
    nativeInputValueSetter.call(el, before + converted + after);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    const newPos = start + converted.length;
    el.setSelectionRange(newPos, newPos);
  } else {
    const sel = window.getSelection();
    if (!sel.rangeCount || sel.isCollapsed) return;
    const selected = sel.toString();
    if (!selected) return;
    converted = converters[caseType](selected);
    if (converted === selected) return showToast("No changes needed");

    const range = sel.getRangeAt(0);
    range.deleteContents();
    const textNode = document.createTextNode(converted);
    range.insertNode(textNode);

    // Place cursor right after the inserted text
    const newRange = document.createRange();
    newRange.setStartAfter(textNode);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);

    // Trigger input event for frameworks that listen
    const editable =
      (el && el.closest && el.closest("[contenteditable]")) ||
      (el && el.getAttribute && el.getAttribute("contenteditable") ? el : null);
    if (editable) {
      editable.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  const caseLabels = {
    upper: "uppercase",
    lower: "lowercase",
    title: "title case",
    sentence: "sentence case",
    camel: "camelCase",
    snake: "snake_case",
    kebab: "kebab-case",
  };
  showToast(`Converted to ${caseLabels[caseType]}`);
});

// ─── Visual Feedback Toast ──────────────────────────────────────────────────

function showToast(message) {
  // Remove any existing toast
  const existing = document.getElementById("__tcc-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "__tcc-toast";
  toast.textContent = message;
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  Object.assign(toast.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    background: "#ffffff",
    color: "#242424",
    padding: "9px 12px",
    border: "1px solid rgba(0, 0, 0, 0.16)",
    borderRadius: "6px",
    fontSize: "13px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontWeight: "600",
    zIndex: "2147483647",
    opacity: "0",
    transform: "translateY(8px)",
    transition: "opacity 0.2s ease, transform 0.2s ease",
    boxShadow: "0 2px 8px rgba(0,0,0,0.14)",
    pointerEvents: "none",
  });

  document.body.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  });

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
    setTimeout(() => toast.remove(), 200);
  }, 1500);
}
