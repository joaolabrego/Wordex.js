"use strict"

import Config from "./Config.mjs"
import WdxParagraph from "./WdxParagraph.mjs"
import WdxSection from "./WdxSection.mjs"

export default class SysRange {
  static range = null

  static saveSelection() {
    const root = WdxSection.getRoot()
    if (!root)
      return false

    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0)
      return false

    const r = sel.getRangeAt(0)

    const a = sel.anchorNode
    const f = sel.focusNode
    if (!a || !f)
      return false
    if (!a.isConnected || !f.isConnected)
      return false

    const aEl = a.nodeType === Node.TEXT_NODE ? a.parentElement : a
    const fEl = f.nodeType === Node.TEXT_NODE ? f.parentElement : f
    if (!(aEl instanceof Element) || !(fEl instanceof Element))
      return false
    if (!root.contains(aEl) || !root.contains(fEl))
      return false

    SysRange.range = r.cloneRange()

    return true
  }

  static restoreRange(range) {
    if (!range)
      return false
    const sel = window.getSelection()
    if (!sel)
      return false
    // Não restaurar range "detached" (nós fora do DOM) — addRange falharia e a seleção ficaria vazia
    try {
      if (!range.startContainer.isConnected || !range.endContainer.isConnected)
        return false
    } catch (_) {
      return false
    }
    sel.removeAllRanges()
    try {
      sel.addRange(range)
      return true
    } catch (_) {
      return false
    }
  }

  static saveRange() {
    const range = SysRange.getSelRange()
    return range ? range.cloneRange() : null
  }

  static getSelRange() {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0)
      return null

    return selection.getRangeAt(0)
  }

  static getSelectedRange() {
    SysRange.restoreRange(SysRange.range)

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0)
      return null

    const range = selection.getRangeAt(0)
    if (range.collapsed)
      return null

    return range
  }

  static hasSelection() {
    return !!SysRange.getSelectedRange()
  }

  static wrapTag(tag, collapse = false) {
    const range = SysRange.getSelectedRange()

    if (!range)
      return false

    const element = document.createElement(tag)
    const fragment = range.extractContents()
    element.appendChild(fragment)
    range.insertNode(element)

    if (collapse)
      return SysRange.#collapseAfter(element)

    return SysRange.#selectNodeContents(element)
  }

  static applyFontStyle(value = "") {
    if (!value) {
      const fontStyle = Config.fontStyleList.find(style => style.selected)
      if (!fontStyle)
        return false
      value = fontStyle.value ?? ""
    }

    return SysRange.wrapTag(value)
  }

  static setFontFamily(cssFontName) {
    if (!cssFontName)
      return false

    return SysRange.wrapSpanStyle({ fontFamily: cssFontName })
  }

  static setFontSize(cssSize) {
    if (!cssSize)
      return false

    return SysRange.wrapSpanStyle({ fontSize: cssSize })
  }

  static setFontColor(hex) {
    if (!hex)
      return false
    
    return SysRange.wrapSpanStyle({ color: hex })
  }

  static wrapSpanStyle(style) {
    const range = SysRange.getSelectedRange()
    if (!range)
      return false

    const span = document.createElement("span")
    if (style.fontFamily)
      span.style.fontFamily = style.fontFamily
    if (style.fontSize)
      span.style.fontSize = style.fontSize
    if (style.color)
      span.style.color = style.color

    const fragment = range.extractContents()
    span.appendChild(fragment)
    range.insertNode(span)

    SysRange.#collapseAfter(span)

    return true
  }

  // -----------------------------
  // internos
  // -----------------------------
  static #collapseAfter(node) {
    const selection = window.getSelection()
    if (!selection)
      return false

    const range = document.createRange()
    range.setStartAfter(node)
    range.collapse(true)

    selection.removeAllRanges()
    selection.addRange(range)

    SysRange.saveSelection()

    return true
  }

  static #selectNodeContents(node) {
    const selection = window.getSelection()
    if (!selection)
      return false

    const range = document.createRange()
    range.selectNodeContents(node)

    selection.removeAllRanges()
    selection.addRange(range)

    SysRange.saveSelection()

    return true
  }
  /**
   * Remove formatação inline dentro da seleção:
   * tags (b,i,u,s,strong,em,mark,code,small,sup,sub) e estilos inline em spans.
   * Mantém o texto e a estrutura (o que não for inline).
   */
  static clearInlineFormatting() {
    const range = SysRange.getSelectedRange()
    if (!range || range.collapsed) return false

    const frag = range.extractContents()
    if (!frag || !frag.firstChild) return false

    // tags a "desembrulhar" (remove a tag, preserva o conteúdo)
    const UNWRAP = new Set(["b", "i", "u", "s", "strong", "em", "mark", "code", "small", "sup", "sub"])

    // percorre o fragmento e faz as limpezas
    const walker = document.createTreeWalker(frag, NodeFilter.SHOW_ELEMENT)
    const toUnwrap = []

    /** @type {Element|null} */
    let el
    while ((el = /** @type {HTMLElement}*/(walker.nextNode()))) {
      const tag = el.tagName.toLowerCase()

      if (UNWRAP.has(tag)) {
        toUnwrap.push(el)
        continue
      }
      if (tag === "span" && el instanceof HTMLElement) {
        el.style.fontWeight = ""
        el.style.fontStyle = ""
        el.style.textDecoration = ""
        el.style.color = ""
        el.style.backgroundColor = ""
        el.style.fontFamily = ""
        el.style.fontSize = ""

        const hasStyle = (el.getAttribute("style") || "").trim().length > 0
        const hasAttrs = el.attributes.length > 0
        if (!hasStyle && !hasAttrs) toUnwrap.push(el)
      }
    }

    // desembrulha de baixo pra cima (pra não bagunçar o walker)
    for (let i = toUnwrap.length - 1; i >= 0; i--) {
      const n = toUnwrap[i]
      const parent = n.parentNode
      if (!parent) continue
      while (n.firstChild) parent.insertBefore(n.firstChild, n)
      parent.removeChild(n)
    }

    // recoloca e mantém seleção
    const first = frag.firstChild
    const last = frag.lastChild
    range.insertNode(frag)

    const sel = window.getSelection()
    if (sel && first && last) {
      const r2 = document.createRange()
      r2.setStartBefore(first)
      r2.setEndAfter(last)
      sel.removeAllRanges()
      sel.addRange(r2)
      SysRange.saveSelection()
    }

    return true
  }
  // SysRange.mjs

  static alignLeft() {
    return SysRange.#alignText("left")
  }

  static alignCenter() {
    return SysRange.#alignText("center")
  }

  static alignRight() {
    return SysRange.#alignText("right")
  }

  static justify() {
    return SysRange.#alignText("justify")
  }

  static #alignText(dir) {
    // 1) se há seleção → aplica no(s) parágrafo(s) envolvidos
    const range = SysRange.getSelectedRange()
    if (range) {
      const blocks = SysRange.#getParagraphsFromRange(range)
      for (const p of blocks) p.style.textAlign = dir
      SysRange.saveSelection()
      return true
    }

    // 2) sem seleção → parágrafo ativo
    const p = WdxParagraph?.getActive?.()
    if (p) {
      p.style.textAlign = dir
      return true
    }

    return false
  }

  static #getParagraphsFromRange(range) {
    const set = new Set()

    const walker = document.createTreeWalker(
      range.commonAncestorContainer,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode(node) {
          if (!(node instanceof HTMLDivElement)) return NodeFilter.FILTER_SKIP
          if (!node.classList.contains("paragraph")) return NodeFilter.FILTER_SKIP
          return range.intersectsNode(node)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_SKIP
        }
      }
    )

    let n
    while ((n = walker.nextNode())) set.add(n)
    return [...set]
  }
}
