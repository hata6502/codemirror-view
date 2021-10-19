import {Text as DocText} from "@codemirror/text"
import {ContentView, DOMPos, Dirty} from "./contentview"
import {WidgetType, MarkDecoration} from "./decoration"
import {Rect, Rect0, flattenRect, textRange, clientRectsFor} from "./dom"
import {CompositionWidget} from "./docview"
import browser from "./browser"

const none: any[] = []

export abstract class InlineView extends ContentView {
  children!: ContentView[]
  // Imperatively splice the given view into the current one, covering
  // offsets `from` to `to` (defaults to `this.length`). When no
  // source is given, just delete the given range from this view.
  // Should check whether the merge is possible and return false if it
  // isn't.
  abstract merge(from: number, to: number, source: InlineView | null, openStart: number, openEnd: number): boolean
  /// Return true when this view is equivalent to `other` and can take
  /// on its role.
  become(_other: InlineView) { return false }
  // Return a new view representing the given part of this view.
  abstract slice(from: number): InlineView
  // When this is a zero-length view with a side, this should return a
  // negative number to indicate it is before its position, or a
  // positive number when after its position.
  getSide() { return 0 }
}

InlineView.prototype.children = none

const MaxJoinLen = 256

export class TextView extends InlineView {
  dom!: Text | null

  constructor(public text: string) {
    super()
  }

  get length() { return this.text.length }

  createDOM(textDOM?: Node) {
    this.setDOM(textDOM || document.createTextNode(this.text))
  }

  sync(track?: {node: Node, written: boolean}) {
    if (!this.dom) this.createDOM()
    if (this.dom!.nodeValue != this.text) {
      if (track && track.node == this.dom) track.written = true
      this.dom!.nodeValue = this.text
    }
  }

  reuseDOM(dom: Node) {
    if (dom.nodeType != 3) return false
    this.createDOM(dom)
    return true
  }

  merge(from: number, to: number, source: InlineView | null): boolean {
    if (source && (!(source instanceof TextView) || this.length - (to - from) + source.length > MaxJoinLen))
      return false
    this.text = this.text.slice(0, from) + (source ? source.text : "") + this.text.slice(to)
    this.markDirty()
    return true
  }

  slice(from: number) {
    let result = new TextView(this.text.slice(from))
    this.text = this.text.slice(0, from)
    return result
  }

  localPosFromDOM(node: Node, offset: number): number {
    return node == this.dom ? offset : offset ? this.text.length : 0
  }

  domAtPos(pos: number) { return new DOMPos(this.dom!, pos) }

  domBoundsAround(_from: number, _to: number, offset: number) {
    return {from: offset, to: offset + this.length, startDOM: this.dom, endDOM: this.dom!.nextSibling}
  }

  coordsAt(pos: number, side: number): Rect {
    return textCoords(this.dom!, pos, side)
  }
}

export class MarkView extends InlineView {
  dom!: HTMLElement | null

  constructor(readonly mark: MarkDecoration,
              public children: InlineView[] = [],
              public length = 0) {
    super()
    for (let ch of children) ch.setParent(this)
  }

  createDOM() {
    let dom = document.createElement(this.mark.tagName)
    if (this.mark.class) dom.className = this.mark.class
    if (this.mark.attrs) for (let name in this.mark.attrs) dom.setAttribute(name, this.mark.attrs[name])
    this.setDOM(dom)
  }

  sync(track?: {node: Node, written: boolean}) {
    if (!this.dom || (this.dirty & Dirty.Attrs)) this.createDOM()
    super.sync(track)
  }

  merge(from: number, to: number, source: InlineView | null, openStart: number, openEnd: number): boolean {
    if (source && (!(source instanceof MarkView && source.mark.eq(this.mark)) ||
                   (from && openStart <= 0) || (to < this.length && openEnd <= 0)))
      return false
    mergeInlineChildren(this, from, to, source ? source.children : none, openStart - 1, openEnd - 1)
    this.markDirty()
    return true
  }

  slice(from: number) {
    let result = [], off = 0, detachFrom = -1, i = 0
    for (let elt of this.children) {
      let end = off + elt.length
      if (end > from) result.push(off < from ? elt.slice(from - off) : elt)
      if (detachFrom < 0 && off >= from) detachFrom = i
      off = end
      i++
    }
    let length = this.length - from
    this.length = from
    if (detachFrom > -1) this.replaceChildren(detachFrom, this.children.length)
    return new MarkView(this.mark, result, length)
  }

  domAtPos(pos: number): DOMPos {
    return inlineDOMAtPos(this.dom!, this.children, pos)
  }

  coordsAt(pos: number, side: number): Rect | null {
    return coordsInChildren(this, pos, side)
  }
}

