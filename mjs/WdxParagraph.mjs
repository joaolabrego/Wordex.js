"use strict"

import Config from "./Config.mjs"
import wdxSection from "./WdxSection.mjs"
import SysRange from "./SysRange.mjs"

export default class WdxParagraph {
    static #selected = null

    #WdxSection
    #wdxParagraph

    constructor(section) {
        this.#WdxSection = section

        this.#wdxParagraph = (document.createElement("div"))
        this.#wdxParagraph.dataset.wxKind = "paragraph"
        this.#wdxParagraph.tabIndex = -1
        this.#wdxParagraph.classList.add("paragraph")
        this.#wdxParagraph.append(document.createElement("br"))
    }
    get owner() {
        return this.#WdxSection
    }
    get element() {
        return this.#wdxParagraph
    }
    get htmlTag() {
        return "div"
    }

    static #applySelectionRing(p) {
        // não encosta em border do parágrafo (é estilo do usuário)
        p.style.outline = ""
        p.style.outlineOffset = ""
        p.style.boxShadow = "inset 0 0 0 2px #0aec0a"
    }

    static #removeSelectionRing(p) {
        // remove só o anel de seleção
        if (p.style.boxShadow === "inset 0 0 0 2px #0aec0a") p.style.boxShadow = ""
    }

    static attach(scope) {
        scope.addEventListener("mousedown", (e) => {
            const t = /** @type {HTMLElement} */ (e.target)
            const rootSection = wdxSection.getRoot()
            if (!rootSection) return

            const p = t.closest("div")
            if (!(p instanceof HTMLDivElement) || p.parentElement !== rootSection) {
                WdxParagraph.#clear()
                return
            }

            WdxParagraph.focus(p)
        })
    }

    static hasFocus() { return !!WdxParagraph.#selected }
    static getFocused() { return WdxParagraph.#selected }

    static focus(p) {
        WdxParagraph.#clear()
        WdxParagraph.#selected = p
        p.classList.add("p-selected")
        WdxParagraph.#applySelectionRing(p)
    }

    static #clear() {
        if (WdxParagraph.#selected) {
            WdxParagraph.#selected.classList.remove("p-selected")
            WdxParagraph.#removeSelectionRing(WdxParagraph.#selected)
        }
        WdxParagraph.#selected = null
    }

    static activate(p, where = "end") {
        if (!p) return false
        if (!p.firstChild) p.appendChild(document.createElement("br"))

        const r = document.createRange()
        r.selectNodeContents(p)
        r.collapse(where === "start")

        const sel = window.getSelection()
        if (!sel) return false
        sel.removeAllRanges()
        sel.addRange(r)
        SysRange.saveSelection()
        return true
    }

    /** garante que o execCommand vai atuar no lugar certo */
    static #restore() {
        return SysRange.restoreRange(SysRange.range)
    }

    static alignLeft() { WdxParagraph.#restore(); return Config.exec("justifyLeft") }
    static alignCenter() { WdxParagraph.#restore(); return Config.exec("justifyCenter") }
    static alignRight() { WdxParagraph.#restore(); return Config.exec("justifyRight") }
    static justify() { WdxParagraph.#restore(); return Config.exec("justifyFull") }

    static getActiveParagraph() {
        const sel = window.getSelection()
        if (!sel || sel.rangeCount === 0)
            return null
        const r = sel.getRangeAt(0)
        const n = r.startContainer

        /** @type {Element|null} */
        const el =
            n.nodeType === Node.ELEMENT_NODE
                ? /** @type {Element} */ (n)
                : n.parentElement

        const p = el ? el.closest("div") : null
        return /** @type {HTMLDivElement|null} */ (p)
    }

    static getActive() {
        WdxParagraph.#restore()
        const p = WdxParagraph.getActiveParagraph()
        return /** @type {HTMLDivElement|null} */ (p)
    }

    // =========================================================
    // redimensionamento (largura)
    // =========================================================

    static increaseWidth(stepPx = 30) {
        const p = WdxParagraph.#selected ?? WdxParagraph.getActive()
        if (!p) return false

        const w = Math.round(p.getBoundingClientRect().width) || 0
        p.style.width = (w + stepPx) + "px"
        p.style.display = "inline-block"
        return true
    }

    static decreaseWidth(stepPx = 30, minPx = 80) {
        const p = WdxParagraph.#selected ?? WdxParagraph.getActive()
        if (!p) return false

        const w = Math.round(p.getBoundingClientRect().width) || 0
        p.style.width = Math.max(minPx, w - stepPx) + "px"
        p.style.display = "inline-block"
        return true
    }

    // =========================================================
    // reposicionamento
    // =========================================================

    /** Move parágrafo selecionado 1 posição para cima (entre irmãos do rootSection). */
    static moveUp() {
        const rootSection = wdxSection.getRoot()
        const p = WdxParagraph.#selected
        if (!rootSection || !p) return false

        const prev = p.previousElementSibling
        if (!(prev instanceof HTMLDivElement)) return false

        rootSection.insertBefore(p, prev)

        WdxParagraph.activate(p, "start")
        WdxParagraph.focus(p)
        return true
    }

    /** Move parágrafo selecionado 1 posição para baixo (entre irmãos do rootSection). */
    static moveDown() {
        const rootSection = wdxSection.getRoot()
        const p = WdxParagraph.#selected
        if (!rootSection || !p) return false

        const next = p.nextElementSibling
        if (!(next instanceof HTMLDivElement)) return false

        rootSection.insertBefore(next, p) // troca

        WdxParagraph.activate(p, "start")
        WdxParagraph.focus(p)
        return true
    }

    /** “Mover para a direita” = indent (margin-left). */
    static indent(stepPx = 20) {
        const p = WdxParagraph.#selected ?? WdxParagraph.getActive()
        if (!p) return false

        const cur = parseInt(p.style.marginLeft || "0", 10) || 0
        p.style.marginLeft = (cur + stepPx) + "px"
        return true
    }

    /** “Mover para a esquerda” = outdent (margin-left). */
    static outdent(stepPx = 20) {
        const p = WdxParagraph.#selected ?? WdxParagraph.getActive()
        if (!p) return false

        const cur = parseInt(p.style.marginLeft || "0", 10) || 0
        p.style.marginLeft = Math.max(0, cur - stepPx) + "px"
        return true
    }

    // =========================================================
    // aliases padronizados (mesmos nomes de wxPicture/wxGrid)
    // =========================================================

    /** + (toolbar) */
    static increase(stepPx = 30) {
        return WdxParagraph.increaseWidth(stepPx)
    }

    /** - (toolbar) */
    static decrease(stepPx = 30, minPx = 80) {
        return WdxParagraph.decreaseWidth(stepPx, minPx)
    }

    /** ⬅ (toolbar) */
    static left(stepPx = 20) {
        return WdxParagraph.outdent(stepPx)
    }

    /** ➡ (toolbar) */
    static right(stepPx = 20) {
        return WdxParagraph.indent(stepPx)
    }

    /** ⬆ (toolbar) */
    static up() {
        return WdxParagraph.moveUp()
    }

    /** ⬇ (toolbar) */
    static down() {
        return WdxParagraph.moveDown()
    }
}
