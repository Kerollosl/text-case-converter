// Injected on demand by background.js (activeTab + scripting). Not a manifest content script.
(function (root) {
  "use strict";

  // Words that stay lowercase in title case (AP style)
  const TITLE_MINOR = new Set([
    "a", "an", "the", "and", "but", "or", "nor", "for", "yet", "so",
    "at", "by", "in", "of", "on", "to", "up", "as", "is", "if", "it",
    "vs", "via",
  ]);

  const CASE_LABELS = {
    upper: "uppercase",
    lower: "lowercase",
    title: "title case",
    sentence: "sentence case",
    camel: "camelCase",
    snake: "snake_case",
    kebab: "kebab-case",
  };

  // Upper-case the first code point, lower-case the rest (Unicode aware).
  const capitalize = (w) => {
    const first = String.fromCodePoint(w.codePointAt(0));
    return first.toUpperCase() + w.slice(first.length).toLowerCase();
  };

  const toTitleCase = (s) =>
    s.replace(/[\p{L}\p{N}]\S*/gu, (w, offset) => {
      // Always capitalize the first and last word
      if (offset === 0 || offset + w.length === s.length) return capitalize(w);
      if (TITLE_MINOR.has(w.toLowerCase())) return w.toLowerCase();
      return capitalize(w);
    });

  const toSentenceCase = (s) =>
    s
      .toLowerCase()
      .replace(/(^\s*|[.!?]\s+|\n\s*)(\p{L})/gu, (_, pre, ch) => pre + ch.toUpperCase());

  const toWords = (s) =>
    s
      .replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, "$1 $2")
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
      return w[0].toLowerCase() + w.slice(1).map(capitalize).join("");
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

  // ─── Visual feedback toast ────────────────────────────────────────────────

  function showToast(message) {
    if (typeof document === "undefined") return;
    const existing = document.getElementById("__tcc-toast");
    if (existing) existing.remove();

    const dark = matchMedia("(prefers-color-scheme: dark)").matches;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const toast = document.createElement("div");
    toast.id = "__tcc-toast";
    toast.textContent = message;
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    Object.assign(toast.style, {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      background: dark ? "#2b2b2b" : "#ffffff",
      color: dark ? "#f2f2f2" : "#242424",
      padding: "9px 12px",
      border: dark ? "1px solid rgba(255, 255, 255, 0.24)" : "1px solid rgba(0, 0, 0, 0.16)",
      borderRadius: "6px",
      fontSize: "14px",
      lineHeight: "1.3",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      fontWeight: "600",
      zIndex: "2147483647",
      opacity: "0",
      transform: "translateY(8px)",
      transition: reduce ? "none" : "opacity 0.2s ease, transform 0.2s ease",
      boxShadow: "0 2px 8px rgba(0,0,0,0.14)",
      pointerEvents: "none",
    });
    (document.body || document.documentElement).appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    });
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(8px)";
      setTimeout(() => toast.remove(), reduce ? 0 : 200);
    }, 1500);
  }

  // ─── Applying the conversion to the page ──────────────────────────────────

  function replaceInRange(sel, converted) {
    const range = sel.getRangeAt(0);
    const { startContainer: sc, endContainer: ec } = range;
    if (sc === ec && sc.nodeType === Node.TEXT_NODE) {
      // Single text node: edit in place so surrounding formatting is untouched.
      const offset = range.startOffset;
      sc.replaceData(offset, range.endOffset - offset, converted);
      sel.collapse(sc, offset + converted.length);
      return;
    }
    range.deleteContents();
    const textNode = document.createTextNode(converted);
    range.insertNode(textNode);
    const after = document.createRange();
    after.setStartAfter(textNode);
    after.collapse(true);
    sel.removeAllRanges();
    sel.addRange(after);
  }

  function run(caseType) {
    const convert = converters[caseType];
    if (!convert) return { done: false };

    const el = document.activeElement;
    const isInput =
      el &&
      (el.tagName === "TEXTAREA" ||
        (el.tagName === "INPUT" && /^(text|search|url|email|tel)$/i.test(el.type)));

    if (isInput) {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const selected = el.value.substring(start, end);
      if (!selected) return { done: false };
      const converted = convert(selected);
      if (converted === selected) { showToast("No changes needed"); return { done: true }; }
      // insertText keeps the page's undo history and fires native input events.
      if (!document.execCommand("insertText", false, converted)) {
        const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value").set;
        setter.call(el, el.value.substring(0, start) + converted + el.value.substring(end));
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.setSelectionRange(start + converted.length, start + converted.length);
      }
    } else {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount || sel.isCollapsed) return { done: false };
      const selected = sel.toString();
      if (!selected) return { done: false };
      const converted = convert(selected);
      if (converted === selected) { showToast("No changes needed"); return { done: true }; }

      const anchor = sel.anchorNode && (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement);
      const editable = anchor && anchor.isContentEditable;
      // In editable regions insertText keeps the formatting at the selection and the undo stack.
      if (!(editable && document.execCommand("insertText", false, converted))) {
        replaceInRange(sel, converted);
        if (editable) anchor.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }
    showToast(`Converted to ${CASE_LABELS[caseType]}`);
    return { done: true };
  }

  root.__tccRun = run;
  if (typeof module !== "undefined") module.exports = { converters, run, capitalize };
})(globalThis);