function textCoords(text: Text, pos: number, side: number): Rect {
  let length = text.nodeValue!.length
  if (pos > length) pos = length
  let from = pos, to = pos, flatten = 0
  if (pos == 0 && side < 0 || pos == length && side >= 0) {
    if (!(browser.chrome || browser.gecko)) { // These browsers reliably return valid rectangles for empty ranges
      if (pos) { from--; flatten = 1 } // FIXME this is wrong in RTL text
      else { to++; flatten = -1 }
    }
  } else {
    if (side < 0) from--; else to++
  }
  let rects = textRange(text, from, to).getClientRects()
  if (!rects.length) return Rect0
  let rect = rects[(flatten ? flatten < 0 : side >= 0) ? 0 : rects.length - 1]
  if (browser.safari && !flatten && rect.width == 0) rect = Array.prototype.find.call(rects, r => r.width) || rect
  return flatten ? flattenRect(rect!, flatten < 0) : rect!
}

// Also used for collapsed ranges that don't have a placeholder widget!
export class WidgetView extends InlineView {
  dom!: HTMLElement | null

  static create(widget: WidgetType, length: number, side: number) {
    return new (widget.customView || WidgetView)(widget, length, side)
  }

  constructor(public widget: WidgetType, public length: number, readonly side: number) {
    super()
  }

  slice(from: number) {
    let result = WidgetView.create(this.widget, this.length - from, this.side)
    this.length -= from
    return result
  }

  sync() {
    if (!this.dom || !this.widget.updateDOM(this.dom)) {
      this.setDOM(this.widget.toDOM(this.editorView))
      this.dom!.contentEditable = "false"
    }
  }

  getSide() { return this.side }

  merge(from: number, to: number, source: InlineView | null, openStart: number, openEnd: number) {
    if (source && (!(source instanceof WidgetView) || !this.widget.compare(source.widget) ||
                   from > 0 && openStart <= 0 || to < this.length && openEnd <= 0))
      return false
    this.length = from + (source ? source.length : 0) + (this.length - to)
    return true
  }

  become(other: InlineView): boolean {
    if (other.length == this.length && other instanceof WidgetView && other.side == this.side) {
      if (this.widget.constructor == other.widget.constructor) {
        if (!this.widget.eq(other.widget)) this.markDirty(true)
        this.widget = other.widget
        return true
      }
    }
    return false
  }

  ignoreMutation(): boolean { return true }
  ignoreEvent(event: Event): boolean { return this.widget.ignoreEvent(event) }

  get overrideDOMText(): DocText | null {
    if (this.length == 0) return DocText.empty
    let top: ContentView = this
    while (top.parent) top = top.parent
    let view = (top as any).editorView, text: DocText | undefined = view && view.state.doc, start = this.posAtStart
    return text ? text.slice(start, start + this.length) : DocText.empty
  }

  domAtPos(pos: number) {
    return pos == 0 ? DOMPos.before(this.dom!) : DOMPos.after(this.dom!, pos == this.length)
  }

  domBoundsAround() { return null }

  coordsAt(pos: number, side: number): Rect | null {
    let rects = this.dom!.getClientRects(), rect: Rect | null = null
    if (!rects.length) return Rect0
    for (let i = pos > 0 ? rects.length - 1 : 0;; i += (pos > 0 ? -1 : 1)) {
      rect = rects[i]
      if (pos > 0 ? i == 0 : i == rects.length - 1 || rect.top < rect.bottom) break
    }
    return (pos == 0 && side > 0 || pos == this.length && side <= 0) ? rect : flattenRect(rect, pos == 0)
  }

  get isEditable() { return false }
}

export class CompositionView extends WidgetView {
  widget!: CompositionWidget

  domAtPos(pos: number) { return new DOMPos(this.widget.text, pos) }

  sync() { if (!this.dom) this.setDOM(this.widget.toDOM()) }

  localPosFromDOM(node: Node, offset: number): number {
    return !offset ? 0 : node.nodeType == 3 ? Math.min(offset, this.length) : this.length
  }

  ignoreMutation(): boolean { return false }

  get overrideDOMText() { return null }

  coordsAt(pos: number, side: number) { return textCoords(this.widget.text, pos, side) }

  get isEditable() { return true }
}

// These are drawn around uneditable widgets to avoid a number of
// browser bugs that show up when the cursor is directly next to
// uneditable inline content.
export class WidgetBufferView extends InlineView {
  constructor(readonly side: number) { super() }

  get length() { return 0 }

  merge() { return false }

  become(other: InlineView): boolean {
    return other instanceof WidgetBufferView && other.side == this.side
  }

  slice() { return new WidgetBufferView(this.side) }

  sync() {
    if (!this.dom) this.setDOM(document.createTextNode("\u200b"))
    else if (this.dirty && this.dom.nodeValue != "\u200b") this.dom.nodeValue = "\u200b"
  }

  getSide() { return this.side }

  domAtPos(pos: number) { return DOMPos.before(this.dom!) }

  domBoundsAround() { return null }

  coordsAt(pos: number): Rect {
    let rects = clientRectsFor(this.dom!)
    return rects[rects.length - 1]
  }

  get overrideDOMText() {
    return DocText.of([this.dom!.nodeValue!.replace(/\u200b/g, "")])
  }
}

