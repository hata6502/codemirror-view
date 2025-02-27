## 0.19.9 (2021-10-01)

### Bug fixes

Fix an issue where some kinds of reflows in the surrounding document could move unrendered parts of the editor into view without the editor noticing and updating its viewport.

Fix an occasional crash in the selection drawing extension.

## 0.19.8 (2021-09-26)

### Bug fixes

Fix a bug that could, on DOM changes near block widgets, insert superfluous line breaks.

Make interacting with a destroyed editor view do nothing, rather than crash, to avoid tripping people up with pending timeouts and such.

Make sure `ViewUpdate.viewportChanged` is true whenever `visibleRanges` changes, so that plugins acting only on visible ranges can use it to check when to update.

Fix line-wise cut on empty lines.

## 0.19.7 (2021-09-13)

### Bug fixes

The view is now aware of the new `EditorState.readOnly` property, and suppresses events that modify the document when it is true.

## 0.19.6 (2021-09-10)

### Bug fixes

Remove a `console.log` that slipped into the previous release.

## 0.19.5 (2021-09-09)

### New features

The new `EditorView.scrollTo` effect can be used to scroll a given range into view.

## 0.19.4 (2021-09-01)

### Bug fixes

Fix an issue where lines containing just a widget decoration wrapped in a mark decoration could be displayed with 0 height.

## 0.19.3 (2021-08-25)

### Bug fixes

Fix a view corruption that could happen in situations involving overlapping mark decorations.

## 0.19.2 (2021-08-23)

### New features

The package now exports a `scrollPastEnd` function, which returns an extension that adds space below the document to allow the last line to be scrolled to the top of the editor.

## 0.19.1 (2021-08-11)

### Breaking changes

The view now emits new-style user event annotations for the transactions it generates.

### Bug fixes

Fix a bug where `coordsAtPos` would allow the passed `side` argument to override widget sides, producing incorrect cursor positions.

Fix a bug that could cause content lines to be misaligned in certain situations involving widgets at the end of lines.

Fix an issue where, if the browser decided to modify DOM attributes in the content in response to some editing action, the view failed to reset those again.

## 0.18.19 (2021-07-12)

### Bug fixes

Fix a regression where `EditorView.editable.of(false)` didn't disable editing on Webkit-based browsers.

## 0.18.18 (2021-07-06)

### Bug fixes

Fix a bug that caused `EditorView.moveVertically` to only move by one line, even when given a custom distance, in some cases.

Hide Safari's native bold/italic/underline controls for the content.

Fix a CSS problem that prevented Safari from breaking words longer than the line in line-wrapping mode.

Avoid a problem where composition would be inappropriately abored on Safari.

Fix drag-selection that scrolls the content by dragging past the visible viewport.

### New features

`posAtCoords` now has an imprecise mode where it'll return an approximate position even for parts of the document that aren't currently rendered.

## 0.18.17 (2021-06-14)

### Bug fixes

Make `drawSelection` behave properly when lines are split by block widgets.

Make sure drawn selections that span a single line break don't leave a gap between the lines.

## 0.18.16 (2021-06-03)

### Bug fixes

Fix a crash that could occur when the document changed during mouse selection.

Fix a bug where composition inside styled content would sometimes be inappropriately aborted by editor DOM updates.

### New features

`MouseSelectionStyle.update` may now return true to indicate it should be queried for a new selection after the update.

## 0.18.15 (2021-06-01)

### Bug fixes

Fix a bug that would, in very specific circumstances, cause `posAtCoords` to go into an infinite loop in Safari.

Fix a bug where some types of IME input on Mobile Safari would drop text.

## 0.18.14 (2021-05-28)

### Bug fixes

Fix an issue where the DOM selection was sometimes not properly updated when next to a widget.

Invert the order in which overlapping decorations are drawn so that higher-precedence decorations are nested inside lower-precedence ones (and thus override their styling).

Fix a but in `posAtCoords` where it would in some situations return -1 instead of `null`.

### New features

A new plugin field, `PluginField.atomicRanges`, can be used to cause cursor motion to skip past some ranges of the document.

## 0.18.13 (2021-05-20)

### Bug fixes

Fix a bug that would cause the content DOM update to crash in specific circumstances.

Work around an issue where, after some types of changes, Mobile Safari would ignore Enter presses.

Make iOS enter and backspace handling more robust, so that platform bugs are less likely to break those keys in the editor.

Fix a regression where Esc + Tab no longer allowed the user to exit the editor.

### New features

You can now drop text files into the editor.

## 0.18.12 (2021-05-10)

### Bug fixes

Work around a Mobile Safari bug where, after backspacing out the last character on a line, Enter didn't work anymore.

Work around a problem in Mobile Safari where you couldn't tap to put the cursor at the end of a line that ended in a widget.

## 0.18.11 (2021-04-30)

### Bug fixes

Add an attribute to prevent the Grammarly browser extension from messing with the editor content.

Fix more issues around selection handling a Shadow DOM in Safari.

## 0.18.10 (2021-04-27)

### Bug fixes

Fix a bug where some types of updates wouldn't properly cause marks around the changes to be joined in the DOM.

Fix an issue where the content and gutters in a fixed-height editor could be smaller than the editor height.

Fix a crash on Safari when initializing an editor in an unfocused window.

Fix a bug where the editor would incorrectly conclude it was out of view in some types of absolutely positioned parent elements.

## 0.18.9 (2021-04-23)

### Bug fixes

Fix a crash that occurred when determining DOM coordinates in some specific situations.

Fix a crash when a DOM change that ended at a zero-width view element (widget) removed that element from the DOM.

Disable autocorrect and autocapitalize by default, since in most code-editor contexts they get in the way. You can use `EditorView.contentAttributes` to override this.

