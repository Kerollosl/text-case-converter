// ============================================================
// Text Case Converter — Google Apps Script
// Adds a "Convert Case" menu to the menu bar in Docs & Sheets
// ============================================================
//
// SETUP (do this once per doc type):
// 1. Open a Google Doc or Sheet
// 2. Extensions > Apps Script
// 3. Replace everything in Code.gs with this file
// 4. Click Save
// 5. Reload the Doc/Sheet
// 6. "Convert Case" appears in the menu bar
//
// NOTE: Google Docs/Sheets have a custom right-click menu that
// cannot be modified. This adds to the top menu bar instead.
// ============================================================

function onOpen() {
  var ui;
  try { ui = DocumentApp.getUi(); } catch(e) {}
  if (!ui) {
    try { ui = SpreadsheetApp.getUi(); } catch(e) {}
  }
  if (!ui) {
    try { ui = SlidesApp.getUi(); } catch(e) {}
  }
  if (!ui) return;

  ui.createMenu('Convert Case')
    .addItem('UPPER CASE', 'toUpper')
    .addItem('lower case', 'toLower')
    .addItem('Title Case', 'toTitle')
    .addItem('Sentence case', 'toSentence')
    .addSeparator()
    .addItem('camelCase', 'toCamel')
    .addItem('snake_case', 'toSnake')
    .addItem('kebab-case', 'toKebab')
    .addToUi();
}

function toUpper()    { run('upper'); }
function toLower()    { run('lower'); }
function toTitle()    { run('title'); }
function toSentence() { run('sentence'); }
function toCamel()    { run('camel'); }
function toSnake()    { run('snake'); }
function toKebab()    { run('kebab'); }

function convert(text, caseType) {
  var TITLE_MINOR = {
    'a':1,'an':1,'the':1,'and':1,'but':1,'or':1,'nor':1,'for':1,'yet':1,'so':1,
    'at':1,'by':1,'in':1,'of':1,'on':1,'to':1,'up':1,'as':1,'is':1,'if':1,'it':1,
    'vs':1,'via':1
  };

  var words = text
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_\-]+/g, ' ')
    .split(/\s+/)
    .filter(function(w) { return w.length > 0; });

  switch (caseType) {
    case 'upper':
      return text.toUpperCase();
    case 'lower':
      return text.toLowerCase();
    case 'title':
      return text.replace(/\w\S*/g, function(w, offset) {
        if (offset === 0 || offset + w.length === text.length) {
          return w.charAt(0).toUpperCase() + w.substr(1).toLowerCase();
        }
        if (TITLE_MINOR.hasOwnProperty(w.toLowerCase())) {
          return w.toLowerCase();
        }
        return w.charAt(0).toUpperCase() + w.substr(1).toLowerCase();
      });
    case 'sentence':
      return text.toLowerCase().replace(/(^\s*|[.!?]\s+|\n\s*)(\w)/g, function(_, pre, ch) {
        return pre + ch.toUpperCase();
      });
    case 'camel':
      if (!words.length) return text;
      return words[0].toLowerCase() + words.slice(1).map(function(w) {
        return w.charAt(0).toUpperCase() + w.substr(1).toLowerCase();
      }).join('');
    case 'snake':
      return words.length ? words.join('_').toLowerCase() : text;
    case 'kebab':
      return words.length ? words.join('-').toLowerCase() : text;
    default:
      return text;
  }
}

function run(caseType) {
  // Try Docs
  try {
    var doc = DocumentApp.getActiveDocument();
    if (doc) {
      var selection = doc.getSelection();
      if (!selection) {
        DocumentApp.getUi().alert('Select some text first.');
        return;
      }
      var elements = selection.getRangeElements();
      for (var i = 0; i < elements.length; i++) {
        var el = elements[i];
        var textEl = el.getElement().editAsText();
        var start = el.isPartial() ? el.getStartOffset() : 0;
        var end = el.isPartial() ? el.getEndOffsetInclusive() : textEl.getText().length - 1;
        if (start > end) continue;
        var original = textEl.getText().substring(start, end + 1);
        var converted = convert(original, caseType);
        textEl.deleteText(start, end);
        textEl.insertText(start, converted);
      }
      return;
    }
  } catch(e) {}

  // Try Sheets
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet();
    if (sheet) {
      var range = sheet.getActiveRange();
      if (!range) {
        SpreadsheetApp.getUi().alert('Select some cells first.');
        return;
      }
      var values = range.getValues();
      for (var r = 0; r < values.length; r++) {
        for (var c = 0; c < values[r].length; c++) {
          if (typeof values[r][c] === 'string' && values[r][c].length > 0) {
            values[r][c] = convert(values[r][c], caseType);
          }
        }
      }
      range.setValues(values);
      return;
    }
  } catch(e) {}

  // Try Slides
  try {
    var pres = SlidesApp.getActivePresentation();
    if (pres) {
      var selection = pres.getSelection();
      if (!selection || selection.getSelectionType() !== SlidesApp.SelectionType.TEXT) {
        SlidesApp.getUi().alert('Select text inside a text box first.');
        return;
      }
      var textRange = selection.getTextRange();
      var original = textRange.asString();
      textRange.setText(convert(original, caseType));
      return;
    }
  } catch(e) {}
}