export function mergeInlineChildren(parent: ContentView & {children: InlineView[]},
                                    from: number, to: number,
                                    elts: InlineView[], openStart: number, openEnd: number) {
  let cur = parent.childCursor()
  let {i: toI, off: toOff} = cur.findPos(to, 1)
  let {i: fromI, off: fromOff} = cur.findPos(from, -1)
  let dLen = from - to
  for (let view of elts) dLen += view.length
  parent.length += dLen

  let {children} = parent
  // Both from and to point into the same child view
  if (fromI == toI && fromOff) {
    let start = children[fromI]
    // Maybe just update that view and be done
    if (elts.length == 1 && start.merge(fromOff, toOff, elts[0], openStart, openEnd)) return
    if (elts.length == 0) { start.merge(fromOff, toOff, null, openStart, openEnd); return }
    // Otherwise split it, so that we don't have to worry about aliasing front/end afterwards
    let after = start.slice(toOff)
    if (after.merge(0, 0, elts[elts.length - 1], 0, openEnd)) elts[elts.length - 1] = after
    else elts.push(after)
    toI++
    openEnd = toOff = 0
  }

  // Make sure start and end positions fall on node boundaries
  // (fromOff/toOff are no longer used after this), and that if the
  // start or end of the elts can be merged with adjacent nodes,
  // this is done
  if (toOff) {
    let end = children[toI]
    if (elts.length && end.merge(0, toOff, elts[elts.length - 1], 0, openEnd)) {
      elts.pop()
      openEnd = elts.length ? 0 : openStart
    } else {
      end.merge(0, toOff, null, 0, 0)
    }
  } else if (toI < children.length && elts.length &&
             children[toI].merge(0, 0, elts[elts.length - 1], 0, openEnd)) {
    elts.pop()
    openEnd = elts.length ? 0 : openStart
  }
  if (fromOff) {
    let start = children[fromI]
    if (elts.length && start.merge(fromOff, start.length, elts[0], openStart, 0)) {
      elts.shift()
      openStart = elts.length ? 0 : openEnd
    } else {
      start.merge(fromOff, start.length, null, 0, 0)
    }
    fromI++
  } else if (fromI && elts.length) {
    let end = children[fromI - 1]
    if (end.merge(end.length, end.length, elts[0], openStart, 0)) {
      elts.shift()
      openStart = elts.length ? 0 : openEnd
    }
  }

  // Then try to merge any mergeable nodes at the start and end of
  // the changed range
  while (fromI < toI && elts.length && children[toI - 1].become(elts[elts.length - 1])) {
    elts.pop()
    toI--
    openEnd = elts.length ? 0 : openStart
  }
  while (fromI < toI && elts.length && children[fromI].become(elts[0])) {
    elts.shift()
    fromI++
    openStart = elts.length ? 0 : openEnd
  }
  if (!elts.length && fromI && toI < children.length &&
      children[toI].merge(0, 0, children[fromI - 1], openStart, openEnd))
    fromI--

  // And if anything remains, splice the child array to insert the new elts
  if (elts.length || fromI != toI) parent.replaceChildren(fromI, toI, elts)
}

export function inlineDOMAtPos(dom: HTMLElement, children: readonly InlineView[], pos: number) {
  let i = 0
  for (let off = 0; i < children.length; i++) {
    let child = children[i], end = off + child.length
    if (end == off && child.getSide() <= 0) continue
    if (pos > off && pos < end && child.dom!.parentNode == dom) return child.domAtPos(pos - off)
    if (pos <= off) break
    off = end
  }
  for (; i > 0; i--) {
    let before = children[i - 1].dom!
    if (before.parentNode == dom) return DOMPos.after(before)
  }
  return new DOMPos(dom, 0)
}

// Assumes `view`, if a mark view, has precisely 1 child.
export function joinInlineInto(parent: ContentView, view: InlineView, open: number) {
  let last, {children} = parent
  if (open > 0 && view instanceof MarkView && children.length &&
      (last = children[children.length - 1]) instanceof MarkView && last.mark.eq(view.mark)) {
    joinInlineInto(last, view.children[0], open - 1)
  } else {
    children.push(view)
    view.setParent(parent)
  }
  parent.length += view.length
}

export function coordsInChildren(view: ContentView & {children: InlineView[]}, pos: number, side: number): Rect | null {
  for (let off = 0, i = 0; i < view.children.length; i++) {
    let child = view.children[i], end = off + child.length, next
    if ((side <= 0 || end == view.length || child.getSide() > 0 ? end >= pos : end > pos) &&
        (pos < end || i + 1 == view.children.length || (next = view.children[i + 1]).length || next.getSide() > 0)) {
      let flatten = 0
      if (end == off) {
        if (child.getSide() <= 0) continue
        flatten = side = -child.getSide()
      }
      let rect = child.coordsAt(pos - off, side)
      return flatten && rect ? flattenRect(rect, side < 0) : rect
    }
    off = end
  }
  let last = view.dom!.lastChild
  if (!last) return (view.dom as HTMLElement).getBoundingClientRect()
  let rects = clientRectsFor(last)
  return rects[rects.length - 1]
}