Fix a bug that interfered with native touch selection handling on Android.

Fix an unnecessary DOM update after composition that would disrupt touch selection on Android.

Add a workaround for Safari's broken selection reporting when the editor is in a shadow DOM tree.

Fix select-all from the context menu on Safari.

## 0.18.8 (2021-04-19)

### Bug fixes

Handle selection replacements where the inserted text matches the start/end of the replaced text better.

Fix an issue where the editor would miss scroll events when it was placed in a DOM component slot.

## 0.18.7 (2021-04-13)

### Bug fixes

Fix a crash when drag-selecting out of the editor with editable turned off.

Backspace and delete now largely work in an editor without a keymap.

Pressing backspace on iOS should now properly update the virtual keyboard's capitalize and autocorrect state.

Prevent random line-wrapping in (non-wrapping) editors on Mobile Safari.
## 0.18.6 (2021-04-08)

### Bug fixes

Fix an issue in the compiled output that would break the code when minified with terser.

## 0.18.5 (2021-04-07)

### Bug fixes

Improve handling of bidi text with brackets (conforming to Unicode 13's bidi algorithm).

Fix the position where `drawSelection` displays the cursor on bidi boundaries.

## 0.18.4 (2021-04-07)

### Bug fixes

Fix an issue where the default focus ring gets obscured by the gutters and active line.

Fix an issue where the editor believed Chrome Android didn't support the CSS `tab-size` style.

Don't style active lines when there are non-empty selection ranges, so that the active line background doesn't obscure the selection.

Make iOS autocapitalize update properly when you press Enter.

## 0.18.3 (2021-03-19)

### Breaking changes

The outer DOM element now has class `cm-editor` instead of `cm-wrap` (`cm-wrap` will be present as well until 0.19).

### Bug fixes

Improve behavior of `posAtCoords` when the position is near text but not in any character's actual box.

## 0.18.2 (2021-03-19)

### Bug fixes

Triple-clicking now selects the line break after the clicked line (if any).

Fix an issue where the `drawSelection` plugin would fail to draw the top line of the selection when it started in an empty line.

Fix an issue where, at the end of a specific type of composition on iOS, the editor read the DOM before the browser was done updating it.

## 0.18.1 (2021-03-05)

### Bug fixes

Fix an issue where, on iOS, some types of IME would cause the composed content to be deleted when confirming a composition.

## 0.18.0 (2021-03-03)

### Breaking changes

The `themeClass` function and ``-style selectors in themes are no longer supported (prefixing with `cm-` should be done manually now).

Themes must now use `&` (instead of an extra `$`) to target the editor wrapper element.

The editor no longer adds `cm-light` or `cm-dark` classes. Targeting light or dark configurations in base themes should now be done by using a `&light` or `&dark` top-level selector.

## 0.17.13 (2021-03-03)

### Bug fixes

Work around a Firefox bug where it won't draw the cursor when it is between uneditable elements.

Fix a bug that broke built-in mouse event handling.

## 0.17.12 (2021-03-02)

### Bug fixes

Avoid interfering with touch events, to allow native selection behavior.

Fix a bug that broke sub-selectors with multiple `&` placeholders in themes.

## 0.17.11 (2021-02-25)

### Bug fixes

Fix vertical cursor motion on Safari with a larger line-height.

Fix incorrect selection drawing (with `drawSelection`) when the selection spans to just after a soft wrap point.

Fix an issue where compositions on Safari were inappropriately aborted in some circumstances.

The view will now redraw when the `EditorView.phrases` facet changes, to make sure translated text is properly updated.

## 0.17.10 (2021-02-22)

### Bug fixes

Long words without spaces, when line-wrapping is enabled, are now properly broken.

Fix the horizontal position of selections drawn by `drawSelection` in right-to-left editors with a scrollbar.

## 0.17.9 (2021-02-18)

### Bug fixes

Fix an issue where pasting linewise at the start of a line left the cursor before the inserted content.

## 0.17.8 (2021-02-16)

### Bug fixes

Fix a problem where the DOM selection and the editor state could get out of sync in non-editable mode.

Fix a crash when the editor was hidden on Safari, due to `getClientRects` returning an empty list.

Prevent Firefox from making the scrollable element keyboard-focusable.

## 0.17.7 (2021-01-25)

### New features

Add an `EditorView.announce` state effect that can be used to conveniently provide screen reader announcements.

## 0.17.6 (2021-01-22)

### Bug fixes

Avoid creating very high scroll containers for large documents so that we don't overflow the DOM's fixed-precision numbers.

## 0.17.5 (2021-01-15)

### Bug fixes

Fix a bug that would create space-filling placeholders with incorrect height when document is very large.

## 0.17.4 (2021-01-14)

### Bug fixes

The `drawSelection` extension will now reuse cursor DOM nodes when the number of cursors stays the same, allowing some degree of cursor transition animation.

Makes highlighted special characters styleable (``) and fix their default look in dark themes to have appropriate contrast.

### New features

Adds a new `MatchDecorator` helper class which can be used to easily maintain decorations on content that matches a regular expression.

## 0.17.3 (2021-01-06)

### New features

The package now also exports a CommonJS module.

## 0.17.2 (2021-01-04)

### Bug fixes

Work around Chrome problem where the native shift-enter behavior inserts two line breaks.

Make bracket closing and bracket pair removing more reliable on Android.

Fix bad cursor position and superfluous change transactions after pressing enter when in a composition on Android.

Fix issue where the wrong character was deleted when backspacing out a character before an identical copy of that character on Android.

## 0.17.1 (2020-12-30)

### Bug fixes

Fix a bug that prevented `ViewUpdate.focusChanged` from ever being true.

## 0.17.0 (2020-12-29)

### Breaking changes

First numbered release.

